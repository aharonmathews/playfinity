import torch
from PIL import Image
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import base64
import io
import numpy as np
import cv2

class OCRService:
    def __init__(self):
        print("🔄 Loading TrOCR model...")
        try:
            # Load processor & model
            self.processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-printed")
            self.model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-printed")
            
            # Move to GPU if available
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model.to(self.device)
            print(f"✅ TrOCR model loaded successfully on {self.device}")
            
        except Exception as e:
            print(f"❌ Error loading TrOCR model: {e}")
            self.processor = None
            self.model = None
            self.device = "cpu"
    
    def preprocess_image_for_ocr(self, image_data):
        """
        Preprocess image for better OCR results with TrOCR
        """
        try:
            # Convert base64 to PIL Image
            if isinstance(image_data, str):
                if "data:image" in image_data:
                    image_data = image_data.split(",")[1]
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data
            
            # Open with PIL and convert to RGB
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            
            # Convert PIL to OpenCV for preprocessing
            img_array = np.array(image)
            img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            # Convert to grayscale
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            
            # Apply Otsu's thresholding for binarization
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Remove noise
            denoised = cv2.medianBlur(thresh, 3)
            
            # Resize image (TrOCR works better with larger images)
            height, width = denoised.shape
            if height < 64 or width < 64:  # Ensure minimum size
                scale_factor = max(64/height, 64/width, 2)
                new_height = int(height * scale_factor)
                new_width = int(width * scale_factor)
                denoised = cv2.resize(denoised, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
            
            # Add padding
            padded = cv2.copyMakeBorder(denoised, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=255)
            
            # Convert back to PIL RGB
            processed_image = Image.fromarray(cv2.cvtColor(padded, cv2.COLOR_GRAY2RGB))
            
            return processed_image
            
        except Exception as e:
            print(f"❌ Error preprocessing image: {e}")
            # Return original image if preprocessing fails
            try:
                if isinstance(image_data, str):
                    if "data:image" in image_data:
                        image_data = image_data.split(",")[1]
                    image_bytes = base64.b64decode(image_data)
                else:
                    image_bytes = image_data
                return Image.open(io.BytesIO(image_bytes)).convert("RGB")
            except:
                # Return a blank white image as last resort
                return Image.new('RGB', (224, 224), 'white')
    
    def recognize_text(self, image_data):
        """
        Use TrOCR to recognize text from image
        """
        try:
            if self.model is None or self.processor is None:
                return {"success": False, "error": "TrOCR model not loaded"}
            
            print("🔍 Preprocessing image for TrOCR...")
            processed_image = self.preprocess_image_for_ocr(image_data)
            
            print("📤 Processing with TrOCR model...")
            
            # Process image with TrOCR
            pixel_values = self.processor(images=processed_image, return_tensors="pt").pixel_values
            
            # Move to device if using GPU
            pixel_values = pixel_values.to(self.device)
            
            # Generate text with better parameters
            with torch.no_grad():
                generated_ids = self.model.generate(
                    pixel_values,
                    max_length=64,      # Increase max length
                    num_beams=4,        # Use beam search for better results
                    early_stopping=True,
                    do_sample=False,    # Deterministic output
                    temperature=1.0
                )
            
            # Decode the generated text
            predicted_text = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            
            print(f"✅ TrOCR prediction: '{predicted_text}'")
            
            # Clean up the predicted text
            predicted_text = predicted_text.strip()
            
            # Split into individual characters/words for compatibility
            texts = [char for char in predicted_text if char.strip()]  # Individual characters
            if not texts and predicted_text:
                texts = [predicted_text]  # If no individual chars, use whole text
            
            return {
                "success": True,
                "texts": texts,
                "full_text": predicted_text,
                "confidence": "high" if predicted_text else "low"
            }
            
        except Exception as e:
            print(f"❌ Error in TrOCR: {e}")
            return {"success": False, "error": str(e)}
    
    def check_letter_match(self, image_data, expected_letter):
        """
        Check if the drawn letter matches the expected letter using TrOCR
        """
        try:
            ocr_result = self.recognize_text(image_data)
            
            if not ocr_result["success"]:
                return {
                    "success": False,
                    "correct": False,
                    "error": ocr_result.get("error", "TrOCR failed"),
                    "detected": "",
                    "expected": expected_letter.upper()
                }
            
            # Get detected text
            full_text = ocr_result["full_text"]
            detected_texts = ocr_result["texts"]
            
            print(f"🎯 Expected: '{expected_letter}' | Detected: '{full_text}' | Individual: {detected_texts}")
            
            # Check if expected letter is found (case-insensitive)
            expected_upper = expected_letter.upper()
            expected_lower = expected_letter.lower()
            
            # Look for exact letter match
            letter_found = False
            detected_letter = full_text
            
            # Check full text first
            if (expected_upper in full_text.upper() or 
                expected_lower in full_text.lower() or
                full_text.upper() == expected_upper or
                full_text.lower() == expected_lower):
                letter_found = True
            
            # Check individual characters
            if not letter_found:
                for char in detected_texts:
                    if char.upper() == expected_upper or char.lower() == expected_lower:
                        letter_found = True
                        detected_letter = char
                        break
            
            # Fuzzy matching for similar looking characters
            if not letter_found:
                similar_chars = {
                    'O': ['0', 'Q'],
                    '0': ['O', 'Q'],
                    'I': ['1', 'l', '|'],
                    '1': ['I', 'l', '|'],
                    'S': ['5'],
                    '5': ['S'],
                    'B': ['8'],
                    '8': ['B'],
                    'G': ['6'],
                    '6': ['G']
                }
                
                if expected_upper in similar_chars:
                    for similar_char in similar_chars[expected_upper]:
                        if similar_char in full_text.upper():
                            letter_found = True
                            detected_letter = f"{full_text} (similar to {expected_upper})"
                            break
            
            return {
                "success": True,
                "correct": letter_found,
                "detected": detected_letter,
                "expected": expected_letter.upper(),
                "all_detected": detected_texts,
                "confidence": ocr_result.get("confidence", "medium"),
                "full_text": full_text
            }
            
        except Exception as e:
            print(f"❌ Error in letter matching: {e}")
            return {
                "success": False,
                "correct": False,
                "error": str(e),
                "detected": "",
                "expected": expected_letter.upper()
            }

# Global OCR service instance
ocr_service = OCRService()