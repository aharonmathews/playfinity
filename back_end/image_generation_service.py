from diffusers import StableDiffusionPipeline
import torch
import os
from datetime import datetime
from typing import List, Dict, Any

class ImageGenerationService:
    def __init__(self):
        self.pipe = None
        self.device = self.get_device()
        
    def get_device(self):
        return "cuda" if torch.cuda.is_available() else "cpu"
    
    def load_pipeline(self):
        """Load the Stable Diffusion pipeline"""
        if self.pipe is not None:
            return
            
        print(f"Loading Stable Diffusion pipeline on {self.device}...")
        
        # Clear GPU memory
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Load pipeline (exactly like your fast working code)
        self.pipe = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            use_safetensors=True
        ).to(self.device)
        
        # Enable optimizations for faster generation
        self.pipe.enable_attention_slicing()
        
        # Try to enable xformers for even faster generation (if available)
        try:
            self.pipe.enable_xformers_memory_efficient_attention()
            print("✅ Xformers enabled for faster generation")
        except:
            print("⚠️ Xformers not available, using standard attention")
        
        self.pipe.safety_checker = None
        self.pipe.requires_safety_checker = False
        
        print("✅ Pipeline loaded successfully")
    
    def generate_images_from_prompts(self, prompts: List[str], topic: str) -> Dict[str, Any]:
        """🚀 OPTIMIZED: Generate images without base64 conversion bottleneck"""
        try:
            # Load pipeline if not already loaded
            self.load_pipeline()
            
            print(f"Using device: {self.device}")
            print(f"🚀 Generating {len(prompts)} images in batch for topic: {topic}")
            
            # Enhance prompts for child-friendly educational content
            enhanced_prompts = []
            for prompt in prompts:
                enhanced_prompt = f"child-friendly educational illustration, simple colorful drawing, {prompt}, cartoon style, bright colors, clear details, no text, suitable for children"
                enhanced_prompts.append(enhanced_prompt)
            
            # Child-friendly negative prompts
            negative_prompt = "scary, violent, inappropriate, adult content, dark, horror, weapons, blood, realistic photography, complex, confusing, blurry, low quality, distorted, deformed, text, watermark, logo"
            negative_prompts = [negative_prompt] * len(enhanced_prompts)
            
            print("Starting batch generation...")
            
            # 🚀 FAST GENERATION (using your exact working code)
            outputs = self.pipe(
                prompt=enhanced_prompts,
                height=512,
                width=512,
                num_inference_steps=25,  # Slightly faster than 30
                guidance_scale=7.5,
                negative_prompt=negative_prompts,
                generator=torch.Generator(self.device).manual_seed(42)  # For reproducibility
            )
            
            # 🚀 OPTIMIZED: Save files only (NO base64 conversion)
            os.makedirs("generated_images", exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            print("Saving images...")
            saved_files = []
            image_data = []
            
            for i, image in enumerate(outputs.images):
                # Save to file (FAST - no base64)
                filename = f"generated_images/{timestamp}_{topic}_{i}.png"
                image.save(filename)
                saved_files.append(filename)
                
                # 🚀 OPTIMIZED: Return file path only (no base64)
                image_data.append({
                    "index": i,
                    "prompt": prompts[i],  # Original prompt
                    "enhanced_prompt": enhanced_prompts[i],  # Enhanced prompt
                    "filename": filename,
                    "url": f"/api/images/{os.path.basename(filename)}"  # API endpoint URL
                })
                
                print(f"✅ Image {i+1}/{len(prompts)}: {filename}")
            
            print(f"\n🎉 All {len(prompts)} images generated successfully!")
            print(f"⚡ FAST MODE: No base64 conversion bottleneck!")
            
            # Clean up GPU memory
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            return {
                "success": True,
                "images": image_data,
                "total_generated": len(image_data),
                "saved_files": saved_files,
                "performance": "optimized"  # Indicator that this is fast mode
            }
            
        except Exception as e:
            print(f"❌ Error generating images: {e}")
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            return {"success": False, "error": str(e)}
    
    def get_image_as_base64(self, filename: str) -> str:
        """🔧 OPTIONAL: Convert specific image to base64 only when needed"""
        try:
            import base64
            import io
            from PIL import Image
            
            if not os.path.exists(filename):
                raise FileNotFoundError(f"Image file not found: {filename}")
            
            image = Image.open(filename)
            buffered = io.BytesIO()
            image.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode()
            
            return f"data:image/png;base64,{img_base64}"
            
        except Exception as e:
            print(f"❌ Error converting image to base64: {e}")
            return ""
    
    def cleanup(self):
        """Clean up resources"""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        if self.pipe is not None:
            del self.pipe
            self.pipe = None

# Global instance
image_service = ImageGenerationService()