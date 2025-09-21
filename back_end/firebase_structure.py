from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore

# ----------------------
# Firebase Initialization
# ----------------------
# IMPORTANT: Replace the path with the actual path to your service account key.
# This file contains the credentials for your Firebase project.
cred = credentials.Certificate("/home/user/backend_flow/my_project.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# ----------------------
# FastAPI App
# ----------------------
app = FastAPI(title="Game Data API")

# ----------------------
# Pydantic Models
# ----------------------
class GameData(BaseModel):
    """
    Model for the game data to be added.
    """
    question: str
    options: list | None = None  # Optional, e.g., Puzzle may not have options
    answer: str
    metadata: dict | None = None

class GameUpdate(BaseModel):
    """
    Model for updating game data. All fields are optional.
    """
    question: str | None = None
    options: list | None = None
    answer: str | None = None
    metadata: dict | None = None

# ----------------------
# Endpoints
# ----------------------

@app.post("/add_game/{topic}/{age}/{game_type}")
def add_game(topic: str, age: str, game_type: str, game: GameData):
    """
    Adds a new game to a specific topic, age category, and game type.
    """
    try:
        # Add topic if not exists
        topic_ref = db.collection("topics").document(topic)
        if not topic_ref.get().exists:
            topic_ref.set({"name": topic})

        # Add age category if not exists
        age_ref = topic_ref.collection("age_categories").document(age)
        if not age_ref.get().exists:
            age_ref.set({"age_range": age})

        # Add game type if not exists
        type_ref = age_ref.collection("game_types").document(game_type)
        if not type_ref.get().exists:
            type_ref.set({"type_name": game_type})

        # Add actual game
        game_ref = type_ref.collection("games").document()
        game_ref.set(game.dict())

        return {"message": "Game added successfully!", "game_id": game_ref.id}
    except Exception as e:
        # ⚠️ This is the key update: It prints the specific error to the console.
        print(f"Error adding game to Firebase: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add game: {e}")

@app.get("/get_games/{topic}/{age}/{game_type}")
def get_games(topic: str, age: str, game_type: str):
    """
    Retrieves all games from a specific topic, age category, and game type.
    """
    try:
        games_ref = db.collection("topics").document(topic) \
                      .collection("age_categories").document(age) \
                      .collection("game_types").document(game_type) \
                      .collection("games").stream()

        games = [g.to_dict() for g in games_ref]
        return {"games": games}
    except Exception as e:
        print(f"Error getting games from Firebase: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/update_game/{topic}/{age}/{game_type}/{game_id}")
def update_game(topic: str, age: str, game_type: str, game_id: str, game_updates: GameUpdate):
    """
    Updates specific fields of an existing game.
    """
    try:
        # Get a reference to the specific game document by its ID
        game_ref = db.collection("topics").document(topic) \
                      .collection("age_categories").document(age) \
                      .collection("game_types").document(game_type) \
                      .collection("games").document(game_id)
        
        # Check if the document exists before attempting to update it
        if not game_ref.get().exists:
            raise HTTPException(status_code=404, detail="Game not found")

        # Create a dictionary of fields that are not None
        update_data = game_updates.dict(exclude_unset=True)

        # Use the update() method to change only the specified fields
        game_ref.update(update_data)

        return {"message": f"Game '{game_id}' updated successfully!"}
    except Exception as e:
        print(f"Error updating game in Firebase: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete_game/{topic}/{age}/{game_type}/{game_id}")
def delete_game(topic: str, age: str, game_type: str, game_id: str):
    """
    Deletes a specific game by its ID.
    """
    try:
        game_ref = db.collection("topics").document(topic) \
                      .collection("age_categories").document(age) \
                      .collection("game_types").document(game_type) \
                      .collection("games").document(game_id)
        
        if not game_ref.get().exists:
            raise HTTPException(status_code=404, detail="Game not found")

        game_ref.delete()
        return {"message": f"Game '{game_id}' deleted successfully."}
    except Exception as e:
        print(f"Error deleting game from Firebase: {e}")
        raise HTTPException(status_code=500, detail=str(e))