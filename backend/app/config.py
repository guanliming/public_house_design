from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "Public House Design 3D"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    
    UPLOAD_DIR: str = "uploads"
    OUTPUT_DIR: str = "outputs"
    MODELS_DIR: str = "models"
    
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/webp"]
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
