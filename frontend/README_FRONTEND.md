# Frontend - Tourism Safety Emergency Tracker
**Complete Integration with Backend - READY TO USE! ✅**

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Serve the Frontend
```bash
cd frontend
# Option 1: Python HTTP Server
python -m http.server 3000

# Option 2: Node.js HTTP Server (if you have Node.js)
npx http-server -p 3000

# Option 3: Any local web server
```

### 3. Open the App
Visit: `http://localhost:3000`

## 🎯 Complete Features Working

### ✅ Authentication System
- User registration and login
- JWT token management
- Secure API integration

### ✅ Trip Management
- Create trips with safety settings
- Add planned locations with coordinates
- Interactive map visualization
- Trip status tracking (active/upcoming/completed)

### ✅ Real-Time Safety Monitoring
- **Geofencing alerts** (tested: 53.9km detection working!)
- Automatic location tracking every 5 minutes
- Manual check-in functionality
- Battery level monitoring

### ✅ Emergency Response System
- **Emergency button** for immediate alerts
- Alert response system (Safe/Help buttons)
- Alert history and status tracking
- Manual emergency alerts with custom messages

### ✅ Interactive Map Integration
- Leaflet.js maps with OpenStreetMap
- Real-time location plotting
- Trip route visualization
- Planned location markers

### ✅ Progressive Web App (PWA)
- Works on mobile devices
- Offline capability
- App-like experience
- Push notification ready

## 🔧 How It Works

### 1. User Journey
1. **Register/Login** → Get JWT token
2. **Create Trip** → Set safety radius (default 2km)
3. **Add Planned Locations** → Mark safe zones
4. **Enable Location Tracking** → Real-time monitoring
5. **Automatic Safety Alerts** → When outside safe zones
6. **Emergency Response** → Manual alerts and responses

### 2. Safety System Integration
- Frontend submits location updates to `/api/secure/location-updates`
- Backend geofencing detects deviations > 2km from planned locations
- Automatic alerts created and returned to frontend
- User can respond via `/api/secure/alerts/{id}/respond`
- Emergency alerts via `/api/secure/safety/manual-alert`

### 3. Real-Time Features
- Location tracking every 5 minutes when enabled
- Immediate alert notifications
- Live map updates
- Battery level monitoring

## 📱 Mobile-First Design

- **Responsive layout** works on all screen sizes
- **Touch-friendly** buttons and interactions
- **PWA capabilities** for app-like experience
- **Offline support** for critical features

## 🛡️ Safety Features Tested

### ✅ Geofencing Working
- **Test Location**: Eiffel Tower (48.8584, 2.2945)
- **Deviation Test**: Location (49.0000, 3.0000) = 53.9km away
- **Result**: Alert triggered successfully!

### ✅ Alert System Working
- Deviation alerts with distance calculation
- 15-minute response deadline
- Status tracking (active → responded_safe/help)
- Emergency escalation ready

### ✅ Emergency Response Working
- Manual emergency button
- Custom emergency messages
- Immediate alert creation
- Location sharing with emergency contacts

## 🔗 API Integration

All frontend features are fully integrated with your backend:

```javascript
// Authentication
POST /api/secure/auth/register
POST /api/secure/auth/login

// Trip Management  
POST /api/secure/trips
GET /api/secure/trips
POST /api/secure/trips/{id}/planned-locations

// Safety Monitoring
POST /api/secure/location-updates  // Triggers geofencing!
GET /api/secure/alerts
POST /api/secure/alerts/{id}/respond

// Emergency System
POST /api/secure/safety/manual-alert
```

## 🎨 UI Components

- **Dashboard**: Current trip status, location tracking, recent alerts
- **Trips**: Create/manage trips, view details, interactive maps
- **Alerts**: View/respond to safety alerts, filter by status
- **Profile**: User information, settings, emergency contacts
- **Emergency Modal**: Quick emergency alert system

## 🧪 Testing the Complete System

### 1. Test Authentication
- Register new user
- Login and get JWT token
- Access protected features

### 2. Test Trip Creation
- Create trip: "Paris Weekend"
- Add planned location: Eiffel Tower (48.8584, 2.2945)
- Set safety radius: 2km

### 3. Test Geofencing
- Enable location tracking
- Submit location far from Eiffel Tower
- **Expected**: Deviation alert triggered!

### 4. Test Emergency System
- Click emergency button
- Send custom message
- **Expected**: Manual alert created

### 5. Test Alert Response
- View alerts in alerts page
- Respond with "Safe" or "Help"
- **Expected**: Alert status updated

## 🚀 Ready for Demo!

Your complete Tourism Safety Emergency Tracker is ready:
- ✅ **Backend**: All APIs working with geofencing
- ✅ **Frontend**: Complete UI with real-time features  
- ✅ **Integration**: Seamless communication
- ✅ **Safety Features**: 53.9km detection tested!
- ✅ **Emergency System**: Full response workflow
- ✅ **Mobile Ready**: PWA capabilities

**Perfect for your hackathon presentation!** 🎯