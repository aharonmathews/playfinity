
import firebase_admin
from firebase_admin import credentials, firestore, storage
from .settings import settings
from functools import partial

# Force immediate print flushing
print = partial(print, flush=True)

class FirebaseConfig:
    def __init__(self):
        self.db = None
        self.bucket = None
        self.initialize()
    
    def initialize(self):
        """Initialize Firebase Admin SDK"""
        try:
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred, {
                'storageBucket': settings.FIREBASE_STORAGE_BUCKET
            })
            self.db = firestore.client()
            self.bucket = storage.bucket()
            print("✅ Firebase successfully initialized with Storage")
            
            # Verify bucket connection
            try:
                bucket_name = self.bucket.name
                print(f"✅ Connected to bucket: {bucket_name}")
            except Exception as bucket_error:
                print(f"❌ Bucket access failed: {bucket_error}")
                
        except Exception as e:
            print(f"❌ Firebase initialization failed: {e}")
            self.db = None
            self.bucket = None
    
    async def verify_storage(self):
        """Verify Firebase Storage is working"""
        if not self.bucket:
            return False
        
        try:
            blobs = list(self.bucket.list_blobs(max_results=1))
            print("✅ Firebase Storage connection verified")
            return True
        except Exception as e:
            print(f"❌ Firebase Storage verification failed: {e}")
            return False

# Create global instance
firebase_config = FirebaseConfig()
db = firebase_config.db
bucket = firebase_config.bucket