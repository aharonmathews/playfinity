from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests
import json
import re
import base64
import os
from PIL import Image
from openai import OpenAI
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, storage
import io
from datetime import datetime
from functools import partial
import asyncio


# Force immediate print flushing
print = partial(print, flush=True)

# ----------------------
# Load environment variables
# ----------------------
load_dotenv()

# ----------------------
# Firebase Initialization
# ----------------------
try:
    cred = credentials.Certificate("C:/Users/aharo/Projects/Personal/ustdecode/ustfinal/my_project.json")
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'decode-27a57.firebasestorage.app'  # ✅ Updated to match Firebase console
    })
    db = firestore.client()
    bucket = storage.bucket()
    print("✅ Firebase successfully initialized with Storage")
    
    # ✅ Add bucket verification
    try:
        bucket_name = bucket.name
        print(f"✅ Connected to bucket: {bucket_name}")
    except Exception as bucket_error:
        print(f"❌ Bucket access failed: {bucket_error}")
        
except Exception as e:
    print(f"❌ Firebase initialization failed: {e}")
    db = None
    bucket = None

# ----------------------
# Azure & OpenRouter Configuration
# ----------------------
AZURE_KEY = os.getenv("AZURE_VISION_KEY")
AZURE_ENDPOINT = "https://aharondecode.cognitiveservices.azure.com/"
ANALYZE_URL = AZURE_ENDPOINT + "vision/v3.2/analyze"
AZURE_PARAMS = {"visualFeatures": "Description,Tags,Objects"}

openrouter_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(base_url="https://openrouter.ai/api/v1", api_key=openrouter_api_key)

# ----------------------
# FastAPI Setup
# ----------------------
app = FastAPI(title="Playfinity Unified Backend")
# Find this section around line 70-80 and update it:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:5174",  # ✅ Add this - common Vite port
        "http://127.0.0.1:5174", # ✅ Add this
        "http://localhost:4173",  # ✅ Add this - Vite preview port  
        "http://127.0.0.1:4173",  # ✅ Add this
        "*"  # ✅ Temporary: Allow all origins for debugging
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# Import Services
# ----------------------
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
# Pydantic Models
# ----------------------
# Update these model definitions (around line 95-105):
class GameGenerationRequest(BaseModel):
    topic: str
    age_group: str = "2"  # ✅ Change default to "2"

class TopicValidationRequest(BaseModel):
    topic: str
    age_group: str = "2"  # ✅ Change default to "2"
class ImageUploadRequest(BaseModel):
    image: str
    label: str = ""

class LetterCheckRequest(BaseModel):
    image: str
    expected_letter: str



# ----------------------
# Helper Functions
# ----------------------
def create_fallback_games(topic, age_group):
    """Create fallback games when generation fails"""
    return {
        "spelling": {
            "word": topic.upper()[:8] if len(topic) <= 8 else topic.upper()[:8],
            "instructions": f"Spell the word related to {topic}"
        },
        "drawing": {
            "word": topic.upper()[:8] if len(topic) <= 8 else topic.upper()[:8],
            "instructions": f"Draw each letter of the word related to {topic}"
        },
        "gallery": {
            "images": [],  # Will be populated by image generation
            "instructions": f"Explore images related to {topic}"
        },
        "quiz": {
            "questions": [
                {
                    "question": f"What is the main characteristic of {topic}?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option A"
                },
                {
                    "question": f"Where would you typically find {topic}?",
                    "options": ["Everywhere", "Specific places", "Nowhere", "Online only"],
                    "correct_answer": "Specific places"
                }
            ],
            "instructions": f"Answer questions about {topic}"
        }
    }

async def verify_firebase_storage():
    """Verify Firebase Storage is working"""
    if not bucket:
        return False
    
    try:
        # Try to list objects in the bucket (this tests access)
        blobs = list(bucket.list_blobs(max_results=1))
        print("✅ Firebase Storage connection verified")
        return True
    except Exception as e:
        print(f"❌ Firebase Storage verification failed: {e}")
        return False

def extract_json_from_response(response_text):
    """Extract JSON from LLaMA response"""
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        try:
            # Try to find JSON in code blocks
            json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            # Try to find bare JSON
            json_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            raise ValueError("No JSON found")
        except Exception as e:
            print(f"❌ JSON parsing failed: {e}")
            return None

