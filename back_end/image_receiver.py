from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import base64, re
from pathlib import Path
from datetime import datetime

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory where images will be saved
SAVE_DIR = Path("images")
SAVE_DIR.mkdir(exist_ok=True)

class DrawingRequest(BaseModel):
    image: str   # base64 encoded string
    label: str   # the drawn character

@app.post("/upload/")
async def upload_drawing(data: DrawingRequest):
    try:
        # Remove base64 header
        base64_str = re.sub("^data:image/.+;base64,", "", data.image)

        # Decode base64 → bytes
        image_bytes = base64.b64decode(base64_str)

        # Filename format: <letter>_<timestamp>.png
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{data.label}_{timestamp}.png"
        filepath = SAVE_DIR / filename

        # Save file
        with open(filepath, "wb") as f:
            f.write(image_bytes)

        return {"status": "success", "filename": filename}
    except Exception as e:
        return {"status": "error", "message": str(e)}
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import base64, re
from pathlib import Path
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # not just 3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Directory where images will be saved
SAVE_DIR = Path("images")
SAVE_DIR.mkdir(exist_ok=True)

class DrawingRequest(BaseModel):
    image: str   # base64 encoded string
    label: str   # the drawn character

@app.post("/upload/")
async def upload_drawing(data: DrawingRequest):
    try:
        # Remove base64 header
        base64_str = re.sub("^data:image/.+;base64,", "", data.image)

        # Decode base64 → bytes
        image_bytes = base64.b64decode(base64_str)

        # Filename format: <letter>_<timestamp>.png
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{data.label}_{timestamp}.png"
        filepath = SAVE_DIR / filename

        # Save file
        with open(filepath, "wb") as f:
            f.write(image_bytes)

        return {"status": "success", "filename": filename}
    except Exception as e:
        return {"status": "error", "message": str(e)}
