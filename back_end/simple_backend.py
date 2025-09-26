from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests
import json
import re
import base64
import os
import uuid  # 🆕 Add this missing import
from PIL import Image
from openai import OpenAI
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore, storage
import io
from datetime import datetime, timezone
from functools import partial
import asyncio
from typing import List, Optional

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
    cred = credentials.Certificate("../../my_project.json")
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'decode-27a57.firebasestorage.app'
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:4173",  
        "http://127.0.0.1:4173",
        "*"
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
class GameGenerationRequest(BaseModel):
    topic: str
    age_group: str = "2"
    domain: Optional[str] = None
    tags: Optional[List[str]] = None

class TopicValidationRequest(BaseModel):
    topic: str
    age_group: str = "2"
    domain: Optional[str] = None
    tags: Optional[List[str]] = None
    
class GenerateDomainsRequest(BaseModel):
    description: str
    tags: List[str]
    primary_label: Optional[str] = None  # Add primary label from image analysis

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
            "images": [],
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

def get_primary_label_from_tags(tags, description):
    """Extract the most relevant primary label from image analysis"""
    if not tags:
        # Extract main subject from description
        if description:
            words = description.lower().split()
            # Remove common words and pick the most relevant noun
            stop_words = {"a", "an", "the", "is", "are", "with", "on", "in", "at", "of", "for", "and", "or", "but"}
            relevant_words = [word for word in words if word not in stop_words and len(word) > 2]
            if relevant_words:
                return relevant_words[0].title()
        return "Object"
    
    # Find the highest confidence tag
    primary_tag = max(tags, key=lambda x: x.get("confidence", 0))
    return primary_tag.get("name", "Object").title()

async def verify_firebase_storage():
    """Verify Firebase Storage is working"""
    if not bucket:
        return False
    
    try:
        blobs = list(bucket.list_blobs(max_results=1))
        print("✅ Firebase Storage connection verified")
        return True
    except Exception as e:
        print(f"❌ Firebase Storage verification failed: {e}")
        return False

def extract_json_from_response(response_text):
    """Extract JSON from LLaMA response"""
    try:
        json_string = re.search(r'(?:json)?\s*(\{.*\})\s*', response_text, re.DOTALL)
        if json_string:
            return json.loads(json_string.group(1))
        
        json_string = re.search(r'(\{.*\})', response_text, re.DOTALL)
        if json_string:
            return json.loads(json_string.group(1))
        
        return json.loads(response_text)
    except Exception as e:
        print(f"❌ JSON parsing failed: {e}")
        return None

async def check_games_exist_in_firebase(topic: str, age_group: str, domain: Optional[str] = None, tags: Optional[List[str]] = None):
    """Check if games for this topic and age group exist in Firebase"""
    if not db:
        return False, None
    
    try:
        print(f"🔍 Checking Firebase for topic: {topic}, age: {age_group}, domain: {domain}, tags: {tags}")
        
        # Handle topic name formatting consistently
        safe_topic = topic.lower().replace(" ", "_").replace("/", "_")
        
        games_ref = db.collection("topics").document(safe_topic).collection("agegrps").document(str(age_group)).collection("games")
        
        docs = games_ref.stream()
        
        games_data = {}
        for doc in docs:
            data = doc.to_dict()
            game_type = doc.id
            
            if game_type == "gallery" and "images" in data:
                images = data["images"]
                print(f"✅ Found {len(images)} images with direct Storage URLs")
            
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

    
async def upload_base64_to_firebase_storage(base64_data: str, filename: str, bucket_folder: str = "generated_images") -> str:
    """Upload base64 image data to Firebase Storage and return public URL"""
    if not bucket:
        raise Exception("Firebase Storage not available")
    
    try:
        # Decode base64 image data
        if base64_data.startswith('data:image'):
            # Remove data:image/png;base64, prefix if present
            base64_data = base64_data.split(',')[1]
        
        image_bytes = base64.b64decode(base64_data)
        
        # Generate unique filename with folder structure
        unique_filename = f"{bucket_folder}/{filename}_{uuid.uuid4().hex[:8]}.png"
        
        # Create blob and upload
        blob = bucket.blob(unique_filename)
        blob.upload_from_string(image_bytes, content_type='image/png')
        
        # Make blob publicly accessible
        blob.make_public()
        
        # Get public URL
        public_url = blob.public_url
        print(f"✅ Uploaded to Firebase Storage: {unique_filename}")
        print(f"🔗 Public URL: {public_url[:50]}...")
        
        return public_url
        
    except Exception as e:
        print(f"❌ Firebase Storage upload failed: {e}")
        raise e