# Update the check_games_exist_in_firebase function to ensure images are loaded correctly:
# Find the section around line 200-250 and update it:
async def check_games_exist_in_firebase(topic: str, age_group: str):
    """Check if games for this topic and age group exist in Firebase"""
    if not db:
        return False, None
    
    try:
        print(f"🔍 Checking Firebase for topic: {topic}, age: {age_group}")
        
        # ✅ NEW STRUCTURE: topics/topicname/agegrps/agegroup/games/
        topic_ref = db.collection("topics").document(topic.lower())
        agegrp_ref = topic_ref.collection("agegrps").document(str(age_group))
        games_ref = agegrp_ref.collection("games")
        
        # Get all games for this topic/age combination
        docs = games_ref.stream()
        
        games_data = {}
        for doc in docs:
            data = doc.to_dict()
            game_type = doc.id
            
            # ✅ Gallery images are already stored as URLs in Firestore
            if game_type == "gallery" and "images" in data:
                images = data["images"]
                print(f"✅ Found {len(images)} images with Storage URLs")
                
                # Verify URLs are accessible
                for i, img in enumerate(images):
                    if img.get("url"):
                        print(f"🖼️ Image {i}: {img['url'][:50]}...")
            
            games_data[game_type] = data
        
        if games_data:
            print(f"✅ Found {len(games_data)} games in Firebase for {topic} (age {age_group})")
            return True, games_data
        else:
            print(f"❌ No games found for {topic} (age {age_group})")
            return False, None
            
    except Exception as e:
        print(f"❌ Error checking Firebase: {e}")
        return False, None


def generate_games_with_llama(topic: str, age_group: str):
    """Generate games using LLaMA API"""
    prompt = f"""
You are an educational game creator for children aged {age_group}. 
Create educational games for the topic: "{topic}"

For the gallery game, create 4 SEQUENTIAL images that show a process, stages, or related aspects of the topic in logical order. Think of it as telling a visual story.

Examples:
- If topic is "germination": [seed, sprouting seed, seedling, young plant]
- If topic is "butterfly": [egg, caterpillar, chrysalis, butterfly] 
- If topic is "cooking": [ingredients, mixing, cooking, finished dish]
- If topic is "seasons": [spring, summer, autumn, winter]
- If topic is "building": [foundation, walls, roof, completed house]

Generate games in this EXACT JSON format:

{{
  "spelling": {{
    "word": "SINGLE_WORD_RELATED_TO_TOPIC_MAX_8_LETTERS",
    "instructions": "Spell the word related to {topic}"
  }},
  "drawing": {{
    "word": "SAME_WORD_AS_SPELLING_GAME",
    "instructions": "Draw each letter of the word"
  }},
  "gallery": {{
    "image_prompts": [
      "Stage 1: [first stage of {topic} process] - simple colorful illustration for children",
      "Stage 2: [second stage of {topic} process] - cute cartoon style for kids", 
      "Stage 3: [third stage of {topic} process] - child-friendly bright colors",
      "Stage 4: [final stage of {topic} process] - happy conclusion scene for children"
    ],
    "instructions": "Explore the {topic} process step by step"
  }},
  "quiz": {{
    "questions": [
      {{
        "question": "What happens first in {topic}?",
        "options": ["Stage 1", "Stage 2", "Stage 3", "Stage 4"],
        "correct_answer": "Stage 1"
      }},
      {{
        "question": "What comes after the first stage of {topic}?",
        "options": ["Stage 2", "Stage 3", "Stage 4", "Nothing"],
        "correct_answer": "Stage 2"
      }},
      {{
        "question": "What is the final result of {topic}?",
        "options": ["Beginning", "Middle", "End result", "Nothing"],
        "correct_answer": "End result"
      }}
    ],
    "instructions": "Answer questions about the {topic} process"
  }}
}}

IMPORTANT: Replace [first stage], [second stage], etc. with actual specific stages relevant to the topic. Make the image prompts describe a clear sequence or process related to {topic}.

Return ONLY the JSON, nothing else.
"""

    try:
        print(f"🧠 Generating sequential games with LLaMA for: {topic}")
        
        response = client.chat.completions.create(
            model="meta-llama/llama-3.1-8b-instruct",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.7
        )

        raw_response = response.choices[0].message.content
        print(f"📝 LLaMA raw response: {raw_response[:200]}...")

        parsed_games = extract_json_from_response(raw_response)
        
        if parsed_games and all(key in parsed_games for key in ["spelling", "drawing", "gallery", "quiz"]):
            print("✅ Successfully parsed sequential games from LLaMA")
            
            # Debug: Show the generated image prompts
            if "gallery" in parsed_games and "image_prompts" in parsed_games["gallery"]:
                print("🎨 Generated sequential image prompts:")
                for i, prompt in enumerate(parsed_games["gallery"]["image_prompts"]):
                    print(f"  {i+1}. {prompt}")
            
            return parsed_games
        else:
            print("❌ Invalid games structure, using fallback")
            return create_fallback_games(topic, age_group)

    except Exception as e:
        print(f"❌ Error generating games with LLaMA: {e}")
        return create_fallback_games(topic, age_group)

