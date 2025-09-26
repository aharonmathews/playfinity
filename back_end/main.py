from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse  # Add this too

import uvicorn

import base64
from functools import partial
import uvicorn

# Configuration
from config.settings import settings
from config.firebase_config import db, bucket, firebase_config

# Import routers

# from endpoints.images import router as images_router  # ✅ Add image serving


# Services
from services.azure_service import azure_service
from services.llama_service import llama_service
from services.cache_service import cache_service
from services.game_service import game_service

# Models
from models.schemas import (
    GameGenerationRequest, TopicValidationRequest, GenerateDomainsRequest,
    ImageUploadRequest, LetterCheckRequest
)

# Utils
from utils.helpers import get_primary_label_from_tags

# Force immediate print flushing
print = partial(print, flush=True)

# ----------------------
# FastAPI Setup
# ----------------------
app = FastAPI(title="Playfinity Unified Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.include_router(images_router)

# ----------------------
# Check Optional Services
# ----------------------
try:
    app.mount("/static/images", StaticFiles(directory="generated_images"), name="images")
    print("✅ Static image serving enabled")
except Exception as e:
    print(f"⚠️ Static image serving not available: {e}")
    
try:
    from image_generation_service import image_service
    DIFFUSERS_AVAILABLE = True
    print("✅ Image generation service available")
except ImportError:
    DIFFUSERS_AVAILABLE = False
    print("❌ Image generation service not available")

try:
    from ocr_service import ocr_service
    OCR_AVAILABLE = True
    print("✅ OCR service available")
except ImportError:
    OCR_AVAILABLE = False
    print("❌ OCR service not available")

# ----------------------
# API Endpoints
# ----------------------
@app.get("/")
async def root():
    """Get API status and service availability"""
    storage_working = await firebase_config.verify_storage() if bucket else False
    cache_stats = await cache_service.get_cache_statistics() if db else {"error": "Firebase not available"}
    
    return {
        "message": "Playfinity Unified Backend Running!",
        "firebase_available": db is not None,
        "storage_available": bucket is not None,
        "storage_working": storage_working,
        "image_generation_available": DIFFUSERS_AVAILABLE,
        "ocr_available": OCR_AVAILABLE,
        "prediction_cache_stats": cache_stats
    }

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    """Analyze image using Azure Computer Vision and generate domain-specific topics with caching"""
    try:
        print(f"🔍 Analyzing uploaded image: {file.filename}")
        
        # Analyze image with Azure
        azure_result = await azure_service.analyze_image(file)
        tags, description = azure_service.extract_tags_and_description(azure_result)
        
        # Get primary label
        primary_label = get_primary_label_from_tags(tags, description)
        print(f"🎯 Primary subject identified: '{primary_label}'")
        
        # Check cache first
        cached_prediction = await cache_service.check_prediction_cache(tags, description)
        
        all_domain_topics = []
        domain_specific_topics = None
        cache_hit = False
        
        if cached_prediction:
            # Use cached results
            cache_hit = True
            all_domain_topics = cached_prediction.get("all_topics", [])
            domain_specific_topics = cached_prediction.get("domain_topics")
            
            print(f"🎯 ✅ Using cached topics for '{primary_label}' ({len(all_domain_topics)} topics)")
            await cache_service.update_cache_access(primary_label)
                
        elif llama_service.client and tags:
            # Generate new topics
            print(f"🧠 Generating NEW topics for '{primary_label}' from {len(tags)} detected tags...")
            
            try:
                # Generate topics from all significant tags
                all_domain_topics = await generate_all_domain_topics_from_tags(tags, description)
                
                # Generate structured domain response
                tag_names = [tag["name"] for tag in tags]
                domain_specific_topics = llama_service.generate_domain_topics(description, tag_names, primary_label)
                
                print(f"📚 Generated {len(all_domain_topics)} total topics for '{primary_label}'")
                
                # Save to cache
                await cache_service.save_prediction_to_cache(
                    tags, description, primary_label, all_domain_topics, domain_specific_topics
                )
                
            except Exception as domain_error:
                print(f"⚠ Could not generate domain topics for '{primary_label}': {domain_error}")
        
        response_data = {
            "success": True,
            "tags": tags,
            "description": description,
            "primary_label": primary_label,
            "analysis": azure_result,
            "all_related_topics": all_domain_topics,
            "flattened_topics": all_domain_topics,
            "cache_hit": cache_hit,
            "topic_source": "cache" if cache_hit else "generated"
        }
        
        # Add structured domain-specific topics if available
        if domain_specific_topics:
            response_data["domain_topics"] = domain_specific_topics
            response_data["auto_generated_topics"] = True
        else:
            response_data["auto_generated_topics"] = False
            
        return response_data
        
    except Exception as e:
        print(f"❌ Error in predict_image: {e}")
        return {
            "success": False,
            "tags": [],
            "description": f"Error: {str(e)}",
            "primary_label": None,
            "analysis": None,
            "auto_generated_topics": False,
            "all_related_topics": [],
            "flattened_topics": [],
            "cache_hit": False,
            "topic_source": "error"
        }

@app.post("/validate-topic")
async def validate_topic(request: TopicValidationRequest):
    """Check if topic exists in Firebase, if not generate new games"""
    try:
        age_group_id = "2" if request.age_group in ["7-11", "5-10"] else request.age_group
        
        print(f"🔍 Validating topic: {request.topic} (age group ID: {age_group_id})")
        
        games_exist, existing_games = await game_service.check_games_exist_in_firebase(
            request.topic, age_group_id, request.domain, request.tags
        )
        
        if games_exist and existing_games:
            print(f"✅ Games found in Firebase for {request.topic}")
            gallery_images = None
            if "gallery" in existing_games and "images" in existing_games["gallery"]:
                gallery_images = existing_games["gallery"]["images"]
                print(f"🖼 Passing {len(gallery_images)} Storage URLs to frontend")
            
            return {
                "success": True,
                "games_exist": True,
                "games": existing_games,
                "images": gallery_images,
                "source": "firebase",
                "age_group_id": age_group_id
            }
        else:
            print(f"❌ No games found, will generate new ones for {request.topic}")
            return {
                "success": True,
                "games_exist": False,
                "message": f"No games found for {request.topic} (age group {age_group_id}). New games will be generated.",
                "source": "generate_new",
                "age_group_id": age_group_id
            }
            
    except Exception as e:
        print(f"❌ Error validating topic: {e}")
        return {"success": False, "error": str(e)}

@app.post("/generate-games")
async def generate_games_endpoint(request: GameGenerationRequest):
    """Generate new games and save to Firebase"""
    try:
        age_group_id = "2" if request.age_group in ["7-11", "5-10"] else request.age_group
        
        print(f"🎮 Generating games for topic: {request.topic} (age group ID: {age_group_id})")
        
        result = await game_service.generate_games_with_images(
            request.topic, age_group_id, request.domain, request.tags
        )
        
        result["age_group_id"] = age_group_id
        return result
        
    except Exception as e:
        print(f"❌ Error in generate_games_endpoint: {e}")
        import traceback
        traceback.print_exc()
        
        # Return fallback response
        fallback_games = llama_service._create_fallback_games(request.topic, request.age_group)
        return {
            "success": True,
            "games": fallback_games,
            "error": str(e),
            "source": "fallback"
        }

@app.get("/images/{topic}/{age_group}/{image_index}")
async def get_image(topic: str, age_group: str, image_index: int):
    """Get image directly from Firebase with direct Storage URL"""
    if not db:
        raise HTTPException(status_code=500, detail="Firebase not available")
    
    try:
        print(f"🖼 Getting image: {topic}/{age_group}/{image_index}")
        
        safe_topic = topic.lower().replace(" ", "_").replace("/", "_")
        
        topic_ref = db.collection("topics").document(safe_topic)
        agegrp_ref = topic_ref.collection("agegrps").document(str(age_group))
        gallery_ref = agegrp_ref.collection("games").document("gallery")
        
        image_doc = gallery_ref.get()
        if not image_doc.exists:
            raise HTTPException(status_code=404, detail="Gallery game not found")
        
        images_list = image_doc.to_dict().get('images', [])
        if len(images_list) <= image_index:
            raise HTTPException(status_code=404, detail="Image index out of range")
        
        image_data = images_list[image_index]
        image_url = image_data.get("url")
        
        if not image_url:
            raise HTTPException(status_code=404, detail="Image URL not found")
        
        print(f"✅ Found direct Firebase Storage URL: {image_url[:50]}...")
        
        return {
            "success": True,
            "image_url": image_url,
            "prompt": image_data.get("prompt", ""),
            "index": image_index,
            "source": "firebase_storage"
        }
        
    except Exception as e:
        print(f"❌ Error getting image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get-related-topics")
async def get_related_topics(request: GenerateDomainsRequest):
    """Generate domain-specific topics based on the primary label from image analysis"""
    if not llama_service.client:
        raise HTTPException(status_code=500, detail="OpenRouter client not available")

    try:
        primary_label = request.primary_label
        if not primary_label:
            tag_objects = []
            if request.tags:
                for tag in request.tags:
                    if isinstance(tag, str):
                        tag_objects.append({"name": tag, "confidence": 50})
                    else:
                        tag_objects.append(tag)
            primary_label = get_primary_label_from_tags(tag_objects, request.description)
        
        print(f"🎯 Generating domain-specific topics for primary subject: {primary_label}")
        
        generated_data = llama_service.generate_domain_topics(request.description, request.tags, primary_label)
        
        if generated_data and "domains" in generated_data:
            print(f"✅ Successfully generated {len(generated_data['domains'])} domain-specific topics for {primary_label}")
            return {
                "success": True,
                "data": generated_data,
                "primary_subject": primary_label
            }
        else:
            print(f"❌ Failed to generate domains for {primary_label}")
            raise HTTPException(status_code=500, detail="Failed to generate domain-specific topics.")
            
    except Exception as e:
        print(f"❌ Error in get_related_topics endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check-letter")
async def check_letter(request: LetterCheckRequest):
    """Check if drawn letter matches expected letter using Azure OCR"""
    if not OCR_AVAILABLE:
        return {
            "success": False,
            "correct": False,
            "error": "OCR service not available",
            "detected": "",
            "expected": request.expected_letter.upper()
        }
    
    try:
        print(f"🔤 Checking letter: expected '{request.expected_letter}'")
        result = ocr_service.check_letter_match(request.image, request.expected_letter)
        if result["success"]:
            print(f"✅ Letter check result: {result['correct']} - Detected: '{result['detected']}'")
        else:
            print(f"❌ Letter check failed: {result.get('error', 'Unknown error')}")
        return result
    except Exception as e:
        print(f"❌ Error in check_letter endpoint: {e}")
        return {
            "success": False,
            "correct": False,
            "error": str(e),
            "detected": "",
            "expected": request.expected_letter.upper()
        }

@app.get("/cached-topics/{topic_name}")
async def get_cached_topics_for_topic(topic_name: str):
    """Get cached topics for a specific topic name"""
    if not db:
        raise HTTPException(status_code=500, detail="Firebase not available")
    
    try:
        cache_key = await cache_service.create_topic_cache_key(topic_name)
        if not cache_key:
            raise HTTPException(status_code=400, detail="Invalid topic name")
        
        print(f"🔍 Getting cached topics for: '{topic_name}' (key: '{cache_key}')")
        
        cache_ref = db.collection("prediction_cache").document(cache_key)
        cache_doc = cache_ref.get()
        
        if cache_doc.exists:
            cached_data = cache_doc.to_dict()
            await cache_service.update_cache_access(topic_name)
            
            return {
                "success": True,
                "topic": topic_name,
                "cache_key": cache_key,
                "all_topics": cached_data.get("all_topics", []),
                "domain_topics": cached_data.get("domain_topics"),
                "topic_count": cached_data.get("topic_count", 0),
                "access_count": cached_data.get("access_count", 0),
                "created_at": cached_data.get("created_at"),
                "examples": cached_data.get("examples", {})
            }
        else:
            raise HTTPException(status_code=404, detail=f"No cached topics found for '{topic_name}'")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting cached topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cache-stats")
async def get_cache_stats():
    """Get prediction cache statistics"""
    try:
        stats = await cache_service.get_cache_statistics()
        return {
            "success": True,
            "cache_statistics": stats,
            "message": "Cache statistics retrieved successfully"
        }
    except Exception as e:
        print(f"❌ Error getting cache stats: {e}")
        return {"success": False, "error": str(e), "cache_statistics": {}}

@app.delete("/clear-cache")
async def clear_prediction_cache():
    """Clear all prediction cache (admin endpoint)"""
    if not db:
        raise HTTPException(status_code=500, detail="Firebase not available")
    
    try:
        result = await cache_service.clear_cache()
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result["error"])
    except Exception as e:
        print(f"❌ Error clearing cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/")
