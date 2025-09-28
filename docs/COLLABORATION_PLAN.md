# Tourism Safety Tracker - 48-Hour Sprint Plan
**Timeline: Friday Evening → Sunday Evening**

## Critical MVP Scope
We're building a **minimal viable product** with core safety features only. Advanced features are cut to meet the deadline.

## Developer A - Pure Backend (No Frontend Overlap)
**Focus: Complete backend API that works independently**

### Friday Evening (3-4 hours)
- **Task 1**: Set up project structure ✅ (Already done)
- **Task 2**: Implement core data models (User, Trip, Location, Alert)
- **Task 3**: Basic JWT authentication (register/login only)

### Saturday Morning (4 hours)
- **Task 4**: Trip CRUD operations
- **Task 5.1**: Location update API endpoints
- **Task 5.2**: Basic geofencing logic (distance calculation only)

### Saturday Afternoon (4 hours)
- **Task 6.1**: Alert creation and management
- **Task 6.2**: Simple emergency escalation (mock emergency services)
- **Task 7.1**: Basic notification service (console/email only)

### Sunday Morning (3 hours)
- **Task 12**: API documentation with Swagger
- **Basic testing**: Unit tests for critical functions
- **Database setup**: SQLite with sample data

### Sunday Afternoon (2 hours)
- **Integration testing**: Test all API endpoints
- **Bug fixes and cleanup**

## Developer B - Pure Frontend (No Backend Overlap)
**Focus: Complete web interface that consumes the API**

### Friday Evening (3-4 hours)
- **Task 9.1**: Basic React/HTML setup with authentication pages
- **Mock API calls**: Create fake data to develop against
- **Basic routing**: Login, dashboard, trip creation

### Saturday Morning (4 hours)
- **Task 9.2**: Trip management interface (create, view trips)
- **Task 9.2**: Basic map integration (Leaflet.js)
- **Location display**: Show current and planned locations

### Saturday Afternoon (4 hours)
- **Task 9.3**: Alert interface (show alerts, respond to them)
- **Task 9.2**: Trip sharing interface
- **Real-time updates**: WebSocket or polling for alerts

### Sunday Morning (3 hours)
- **Task 10**: Basic offline support (localStorage)
- **Mobile responsiveness**: Make it work on phones
- **UI polish**: Make it look decent

### Sunday Afternoon (2 hours)
- **API integration**: Replace mock data with real API calls
- **Bug fixes and testing**

## Zero-Conflict Repository Structure
**Complete separation to avoid merge conflicts**

```
tourism-safety-tracker/
├── backend/                 # Developer A ONLY
│   ├── app/
│   ├── tests/
│   ├── requirements.txt
│   ├── main.py
│   └── README_BACKEND.md
├── frontend/                # Developer B ONLY  
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README_FRONTEND.md
├── docs/                    # Shared (no conflicts)
│   ├── API_CONTRACT.md      # Developer A writes, B reads
│   └── INTEGRATION.md       # Both document issues
└── README.md               # Project overview (both can edit)
```

## GitHub Workflow (Conflict-Free)

### Branch Strategy
- **Developer A**: Works only on `backend` branch
- **Developer B**: Works only on `frontend` branch  
- **Integration**: Happens on Sunday afternoon only

### Daily Sync Protocol
**No code sharing until Sunday - just communication:**

1. **Friday Night**: Share API contract (what endpoints will exist)
2. **Saturday Morning**: Quick check-in on progress
3. **Saturday Evening**: Share any API changes
4. **Sunday Morning**: Final API documentation
5. **Sunday Afternoon**: Integration and testing

### API Contract (Developer A creates, B follows)
```
POST /api/auth/register
POST /api/auth/login
GET /api/trips
POST /api/trips
GET /api/trips/{id}/locations
POST /api/trips/{id}/locations
GET /api/alerts
POST /api/alerts/{id}/respond
```

## Critical Success Factors

### For Developer A (Backend)
1. **API-first**: Document endpoints as you build them
2. **Keep it simple**: Basic CRUD operations only
3. **Mock external services**: Don't integrate real SMS/email yet
4. **SQLite database**: No complex setup needed
5. **CORS enabled**: Frontend needs to call your API

### For Developer B (Frontend)
1. **Mock data first**: Don't wait for backend
2. **Mobile-first**: Design for phones primarily
3. **Basic UI**: Focus on functionality over beauty
4. **Local storage**: For offline capability
5. **Error handling**: Assume API might be down

## Sunday Integration Plan

### 2:00 PM - First Integration
- Developer A: Backend running on localhost:8000
- Developer B: Update API calls to real endpoints
- Test basic flow: register → login → create trip

### 4:00 PM - Feature Integration  
- Test location updates and alerts
- Fix any API mismatches
- Test on mobile devices

### 6:00 PM - Final Testing
- End-to-end user journey testing
- Deploy to simple hosting (Heroku/Netlify)
- Document any known issues

## What We're NOT Building (Cut for Time)
- ❌ Real SMS/email notifications
- ❌ Advanced geofencing algorithms  
- ❌ WebSocket real-time updates
- ❌ Offline sync
- ❌ Security features
- ❌ Deployment infrastructure
- ❌ Comprehensive testing

## What We ARE Building (MVP)
- ✅ User registration/login
- ✅ Create and manage trips
- ✅ Add planned locations to trips
- ✅ Submit location updates
- ✅ Basic distance-based alerts
- ✅ Simple alert response system
- ✅ Web interface that works on mobile
- ✅ Basic trip sharing

## Emergency Communication Plan

### Immediate Setup (Friday Night)
1. **Create shared Google Doc** for real-time communication
2. **Exchange phone numbers** for urgent issues
3. **Agree on API contract** before starting

### Quick Check-ins
- **Saturday 10 AM**: "How's it going?" message
- **Saturday 6 PM**: Share progress and any blockers
- **Sunday 10 AM**: "Ready for integration?" check

### API Contract (Must Agree Friday Night)
Developer A commits to building these exact endpoints:

```
Authentication:
POST /api/auth/register {email, password, name}
POST /api/auth/login {email, password} → {token}

Trips:
GET /api/trips (requires auth)
POST /api/trips {name, start_date, end_date}
GET /api/trips/{id}

Locations:
POST /api/trips/{id}/locations {lat, lng, name, planned_time}
GET /api/trips/{id}/locations
POST /api/location-updates {trip_id, lat, lng, timestamp}

Alerts:
GET /api/alerts (requires auth)
POST /api/alerts/{id}/respond {response: "safe"|"help"}
```

## Risk Mitigation

### If Backend is Behind Schedule
- Developer B continues with mock data
- Focus on UI completeness
- Integration happens with whatever backend exists

### If Frontend is Behind Schedule  
- Developer A creates simple HTML test pages
- Focus on API completeness
- Use Postman/curl for testing

### If Integration Fails Sunday
- Demo each part separately
- Document what works independently
- Plan for post-deadline integration

## Success Metrics (Sunday Evening)
**Minimum viable demo:**
1. User can register and login
2. User can create a trip with locations
3. User can submit location updates
4. System shows basic alerts
5. Works on mobile browser

**Stretch goals if time permits:**
1. Trip sharing between users
2. Map visualization
3. Real-time alert notifications
4. Basic offline support

This plan prioritizes getting SOMETHING working over getting everything perfect. The key is complete separation of work until the final integration phase.