async def upload_image_to_firebase(image_data: str, filename: str):
    """Upload image to Firebase Storage and return public URL"""
    if not bucket:
        print("❌ Firebase Storage not available")
        return None
    
    try:
        # Clean base64 data
        if "base64," in image_data:
            image_data = image_data.split("base64,")[1]
        elif image_data.startswith("data:"):
            image_data = image_data.split(",")[1]
        
        # Convert base64 to bytes
        image_bytes = base64.b64decode(image_data)
        
        # Create blob in Firebase Storage
        blob = bucket.blob(f"game_images/{filename}")
        blob.upload_from_string(image_bytes, content_type='image/png')
        
        # Make blob publicly readable
        blob.make_public()
        
        public_url = blob.public_url
        print(f"✅ Uploaded image to Firebase Storage: {filename} -> {public_url}")
        return public_url
        
    except Exception as e:
        print(f"❌ Error uploading image to Firebase Storage: {e}")
        return None


# Replace the save_games_to_firebase function with this fixed version:
# Replace the save_games_to_firebase function (around line 250-350) with this corrected version:
async def save_games_to_firebase(topic: str, age_group: str, games_data: dict, images_data: list = None):
    """Save all games to Firebase with images in Storage"""
    if not db:
        print("❌ Firebase not available, skipping save")
        return []
    
    try:
        saved_games = []
        from datetime import datetime, timezone
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # ✅ NEW STRUCTURE: topics/topicname/agegrps/agegroup/games/gametype
        topic_ref = db.collection("topics").document(topic.lower())
        agegrp_ref = topic_ref.collection("agegrps").document(str(age_group))
        
        # Create topic document if it doesn't exist
        topic_doc = topic_ref.get()
        if not topic_doc.exists:
            topic_ref.set({
                "name": topic,
                "created_at": timestamp,
                "last_updated": timestamp
            })
            print(f"✅ Created topic document: {topic}")
        
        # Create age group document if it doesn't exist  
        agegrp_doc = agegrp_ref.get()
        if not agegrp_doc.exists:
            age_range = "5-10" if str(age_group) == "2" else "7-11"
            agegrp_ref.set({
                "age_group_id": str(age_group),
                "age_range": age_range,
                "created_at": timestamp,
                "last_updated": timestamp
            })
            print(f"✅ Created age group document: {age_group} ({age_range})")
        
        # Process each game type
        for game_type, game_data in games_data.items():
            
            # Prepare document data
            doc_data = {
                "created_at": timestamp,
                "last_updated": timestamp,
                **game_data
            }
            
            # ✅ Handle gallery game - Store images in Firebase Storage
            if game_type == "gallery" and images_data and len(images_data) > 0:
                print(f"🖼️ Processing {len(images_data)} images for gallery game")
                
                # Remove image_prompts if it exists
                if "image_prompts" in doc_data:
                    del doc_data["image_prompts"]
                
                # Upload images to Firebase Storage
                firebase_images = []
                for idx, img_data in enumerate(images_data):
                    filename = f"{topic}_{age_group}_{idx}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                    
                    # ✅ Upload to Firebase Storage
                    public_url = await upload_image_to_firebase(img_data.get('image_base64', ''), filename)
                    
                    if public_url:
                        firebase_images.append({
                            "url": public_url,
                            "prompt": img_data.get('prompt', f'Image {idx + 1} for {topic}'),
                            "enhanced_prompt": img_data.get('enhanced_prompt', ''),
                            "index": idx,
                            "filename": filename
                        })
                        print(f"✅ Added image {idx} with URL: {public_url}")
                    else:
                        print(f"❌ Failed to upload image {idx}")
                        continue
                
                # ✅ Store image URLs in Firestore (no base64 data)
                doc_data["images"] = firebase_images
                doc_data["image_count"] = len(firebase_images)
                doc_data["images_stored_in_storage"] = True
                
                print(f"✅ Successfully uploaded {len(firebase_images)} images to Firebase Storage")
            
            # Save game document
            game_ref = agegrp_ref.collection("games").document(game_type)
            game_ref.set(doc_data)
            
            saved_games.append({
                "game_type": game_type,
                "id": game_type,
                "path": f"topics/{topic.lower()}/agegrps/{age_group}/games/{game_type}",
                "data": {k: v for k, v in doc_data.items() if k not in ["images"]}  # Exclude images from response
            })
            
            print(f"✅ Saved {game_type} game at: topics/{topic.lower()}/agegrps/{age_group}/games/{game_type}")
        
        return saved_games
        
    except Exception as e:
        print(f"❌ Error saving games to Firebase: {e}")
        import traceback
        traceback.print_exc()
        return []
    
