import re
from datetime import datetime, timezone
from firebase_admin import firestore
from config.firebase_config import db
from utils.helpers import get_primary_label_from_tags
from typing import List, Dict, Optional
from functools import partial

print = partial(print, flush=True)

class CacheService:
    def __init__(self):
        self.db = db
    
    async def create_topic_cache_key(self, primary_label: str) -> Optional[str]:
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
    
    async def check_prediction_cache(self, tags: List[Dict], description: str) -> Optional[Dict]:
        """Check if we already have topics generated for this specific topic"""
        if not self.db or not tags:
            return None
        
        try:
            # Get primary label from the current prediction
            primary_label = get_primary_label_from_tags(tags, description)
            cache_key = await self.create_topic_cache_key(primary_label)
            
            if not cache_key:
                print("❌ Could not create cache key from primary label")
                return None
            
            print(f"🔍 Checking prediction cache for topic: '{primary_label}' (key: '{cache_key}')")
            
            # Check if this topic already has cached results
            cache_ref = self.db.collection("prediction_cache").document(cache_key)
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
    
    async def save_prediction_to_cache(self, tags: List[Dict], description: str, 
                                     primary_label: str, all_topics: List[str], 
                                     domain_topics: Optional[Dict] = None) -> bool:
        """Save prediction results to cache using topic as document ID"""
        if not self.db or not tags or not primary_label:
            print("❌ Cannot save to cache: missing requirements")
            return False
        
        try:
            cache_key = await self.create_topic_cache_key(primary_label)
            
            if not cache_key:
                print("❌ Could not create cache key, skipping cache save")
                return False
            
            print(f"💾 Saving prediction cache for topic: '{primary_label}' (key: '{cache_key}')")
            
            # Prepare cache data with topic-focused structure
            cache_data = {
                "topic": primary_label,
                "cache_key": cache_key,
                "primary_label": primary_label,
                "description_sample": description[:200] if description else "",
                "tags": tags,
                "all_topics": all_topics,
                "topic_count": len(all_topics),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_accessed": datetime.now(timezone.utc).isoformat(),
                "access_count": 1,
                "examples": {
                    "descriptions": [description] if description else [],
                    "tag_combinations": [tag.get("name") for tag in tags[:5]]
                }
            }
            
            # Add structured domain topics if available
            if domain_topics:
                cache_data["domain_topics"] = domain_topics
                cache_data["has_structured_domains"] = True
            else:
                cache_data["has_structured_domains"] = False
            
            # Save to Firestore with topic as document ID
            cache_ref = self.db.collection("prediction_cache").document(cache_key)
            
            # Check if document already exists to merge examples
            existing_doc = cache_ref.get()
            if existing_doc.exists:
                # Update existing document with new examples
                existing_data = existing_doc.to_dict()
                
                # Add new description to examples if different
                existing_descriptions = existing_data.get("examples", {}).get("descriptions", [])
                if description and description not in existing_descriptions:
                    existing_descriptions.append(description)
                    cache_data["examples"]["descriptions"] = existing_descriptions[:10]
                
                # Update access count
                cache_data["access_count"] = existing_data.get("access_count", 0) + 1
                cache_data["created_at"] = existing_data.get("created_at", cache_data["created_at"])
                
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
    
    async def update_cache_access(self, primary_label: str):
        """Update cache access statistics using topic name"""
        if not self.db or not primary_label:
            return
        
        try:
            cache_key = await self.create_topic_cache_key(primary_label)
            if not cache_key:
                return
            
            cache_ref = self.db.collection("prediction_cache").document(cache_key)
            
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
    
    async def get_cache_statistics(self) -> Dict:
        """Get enhanced cache usage statistics"""
        if not self.db:
            return {"total_cached": 0, "error": "Firebase not available"}
        
        try:
            cache_collection = self.db.collection("prediction_cache")
            docs = cache_collection.stream()
            
            stats = {
                "total_cached_topics": 0,
                "total_generated_topics": 0,
                "total_cache_hits": 0,
                "most_popular_topics": [],
                "recent_topics": []
            }
            
            topic_popularity = []
            
            for doc in docs:
                data = doc.to_dict()
                topic_name = data.get("topic", doc.id)
                access_count = data.get("access_count", 0)
                topic_count = data.get("topic_count", 0)
                created_at = data.get("created_at", "")
                
                stats["total_cached_topics"] += 1
                stats["total_generated_topics"] += topic_count
                stats["total_cache_hits"] += access_count
                
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
    
    async def clear_cache(self) -> Dict:
        """Clear all prediction cache"""
        if not self.db:
            return {"success": False, "error": "Firebase not available"}
        
        try:
            print("🧹 Clearing prediction cache...")
            
            cache_collection = self.db.collection("prediction_cache")
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
            return {"success": False, "error": str(e)}

# Create global instance
cache_service = CacheService()