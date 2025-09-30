from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    trips = relationship("Trip", back_populates="owner")
    location_updates = relationship("LocationUpdate", back_populates="user")
    alerts = relationship("SafetyAlert", back_populates="user")


class Trip(Base):
    __tablename__ = "trips"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    monitoring_enabled = Column(Boolean, default=True)
    deviation_threshold_km = Column(Float, default=2.0)
    created_at = Column(DateTime, server_default=func.now())
    
    # Foreign Keys
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="trips")
    planned_locations = relationship("PlannedLocation", back_populates="trip")
    location_updates = relationship("LocationUpdate", back_populates="trip")
    alerts = relationship("SafetyAlert", back_populates="trip")


class PlannedLocation(Base):
    __tablename__ = "planned_locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    planned_arrival = Column(DateTime, nullable=True)
    radius_meters = Column(Integer, default=500)
    is_accommodation = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Foreign Keys
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    
    # Relationships
    trip = relationship("Trip", back_populates="planned_locations")


class LocationUpdate(Base):
    __tablename__ = "location_updates"
    
    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy_meters = Column(Float, nullable=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    battery_level = Column(Integer, nullable=True)
    is_manual = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="location_updates")
    trip = relationship("Trip", back_populates="location_updates")


class SafetyAlert(Base):
    __tablename__ = "safety_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String, nullable=False)  # "deviation", "stationary", "manual"
    status = Column(String, default="active")  # "active", "responded_safe", "escalated"
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    distance_from_planned_km = Column(Float, nullable=True)
    triggered_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    response_deadline = Column(DateTime, nullable=False)
    responded_at = Column(DateTime, nullable=True)
    response_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="alerts")
    trip = relationship("Trip", back_populates="alerts")
