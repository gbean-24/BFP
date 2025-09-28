# Tourism Safety Tracker - Frontend

Frontend application for the Tourism Safety Tracker project. Built as a Progressive Web App (PWA) with vanilla JavaScript for maximum compatibility and performance.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (for development server)
- Modern web browser
- Backend API running on `http://localhost:8000`

### Development Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open in browser:**
- Development: `http://localhost:3000`
- The app will automatically reload on changes

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Serve with Python (alternative)
npm run serve
```

## 📱 Features

### Core Functionality
- ✅ **User Authentication** - Login/Register with JWT tokens
- ✅ **Trip Management** - Create, view, and manage travel trips
- ✅ **Location Tracking** - GPS-based location updates
- ✅ **Interactive Maps** - Leaflet.js integration with OpenStreetMap
- ✅ **Safety Alerts** - Real-time emergency notifications
- ✅ **Emergency Response** - Quick response to safety checks
- ✅ **Mobile Responsive** - Works on all device sizes

### Progressive Web App (PWA)
- 📱 **Installable** - Can be installed on mobile devices
- 🔄 **Offline Support** - Basic functionality works offline
- 🔔 **Push Notifications** - Emergency alerts (when backend supports it)
- ⚡ **Fast Loading** - Optimized for performance

## 🏗️ Architecture

### Project Structure
```
frontend/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.js             # Application entry point
│   ├── styles/
│   │   └── main.css        # Main stylesheet
│   ├── components/
│   │   ├── auth.js         # Authentication component
│   │   ├── trips.js        # Trip management component
│   │   └── alerts.js       # Alerts and emergency component
│   └── api/
│       └── client.js       # API client with mock data
└── README_FRONTEND.md      # This file
```

### Component Architecture
- **AuthComponent**: Handles login, registration, and authentication state
- **TripsComponent**: Manages trip creation, viewing, and location management
- **AlertsComponent**: Handles safety alerts and emergency responses
- **ApiClient**: Centralized API communication with mock data fallback

## 🔌 API Integration

### Backend Compatibility
The frontend is designed to work with the backend API contract:

```javascript
// Authentication
POST /api/auth/register {name, email, password}
POST /api/auth/login {email, password} → {token, user}

// Trips
GET /api/trips
POST /api/trips {name, start_date, end_date}
GET /api/trips/{id}

// Locations
POST /api/trips/{id}/locations {name, lat, lng, planned_time}
GET /api/trips/{id}/locations
POST /api/location-updates {trip_id, lat, lng, timestamp}

// Alerts
GET /api/alerts
POST /api/alerts/{id}/respond {response: "safe"|"help"}
```

### Mock Data Mode
When the backend is not available, the app automatically switches to mock data mode:
- Simulates all API responses
- Provides realistic test data
- Allows full frontend development without backend dependency

## 🎨 Styling

### CSS Architecture
- **Mobile-first responsive design**
- **CSS Grid and Flexbox** for layouts
- **CSS Custom Properties** for theming
- **Utility classes** for common patterns
- **Component-specific styles** for modularity

### Design System
- **Colors**: Blue primary (#2563eb), semantic colors for alerts
- **Typography**: System fonts for performance
- **Spacing**: Consistent 0.5rem increments
- **Border Radius**: 6px for buttons, 8px for cards, 12px for modals

## 📱 Mobile Features

### Responsive Design
- **Breakpoint**: 768px for mobile/desktop switch
- **Touch-friendly**: Large tap targets (44px minimum)
- **Readable text**: Minimum 16px font size
- **Accessible**: High contrast, keyboard navigation

### PWA Features
- **App Manifest**: Installable with custom icon
- **Service Worker**: Offline caching (basic)
- **Viewport Meta**: Proper mobile scaling
- **Theme Color**: Matches app branding

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Trip creation and management
- [ ] Location updates (requires HTTPS or localhost)
- [ ] Alert responses
- [ ] Mobile responsiveness
- [ ] Offline functionality
- [ ] PWA installation

### Browser Testing
- ✅ Chrome/Chromium (primary)
- ✅ Firefox
- ✅ Safari (iOS)
- ✅ Edge

## 🔧 Development

### Adding New Features

1. **Create component file** in `src/components/`
2. **Import in main.js** and initialize
3. **Add navigation** if needed
4. **Update API client** for new endpoints
5. **Add styles** to component or main.css

### API Client Usage
```javascript
import apiClient from './api/client.js';

// All methods return promises
const trips = await apiClient.getTrips();
const newTrip = await apiClient.createTrip(tripData);
await apiClient.respondToAlert(alertId, 'safe');
```

### Adding Mock Data
Update `generateMockData()` in `src/api/client.js`:
```javascript
const mockData = {
  '/your-endpoint': { your: 'data' }
};
```

## 🚀 Deployment

### Static Hosting
The frontend is a static web app that can be deployed to:
- **Netlify**: Drag and drop `dist/` folder
- **Vercel**: Connect GitHub repository
- **GitHub Pages**: Upload `dist/` contents
- **Any web server**: Serve `dist/` folder

### Environment Configuration
Update API base URL in `src/api/client.js`:
```javascript
this.baseURL = 'https://your-backend-api.com/api';
```

### HTTPS Requirements
- **Geolocation**: Requires HTTPS in production
- **PWA**: Requires HTTPS for installation
- **Service Worker**: Requires HTTPS (except localhost)

## 🐛 Troubleshooting

### Common Issues

**"Backend not available" message:**
- Check if backend is running on `http://localhost:8000`
- App will use mock data automatically

**Location not working:**
- Ensure HTTPS or localhost
- Check browser permissions
- Test on mobile device

**PWA not installing:**
- Requires HTTPS
- Check manifest.json validity
- Ensure service worker is registered

**Styles not loading:**
- Check console for CSS errors
- Verify file paths
- Clear browser cache

### Debug Mode
Open browser developer tools:
- **Console**: Check for JavaScript errors
- **Network**: Monitor API calls
- **Application**: Check PWA features
- **Sources**: Debug with breakpoints

## 📞 Support

### Development Help
- Check browser console for errors
- Use mock data mode for backend-independent development
- Test on multiple devices and browsers
- Refer to collaboration plan for API contract

### Integration with Backend
- Ensure CORS is enabled on backend
- Match API endpoints exactly
- Handle authentication tokens properly
- Test error scenarios

---

**Ready for 48-hour sprint development!** 🚀

The frontend is designed to work independently with mock data, allowing you to develop and test all features even when the backend is not ready. Perfect for parallel development!