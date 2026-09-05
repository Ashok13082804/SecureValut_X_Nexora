from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "SecureAI Vault"
    TAGLINE: str = "Protect. Detect. Trust."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & JWT
    SECRET_KEY: str = "e7c638f29d8b4e72a8c3d2f1b4a6e8c9d0f2a4b6c8e0d2f4a6b8c0e2d4f6a8b0"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours for convenience
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Master key for wrapping file encryption keys (32 bytes AES-256 key in hex)
    AES_MASTER_KEY: str = "4f8a3c2b1e9d8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a"
    
    # Database
    DATABASE_URL: str = "sqlite:///./secureai_vault.db"
    
    # File Storage
    STORAGE_PATH: str = "./secure_storage"
    MAX_UPLOAD_SIZE_MB: int = 100
    ALLOWED_EXTENSIONS: List[str] = [
        "pdf", "docx", "xlsx", "pptx", "txt", "csv", 
        "png", "jpg", "jpeg", "gif", "zip"
    ]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 120
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    # Demo Mode
    ENABLE_DEMO_DATA: bool = True
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

# Ensure storage path exists
os.makedirs(settings.STORAGE_PATH, exist_ok=True)
