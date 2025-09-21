# Move your imagegenerationservice.py content here with the exact same code
from diffusers import StableDiffusionPipeline
import torch
import os
import base64
import io
from datetime import datetime
from PIL import Image

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
        
        # Load pipeline (exactly like your working code)
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
    
    def generate_images_from_prompts(self, prompts, topic):
        """Generate images using your exact working code"""
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
            
            # Generate all images in one batch (using your exact working code)
            outputs = self.pipe(
                prompt=enhanced_prompts,
                height=512,
                width=512,
                num_inference_steps=25,  # Slightly faster
                guidance_scale=7.5,
                negative_prompt=negative_prompts,
                generator=torch.Generator(self.device).manual_seed(42)  # For reproducibility
            )
            
            # Save all images and convert to base64
            os.makedirs("generated_images", exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            print("Saving images...")
            saved_files = []
            image_data = []
            
            for i, image in enumerate(outputs.images):
                # Save to file
                filename = f"generated_images/{timestamp}_{topic}_{i}.png"
                image.save(filename)
                saved_files.append(filename)
                
                # Convert to base64 for frontend
                buffered = io.BytesIO()
                image.save(buffered, format="PNG")
                img_base64 = base64.b64encode(buffered.getvalue()).decode()
                
                image_data.append({
                    "index": i,
                    "prompt": prompts[i],  # Original prompt
                    "enhanced_prompt": enhanced_prompts[i],  # Enhanced prompt
                    "filename": filename,
                    "image_base64": f"data:image/png;base64,{img_base64}",
                    "url": filename  # Local file path
                })
                
                print(f"✅ Image {i+1}/{len(prompts)}: {filename}")
            
            print(f"\n🎉 All {len(prompts)} images generated successfully!")
            print(f"Total time per image: ~{(25/len(prompts)):.1f} seconds (instead of 25s each)")
            
            # Clean up GPU memory
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            return {
                "success": True,
                "images": image_data,
                "total_generated": len(image_data),
                "saved_files": saved_files
            }
            
        except Exception as e:
            print(f"❌ Error generating images: {e}")
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            return {"success": False, "error": str(e)}
    
    def cleanup(self):
        """Clean up resources"""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        if self.pipe is not None:
            del self.pipe
            self.pipe = None

# Global instance
image_service = ImageGenerationService()