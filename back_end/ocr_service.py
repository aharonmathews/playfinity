import requests
import cv2
import numpy as np
import time
import base64
import io
from PIL import Image
import os
from dotenv import load_dotenv

load_dotenv()

class OCRService:
    def __init__(self):
        self.subscription_key = os.getenv("AZURE_VISION_KEY")
        self.endpoint = "https://aharondecode.cognitiveservices.azure.com/"
        self.read_url = self.endpoint + "vision/v3.2/read/analyze"
        
    def preprocess_image_for_ocr(self, image_data):
        """
        Preprocess image for better OCR results
        """
        try:
            # Convert base64 to image
            if isinstance(image_data, str):
                if "data:image" in image_data:
                    image_data = image_data.split(",")[1]
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data
                
            # Convert to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                raise ValueError("Could not decode image")
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply Otsu's thresholding (binarization)
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Remove noise with median blur
            denoised = cv2.medianBlur(thresh, 3)
            
            # Resize image (make it larger for better recognition)
            height, width = denoised.shape
            resized = cv2.resize(denoised, (width * 3, height * 3), interpolation=cv2.INTER_LINEAR)
            
            # Add padding around the image
            padded = cv2.copyMakeBorder(resized, 50, 50, 50, 50, cv2.BORDER_CONSTANT, value=255)
            
            # Convert back to bytes
            success, encoded_image = cv2.imencode('.png', padded)
            if not success:
                raise ValueError("Could not encode processed image")
                
            return encoded_image.tobytes()
            
        except Exception as e:
            print(f"❌ Error preprocessing image: {e}")
            # Return original image if preprocessing fails
            if isinstance(image_data, str):
                if "data:image" in image_data:
                    image_data = image_data.split(",")[1]
                return base64.b64decode(image_data)
            return image_data
    
    def recognize_text(self, image_data):
        """
        Use Azure Read API to recognize text from image
        """
        try:
            print("🔍 Preprocessing image for OCR...")
            processed_image = self.preprocess_image_for_ocr(image_data)
            
            headers = {
                "Ocp-Apim-Subscription-Key": self.subscription_key,
                "Content-Type": "application/octet-stream"
            }
            
            print("📤 Sending image to Azure Read API...")
            response = requests.post(self.read_url, headers=headers, data=processed_image)
            
            if response.status_code != 202:
                print(f"❌ Azure API Error: {response.status_code}")
                return {"success": False, "error": f"API Error: {response.status_code}"}
            
            # Get operation location from response headers
            operation_url = response.headers["Operation-Location"]
            print("⏳ Processing image...")
            
            # Poll for results (with timeout)
            max_attempts = 10
            attempt = 0
            
            while attempt < max_attempts:
                result = requests.get(operation_url, headers={
                    "Ocp-Apim-Subscription-Key": self.subscription_key
                })
                result.raise_for_status()
                analysis = result.json()
                
                if analysis["status"] == "succeeded":
                    print("✅ OCR completed successfully")
                    
                    # Extract all text
                    extracted_texts = []
                    for page in analysis["analyzeResult"]["readResults"]:
                        for line in page["lines"]:
                            extracted_texts.append(line["text"].strip())
                    
                    return {
                        "success": True,
                        "texts": extracted_texts,
                        "full_text": " ".join(extracted_texts),
                        "analysis": analysis
                    }
                    
                elif analysis["status"] == "failed":
                    print("❌ OCR failed")
                    return {"success": False, "error": "OCR processing failed"}
                
                time.sleep(1)
                attempt += 1
            
            return {"success": False, "error": "OCR timeout"}
            
        except Exception as e:
            print(f"❌ Error in OCR: {e}")
            return {"success": False, "error": str(e)}
    
    def check_letter_match(self, image_data, expected_letter):
        """
        Check if the drawn letter matches the expected letter
        """
        try:
            ocr_result = self.recognize_text(image_data)
            
            if not ocr_result["success"]:
                return {
                    "success": False,
                    "correct": False,
                    "error": ocr_result.get("error", "OCR failed"),
                    "detected": "",
                    "expected": expected_letter.upper()
                }
            
            # Get all detected text
            detected_texts = ocr_result["texts"]
            full_text = ocr_result["full_text"]
            
            print(f"🎯 Expected: '{expected_letter}' | Detected: {detected_texts}")
            
            # Check if expected letter is found (case-insensitive)
            expected_upper = expected_letter.upper()
            expected_lower = expected_letter.lower()
            
            # Look for exact letter match
            letter_found = False
            detected_letter = ""
            
            for text in detected_texts:
                # Check if the text contains our letter
                if (expected_upper in text.upper() or 
                    expected_lower in text.lower() or
                    text.upper() == expected_upper or
                    text.lower() == expected_lower):
                    letter_found = True
                    detected_letter = text
                    break
            
            # If no exact match, check if any single character matches
            if not letter_found:
                for text in detected_texts:
                    if len(text) == 1 and text.upper() == expected_upper:
                        letter_found = True
                        detected_letter = text
                        break
            
            return {
                "success": True,
                "correct": letter_found,
                "detected": detected_letter or full_text,
                "expected": expected_letter.upper(),
                "all_detected": detected_texts,
                "confidence": "high" if letter_found else "low"
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