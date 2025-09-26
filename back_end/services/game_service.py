import uuid
import base64
from datetime import datetime, timezone
from config.firebase_config import db, bucket
from services.llama_service import llama_service
from typing import Dict, List, Optional
from functools import partial

print = partial(print, flush=True)

class GameService:
    def __init__(self):
        self.db = db
        self.bucket = bucket
    
    async def check_games_exist_in_firebase(self, topic: str, age_group: str, 
                                          domain: Optional[str] = None, 
                                          tags: Optional[List[str]] = None) -> tuple[bool, Optional[Dict]]:
        """Check if games for this topic and age group exist in Firebase"""
        if not self.db:
            return False, None
        
        try:
            print(f"🔍 Checking Firebase for topic: {topic}, age: {age_group}, domain: {domain}, tags: {tags}")
            
            # Handle topic name formatting consistently
            safe_topic = topic.lower().replace(" ", "_").replace("/", "_")
            
            games_ref = self.db.collection("topics").document(safe_topic).collection("agegrps").document(str(age_group)).collection("games")
            
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
    
    async def upload_base64_to_firebase_storage(self, base64_data: str, filename: str, 
                                              bucket_folder: str = "generated_images") -> str:
        """Upload base64 image data to Firebase Storage and return public URL"""
        if not self.bucket:
            raise Exception("Firebase Storage not available")
        
        try:
            # Decode base64 image data
            if base64_data.startswith('data:image'):
                base64_data = base64_data.split(',')[1]
            
            image_bytes = base64.b64decode(base64_data)
            
            # Generate unique filename with folder structure
            unique_filename = f"{bucket_folder}/{filename}_{uuid.uuid4().hex[:8]}.png"
            
            # Create blob and upload
            blob = self.bucket.blob(unique_filename)
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
    
    async def save_games_to_firebase(self, topic: str, age_group: str, games_data: Dict, 
                                   images_data: List, domain: str = None, 
                                   tags: List = None) -> bool:
        """Save generated games to Firebase with direct Storage upload"""
        if not self.db:
            print("❌ Firebase not available, cannot save games")
            return False
        
        try:
            print(f"💾 Saving games to Firebase: {topic} (age {age_group})")
            
            # Reference structure: topics/{topic}/agegrps/{age_group}/games/{game_type}
            safe_topic = topic.lower().replace(" ", "_").replace("/", "_")
            topic_ref = self.db.collection("topics").document(safe_topic)
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
            
            # Process and upload images to Firebase Storage
            firebase_images = []
            if images_data:
                print(f"📸 Processing {len(images_data)} images for Firebase Storage upload...")
                
                for i, img_data in enumerate(images_data):
                    try:
                        if "image_base64" in img_data and img_data["image_base64"]:
                            filename = f"{safe_topic}_image_{i}"
                            
                            print(f"⬆️ Uploading image {i+1}/{len(images_data)} to Firebase Storage...")
                            
                            firebase_url = await self.upload_base64_to_firebase_storage(
                                img_data["image_base64"], 
                                filename,
                                f"topics/{safe_topic}"
                            )
                            
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
                        continue
                
                print(f"📸 Successfully uploaded {len(firebase_images)} images to Firebase Storage")
            
            # Save each game type
            for game_type, game_data in games_data.items():
                if game_type == "gallery":
                    game_data["images"] = firebase_images
                    print(f"🖼️ Gallery game will have {len(firebase_images)} Firebase Storage images")
                
                game_ref = agegrp_ref.collection("games").document(game_type)
                game_ref.set(game_data)
                print(f"✅ Saved {game_type} game")
            
            return True
            
        except Exception as e:
            print(f"❌ Error saving games to Firebase: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def generate_games_with_images(self, topic: str, age_group: str, 
                                       domain: str = None, tags: List[str] = None) -> Dict:
        """Generate games and images for a topic"""
        
        # First check if games already exist
        games_exist, existing_games = await self.check_games_exist_in_firebase(topic, age_group, domain, tags)
        
        if games_exist:
            print("✅ Games already exist, returning from Firebase")
            gallery_images = []
            if "gallery" in existing_games and "images" in existing_games["gallery"]:
                gallery_images = existing_games["gallery"]["images"]
            
            return {
                "success": True,
                "games": existing_games,
                "images": gallery_images,
                "source": "firebase_existing"
            }
        
        # Generate new games using LLaMA service
        games_data = llama_service.generate_games(topic, age_group, tags, domain)
        
        # Generate images if available
        images_data = []
        try:
            from image_generation_service import image_service
            if "gallery" in games_data and "image_prompts" in games_data["gallery"]:
                print(f"🎨 Generating images for gallery game...")
                prompts = games_data["gallery"]["image_prompts"]
                image_result = image_service.generate_images_from_prompts(prompts, topic)
                
                if image_result.get("success") and image_result.get("images"):
                    images_data = image_result["images"]
                    print(f"✅ Generated {len(images_data)} images")
                else:
                    print(f"❌ Image generation failed: {image_result.get('error', 'Unknown error')}")
        except ImportError:
            print("❌ Image generation service not available")
        
        # Save games to Firebase
        saved = await self.save_games_to_firebase(topic, age_group, games_data, images_data, domain, tags)
        
        # Get updated games with Firebase URLs
        _, updated_games = await self.check_games_exist_in_firebase(topic, age_group)
        final_images = []
        if updated_games and "gallery" in updated_games and "images" in updated_games["gallery"]:
            final_images = updated_games["gallery"]["images"]
        
        return {
            "success": True,
            "games": games_data,
            "images": final_images,
            "saved_games": saved,
            "source": "generated_new"
        }

# Create global instance
game_service = GameService()