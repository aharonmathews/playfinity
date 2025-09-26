from openai import OpenAI
from config.settings import settings
from utils.helpers import extract_json_from_response
from typing import List, Dict, Optional
from functools import partial

print = partial(print, flush=True)

class LlamaService:
    def __init__(self):
        self.client = OpenAI(
            base_url=settings.OPENROUTER_BASE_URL,
            api_key=settings.OPENROUTER_API_KEY
        ) if settings.OPENROUTER_API_KEY else None
    
    def generate_games(self, topic: str, age_group: str, tags: List[str] = None, domain: str = None) -> Dict:
        """Generate educational games using LLaMA API"""
        
        if not self.client:
            print("❌ LLaMA client not available")
            return self._create_fallback_games(topic, age_group)
        
        prompt = self._build_game_generation_prompt(topic, age_group, tags, domain)
        
        try:
            print(f"🧠 Generating sequential games with LLaMA for: {topic}")
            response = self.client.chat.completions.create(
                model="meta-llama/llama-3.1-8b-instruct",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1500,
                temperature=0.7
            )
            
            raw_response = response.choices[0].message.content
            print(f"📝 LLaMA raw response: {raw_response[:200]}...")
            
            parsed_games = extract_json_from_response(raw_response)
            
            if parsed_games and all(key in parsed_games for key in ["spelling", "drawing", "gallery", "quiz"]):
                print("✅ Successfully parsed sequential games from LLaMA")
                if "gallery" in parsed_games and "image_prompts" in parsed_games["gallery"]:
                    print("🎨 Generated sequential image prompts:")
                    for i, prompt in enumerate(parsed_games["gallery"]["image_prompts"]):
                        print(f"  {i+1}. {prompt}")
                return parsed_games
            else:
                print("❌ Invalid games structure, using fallback")
                return self._create_fallback_games(topic, age_group)
                
        except Exception as e:
            print(f"❌ Error generating games with LLaMA: {e}")
            return self._create_fallback_games(topic, age_group)
    
    def generate_domain_topics(self, description: str, tags: List[str], primary_label: str = None) -> Dict:
        """Generate domain-specific topics using LLaMA"""
        
        if not self.client:
            print("❌ LLaMA client not available for domain generation")
            return self._create_fallback_domains(primary_label or "Unknown")
        
        main_subject = primary_label if primary_label else (tags[0] if tags else "the subject")
        prompt = self._build_domain_generation_prompt(main_subject, description, tags)
        
        try:
            print(f"🧠 Generating domain-specific topics for: {main_subject}")
            response = self.client.chat.completions.create(
                model="meta-llama/llama-3.1-8b-instruct",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1200,
                temperature=0.6
            )
            
            raw_response = response.choices[0].message.content
            parsed_response = extract_json_from_response(raw_response)
            
            if parsed_response and "domains" in parsed_response:
                print(f"✅ Generated {len(parsed_response['domains'])} domains for {main_subject}")
                for domain in parsed_response['domains']:
                    print(f"  📚 {domain['domain']}: {', '.join(domain['topics'])}")
                return parsed_response
            else:
                print("❌ Failed to parse domain response, using fallback")
                return self._create_fallback_domains(main_subject)
                
        except Exception as e:
            print(f"❌ Error generating domains with LLaMA: {e}")
            return self._create_fallback_domains(main_subject)
    
    def _build_game_generation_prompt(self, topic: str, age_group: str, tags: List[str], domain: str) -> str:
        """Build the game generation prompt"""
        prompt = f"""
You are an educational game creator for children aged {age_group}. 
Create educational games for the topic: "{topic}"
"""
        if domain:
            prompt += f"""
The games must be focused on the educational domain of *{domain}*.
"""
        if tags:
            tags_str = ", ".join(tags)
            prompt += f"""
Ensure the game content incorporates the following keywords or concepts: *{tags_str}*.
"""
        
        prompt += f"""
For the gallery game, create 4 *SEQUENTIAL* images that show a process, stages, or related aspects of the topic in logical order. Think of it as telling a visual story.

Examples:
- If topic is "germination": [seed, sprouting seed, seedling, young plant]
- If topic is "butterfly": [egg, caterpillar, chrysalis, butterfly] 
- If topic is "cooking": [ingredients, mixing, cooking, finished dish]

Generate games in this *EXACT JSON* format:

{{
  "spelling": {{
    "word": "SINGLE_WORD_RELATED_TO_TOPIC_MAX_8_LETTERS",
    "instructions": "Spell the word related to {topic}"
  }},
  "drawing": {{
    "word": "SAME_WORD_AS_SPELLING_GAME",
    "instructions": "Draw each letter of the word"
  }},
  "gallery": {{
    "image_prompts": [
      "Stage 1: [first stage of {topic} process]",
      "Stage 2: [second stage of {topic} process]", 
      "Stage 3: [third stage of {topic} process]",
      "Stage 4: [final stage of {topic} process]"
    ],
    "instructions": "Explore the {topic} process step by step"
  }},
  "quiz": {{
    "questions": [
      {{
        "question": "What happens first in {topic}?",
        "options": ["Stage 1", "Stage 2", "Stage 3", "Stage 4"],
        "correct_answer": "Stage 1"
      }},
      {{
        "question": "What comes after the first stage of {topic}?",
        "options": ["Stage 2", "Stage 3", "Stage 4", "Nothing"],
        "correct_answer": "Stage 2"
      }},
      {{
        "question": "What is the final result of {topic}?",
        "options": ["Beginning", "Middle", "End result", "Nothing"],
        "correct_answer": "End result"
      }}
    ],
    "instructions": "Answer questions about the {topic} process"
  }}
}}

*IMPORTANT*: Replace [first stage], [second stage], etc. with actual specific stages relevant to the topic. Make the image prompts describe a clear sequence or process related to {topic}.

Return *ONLY* the JSON, nothing else.
"""
        return prompt
    
    def _build_domain_generation_prompt(self, main_subject: str, description: str, tags: List[str]) -> str:
        """Build the domain generation prompt"""
        tags_str = ", ".join(tags) if tags else ""
        
        return f"""
You are an educational expert for children. The main subject identified from an image is "{main_subject}".

Your task is to generate educational domains and specific learning topics that are directly related to "{main_subject}". Each domain should contain topics that help children learn about different aspects of "{main_subject}".

Context:
- Primary subject: "{main_subject}"
- Description: "{description}"
- Related tags: "{tags_str}"

For each domain, suggest 2-3 specific, educational topics that are:
1. Directly related to "{main_subject}"
2. Age-appropriate for children
3. Educational and engaging
4. Clickable and specific (not too broad)

Return the response in this *EXACT JSON* format:

{{
  "primary_subject": "{main_subject}",
  "domains": [
    {{
      "domain": "Domain Name 1",
      "topics": ["Topic 1a related to {main_subject}", "Topic 1b related to {main_subject}"]
    }},
    {{
      "domain": "Domain Name 2", 
      "topics": ["Topic 2a related to {main_subject}", "Topic 2b related to {main_subject}"]
    }},
    {{
      "domain": "Domain Name 3",
      "topics": ["Topic 3a related to {main_subject}", "Topic 3b related to {main_subject}"]
    }}
  ]
}}

Generate 3-4 relevant educational domains with specific topics all connected to "{main_subject}".
"""
    
    def _create_fallback_games(self, topic: str, age_group: str) -> Dict:
        """Create fallback games when generation fails"""
        return {
            "spelling": {
                "word": topic.upper()[:8] if len(topic) <= 8 else topic.upper()[:8],
                "instructions": f"Spell the word related to {topic}"
            },
            "drawing": {
                "word": topic.upper()[:8] if len(topic) <= 8 else topic.upper()[:8],
                "instructions": f"Draw each letter of the word related to {topic}"
            },
            "gallery": {
                "images": [],
                "instructions": f"Explore images related to {topic}"
            },
            "quiz": {
                "questions": [
                    {
                        "question": f"What is the main characteristic of {topic}?",
                        "options": ["Option A", "Option B", "Option C", "Option D"],
                        "correct_answer": "Option A"
                    }
                ],
                "instructions": f"Answer questions about {topic}"
            }
        }
    
    def _create_fallback_domains(self, primary_subject: str) -> Dict:
        """Generate fallback domains when LLaMA fails"""
        return {
            "primary_subject": primary_subject,
            "domains": [
                {
                    "domain": "Science",
                    "topics": [f"{primary_subject} Properties", f"How {primary_subject} Works"]
                },
                {
                    "domain": "Nature", 
                    "topics": [f"{primary_subject} in Environment", f"{primary_subject} Lifecycle"]
                },
                {
                    "domain": "Learning",
                    "topics": [f"Fun Facts about {primary_subject}", f"{primary_subject} Exploration"]
                }
            ]
        }

# Create global instance
llama_service = LlamaService()