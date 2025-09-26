import requests
from fastapi import UploadFile
from config.settings import settings
from functools import partial

print = partial(print, flush=True)

class AzureVisionService:
    def __init__(self):
        self.api_key = settings.AZURE_VISION_KEY
        self.analyze_url = settings.AZURE_ANALYZE_URL
        self.params = settings.AZURE_PARAMS
    
    async def analyze_image(self, file: UploadFile):
        """Analyze image using Azure Computer Vision"""
        try:
            print(f"🔍 Analyzing image with Azure Vision: {file.filename}")
            
            image_data = await file.read()
            headers = {
                "Ocp-Apim-Subscription-Key": self.api_key,
                "Content-Type": "application/octet-stream"
            }
            
            response = requests.post(
                self.analyze_url, 
                headers=headers, 
                params=self.params, 
                data=image_data
            )
            response.raise_for_status()
            
            result = response.json()
            print(f"✅ Azure analysis complete - found {len(result.get('tags', []))} tags")
            return result
            
        except Exception as e:
            print(f"❌ Azure Vision analysis failed: {e}")
            raise e
    
    def extract_tags_and_description(self, azure_result):
        """Extract tags and description from Azure response"""
        tags = []
        if "tags" in azure_result:
            for tag in azure_result["tags"]:
                tags.append({
                    "name": tag["name"],
                    "confidence": round(tag["confidence"] * 100, 1)
                })
        
        description = ""
        if "description" in azure_result and "captions" in azure_result["description"]:
            captions = azure_result["description"]["captions"]
            if captions:
                description = captions[0]["text"]
        
        return tags, description

# Create global instance
azure_service = AzureVisionService()