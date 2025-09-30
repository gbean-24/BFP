from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from app.database import get_db
from app.models import User, Trip, LocationUpdate, PlannedLocation, SafetyAlert
from app.schemas import UserCreate, UserResponse, UserLogin, Token, TripCreate, TripResponse, LocationUpdateCreate, PlannedLocationCreate, AlertResponse
from app.auth import authenticate_user, create_access_token, get_password_hash, get_current_active_user, get_current_user

router = APIRouter()

# Authentication Routes
@router.post("/auth/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        name=user.name,
        phone=user.phone,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.post("/auth/login", response_model=Token)
def login_user(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# User Routes
@router.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.get("/test-auth")
def test_auth(current_user: User = Depends(get_current_user)):
    return {"message": "Auth working!", "user_email": current_user.email}


# Trip Routes
@router.post("/trips", response_model=TripResponse)
def create_trip(
    trip: TripCreate, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    db_trip = Trip(
        name=trip.name,
        description=trip.description,
        start_date=trip.start_date,
        end_date=trip.end_date,
        monitoring_enabled=trip.monitoring_enabled,
        deviation_threshold_km=trip.deviation_threshold_km,
        owner_id=current_user.id
    )
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip


@router.get("/trips")
def get_user_trips(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    trips = db.query(Trip).filter(Trip.owner_id == current_user.id).all()
    return trips


@router.get("/trips/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(
        Trip.id == trip_id, 
        Trip.owner_id == current_user.id
    ).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return trip


# Location Routes
@router.post("/location-updates")
def create_location_update(
    location: LocationUpdateCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    from app.safety_service import SafetyMonitor
    
    # Verify trip belongs to user
    trip = db.query(Trip).filter(
        Trip.id == location.trip_id,
        Trip.owner_id == current_user.id
    ).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    db_location = LocationUpdate(
        latitude=location.latitude,
        longitude=location.longitude,
        accuracy_meters=location.accuracy_meters,
        timestamp=location.timestamp,
        battery_level=location.battery_level,
        is_manual=location.is_manual,
        user_id=current_user.id,
        trip_id=location.trip_id
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    
    # Check for safety alerts (geofencing)
    alerts_created = []
    print(f"DEBUG: Trip monitoring enabled: {trip.monitoring_enabled}")
    if trip.monitoring_enabled:
        print("DEBUG: Checking for safety alerts...")
        # Check deviation alert
        deviation_alert = SafetyMonitor.check_deviation_alert(db, db_location, trip)
        print(f"DEBUG: Deviation alert result: {deviation_alert}")
        if deviation_alert:
            alerts_created.append({"type": "deviation", "alert_id": deviation_alert.id})
        
        # Check stationary alert
        stationary_alert = SafetyMonitor.check_stationary_alert(db, current_user.id, trip)
        print(f"DEBUG: Stationary alert result: {stationary_alert}")
        if stationary_alert:
            alerts_created.append({"type": "stationary", "alert_id": stationary_alert.id})
    else:
        print("DEBUG: Trip monitoring is disabled")
    
    response = {
        "message": "Location updated successfully", 
        "location_id": db_location.id
    }
    
    if alerts_created:
        response["alerts_triggered"] = alerts_created
        response["message"] += f" - {len(alerts_created)} safety alert(s) triggered"
    
    return response


@router.get("/trips/{trip_id}/locations")
def get_trip_locations(
    trip_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify trip belongs to user
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_id == current_user.id
    ).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    locations = db.query(LocationUpdate).filter(
        LocationUpdate.trip_id == trip_id
    ).order_by(LocationUpdate.timestamp.desc()).limit(50).all()
    
    return locations


# Planned Location Routes
@router.post("/trips/{trip_id}/planned-locations")
def add_planned_location(
    trip_id: int,
    location: PlannedLocationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify trip belongs to user
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_id == current_user.id
    ).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    db_location = PlannedLocation(
        name=location.name,
        description=location.description,
        latitude=location.latitude,
        longitude=location.longitude,
        planned_arrival=location.planned_arrival,
        radius_meters=location.radius_meters,
        is_accommodation=location.is_accommodation,
        trip_id=trip_id
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    
    return db_location


# Safety Alert Routes
@router.get("/alerts")
def get_user_alerts(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    alerts = db.query(SafetyAlert).filter(
        SafetyAlert.user_id == current_user.id
    ).order_by(SafetyAlert.triggered_at.desc()).all()
    
    return alerts


@router.post("/alerts/{alert_id}/respond")
def respond_to_alert(
    alert_id: int,
    response: AlertResponse,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Find the alert
    alert = db.query(SafetyAlert).filter(
        SafetyAlert.id == alert_id,
        SafetyAlert.user_id == current_user.id
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Update alert status
    if response.response == "safe":
        alert.status = "responded_safe"
        alert.response_message = response.message or "User confirmed they are safe"
    elif response.response == "help":
        alert.status = "responded_help"
        alert.response_message = response.message or "User requested help"
    
    alert.responded_at = datetime.utcnow()
    db.commit()
    
    return {"message": f"Alert response recorded: {response.response}", "alert_id": alert_id}


# Manual Safety Check
@router.post("/safety/manual-alert")
def create_manual_alert(
    trip_id: int,
    message: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify trip belongs to user
    trip = db.query(Trip).filter(
        Trip.id == trip_id,
        Trip.owner_id == current_user.id
    ).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Get user's latest location
    latest_location = db.query(LocationUpdate).filter(
        LocationUpdate.user_id == current_user.id,
        LocationUpdate.trip_id == trip_id
    ).order_by(LocationUpdate.timestamp.desc()).first()
    
    if not latest_location:
        raise HTTPException(status_code=400, detail="No location data found for this trip")
    
    # Create manual alert
    alert = SafetyAlert(
        alert_type="manual",
        status="active",
        title="Manual Safety Alert",
        message=message,
        latitude=latest_location.latitude,
        longitude=latest_location.longitude,
        triggered_at=datetime.utcnow(),
        response_deadline=datetime.utcnow() + timedelta(minutes=15),
        user_id=current_user.id,
        trip_id=trip_id
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return {"message": "Manual alert created", "alert_id": alert.id}
