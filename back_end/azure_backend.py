from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json
import re
import base64
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Configuration ---
subscription_key = os.getenv("AZURE_VISION_KEY")
endpoint = "https://aharondecode.cognitiveservices.azure.com/"
analyze_url = endpoint + "vision/v3.2/analyze"
params = {"visualFeatures": "Description,Tags,Objects"}

openrouter_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=openrouter_api_key,
)

# --- FastAPI Setup (CREATE APP FIRST!) ---
app = FastAPI(title="Playfinity Backend with Image Generation and OCR")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Import Services AFTER app is created ---
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

# --- Models ---
class GameGenerationRequest(BaseModel):
    topic: str
    age_group: str = "7-11"
    generate_images: bool = True

class ImageUploadRequest(BaseModel):
    image: str
    label: str = ""

class LetterCheckRequest(BaseModel):
    image: str  # base64 encoded image
    expected_letter: str

# --- Helper Functions ---
def create_fallback_games(topic):
    return {
        "game1": {
            "word": topic.upper()[:8] if len(topic) <= 8 else topic.upper()[:8]
        },
        "game2": {
            "prompts": [
                f"a simple colorful drawing of {topic}",
                f"a cute cartoon {topic} with big eyes",
                f"a bright and cheerful {topic} scene"
            ]
        },
        "game3": {
            "questions": [
                {
                    "question": f"What is the main characteristic of {topic}?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option A"
                },
                {
                    "question": f"Where would you typically find {topic}?",
                    "options": ["Everywhere", "Nowhere", "Sometimes", "Always"],
                    "correct_answer": "Everywhere"
                }
            ]
        },
        "game4": {
            "calculation": f"Count how many letters are in the word '{topic}': {len(topic)} letters"
        }
    }

def extract_json_from_response(response_text):
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        try:
            json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                return json.loads(json_str)
            
            json_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                return json.loads(json_str)
            
            raise ValueError("No JSON found in response")
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Failed to parse JSON: {e}")
            return None

async def analyze_image(file: UploadFile):
    image_data = await file.read()
    headers = {
        "Ocp-Apim-Subscription-Key": subscription_key,
        "Content-Type": "application/octet-stream",
    }
    response = requests.post(
        analyze_url,
        headers=headers,
        params=params,
        data=image_data,
        timeout=15
    )
    response.raise_for_status()
    return response.json()

def generate_games(topic, age_group):
    """Generate games with detailed prompts for image generation"""
    prompt = f"""
You are an educational assistant creating games for children. 
Based on the topic "{topic}" and age group "{age_group}", generate content for 4 educational games. 

Game 1: A single word related to the topic (maximum 8 letters). Child will spell this word.

Game 2: Generate exactly 4 detailed visual prompts related to "{topic}". 
These prompts will be used to generate AI images for children.
Make them simple, colorful, and child-friendly.
Examples for "heart": 
- "a cute red heart with a happy smiling face"
- "a heart-shaped balloon floating in blue sky with white clouds"  
- "children holding hands in heart formation in a sunny park"
- "a heart made of colorful flowers in a garden"

Game 3: Generate 3 quiz questions about "{topic}". 
Each question must have 4 options. Mark the correct answer clearly.

Game 4: Generate a simple math problem connected to "{topic}" for age {age_group}.

Return ONLY valid JSON:

{{
  "game1": {{
    "word": "WORD"
  }},
  "game2": {{
    "prompts": ["prompt1", "prompt2", "prompt3", "prompt4"]
  }},
  "game3": {{
    "questions": [
      {{
        "question": "question_text",
        "options": ["option1", "option2", "option3", "option4"],
        "correct_answer": "correct_option"
      }}
    ]
  }},
  "game4": {{
    "calculation": "math_problem"
  }}
}}
"""

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-3.1-8b-instruct",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.7,
            extra_headers={
                "HTTP-Referer": "https://playfinity.app",
                "X-Title": "Playfinity Educational Games",
            }
        )

        raw_response = response.choices[0].message.content
        print(f"Raw response: {raw_response}")

        parsed_games = extract_json_from_response(raw_response)
        
        if parsed_games is None:
            print("Using fallback games due to parsing failure")
            parsed_games = create_fallback_games(topic)
        
        print(f"Parsed games: {json.dumps(parsed_games, indent=2)}")
        return parsed_games
        
    except Exception as e:
        print(f"Error in generate_games: {e}")
        return create_fallback_games(topic)

# --- API Endpoints ---
@app.get("/")
async def root():
    return {
        "message": "Playfinity Backend with Image Generation and OCR is running!",
        "image_generation_available": DIFFUSERS_AVAILABLE,
        "ocr_available": OCR_AVAILABLE
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
        print(f"Error in predict_image: {e}")
        return {
            "success": False,
            "tags": [],
            "description": f"Error: {str(e)}",
            "analysis": None
        }

@app.post("/generate-games")
async def generate_games_endpoint(request: GameGenerationRequest):
    try:
        print(f"Generating games for topic: {request.topic}, age group: {request.age_group}")
        
        # Generate games using Llama
        games = generate_games(request.topic, request.age_group)
        
        if not isinstance(games, dict):
            raise ValueError("Games must be a dictionary")
        
        required_keys = ['game1', 'game2', 'game3', 'game4']
        for key in required_keys:
            if key not in games:
                print(f"Missing key {key}, using fallback")
                games = create_fallback_games(request.topic)
                break
        
        response_data = {"success": True, "games": games}
        
        # Generate images if requested and available
        if request.generate_images and DIFFUSERS_AVAILABLE and 'game2' in games and 'prompts' in games['game2']:
            prompts = games['game2']['prompts']
            print(f"🎨 Generating images for prompts: {prompts}")
            
            image_result = image_service.generate_images_from_prompts(prompts, request.topic)
            response_data['images'] = image_result
            
            if image_result['success']:
                print(f"✅ Generated {image_result['total_generated']} images successfully")
            else:
                print(f"❌ Image generation failed: {image_result.get('error', 'Unknown error')}")
        
        print(f"Final response: Games + {len(response_data.get('images', {}).get('images', []))} images")
        return response_data
        
    except Exception as e:
        print(f"Error generating games: {str(e)}")
        fallback_games = create_fallback_games(request.topic)
        return {
            "success": True, 
            "games": fallback_games,
            "images": {"success": False, "error": "Fallback mode - no images generated"}
        }

@app.post("/upload/")
async def upload_drawing(request: ImageUploadRequest):
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
        print(f"Error saving drawing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print(f"🚀 Starting Playfinity backend...")
    if DIFFUSERS_AVAILABLE:
        print(f"✅ Image generation enabled")
    else:
        print("⚠️ Image generation disabled - check dependencies")
    
    if OCR_AVAILABLE:
        print(f"✅ OCR enabled")
    else:
        print("⚠️ OCR disabled - check dependencies")
    
    uvicorn.run(app, host="127.0.0.1", port=8000)