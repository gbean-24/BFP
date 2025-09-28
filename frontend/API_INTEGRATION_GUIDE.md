# API Integration Guide - Tourism Safety Tracker Frontend

## Overview

This document outlines the API integration points and mock data validation results for the Tourism Safety Tracker frontend application. It serves as a guide for Sunday's backend integration phase.

## Mock Data Validation Results

### ✅ Validated API Endpoints

#### Authentication Endpoints
- **POST /auth/register** - User registration
  - ✅ Returns success confirmation
  - ✅ Validates required fields (name, email, password)
  - ✅ Handles duplicate email scenarios

- **POST /auth/login** - User authentication
  - ✅ Returns JWT token and user data
  - ✅ Sets authentication token in localStorage
  - ✅ Validates credentials format

- **POST /auth/logout** - User logout
  - ✅ Clears authentication token
  - ✅ Returns success confirmation

#### Trip Management Endpoints
- **GET /trips** - Retrieve user trips
  - ✅ Returns array of trip objects
  - ✅ Includes trip metadata (status, location count)
  - ✅ Handles empty trip lists

- **POST /trips** - Create new trip
  - ✅ Accepts trip data (name, dates, description)
  - ✅ Returns created trip with ID
  - ✅ Validates date ranges and required fields

- **GET /trips/{id}** - Get trip details
  - ✅ Returns detailed trip information
  - ✅ Includes emergency contacts array
  - ✅ Handles non-existent trip IDs

- **PUT /trips/{id}** - Update trip
  - ✅ Accepts partial update data
  - ✅ Returns updated trip object

- **DELETE /trips/{id}** - Delete trip
  - ✅ Returns deletion confirmation

#### Location Management Endpoints
- **GET /trips/{id}/locations** - Get trip locations
  - ✅ Returns array of location objects
  - ✅ Includes coordinates, timing, and type data
  - ✅ Validates coordinate ranges (-90 to 90 lat, -180 to 180 lng)

- **POST /trips/{id}/locations** - Add location to trip
  - ✅ Accepts location data with coordinates
  - ✅ Returns created location with ID
  - ✅ Validates coordinate format

- **POST /location-updates** - Submit location update
  - ✅ Accepts real-time location data
  - ✅ Returns success confirmation
  - ✅ Includes timestamp validation

#### Alert System Endpoints
- **GET /alerts** - Retrieve alerts
  - ✅ Returns array of alert objects
  - ✅ Includes various alert types and statuses
  - ✅ Validates alert severity levels

- **POST /alerts/{id}/respond** - Respond to alert
  - ✅ Accepts response type (safe/help)
  - ✅ Returns response confirmation
  - ✅ Updates alert status

## Mock Data Scenarios

### Trip Data Scenarios
```javascript
// Active trip with locations
{
  id: 1,
  name: 'Tokyo Adventure',
  status: 'active',
  locations_count: 3
}

// Planned future trip
{
  id: 2,
  name: 'European Tour', 
  status: 'planned',
  locations_count: 5
}

// Completed trip
{
  id: 3,
  name: 'Solo Backpacking Adventure',
  status: 'completed',
  locations_count: 12
}

// Cancelled trip
{
  id: 4,
  name: 'Family Vacation',
  status: 'cancelled',
  locations_count: 0
}
```

### Alert Scenarios
```javascript
// Location deviation alert
{
  type: 'location_deviation',
  status: 'active',
  severity: 'medium'
}

// Battery warning
{
  type: 'battery_low',
  status: 'active', 
  severity: 'high'
}

// Emergency escalation
{
  type: 'emergency',
  status: 'escalated',
  severity: 'critical'
}
```

### Location Types
- `transport` - Stations, airports, bus stops
- `accommodation` - Hotels, hostels, lodging
- `attraction` - Tourist sites, museums, landmarks
- `food` - Restaurants, markets, cafes
- `emergency` - Hospitals, police stations, embassies

## Error Handling Validation

### ✅ Tested Error Scenarios

