# Backend - Tourism Safety Emergency Tracker
**Developer A Work - COMPLETE ✅**

## 🚀 Quick Start for Frontend Developer

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**API Documentation:** http://localhost:8000/docs

## 📡 API Endpoints Ready for Frontend

### Authentication (Required for all secure endpoints)
```
POST /api/secure/auth/register - Register user
POST /api/secure/auth/login    - Get JWT token
```

### Trip Management
```
POST /api/secure/trips                           - Create trip
GET  /api/secure/trips                           - Get user trips
GET  /api/secure/trips/{id}                      - Get specific trip
POST /api/secure/trips/{id}/planned-locations    - Add planned locations
```

### Location Tracking & Safety (Core Features)
```
POST /api/secure/location-updates               - Submit location (triggers geofencing!)
GET  /api/secure/alerts                         - Get safety alerts
POST /api/secure/alerts/{id}/respond            - Respond to alerts
POST /api/secure/safety/manual-alert            - Emergency button
```

### Testing Endpoints (No Auth Required)
```
POST /api/simple/users      - Create test user
POST /api/simple/trips      - Create test trip  
POST /api/simple/locations  - Submit test location
```

## 🛡️ Safety Features Working

- ✅ **Geofencing**: Automatic deviation alerts (tested: 53.9km detection)
- ✅ **Emergency Response**: Manual emergency alerts
- ✅ **Alert Management**: Response tracking and escalation
- ✅ **Real-time Monitoring**: Location-based safety checks

## 🔧 Frontend Integration Guide

### 1. User Authentication Flow
```javascript
// Register
POST /api/secure/auth/register
{ "email": "user@example.com", "name": "User", "password": "pass123" }

// Login  
POST /api/secure/auth/login
{ "email": "user@example.com", "password": "pass123" }

// Use token in headers
Authorization: Bearer YOUR_JWT_TOKEN
```

### 2. Trip Creation Flow
```javascript
// Create trip
POST /api/secure/trips
{ "name": "Paris Trip", "start_date": "2024-02-01T10:00:00", ... }

// Add planned locations
POST /api/secure/trips/{trip_id}/planned-locations  
{ "name": "Eiffel Tower", "latitude": 48.8584, "longitude": 2.2945 }
```

### 3. Location Tracking (Triggers Safety Alerts)
```javascript
// Submit location update
POST /api/secure/location-updates
{ "trip_id": 1, "latitude": 48.9000, "longitude": 2.4000, "timestamp": "..." }

// Response includes alerts if triggered:
{ "message": "Location updated - 1 safety alert(s) triggered", "alerts_triggered": [...] }
```

### 4. Handle Safety Alerts
```javascript
// Get alerts
GET /api/secure/alerts

// Respond to alert
POST /api/secure/alerts/{alert_id}/respond
{ "response": "safe", "message": "All good!" }
```

## 🗄️ Database Models
- **User**: Authentication and profiles
- **Trip**: Travel trips with safety settings  
- **PlannedLocation**: Destinations with geofences
- **LocationUpdate**: Real-time GPS data
- **SafetyAlert**: Emergency alerts and responses

## 🧪 Testing the Backend

**Test Geofencing:**
1. Create trip with planned location (Eiffel Tower: 48.8584, 2.2945)
2. Submit location far away (49.0000, 3.0000) 
3. Should trigger deviation alert!

**Test Emergency System:**
1. Create manual alert: `POST /api/secure/safety/manual-alert`
2. Check alerts: `GET /api/secure/alerts`
3. Respond: `POST /api/secure/alerts/{id}/respond`

## 📱 Frontend TODO