async def upload_drawing(request: ImageUploadRequest):
    """Upload drawing"""
    try:
        image_data = request.image.split(",")[1] if "," in request.image else request.image
        image_bytes = base64.b64decode(image_data)
        filename = f"drawing_{request.label}_{hash(request.image) % 10000}.png"
        with open(filename, "wb") as f:
            f.write(image_bytes)
        return {
            "success": True,
            "message": "Drawing saved successfully",
            "filename": filename,
            "label": request.label
        }
    except Exception as e:
        print(f"❌ Error saving drawing: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

# ----------------------
# Image Serving Endpoints (NEW)
# ----------------------

@app.get("/api/images/{filename}")
async def serve_generated_image(filename: str):
    """Serve generated images efficiently"""
    file_path = os.path.join("generated_images", filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(
        path=file_path,
        media_type="image/png",
        headers={"Cache-Control": "max-age=3600"}  # Cache for 1 hour
    )

@app.get("/api/images/{filename}/base64")
async def get_image_as_base64_endpoint(filename: str):
    """🔧 OPTIONAL: Get base64 only when specifically requested"""
    if not DIFFUSERS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Image generation service not available")
    
    try:
        from image_generation_service import image_service
        
        file_path = os.path.join("generated_images", filename)
        base64_data = image_service.get_image_as_base64(file_path)
        
        if not base64_data:
            raise HTTPException(status_code=404, detail="Image not found")
        
        return {"image_base64": base64_data}
    except Exception as e:
        print(f"❌ Error converting image to base64: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------
# Helper Functions for Complex Operations
# ----------------------
async def generate_all_domain_topics_from_tags(tags, description):
    """Generate domain-specific topics for ALL detected tags"""
    if not tags or not llama_service.client:
        return []
    
    all_topics = []
    processed_subjects = set()
    
    # Get top 5 most confident tags
    sorted_tags = sorted(tags, key=lambda x: x.get("confidence", 0), reverse=True)[:5]
    
    for tag in sorted_tags:
        subject = tag.get("name", "").title()
        if subject and subject not in processed_subjects and len(subject) > 2:
            processed_subjects.add(subject)
            
            try:
                print(f"🎯 Generating topics for subject: {subject} (confidence: {tag.get('confidence', 0)}%)")
                
                domain_data = llama_service.generate_domain_topics(description, [subject], subject)
                
                if domain_data and "domains" in domain_data:
                    for domain in domain_data["domains"]:
                        domain_topics = domain.get("topics", [])
                        all_topics.extend(domain_topics)
                        print(f"  📚 {domain['domain']}: {', '.join(domain_topics)}")
                
            except Exception as e:
                print(f"❌ Failed to generate topics for {subject}: {e}")
                continue
    
    # Remove duplicates while preserving order
    unique_topics = []
    seen = set()
    for topic in all_topics:
        if topic not in seen:
            unique_topics.append(topic)
            seen.add(topic)
    
    print(f"✅ Generated {len(unique_topics)} unique topics from {len(processed_subjects)} subjects")
    return unique_topics

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Playfinity Unified Backend...")
    print(f"✅ Firebase: {'Available' if db else 'Not Available'}")
    print(f"✅ Image Generation: {'Available' if DIFFUSERS_AVAILABLE else 'Not Available'}")
    print(f"✅ OCR: {'Available' if OCR_AVAILABLE else 'Not Available'}")
    uvicorn.run(app, host="127.0.0.1", port=8000)