1. **Network Timeouts**
   - 5% random failure rate simulation
   - Proper error message handling
   - Retry mechanism compatibility

2. **Authentication Errors**
   - Invalid credentials handling
   - Token expiration simulation
   - Unauthorized access responses

3. **Validation Errors**
   - Required field validation
   - Date range validation
   - Coordinate boundary checking

4. **Server Errors**
   - 500 error simulation
   - Graceful degradation
   - User-friendly error messages

## Integration Checklist for Sunday

### 🔧 Backend Integration Steps

1. **Update API Configuration**
   ```javascript
   // In src/api/client.js
   this.baseURL = 'https://your-backend-domain.com/api';
   this.useMockData = false;
   ```

2. **Authentication Token Format**
   - Verify JWT token structure matches backend
   - Update token validation logic if needed
   - Test token refresh mechanism

3. **Data Format Validation**
   - Ensure date formats match (ISO 8601 recommended)
   - Verify coordinate precision requirements
   - Check array vs object response formats

4. **Error Response Format**
   - Standardize error response structure
   - Map HTTP status codes to user messages
   - Implement proper error logging

5. **Real-time Features**
   - Test WebSocket connections for alerts
   - Implement location update polling
   - Verify push notification setup

### 🧪 Testing Priorities

1. **Authentication Flow**
   - Registration with email verification
   - Login with various credential types
   - Token refresh and expiration handling

2. **Trip CRUD Operations**
   - Create trips with validation
   - Update trip details and locations
   - Delete trips and cascade effects

3. **Location Tracking**
   - Real-time location updates
   - Geofencing and deviation detection
   - Battery optimization for tracking

4. **Alert System**
   - Alert generation and delivery
   - Emergency escalation workflows
   - Response time tracking

### 📊 Performance Considerations

- **Response Times**: Current mock average ~500ms
- **Payload Sizes**: Optimize for mobile data usage
- **Caching Strategy**: Implement for trip and location data
- **Offline Support**: Ensure PWA functionality works

### 🔒 Security Checklist

- [ ] HTTPS enforcement
- [ ] JWT token security
- [ ] Input sanitization
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] Data encryption for sensitive information

## Mock vs Real API Differences

### Expected Changes

1. **Response Times**
   - Mock: 200-800ms simulated delay
   - Real: Varies based on server location and load

2. **Error Rates**
   - Mock: 5% random failure simulation
   - Real: Depends on infrastructure reliability

3. **Data Validation**
   - Mock: Basic client-side validation
   - Real: Server-side validation with detailed error messages

4. **Authentication**
   - Mock: Simple token generation
   - Real: Secure JWT with proper expiration and refresh

## Troubleshooting Guide

### Common Integration Issues

1. **CORS Errors**
   ```javascript
   // Ensure backend allows frontend domain
   Access-Control-Allow-Origin: https://your-frontend-domain.com
   ```

2. **Authentication Failures**
   - Check token format and headers
   - Verify API endpoint URLs
   - Test with curl/Postman first

3. **Data Format Mismatches**
   - Compare mock vs real response structures
   - Update frontend parsing logic
   - Add data transformation layers

4. **Network Timeouts**
   - Increase timeout values for mobile networks
   - Implement retry logic with exponential backoff
   - Add offline queue for failed requests

## Success Metrics

### Integration Success Criteria

- [ ] All authentication flows work end-to-end
- [ ] Trip creation and management functional
- [ ] Location tracking accurate within 10m
- [ ] Alerts delivered within 30 seconds
- [ ] Error handling provides clear user feedback
- [ ] Performance meets mobile usability standards
- [ ] PWA features work offline

### Performance Targets

- **API Response Time**: < 2 seconds
- **Location Update Frequency**: Every 30 seconds
- **Alert Delivery Time**: < 30 seconds
- **Offline Functionality**: 24 hours minimum
- **Battery Impact**: < 5% per hour of tracking

---

*This document should be updated after successful backend integration with actual performance metrics and any discovered issues.*