def generate_games_with_llama(topic: str, age_group: str, tags: List[str] = None, domain: str = None):
    """Generate games using LLaMA API with additional tags and domain constraints."""
    
    prompt = f"""
You are an educational game creator for children aged {age_group}. 
Create educational games for the topic: "{topic}"
"""
    if domain:
        prompt += f"""
The games must be focused on the educational domain of *{domain}*.
"""
    if tags:
        tags_str = ", ".join(tags)
        prompt += f"""
Ensure the game content incorporates the following keywords or concepts: *{tags_str}*.
"""
    prompt += f"""
For the gallery game, create 4 *SEQUENTIAL* images that show a process, stages, or related aspects of the topic in logical order. Think of it as telling a visual story.

Examples:
- If topic is "germination": [seed, sprouting seed, seedling, young plant]
- If topic is "butterfly": [egg, caterpillar, chrysalis, butterfly] 
- If topic is "cooking": [ingredients, mixing, cooking, finished dish]

Generate games in this *EXACT JSON* format:

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

*IMPORTANT*: Replace [first stage], [second stage], etc. with actual specific stages relevant to the topic. Make the image prompts describe a clear sequence or process related to {topic}.

Return *ONLY* the JSON, nothing else.
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

def generate_domains_with_llama(description: str, tags: List[str], primary_label: str = None):
    """Generates domain-specific topics using the primary label from image analysis"""
    
    # Use primary_label as the main focus if available
    main_subject = primary_label if primary_label else (tags[0] if tags else "the subject")
    tags_str = ", ".join(tags) if tags else ""
    
    prompt = f"""
You are an educational expert for children. The main subject identified from an image is "{main_subject}".

Your task is to generate educational domains and specific learning topics that are directly related to "{main_subject}". Each domain should contain topics that help children learn about different aspects of "{main_subject}".

Context:
- Primary subject: "{main_subject}"
- Description: "{description}"
- Related tags: "{tags_str}"

For each domain, suggest 2-3 specific, educational topics that are:
1. Directly related to "{main_subject}"
2. Age-appropriate for children
3. Educational and engaging
4. Clickable and specific (not too broad)

Example approach:
- If primary_label is "Apple": Science domain might include "Gravity and Falling Objects", "Plant Growth Cycles", "Nutrition and Health"
- If primary_label is "Car": Physics domain might include "Motion and Speed", "Simple Machines", "Energy and Fuel"
- If primary_label is "Bird": Biology domain might include "Animal Flight", "Bird Migration", "Habitats and Nesting"

Return the response in this *EXACT JSON* format:

{{
  "primary_subject": "{main_subject}",
  "domains": [
    {{
      "domain": "Domain Name 1",
      "topics": ["Topic 1a related to {main_subject}", "Topic 1b related to {main_subject}"]
    }},
    {{
      "domain": "Domain Name 2", 
      "topics": ["Topic 2a related to {main_subject}", "Topic 2b related to {main_subject}"]
    }},
    {{
      "domain": "Domain Name 3",
      "topics": ["Topic 3a related to {main_subject}", "Topic 3b related to {main_subject}"]
    }}
  ]
}}