async def analyze_image(file: UploadFile):
    """Analyze image using Azure Computer Vision"""
    image_data = await file.read()
    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_KEY,
        "Content-Type": "application/octet-stream"
    }
    
    response = requests.post(ANALYZE_URL, headers=headers, params=AZURE_PARAMS, data=image_data)
    response.raise_for_status()
    return response.json()

# ----------------------
# API Endpoints
# ----------------------
@app.get("/")
async def root():
    storage_working = await verify_firebase_storage() if bucket else False
    
    return {
        "message": "Playfinity Unified Backend Running!",
        "firebase_available": db is not None,
        "storage_available": bucket is not None,
        "storage_working": storage_working,
        "image_generation_available": DIFFUSERS_AVAILABLE,
        "ocr_available": OCR_AVAILABLE
    }

@app.post("/validate-topic")
async def validate_topic(request: TopicValidationRequest):
    """Check if topic exists in Firebase, if not generate new games"""
    try:
        # ✅ Convert age_group to internal ID
        age_group_id = "2" if request.age_group in ["7-11", "5-10"] else request.age_group
        
        print(f"🔍 Validating topic: {request.topic} (age group ID: {age_group_id})")
        
        # Check if games exist in Firebase
        games_exist, existing_games = await check_games_exist_in_firebase(request.topic, age_group_id)
        
        if games_exist and existing_games:
            print(f"✅ Games found in Firebase for {request.topic}")
            
            # ✅ Extract images from gallery (they're already URLs)
            gallery_images = None
            if "gallery" in existing_games and "images" in existing_games["gallery"]:
                gallery_images = existing_games["gallery"]["images"]
                print(f"🖼️ Passing {len(gallery_images)} Storage URLs to frontend")
            
            return {
                "success": True,
                "games_exist": True,
                "games": existing_games,
                "images": gallery_images,  # ✅ Pass Storage URLs
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
        return {
            "success": False,
            "error": str(e)
        }
    
@app.get("/images/{topic}/{age_group}/{image_index}")
async def get_image(topic: str, age_group: str, image_index: int):
    """Get image directly from Firebase"""
    if not db:
        raise HTTPException(status_code=500, detail="Firebase not available")
    
    try:
        print(f"🖼️ Getting image: {topic}/{age_group}/{image_index}")
        
        # Get the image from Firebase
        topic_ref = db.collection("topics").document(topic.lower())
        agegrp_ref = topic_ref.collection("agegrps").document(str(age_group))
        gallery_ref = agegrp_ref.collection("games").document("gallery")
        image_ref = gallery_ref.collection("images").document(f"image_{image_index}")
        
        image_doc = image_ref.get()
        if not image_doc.exists:
            raise HTTPException(status_code=404, detail="Image not found")
        
        image_data = image_doc.to_dict()
        image_base64 = image_data.get("image_base64", "")
        
        if not image_base64:
            raise HTTPException(status_code=404, detail="Image data not found")
        
        # Return as base64 data URL
        return {
            "success": True,
            "image_url": f"data:image/png;base64,{image_base64}",
            "prompt": image_data.get("prompt", ""),
            "index": image_index
        }
        
    except Exception as e:
        print(f"❌ Error getting image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Also, let's modify the validate-topic endpoint to return image URLs instead of base64:
# Replace the validate_topic function with this updated version:

# Update the generate_games_endpoint function to debug image generation (around line 480-530):
# Replace the generate_games_endpoint function (around line 580-650):
@app.post("/generate-games")
async def generate_games_endpoint(request: GameGenerationRequest):
    """Generate new games and save to Firebase"""
    try:
        # ✅ Convert age_group to internal ID
        age_group_id = "2" if request.age_group in ["7-11", "5-10"] else request.age_group
        
        print(f"🎮 Generating games for topic: {request.topic} (age group ID: {age_group_id})")
        
        # First check if games already exist
        games_exist, existing_games = await check_games_exist_in_firebase(request.topic, age_group_id)
        
        if games_exist:
            print("✅ Games already exist, returning from Firebase")
            
            # ✅ Extract images from existing gallery
            gallery_images = []
            if "gallery" in existing_games and "images" in existing_games["gallery"]:
                gallery_images = existing_games["gallery"]["images"]
                print(f"🖼️ Found {len(gallery_images)} existing images")
            
            return {
                "success": True,
                "games": existing_games,
                "images": gallery_images,  # ✅ Include existing images
                "source": "firebase_existing",
                "age_group_id": age_group_id
            }
        
        # Generate new games with LLaMA
        games_data = generate_games_with_llama(request.topic, request.age_group)
        
        # ✅ Generate ACTUAL IMAGES for gallery game
        images_data = []
        if DIFFUSERS_AVAILABLE and "gallery" in games_data and "image_prompts" in games_data["gallery"]:
            print(f"🎨 Generating images for gallery game...")
            
            prompts = games_data["gallery"]["image_prompts"]
            print(f"📝 Image prompts: {prompts}")
            
            image_result = image_service.generate_images_from_prompts(prompts, request.topic)
            print(f"🔍 Image generation result keys: {list(image_result.keys())}")
            
            if image_result.get("success") and image_result.get("images"):
                images_data = image_result["images"]
                print(f"✅ Generated {len(images_data)} images")
                
                # ✅ Debug: Check if images have base64 data
                for i, img in enumerate(images_data):
                    has_base64 = 'image_base64' in img and len(img.get('image_base64', '')) > 0
                    print(f"🖼️ Image {i}: has_base64={has_base64}, prompt='{img.get('prompt', 'No prompt')}'")
                
            else:
                print(f"❌ Image generation failed: {image_result.get('error', 'Unknown error')}")
                print(f"🔍 Full image result: {image_result}")
        else:
            print("❌ Image generation not available or no image prompts found")
            print(f"🔍 DIFFUSERS_AVAILABLE: {DIFFUSERS_AVAILABLE}")
            print(f"🔍 games_data keys: {list(games_data.keys())}")
            if "gallery" in games_data:
                print(f"🔍 gallery keys: {list(games_data['gallery'].keys())}")
        
        # Save games to Firebase Storage
        print(f"💾 Saving to Firebase with {len(images_data)} images...")
        saved_games = await save_games_to_firebase(request.topic, age_group_id, games_data, images_data)
        
        # ✅ Get the saved images with Storage URLs
        _, updated_games = await check_games_exist_in_firebase(request.topic, age_group_id)
        final_images = []
        if updated_games and "gallery" in updated_games and "images" in updated_games["gallery"]:
            final_images = updated_games["gallery"]["images"]
            print(f"🖼️ Retrieved {len(final_images)} images with Storage URLs")
        
        return {
            "success": True,
            "games": games_data,
            "images": final_images,  # ✅ Return Storage URLs
            "saved_games": saved_games,
            "source": "generated_new",
            "age_group_id": age_group_id
        }
        
    except Exception as e:
        print(f"❌ Error in generate_games_endpoint: {e}")
        import traceback
        traceback.print_exc()
        
        fallback_games = create_fallback_games(request.topic, request.age_group)
        return {
            "success": True,
            "games": fallback_games,
            "error": str(e),
            "source": "fallback"
        }


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

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    """Analyze image using Azure Computer Vision"""
    try:
        result = await analyze_image(file)
        
        tags = []
        if "tags" in result:
            for tag in result["tags"]:
                tags.append({
                    "name": tag["name"],
                    "confidence": round(tag["confidence"] * 100, 1)
                })
        
        description = ""
        if "description" in result and "captions" in result["description"]:
            captions = result["description"]["captions"]
            if captions:
                description = captions[0]["text"]
        
        return {
            "success": True,
            "tags": tags,
            "description": description,
            "analysis": result
        }
        
    except Exception as e:
        print(f"❌ Error in predict_image: {e}")
        return {
            "success": False,
            "tags": [],
            "description": f"Error: {str(e)}",
            "analysis": None
        }

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

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Playfinity Unified Backend...")
    print(f"✅ Firebase: {'Available' if db else 'Not Available'}")
    print(f"✅ Image Generation: {'Available' if DIFFUSERS_AVAILABLE else 'Not Available'}")
    print(f"✅ OCR: {'Available' if OCR_AVAILABLE else 'Not Available'}")
    
    uvicorn.run(app, host="127.0.0.1", port=8000)