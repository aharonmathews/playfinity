import json
import re
from typing import List, Dict, Optional

def extract_json_from_response(response_text: str) -> Optional[Dict]:
    """Extract JSON from LLaMA response"""
    try:
        # Try to find JSON within backticks or json markers
        json_string = re.search(r'(?:json)?\s*(\{.*\})\s*', response_text, re.DOTALL)
        if json_string:
            return json.loads(json_string.group(1))
        
        # Try to find any JSON-like structure
        json_string = re.search(r'(\{.*\})', response_text, re.DOTALL)
        if json_string:
            return json.loads(json_string.group(1))
        
        # Try parsing the entire response as JSON
        return json.loads(response_text)
    except Exception as e:
        print(f"❌ JSON parsing failed: {e}")
        return None

def get_primary_label_from_tags(tags: List[Dict], description: str) -> str:
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