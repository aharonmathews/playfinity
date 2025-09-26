import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    # Azure Configuration
    AZURE_VISION_KEY = os.getenv("AZURE_VISION_KEY")
    AZURE_ENDPOINT = "https://aharondecode.cognitiveservices.azure.com/"
    AZURE_ANALYZE_URL = AZURE_ENDPOINT + "vision/v3.2/analyze"
    AZURE_PARAMS = {"visualFeatures": "Description,Tags,Objects"}
    
    # OpenRouter Configuration  
    OPENROUTER_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
    
    # Firebase Configuration
    FIREBASE_CREDENTIALS_PATH = "../../my_project.json"
    FIREBASE_STORAGE_BUCKET = "decode-27a57.firebasestorage.app"
    
    # CORS Origins
    CORS_ORIGINS = [
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:4173",  
        "http://127.0.0.1:4173",
        "*"
    ]

settings = Settings()