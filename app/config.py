"""Application configuration management."""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "sqlite:///./tourism_tracker.db"
    
    # Security
    secret_key: str = "dev-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # External Services
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    
    sendgrid_api_key: Optional[str] = None
    sendgrid_from_email: Optional[str] = None
    
    firebase_credentials_path: Optional[str] = None
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # OpenRouteService
    ors_api_key: Optional[str] = None
    
    # Application
    debug: bool = True
    log_level: str = "INFO"
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Emergency Settings
    emergency_timeout_minutes: int = 15
    location_check_interval_minutes: int = 5
    deviation_threshold_meters: int = 2000
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()