from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Trip Schemas
class TripBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    monitoring_enabled: bool = True
    deviation_threshold_km: float = 2.0


class TripCreate(TripBase):
    pass


class TripResponse(TripBase):
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Location Schemas
class LocationUpdateCreate(BaseModel):
    trip_id: int
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = None
    timestamp: datetime
    battery_level: Optional[int] = None
    is_manual: bool = False


class LocationUpdateResponse(LocationUpdateCreate):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Planned Location Schemas
class PlannedLocationCreate(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    planned_arrival: Optional[datetime] = None
    radius_meters: int = 500
    is_accommodation: bool = False


# Alert Response Schema
class AlertResponse(BaseModel):
    response: str  # "safe" or "help"
    message: Optional[str] = None
