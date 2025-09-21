from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests
import json
import re
import base64
import io
from PIL import Image
from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Azure Configuration ---
subscription_key = os.getenv("AZURE_VISION_KEY")  # Changed to use env variable
endpoint = "https://aharondecode.cognitiveservices.azure.com/"
analyze_url = endpoint + "vision/v3.2/analyze"
params = {"visualFeatures": "Description,Tags,Objects"}

# --- OpenAI/Llama Configuration ---
openai_api_key = os.getenv("OPENAI_API_KEY")  # Changed to use env variable
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=openai_api_key,  # Use env variable
)

# --- FastAPI Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite default
        "http://127.0.0.1:5173",  # Also allow 127.0.0.1
        "http://127.0.0.1:3000",   # React default
        "http://localhost:3000",   # React default
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class GameGenerationRequest(BaseModel):
    topic: str
    age_group: str = "7-11"

class ImageUploadRequest(BaseModel):
    image: str  # Base64 encoded image
    label: str = ""

# --- Helper Functions ---
def create_fallback_games(topic):
    return {
        "game1": {
            "word": topic.upper()[:8] if len(topic) <= 8 else topic.upper()[:8]
        },
        "game2": {
            "prompts": [
                f"Draw a simple representation of {topic}",
                f"Draw {topic} in action or being used",
                f"Draw the result or effect of {topic}"
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
        # First try direct parsing
        return json.loads(response_text)
    except json.JSONDecodeError:
        try:
            # Try to find JSON within markdown code blocks
            json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                return json.loads(json_str)
            
            # Try to find JSON without code blocks
            json_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                return json.loads(json_str)
            
            # If no JSON found, return None
            raise ValueError("No JSON found in response")
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Failed to parse JSON: {e}")
            return None

# Core function for Azure image analysis
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

# Core function for game generation
def generate_games(topic, age_group):
    prompt = f"""
You are an educational assistant. 
Based on the topic "{topic}" and age group "{age_group}", generate text for 4 games. 
Everything must be adapted to the given age group.

Game 1: A single word related to the topic (maximum 8 letters). Child tries to spell the word.

Game 2: Generate 3-5 prompts for drawing activities. 
Each prompt should describe one step or aspect of "{topic}" clearly.
Return them as a list.

Game 3: Generate 3 quiz questions related to "{topic}". 
Each question must have 4 options. Mark the correct answer clearly. 
Make questions appropriate for age {age_group}.

Game 4: Generate a simple math problem connected to "{topic}" for the age group.

Return ONLY valid JSON without any markdown formatting or explanation:

{{
  "game1": {{
    "word": "word_here"
  }},
  "game2": {{
    "prompts": ["prompt1", "prompt2", "prompt3"]
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
    "calculation": "math_problem_text"
  }}
}}
"""

    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-3.1-8b-instruct:free",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.7
        )

        raw_response = response.choices[0].message.content
        print(f"Raw response: {raw_response}")

        # Parse the response
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
    return {"message": "Azure Backend API is running!"}

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    try:
        result = await analyze_image(file)
        
        # Extract tags with confidence scores
        tags = []
        if "tags" in result:
            for tag in result["tags"]:
                tags.append({
                    "name": tag["name"],
                    "confidence": round(tag["confidence"] * 100, 1)
                })
        
        # Get description
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
        
        games = generate_games(request.topic, request.age_group)
        
        # Validate the structure
        if not isinstance(games, dict):
            raise ValueError("Games must be a dictionary")
        
        required_keys = ['game1', 'game2', 'game3', 'game4']
        for key in required_keys:
            if key not in games:
                print(f"Missing key {key}, using fallback")
                games = create_fallback_games(request.topic)
                break
        
        print(f"Final games response: {games}")
        return {"success": True, "games": games}
        
    except Exception as e:
        print(f"Error generating games: {str(e)}")
        # Return fallback games instead of error
        fallback_games = create_fallback_games(request.topic)
        return {"success": True, "games": fallback_games}

@app.post("/upload/")
async def upload_drawing(request: ImageUploadRequest):
    try:
        # Decode base64 image
        image_data = request.image.split(",")[1] if "," in request.image else request.image
        image_bytes = base64.b64decode(image_data)
        
        # Save to file (optional)
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

# --- Run the app ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)