from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests

# --- Azure Configuration ---
subscription_key = ""
endpoint = ""
analyze_url = endpoint + "vision/v3.2/analyze"
params = {"visualFeatures": "Description,Tags,Objects"}

# --- FastAPI Setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite default
        "http://127.0.0.1:3000",   # React default
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core function for prediction
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

# --- Routes ---
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        analysis = await analyze_image(file)
        return {"success": True, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Same endpoint at root "/"
@app.post("/")
async def predict_root(file: UploadFile = File(...)):
    try:
        analysis = await analyze_image(file)
        return {"success": True, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
