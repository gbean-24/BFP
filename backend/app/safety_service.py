import math
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import Trip, PlannedLocation, LocationUpdate, SafetyAlert
from typing import List, Tuple, Optional

class SafetyMonitor:
    """Service for monitoring traveler safety and triggering alerts"""
    
    @staticmethod
    def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two GPS coordinates in kilometers"""
        # Haversine formula
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    @staticmethod
    def find_nearest_planned_location(
        current_lat: float, 
        current_lon: float, 
        planned_locations: List[PlannedLocation]
    ) -> Tuple[Optional[PlannedLocation], float]:
        """Find the nearest planned location and distance to it"""
        if not planned_locations:
            return None, float('inf')
        
        nearest_location = None
        min_distance = float('inf')
        
        for location in planned_locations:
            distance = SafetyMonitor.calculate_distance_km(
                current_lat, current_lon,
                location.latitude, location.longitude
            )
            if distance < min_distance:
                min_distance = distance
                nearest_location = location
        
        return nearest_location, min_distance
    
    @staticmethod
    def check_deviation_alert(
        db: Session,
        location_update: LocationUpdate,
        trip: Trip
    ) -> Optional[SafetyAlert]:
        """Check if location update triggers a deviation alert"""
        
        # Get planned locations for this trip
        planned_locations = db.query(PlannedLocation).filter(
            PlannedLocation.trip_id == trip.id
        ).all()
        
        if not planned_locations:
            return None
        
        # Find nearest planned location
        nearest_location, distance_km = SafetyMonitor.find_nearest_planned_location(
            location_update.latitude,
            location_update.longitude,
            planned_locations
        )
        
        # Check if distance exceeds threshold
        if distance_km > trip.deviation_threshold_km:
            # Create deviation alert
            alert = SafetyAlert(
                alert_type="deviation",
                status="active",
                title="Location Deviation Detected",
                message=f"You are {distance_km:.1f}km away from your planned route. Are you safe?",
                latitude=location_update.latitude,
                longitude=location_update.longitude,
                distance_from_planned_km=distance_km,
                triggered_at=datetime.utcnow(),
                response_deadline=datetime.utcnow() + timedelta(minutes=15),
                user_id=location_update.user_id,
                trip_id=trip.id
            )
            
            db.add(alert)
            db.commit()
            db.refresh(alert)
            return alert
        
        return None
    
    @staticmethod
    def check_stationary_alert(
        db: Session,
        user_id: int,
        trip: Trip
    ) -> Optional[SafetyAlert]:
        """Check if user has been stationary too long outside planned locations"""
        
        # Get recent location updates (last 4 hours)
        four_hours_ago = datetime.utcnow() - timedelta(hours=4)
        recent_locations = db.query(LocationUpdate).filter(
            LocationUpdate.user_id == user_id,
            LocationUpdate.trip_id == trip.id,
            LocationUpdate.timestamp >= four_hours_ago
        ).order_by(LocationUpdate.timestamp.desc()).all()
        
        if len(recent_locations) < 2:
            return None
        
        # Check if user has been in roughly the same location
        latest_location = recent_locations[0]
        stationary = True
        
        for location in recent_locations[1:]:
            distance = SafetyMonitor.calculate_distance_km(
                latest_location.latitude, latest_location.longitude,
                location.latitude, location.longitude
            )
            if distance > 0.5:  # More than 500m movement
                stationary = False
                break
        
        if stationary:
            # Check if current location is near any planned location
            planned_locations = db.query(PlannedLocation).filter(
                PlannedLocation.trip_id == trip.id
            ).all()
            
            nearest_location, distance_km = SafetyMonitor.find_nearest_planned_location(
                latest_location.latitude,
                latest_location.longitude,
                planned_locations
            )
            
            # If stationary and far from planned locations, create alert
            if distance_km > 1.0:  # More than 1km from planned locations
                alert = SafetyAlert(
                    alert_type="stationary",
                    status="active",
                    title="Stationary Alert",
                    message=f"You've been in the same location for 4+ hours, {distance_km:.1f}km from planned locations. Are you safe?",
                    latitude=latest_location.latitude,
                    longitude=latest_location.longitude,
                    distance_from_planned_km=distance_km,
                    triggered_at=datetime.utcnow(),
                    response_deadline=datetime.utcnow() + timedelta(minutes=15),
                    user_id=user_id,
                    trip_id=trip.id
                )
                
                db.add(alert)
                db.commit()
                db.refresh(alert)
                return alert
        
        return None
