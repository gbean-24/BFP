import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import User, Trip, PlannedLocation, LocationUpdate, SafetyAlert, AlertType, AlertStatus


# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    """Create a test database session"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_user_creation(db_session):
    """Test creating a user"""
    user = User(
        email="test@example.com",
        name="Test User",
        hashed_password="hashed_password_here",
        phone="+1234567890"
    )
    db_session.add(user)
    db_session.commit()
    
    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.is_active is True


def test_trip_creation(db_session):
    """Test creating a trip with owner"""
    # Create user first
    user = User(
        email="traveler@example.com",
        name="Traveler",
        hashed_password="hashed_password"
    )
    db_session.add(user)
    db_session.commit()
    
    # Create trip
    trip = Trip(
        name="Europe Adventure",
        description="Two week trip across Europe",
        start_date=datetime.now(),
        end_date=datetime.now() + timedelta(days=14),
        owner_id=user.id
    )
    db_session.add(trip)
    db_session.commit()
    
    assert trip.id is not None
    assert trip.owner_id == user.id
    assert trip.is_active is True
    assert trip.monitoring_enabled is True


def test_planned_location_creation(db_session):
    """Test creating planned locations for a trip"""
    # Create user and trip
    user = User(email="test@example.com", name="Test", hashed_password="hash")
    db_session.add(user)
    db_session.commit()
    
    trip = Trip(
        name="Test Trip",
        start_date=datetime.now(),
        end_date=datetime.now() + timedelta(days=7),
        owner_id=user.id
    )
    db_session.add(trip)
    db_session.commit()
    
    # Create planned location
    location = PlannedLocation(
        name="Eiffel Tower",
        description="Famous landmark in Paris",
        latitude=48.8584,
        longitude=2.2945,
        trip_id=trip.id,
        is_accommodation=False
    )
    db_session.add(location)
    db_session.commit()
    
    assert location.id is not None
    assert location.trip_id == trip.id
    assert location.latitude == 48.8584


def test_location_update_creation(db_session):
    """Test creating location updates"""
    # Setup user and trip
    user = User(email="test@example.com", name="Test", hashed_password="hash")
    db_session.add(user)
    db_session.commit()
    
    trip = Trip(
        name="Test Trip",
        start_date=datetime.now(),
        end_date=datetime.now() + timedelta(days=7),
        owner_id=user.id
    )
    db_session.add(trip)
    db_session.commit()
    
    # Create location update
    location_update = LocationUpdate(
        latitude=48.8566,
        longitude=2.3522,
        accuracy_meters=10.0,
        timestamp=datetime.now(),
        user_id=user.id,
        trip_id=trip.id,
        battery_level=85
    )
    db_session.add(location_update)
    db_session.commit()
    
    assert location_update.id is not None
    assert location_update.user_id == user.id
    assert location_update.trip_id == trip.id


def test_safety_alert_creation(db_session):
    """Test creating safety alerts"""
    # Setup user and trip
    user = User(email="test@example.com", name="Test", hashed_password="hash")
    db_session.add(user)
    db_session.commit()
    
    trip = Trip(
        name="Test Trip",
        start_date=datetime.now(),
        end_date=datetime.now() + timedelta(days=7),
        owner_id=user.id
    )
    db_session.add(trip)
    db_session.commit()
    
    # Create safety alert
    alert = SafetyAlert(
        alert_type=AlertType.DEVIATION,
        title="Location Deviation Detected",
        message="You are 3km away from your planned route",
        latitude=48.8566,
        longitude=2.3522,
        distance_from_planned_km=3.0,
        triggered_at=datetime.now(),
        response_deadline=datetime.now() + timedelta(minutes=15),
        user_id=user.id,
        trip_id=trip.id
    )
    db_session.add(alert)
    db_session.commit()
    
    assert alert.id is not None
    assert alert.status == AlertStatus.ACTIVE
    assert alert.alert_type == AlertType.DEVIATION


def test_model_relationships(db_session):
    """Test relationships between models"""
    # Create user
    user = User(email="test@example.com", name="Test", hashed_password="hash")
    db_session.add(user)
    db_session.commit()
    
    # Create trip
    trip = Trip(
        name="Test Trip",
        start_date=datetime.now(),
        end_date=datetime.now() + timedelta(days=7),
        owner_id=user.id
    )
    db_session.add(trip)
    db_session.commit()
    
    # Test relationships
    assert trip.owner == user
    assert trip in user.trips
    
    # Add planned location
    location = PlannedLocation(
        name="Test Location",
        latitude=48.8584,
        longitude=2.2945,
        trip_id=trip.id
    )
    db_session.add(location)
    db_session.commit()
    
    assert location.trip == trip
    assert location in trip.planned_locations
