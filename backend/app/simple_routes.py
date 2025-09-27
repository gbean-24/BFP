from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Trip, LocationUpdate, PlannedLocation, SafetyAlert
from app.safety_service import SafetyMonitor
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter()

# Simple schemas without email validation
class SimpleUser(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None

class SimpleTrip(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: str  # Simple string instead of datetime
    end_date: str

class SimpleLocation(BaseModel):
    trip_id: int
    latitude: float
    longitude: float
    timestamp: str

class SimplePlannedLocation(BaseModel):
    trip_id: int
    name: str
    latitude: float
    longitude: float
    description: Optional[str] = None

class AlertResponse(BaseModel):
    alert_id: int
    response: str  # "safe" or "help"
    message: Optional[str] = None

# Simple routes without authentication
@router.post("/simple/users")
def create_simple_user(user: SimpleUser, db: Session = Depends(get_db)):
    db_user = User(
        email=user.email,
        name=user.name,
        phone=user.phone,
        hashed_password="simple_password"  # No hashing for now
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": "User created", "user_id": db_user.id, "name": db_user.name}

@router.get("/simple/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "name": u.name, "email": u.email} for u in users]

@router.post("/simple/trips")
def create_simple_trip(trip: SimpleTrip, db: Session = Depends(get_db)):
    # Get the first user for testing
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=400, detail="Create a user first")
    
    db_trip = Trip(
        name=trip.name,
        description=trip.description,
        start_date=datetime.now(),  # Simple datetime
        end_date=datetime.now(),
        owner_id=user.id
    )
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return {"message": "Trip created", "trip_id": db_trip.id, "name": db_trip.name}

@router.get("/simple/trips")
def get_all_trips(db: Session = Depends(get_db)):
    trips = db.query(Trip).all()
    return [{"id": t.id, "name": t.name, "owner_id": t.owner_id} for t in trips]

@router.post("/simple/locations")
def create_simple_location(location: SimpleLocation, db: Session = Depends(get_db)):
    # Get the first user for testing
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=400, detail="Create a user first")
    
    db_location = LocationUpdate(
        latitude=location.latitude,
        longitude=location.longitude,
        timestamp=datetime.now(),
        user_id=user.id,
        trip_id=location.trip_id
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return {"message": "Location created", "location_id": db_location.id}
