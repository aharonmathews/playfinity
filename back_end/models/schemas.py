from pydantic import BaseModel
from typing import List, Optional

class GameGenerationRequest(BaseModel):
    topic: str
    age_group: str = "2"
    domain: Optional[str] = None
    tags: Optional[List[str]] = None

class TopicValidationRequest(BaseModel):
    topic: str
    age_group: str = "2"
    domain: Optional[str] = None
    tags: Optional[List[str]] = None
    
class GenerateDomainsRequest(BaseModel):
    description: str
    tags: List[str]
    primary_label: Optional[str] = None

class ImageUploadRequest(BaseModel):
    image: str
    label: str = ""

class LetterCheckRequest(BaseModel):
    image: str
    expected_letter: str

class ImageTag(BaseModel):
    name: str
    confidence: float

class PredictionResponse(BaseModel):
    success: bool
    tags: List[ImageTag]
    description: str
    primary_label: Optional[str]
    all_related_topics: List[str]
    cache_hit: bool
    topic_source: str