Generate 3-4 relevant educational domains with specific topics all connected to "{main_subject}".
"""

    try:
        print(f"🧠 Generating domain-specific topics for primary subject: {main_subject}")
        response = client.chat.completions.create(
            model="meta-llama/llama-3.1-8b-instruct",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1200,
            temperature=0.6
        )
        raw_response = response.choices[0].message.content
        parsed_response = extract_json_from_response(raw_response)
        
        if parsed_response and "domains" in parsed_response:
            print(f"✅ Generated {len(parsed_response['domains'])} domains for {main_subject}")
            for domain in parsed_response['domains']:
                print(f"  📚 {domain['domain']}: {', '.join(domain['topics'])}")
            return parsed_response
        else:
            print("❌ Failed to parse domain response, using fallback")
            return generate_fallback_domains(main_subject)
            
    except Exception as e:
        print(f"❌ Error generating domains with LLaMA: {e}")
        return generate_fallback_domains(main_subject)
    
async def create_topic_cache_key(primary_label: str):
    """Create a cache key based on the primary topic/label"""
    if not primary_label:
        return None
    
    # Clean and normalize the topic name for use as document ID
    clean_topic = primary_label.lower().strip()
    # Replace spaces and special characters with underscores
    clean_topic = re.sub(r'[^a-z0-9]+', '_', clean_topic)
    # Remove leading/trailing underscores
    clean_topic = clean_topic.strip('_')
    
    # Ensure it's not empty and has reasonable length
    if not clean_topic or len(clean_topic) < 2:
        return "unknown_topic"
    
    # Limit length for Firestore document ID constraints
    if len(clean_topic) > 50:
        clean_topic = clean_topic[:50]
    
    print(f"🔑 Created topic-based cache key: '{clean_topic}' from '{primary_label}'")
    return clean_topic
async def check_prediction_cache(tags, description):
    """Check if we already have topics generated for this specific topic"""
    if not db or not tags:
        return None
    
    try:
        # Get primary label from the current prediction
        primary_label = get_primary_label_from_tags(tags, description)
        cache_key = await create_topic_cache_key(primary_label)
        
        if not cache_key:
            print("❌ Could not create cache key from primary label")
            return None
        
        print(f"🔍 Checking prediction cache for topic: '{primary_label}' (key: '{cache_key}')")
        
        # Check if this topic already has cached results
        cache_ref = db.collection("prediction_cache").document(cache_key)
        cache_doc = cache_ref.get()
        
        if cache_doc.exists:
            cached_data = cache_doc.to_dict()
            topic_count = len(cached_data.get('all_topics', []))
            
            print(f"🎯 ✅ CACHE HIT! Found cached topics for '{primary_label}':")
            print(f"   📚 {topic_count} topics available")
            print(f"   📅 Originally cached: {cached_data.get('created_at', 'Unknown')}")
            print(f"   🔄 Total access count: {cached_data.get('access_count', 0)}")
            
            return cached_data
        else:
            print(f"❌ CACHE MISS: No cached topics found for '{primary_label}'")
            return None
            
    except Exception as e:
        print(f"❌ Error checking prediction cache: {e}")
        return None

async def save_prediction_to_cache(tags, description, primary_label, all_topics, domain_topics=None):
    """Save prediction results to cache using topic as document ID"""
    if not db or not tags or not primary_label:
        print("❌ Cannot save to cache: missing requirements")
        return False
    
    try:
        cache_key = await create_topic_cache_key(primary_label)
        
        if not cache_key:
            print("❌ Could not create cache key, skipping cache save")
            return False
        
        print(f"💾 Saving prediction cache for topic: '{primary_label}' (key: '{cache_key}')")
        
        # Prepare cache data with topic-focused structure
        cache_data = {
            "topic": primary_label,                    # 🆕 Clear topic identifier
            "cache_key": cache_key,                    # Document ID (same as topic)
            "primary_label": primary_label,            # Keep for compatibility
            "description_sample": description[:200] if description else "",  # Sample for reference
            "tags": tags,                              # Original tags from image analysis
            "all_topics": all_topics,                  # All generated related topics
            "topic_count": len(all_topics),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_accessed": datetime.now(timezone.utc).isoformat(),
            "access_count": 1,
            "examples": {                              # 🆕 Store examples of when this was detected
                "descriptions": [description] if description else [],
                "tag_combinations": [tag.get("name") for tag in tags[:5]]  # Top 5 tags
            }
        }
        
        # Add structured domain topics if available
        if domain_topics:
            cache_data["domain_topics"] = domain_topics
            cache_data["has_structured_domains"] = True
        else:
            cache_data["has_structured_domains"] = False
        
        # Save to Firestore with topic as document ID
        cache_ref = db.collection("prediction_cache").document(cache_key)
        
        # Check if document already exists to merge examples
        existing_doc = cache_ref.get()
        if existing_doc.exists:
            # 🔄 Update existing document with new examples
            existing_data = existing_doc.to_dict()
            
            # Add new description to examples if it's different
            existing_descriptions = existing_data.get("examples", {}).get("descriptions", [])
            if description and description not in existing_descriptions:
                existing_descriptions.append(description)
                cache_data["examples"]["descriptions"] = existing_descriptions[:10]  # Keep last 10
            
            # Update access count
            cache_data["access_count"] = existing_data.get("access_count", 0) + 1
            cache_data["created_at"] = existing_data.get("created_at", cache_data["created_at"])  # Keep original creation time
            
            print(f"🔄 Updating existing cache for '{primary_label}' (total accesses: {cache_data['access_count']})")
        else:
            print(f"🆕 Creating new cache entry for '{primary_label}'")
        
        # Save/update the document
        cache_ref.set(cache_data)
        
        print(f"✅ Successfully cached {len(all_topics)} topics for '{primary_label}'")
        return True
        
    except Exception as e:
        print(f"❌ Error saving prediction to cache: {e}")
        return False

async def update_cache_access(primary_label: str):
    """Update cache access statistics using topic name"""
    if not db or not primary_label:
        return
    
    try:
        cache_key = await create_topic_cache_key(primary_label)
        if not cache_key:
            return
        
        cache_ref = db.collection("prediction_cache").document(cache_key)
        
        # Check if document exists first
        cache_doc = cache_ref.get()
        if cache_doc.exists:
            cache_ref.update({
                "last_accessed": datetime.now(timezone.utc).isoformat(),
                "access_count": firestore.Increment(1)
            })
            print(f"📊 Updated access count for topic: '{primary_label}'")
        else:
            print(f"⚠️ Cache document for '{primary_label}' not found, cannot update access")
            
    except Exception as e:
        print(f"⚠️ Could not update cache access for '{primary_label}': {e}")

async def get_cache_statistics():
    """Get enhanced cache usage statistics"""
    if not db:
        return {"total_cached": 0, "error": "Firebase not available"}
    
    try:
        cache_collection = db.collection("prediction_cache")
        docs = cache_collection.stream()
        
        stats = {
            "total_cached_topics": 0,
            "total_generated_topics": 0,
            "total_cache_hits": 0,
            "most_popular_topics": [],
            "recent_topics": []
        }
        
        topic_popularity = []  # For tracking most accessed topics
        
        for doc in docs:
            data = doc.to_dict()
            topic_name = data.get("topic", doc.id)
            access_count = data.get("access_count", 0)
            topic_count = data.get("topic_count", 0)
            created_at = data.get("created_at", "")
            
            stats["total_cached_topics"] += 1
            stats["total_generated_topics"] += topic_count
            stats["total_cache_hits"] += access_count
            
            # Track topic popularity
            topic_popularity.append({
                "topic": topic_name,
                "access_count": access_count,
                "topic_count": topic_count,
                "created_at": created_at
            })
        
        # Sort and get top 5 most popular topics
        topic_popularity.sort(key=lambda x: x["access_count"], reverse=True)
        stats["most_popular_topics"] = topic_popularity[:5]
        
        # Sort by creation date for recent topics
        topic_popularity.sort(key=lambda x: x["created_at"], reverse=True)
        stats["recent_topics"] = topic_popularity[:5]
        
        # Calculate averages
        if stats["total_cached_topics"] > 0:
            stats["average_topics_per_cache"] = round(stats["total_generated_topics"] / stats["total_cached_topics"], 2)
            stats["average_access_per_topic"] = round(stats["total_cache_hits"] / stats["total_cached_topics"], 2)
        else:
            stats["average_topics_per_cache"] = 0
            stats["average_access_per_topic"] = 0
        
        return stats
        
    except Exception as e:
        return {"error": str(e)}

def generate_fallback_domains(primary_subject: str):
    """Generate fallback domains when LLaMA fails"""
    return {
        "primary_subject": primary_subject,
        "domains": [
            {
                "domain": "Science",
                "topics": [f"{primary_subject} Properties", f"How {primary_subject} Works"]
            },
            {
                "domain": "Nature", 
                "topics": [f"{primary_subject} in Environment", f"{primary_subject} Lifecycle"]
            },
            {
                "domain": "Learning",
                "topics": [f"Fun Facts about {primary_subject}", f"{primary_subject} Exploration"]
            }
        ]
    }

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

async def save_games_to_firebase(topic: str, age_group: str, games_data: dict, images_data: list, domain: str = None, tags: list = None):
    """Save generated games to Firebase with direct Storage upload"""
    if not db:
        print("❌ Firebase not available, cannot save games")
        return False
    
    try:
        print(f"💾 Saving games to Firebase: {topic} (age {age_group})")
        
        # Reference structure: topics/{topic}/agegrps/{age_group}/games/{game_type}
        safe_topic = topic.lower().replace(" ", "_").replace("/", "_")
        topic_ref = db.collection("topics").document(safe_topic)
        agegrp_ref = topic_ref.collection("agegrps").document(str(age_group))
        
        # Save metadata
        metadata = {
            "topic": topic,
            "age_group": age_group,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "domain": domain,
            "tags": tags or []
        }
        agegrp_ref.set(metadata)
        
        # 🆕 Process and upload images to Firebase Storage FIRST
        firebase_images = []
        if images_data:
            print(f"📸 Processing {len(images_data)} images for Firebase Storage upload...")
            
            for i, img_data in enumerate(images_data):
                try:
                    if "image_base64" in img_data and img_data["image_base64"]:
                        # Generate filename for this topic and image
                        filename = f"{safe_topic}_image_{i}"
                        
                        print(f"⬆️ Uploading image {i+1}/{len(images_data)} to Firebase Storage...")
                        
                        # Upload base64 to Firebase Storage and get direct URL
                        firebase_url = await upload_base64_to_firebase_storage(
                            img_data["image_base64"], 
                            filename,
                            f"topics/{safe_topic}"
                        )
                        
                        # Add to firebase_images with direct Storage URL
                        firebase_images.append({
                            "url": firebase_url,
                            "prompt": img_data.get("prompt", f"Image {i+1}"),
                            "index": i,
                            "filename": f"{filename}.png"
                        })
                        
                        print(f"✅ Image {i+1} uploaded and ready: {firebase_url[:50]}...")
                        
                    else:
                        print(f"⚠️ Image {i+1} has no base64 data, skipping...")
                        
                except Exception as img_error:
                    print(f"❌ Failed to upload image {i+1}: {img_error}")
                    continue  # Continue with other images even if one fails
            
            print(f"📸 Successfully uploaded {len(firebase_images)} images to Firebase Storage")
        
        # Save each game type
        for game_type, game_data in games_data.items():
            if game_type == "gallery":
                # 🆕 Add direct Firebase Storage URLs to gallery game
                game_data["images"] = firebase_images
                print(f"🖼️ Gallery game will have {len(firebase_images)} Firebase Storage images")
            
            # Save game to Firebase Firestore
            game_ref = agegrp_ref.collection("games").document(game_type)
            game_ref.set(game_data)
            print(f"✅ Saved {game_type} game")
        
        return True
        
    except Exception as e:
        print(f"❌ Error saving games to Firebase: {e}")
        import traceback
        traceback.print_exc()
        return False

# ----------------------
# API Endpoints
# ----------------------
@app.get("/")
async def root():
    storage_working = await verify_firebase_storage() if bucket else False
    cache_stats = await get_cache_statistics() if db else {"error": "Firebase not available"}
    
    return {
        "message": "Playfinity Unified Backend Running!",
        "firebase_available": db is not None,
        "storage_available": bucket is not None,
        "storage_working": storage_working,
        "image_generation_available": DIFFUSERS_AVAILABLE,
        "ocr_available": OCR_AVAILABLE,
        "prediction_cache_stats": cache_stats  # 🆕 Cache statistics
    }

@app.post("/validate-topic")
async def validate_topic(request: TopicValidationRequest):
    """Check if topic exists in Firebase, if not generate new games"""
    try:
        age_group_id = "2" if request.age_group in ["7-11", "5-10"] else request.age_group
        
        print(f"🔍 Validating topic: {request.topic} (age group ID: {age_group_id}) with domain: {request.domain} and tags: {request.tags}")
        
        games_exist, existing_games = await check_games_exist_in_firebase(request.topic, age_group_id, request.domain, request.tags)
        
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
        return {
            "success": False,
            "error": str(e)
        }
    
@app.get("/images/{topic}/{age_group}/{image_index}")
async def get_image(topic: str, age_group: str, image_index: int):
    """Get image directly from Firebase with direct Storage URL"""
    if not db:
        raise HTTPException(status_code=500, detail="Firebase not available")
    
    try:
        print(f"🖼 Getting image: {topic}/{age_group}/{image_index}")
        
        # Handle topic name formatting consistently
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

@app.post("/generate-games")
async def generate_games_endpoint(request: GameGenerationRequest):
    """Generate new games and save to Firebase"""
    try:
        age_group_id = "2" if request.age_group in ["7-11", "5-10"] else request.age_group
        
        print(f"🎮 Generating games for topic: {request.topic} (age group ID: {age_group_id}) with domain: {request.domain} and tags: {request.tags}")
        
        games_exist, existing_games = await check_games_exist_in_firebase(request.topic, age_group_id, request.domain, request.tags)
        
        if games_exist:
            print("✅ Games already exist, returning from Firebase")
            gallery_images = []
            if "gallery" in existing_games and "images" in existing_games["gallery"]:
                gallery_images = existing_games["gallery"]["images"]
                print(f"🖼 Found {len(gallery_images)} existing images")
            
            return {
                "success": True,
                "games": existing_games,
                "images": gallery_images,
                "source": "firebase_existing",
                "age_group_id": age_group_id
            }
        
        games_data = generate_games_with_llama(request.topic, request.age_group, request.tags, request.domain)
        
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
                for i, img in enumerate(images_data):
                    has_base64 = 'image_base64' in img and len(img.get('image_base64', '')) > 0
                    print(f"🖼 Image {i}: has_base64={has_base64}, prompt='{img.get('prompt', 'No prompt')}'")
            else:
                print(f"❌ Image generation failed: {image_result.get('error', 'Unknown error')}")
                print(f"🔍 Full image result: {image_result}")
        else:
            print("❌ Image generation not available or no image prompts found")
            print(f"🔍 DIFFUSERS_AVAILABLE: {DIFFUSERS_AVAILABLE}")
            print(f"🔍 games_data keys: {list(games_data.keys())}")
            if "gallery" in games_data:
                print(f"🔍 gallery keys: {list(games_data['gallery'].keys())}")
        
        saved_games = await save_games_to_firebase(request.topic, age_group_id, games_data, images_data, request.domain, request.tags)
        
        _, updated_games = await check_games_exist_in_firebase(request.topic, age_group_id)
        final_images = []
        if updated_games and "gallery" in updated_games and "images" in updated_games["gallery"]:
            final_images = updated_games["gallery"]["images"]
            print(f"🖼 Retrieved {len(final_images)} images with Storage URLs")
        
        return {
            "success": True,
            "games": games_data,
            "images": final_images,
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

@app.post("/get-related-topics")
async def get_related_topics(request: GenerateDomainsRequest):
    """
    Generates domain-specific topics based on the primary label from image analysis
    """
    if not client:
        raise HTTPException(status_code=500, detail="OpenRouter client not available")

    try:
        # Extract primary label if not provided
        primary_label = request.primary_label
        if not primary_label:
            # Create tag objects from strings if they aren't already
            tag_objects = []
            if request.tags:
                for tag in request.tags:
                    if isinstance(tag, str):
                        tag_objects.append({"name": tag, "confidence": 50})  # Default confidence
                    else:
                        tag_objects.append(tag)
            primary_label = get_primary_label_from_tags(tag_objects, request.description)
        
        print(f"🎯 Generating domain-specific topics for primary subject: {primary_label}")
        print(f"🔍 Context - Description: {request.description}")
        print(f"🏷 Context - Tags: {request.tags}")
        
        # Generate domains focused on the primary label
        generated_data = generate_domains_with_llama(request.description, request.tags, primary_label)
        
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
    
async def generate_all_domain_topics_from_tags(tags, description):
    """Generate domain-specific topics for ALL detected tags, not just primary"""
    if not tags or not client:
        return []
    
    all_topics = []
    processed_subjects = set()  # Avoid duplicates
    
    # Get top 5 most confident tags to generate topics from
    sorted_tags = sorted(tags, key=lambda x: x.get("confidence", 0), reverse=True)[:5]
    
    for tag in sorted_tags:
        subject = tag.get("name", "").title()
        if subject and subject not in processed_subjects and len(subject) > 2:
            processed_subjects.add(subject)
            
            try:
                print(f"🎯 Generating topics for subject: {subject} (confidence: {tag.get('confidence', 0)}%)")
                
                # Generate domain topics for this specific subject
                domain_data = generate_domains_with_llama(description, [subject], subject)
                
                if domain_data and "domains" in domain_data:
                    # Extract all topics from all domains for this subject
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

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    """Analyze image using Azure Computer Vision and automatically generate domain-specific topics with topic-based caching"""
    try:
        print(f"🔍 Analyzing uploaded image: {file.filename}")
        result = await analyze_image(file)
        
        # Extract tags with confidence scores
        tags = []
        if "tags" in result:
            for tag in result["tags"]:
                tags.append({
                    "name": tag["name"],
                    "confidence": round(tag["confidence"] * 100, 1)
                })
        
        # Extract description
        description = ""
        if "description" in result and "captions" in result["description"]:
            captions = result["description"]["captions"]
            if captions:
                description = captions[0]["text"]
        
        # Get primary label from the analysis
        primary_label = get_primary_label_from_tags(tags, description)
        print(f"🎯 Primary subject identified: '{primary_label}'")
        
        # 🆕 Check topic-based cache
        cached_prediction = await check_prediction_cache(tags, description)
        
        all_domain_topics = []
        domain_specific_topics = None
        cache_hit = False
        
        if cached_prediction:
            # 🎉 Use cached results for this exact topic
            cache_hit = True
            all_domain_topics = cached_prediction.get("all_topics", [])
            domain_specific_topics = cached_prediction.get("domain_topics")
            
            print(f"🎯 ✅ Using cached topics for '{primary_label}' ({len(all_domain_topics)} topics)")
            
            # Update access statistics using primary_label
            await update_cache_access(primary_label)
                
        elif client and tags:
            # 🧠 Generate new topics for this topic (cache miss)
            print(f"🧠 Generating NEW topics for '{primary_label}' from {len(tags)} detected tags...")
            
            try:
                # Generate topics from all significant tags
                all_domain_topics = await generate_all_domain_topics_from_tags(tags, description)
                
                # Also generate the structured domain response for primary subject
                tag_names = [tag["name"] for tag in tags]
                domain_specific_topics = generate_domains_with_llama(description, tag_names, primary_label)
                
                print(f"📚 Generated {len(all_domain_topics)} total topics for '{primary_label}'")
                
                # 💾 Save to cache using primary_label as key
                await save_prediction_to_cache(
                    tags, 
                    description, 
                    primary_label, 
                    all_domain_topics, 
                    domain_specific_topics
                )
                
            except Exception as domain_error:
                print(f"⚠ Could not generate domain topics for '{primary_label}': {domain_error}")
        
        response_data = {
            "success": True,
            "tags": tags,
            "description": description,
            "primary_label": primary_label,
            "analysis": result,
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

@app.get("/cached-topics/{topic_name}")
async def get_cached_topics_for_topic(topic_name: str):
    """Get cached topics for a specific topic name"""
    if not db:
        raise HTTPException(status_code=500, detail="Firebase not available")
    
    try:
        cache_key = await create_topic_cache_key(topic_name)
        if not cache_key:
            raise HTTPException(status_code=400, detail="Invalid topic name")
        
        print(f"🔍 Getting cached topics for: '{topic_name}' (key: '{cache_key}')")
        
        cache_ref = db.collection("prediction_cache").document(cache_key)
        cache_doc = cache_ref.get()
        
        if cache_doc.exists:
            cached_data = cache_doc.to_dict()
            
            # Update access count
            await update_cache_access(topic_name)
            
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
            raise HTTPException(
                status_code=404, 
                detail=f"No cached topics found for '{topic_name}'"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting cached topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/cache-stats")
async def get_cache_stats():
    """Get prediction cache statistics"""
    try:
        stats = await get_cache_statistics()
        return {
            "success": True,
            "cache_statistics": stats,
            "message": "Cache statistics retrieved successfully"
        }
    except Exception as e:
        print(f"❌ Error getting cache stats: {e}")
        return {
            "success": False,
            "error": str(e),
            "cache_statistics": {}
        }

@app.delete("/clear-cache")
async def clear_prediction_cache():
    """Clear all prediction cache (admin endpoint)"""
    if not db:
        raise HTTPException(status_code=500, detail="Firebase not available")
    
    try:
        print("🧹 Clearing prediction cache...")
        
        # Get all cache documents
        cache_collection = db.collection("prediction_cache")
        docs = cache_collection.stream()
        
        deleted_count = 0
        for doc in docs:
            doc.reference.delete()
            deleted_count += 1
        
        print(f"✅ Cleared {deleted_count} cached predictions")
        
        return {
            "success": True,
            "deleted_count": deleted_count,
            "message": f"Successfully cleared {deleted_count} cached predictions"
        }
        
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

if __name__ == "_main_":
    import uvicorn
    print("🚀 Starting Playfinity Unified Backend...")
    print(f"✅ Firebase: {'Available' if db else 'Not Available'}")
    print(f"✅ Image Generation: {'Available' if DIFFUSERS_AVAILABLE else 'Not Available'}")
    print(f"✅ OCR: {'Available' if OCR_AVAILABLE else 'Not Available'}")
    uvicorn.run(app, host="127.0.0.1", port=8000)