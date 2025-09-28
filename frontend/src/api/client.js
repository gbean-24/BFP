// API Client for Tourism Safety Tracker
// Matches the API contract from the collaboration plan

class ApiClient {
    constructor() {
        this.baseURL = 'http://localhost:8000/api/secure';
        this.token = localStorage.getItem('auth_token');
        
        // Initialize backend availability check
        this.backendAvailable = false;
        this.useMockData = true; // Start with mock data, check backend availability
        
        // Offline sync service will be injected
        this.offlineSyncService = null;
        
        // Initialize backend availability check
        this.initializeBackendConnection();
    }

    // Set offline sync service
    setOfflineSyncService(syncService) {
        this.offlineSyncService = syncService;
    }

    // Initialize backend connection and check availability
    async initializeBackendConnection() {
        try {
            console.log('🔍 Checking backend availability...');
            const response = await fetch('http://localhost:8000/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Add timeout to prevent hanging
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                const healthData = await response.json();
                console.log('✅ Backend is available:', healthData);
                this.backendAvailable = true;
                this.useMockData = false;
                
                // Check if API routes are available
                await this.validateApiEndpoints();
            } else {
                throw new Error(`Backend health check failed: ${response.status}`);
            }
        } catch (error) {
            console.log('❌ Backend not available, using mock data:', error.message);
            this.backendAvailable = false;
            this.useMockData = true;
        }
    }

    // Validate that required API endpoints are available
    async validateApiEndpoints() {
        const testEndpoints = [
            '/auth/login',
            '/trips',
            '/alerts'
        ];
        
        console.log('🔍 Validating API endpoints...');
        
        for (const endpoint of testEndpoints) {
            try {
                // Use OPTIONS request to check if endpoint exists without side effects
                const response = await fetch(`${this.baseURL}${endpoint}`, {
                    method: 'OPTIONS',
                    signal: AbortSignal.timeout(3000)
                });
                
                // If we get a 405 (Method Not Allowed), the endpoint exists but doesn't support OPTIONS
                // If we get a 404, the endpoint doesn't exist
                if (response.status === 404) {
                    console.log(`⚠️ API endpoint not implemented: ${endpoint}`);
                    this.useMockData = true;
                    return;
                }
            } catch (error) {
                console.log(`⚠️ Could not validate endpoint ${endpoint}:`, error.message);
                this.useMockData = true;
                return;
            }
        }
        
        console.log('✅ API endpoints validated successfully');
    }

    // Check if backend is available (legacy method for compatibility)
    async isBackendAvailable() {
        return this.backendAvailable;
    }

    // Retry backend connection
    async retryBackendConnection() {
        console.log('🔄 Retrying backend connection...');
        await this.initializeBackendConnection();
        return this.backendAvailable;
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    // Clear authentication token
    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    // Manually switch between mock and real API
    setMockMode(useMock) {
        this.useMockData = useMock;
        console.log(`🔧 API mode switched to: ${useMock ? 'Mock Data' : 'Real Backend'}`);
    }

    // Get current API mode
    getApiMode() {
        return {
            useMockData: this.useMockData,
            backendAvailable: this.backendAvailable,
            baseURL: this.baseURL
        };
    }

    // Get headers with authentication
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic API request method with offline support and backend fallback
    async request(endpoint, options = {}) {
        const method = options.method || 'GET';
        const cacheKey = `${method}:${endpoint}`;
        
        // Use mock data if backend is not available
        if (this.useMockData) {
            console.log(`🎭 Using mock data for: ${method} ${endpoint}`);
            const mockResponse = await this.getMockResponse(endpoint, method, options.body);
            
            // Cache successful GET responses
            if (method === 'GET' && this.offlineSyncService) {
                await this.offlineSyncService.cacheResponse(cacheKey, mockResponse);
            }
            
            return mockResponse;
        }

        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options,
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(10000)
        };

        try {
            console.log(`🌐 Making real API request: ${method} ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                // Handle specific HTTP status codes
                if (response.status === 404) {
                    console.log(`⚠️ API endpoint not found: ${endpoint}, falling back to mock data`);
                    this.useMockData = true;
                    return await this.getMockResponse(endpoint, method, options.body);
                }
                
                if (response.status === 401) {
                    console.log('🔐 Authentication failed, clearing token');
                    this.clearToken();
                    throw new Error('Authentication required. Please log in again.');
                }
                
                const error = await response.json().catch(() => ({ 
                    message: `HTTP ${response.status}: ${response.statusText}` 
                }));
                throw new Error(error.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ API request successful: ${method} ${endpoint}`);
            
            // Cache successful GET responses
            if (method === 'GET' && this.offlineSyncService) {
                await this.offlineSyncService.cacheResponse(cacheKey, data);
            }
            
            return data;
        } catch (error) {
            console.error(`❌ API Request failed for ${method} ${endpoint}:`, error.message);
            
            // If it's a network error or timeout, try to fall back to mock data
            if (error.name === 'AbortError' || error.message.includes('fetch')) {
                console.log('🔄 Network error detected, checking backend availability...');
                this.backendAvailable = false;
                this.useMockData = true;
                
                // For GET requests, try cached data first, then mock data
                if (method === 'GET') {
                    if (this.offlineSyncService) {
                        const cachedData = await this.offlineSyncService.getCachedResponse(cacheKey);
                        if (cachedData) {
                            console.log('📦 Using cached data for:', endpoint);
                            return { ...cachedData, _offline: true };
                        }
                    }
                    
                    console.log('🎭 Falling back to mock data for:', endpoint);
                    return await this.getMockResponse(endpoint, method, options.body);
                }
            }
            
            // Queue write operations for offline sync
            if (['POST', 'PUT', 'DELETE'].includes(method) && this.offlineSyncService) {
                if (!navigator.onLine || error.name === 'AbortError') {
                    console.log('📦 Queuing offline request:', method, endpoint);
                    await this.offlineSyncService.queueOfflineRequest(
                        method, 
                        url, 
                        options.body ? JSON.parse(options.body) : null,
                        this.getHeaders()
                    );
                    
                    // Return optimistic response for offline writes
                    return this.getOptimisticResponse(endpoint, method, options.body);
                }
            }
            
            throw error;
        }
    }

    // Generate optimistic response for offline operations
    getOptimisticResponse(endpoint, method, body) {
        const timestamp = new Date().toISOString();
        
        if (method === 'POST') {
            if (endpoint === '/trips') {
                const tripData = body ? JSON.parse(body) : {};
                return {
                    id: Date.now(),
                    ...tripData,
                    status: 'planned',
                    created_at: timestamp,
                    _offline: true,
                    _optimistic: true
                };
            }
            
            if (endpoint.includes('/locations')) {
                const locationData = body ? JSON.parse(body) : {};
                return {
                    id: Date.now(),
                    ...locationData,
                    created_at: timestamp,
                    _offline: true,
                    _optimistic: true
                };
            }
            
            return {
                success: true,
                message: 'Request queued for sync',
                timestamp,
                _offline: true,
                _optimistic: true
            };
        }
        
        if (method === 'PUT' || method === 'DELETE') {
            return {
                success: true,
                message: 'Request queued for sync',
                timestamp,
                _offline: true,
                _optimistic: true
            };
        }
        
        return {
            success: true,
            _offline: true,
            _optimistic: true
        };
    }

    // Authentication endpoints
    async register(userData) {
        try {
            const response = await this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
            
            console.log('✅ Registration successful');
            return response;
        } catch (error) {
            console.error('❌ Registration failed:', error.message);
            throw error;
        }
    }

    async login(credentials) {
        try {
            const response = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials),
            });
            
            // Handle both mock and real backend token formats
            if (response.token || response.access_token) {
                const token = response.token || response.access_token;
                this.setToken(token);
                console.log('✅ Login successful, token stored');
            }
            
            return response;
        } catch (error) {
            console.error('❌ Login failed:', error.message);
            throw error;
        }
    }

    async logout() {
        this.clearToken();
        return { success: true };
    }

    // Trip endpoints
    async getTrips() {
        return this.request('/trips');
    }

    async createTrip(tripData) {
        return this.request('/trips', {
            method: 'POST',
            body: JSON.stringify(tripData),
        });
    }

    async getTrip(tripId) {
        return this.request(`/trips/${tripId}`);
    }

    async updateTrip(tripId, tripData) {
        return this.request(`/trips/${tripId}`, {
            method: 'PUT',
            body: JSON.stringify(tripData),
        });
    }

    async deleteTrip(tripId) {
        return this.request(`/trips/${tripId}`, {
            method: 'DELETE',
        });
    }

    // Location endpoints
    async getTripLocations(tripId) {
        return this.request(`/trips/${tripId}/locations`);
    }

    async addTripLocation(tripId, locationData) {
        return this.request(`/trips/${tripId}/planned-locations`, {
            method: 'POST',
            body: JSON.stringify(locationData),
        });
    }

    async addLocationToTrip(tripId, locationData) {
        return this.addTripLocation(tripId, locationData);
    }

    async updateTripLocation(tripId, locationData) {
        return this.request(`/trips/${tripId}/planned-locations`, {
            method: 'PUT',
            body: JSON.stringify(locationData),
        });
    }

    async submitLocationUpdate(locationData) {
        return this.request('/location-updates', {
            method: 'POST',
            body: JSON.stringify(locationData),
        });
    }

    // Alert endpoints
    async getAlerts() {
        return this.request('/alerts');
    }

    async respondToAlert(alertId, response) {
        return this.request(`/alerts/${alertId}/respond`, {
            method: 'POST',
            body: JSON.stringify({ response }),
        });
    }

    // Mock data for development
    getMockResponse(endpoint, method, body) {
        console.log(`Mock API: ${method} ${endpoint}`, body ? JSON.parse(body) : '');
        
        // Simulate various network conditions and errors
        return new Promise((resolve, reject) => {
            // Simulate random network delays (200-800ms)
            const delay = Math.random() * 600 + 200;
            
            setTimeout(() => {
                // Simulate occasional network errors (5% chance)
                if (Math.random() < 0.05) {
                    reject(new Error('Network timeout - please try again'));
                    return;
                }
                
                // Simulate server errors for specific scenarios
                if (endpoint === '/auth/login' && body) {
                    const credentials = JSON.parse(body);
                    if (credentials.email === 'invalid@example.com') {
                        reject(new Error('Invalid email or password'));
                        return;
                    }
                }
                
                // Simulate validation errors
                if (method === 'POST' && endpoint === '/trips' && body) {
                    const tripData = JSON.parse(body);
                    if (!tripData.name || tripData.name.length < 2) {
                        reject(new Error('Trip name must be at least 2 characters long'));
                        return;
                    }
                    if (new Date(tripData.start_date) > new Date(tripData.end_date)) {
                        reject(new Error('End date must be after start date'));
                        return;
                    }
                }
                
                try {
                    const response = this.generateMockData(endpoint, method, body);
                    resolve(response);
                } catch (error) {
                    reject(new Error('Mock data generation failed: ' + error.message));
                }
            }, delay);
        });
    }

    generateMockData(endpoint, method, body) {
        const mockData = {
            // Authentication
            '/auth/register': { 
                id: Date.now(),
                email: 'test@example.com',
                name: 'Test User',
                phone: null,
                is_active: true,
                created_at: new Date().toISOString()
            },
            '/auth/login': { 
                access_token: 'mock_jwt_token_' + Date.now(),
                token_type: 'bearer'
            },

            // Trips - Enhanced with more diverse data
            '/trips': method === 'GET' ? [
                {
                    id: 1,
                    name: 'Tokyo Adventure',
                    description: 'Exploring Tokyo and surrounding areas',
                    start_date: '2024-02-01T00:00:00Z',
                    end_date: '2024-02-07T00:00:00Z',
                    is_active: true,
                    monitoring_enabled: true,
                    deviation_threshold_km: 2.0,
                    owner_id: 1,
                    created_at: '2024-01-15T10:00:00Z'
                },
                {
                    id: 2,
                    name: 'European Tour',
                    description: 'Multi-city European adventure',
                    start_date: '2024-03-15T00:00:00Z',
                    end_date: '2024-03-25T00:00:00Z',
                    is_active: true,
                    monitoring_enabled: true,
                    deviation_threshold_km: 2.0,
                    owner_id: 1,
                    created_at: '2024-02-01T10:00:00Z'
                }
            ] : {
                id: Date.now(),
                owner_id: 1,
                is_active: true,
                monitoring_enabled: true,
                deviation_threshold_km: 2.0,
                created_at: new Date().toISOString(),
                ...JSON.parse(body || '{}')
            },

            // Trip details - Enhanced with more realistic data
            '/trips/1': {
                id: 1,
                name: 'Tokyo Adventure',
                start_date: '2024-02-01',
                end_date: '2024-02-07',
                status: 'active',
                description: 'Exploring Tokyo and surrounding areas with focus on cultural sites and modern attractions',
                emergency_contacts: ['john.doe@example.com', 'jane.smith@example.com'],
                created_at: '2024-01-15T10:00:00Z',
                updated_at: '2024-01-20T14:30:00Z'
            },

            // Locations - Enhanced with more diverse location types
            '/trips/1/locations': method === 'GET' ? [
                {
                    id: 1,
                    latitude: 35.6812,
                    longitude: 139.7671,
                    accuracy_meters: 5.0,
                    timestamp: '2024-02-01T10:00:00Z',
                    battery_level: 85,
                    is_manual: false,
                    user_id: 1,
                    trip_id: 1,
                    created_at: '2024-02-01T10:00:00Z'
                },
                {
                    id: 2,
                    latitude: 35.6598,
                    longitude: 139.7006,
                    accuracy_meters: 3.0,
                    timestamp: '2024-02-01T15:00:00Z',
                    battery_level: 78,
                    is_manual: false,
                    user_id: 1,
                    trip_id: 1,
                    created_at: '2024-02-01T15:00:00Z'
                }
            ] : {
                id: Date.now(),
                user_id: 1,
                created_at: new Date().toISOString(),
                ...JSON.parse(body || '{}')
            },

            // Alerts - Enhanced with more alert types and scenarios
            '/alerts': this.generateDynamicAlerts(),

            // Location updates
            '/location-updates': {
                success: true,
                message: 'Location updated successfully',
                timestamp: new Date().toISOString()
            },

            // Alert responses - Enhanced with different response types
            '/alerts/1/respond': {
                success: true,
                message: 'Response recorded',
                response_time: new Date().toISOString()
            }
        };

        // Handle dynamic endpoints (like /trips/123)
        if (endpoint.startsWith('/trips/') && endpoint.includes('/locations')) {
            return mockData['/trips/1/locations'];
        }
        
        if (endpoint.startsWith('/trips/') && !endpoint.includes('/')) {
            return mockData['/trips/1'];
        }

        return mockData[endpoint] || { error: 'Mock endpoint not implemented' };
    }

    // Generate dynamic alerts for real-time testing
    generateDynamicAlerts() {
        const baseAlerts = [
            {
                id: 1,
                type: 'location_deviation',
                message: 'You seem to be far from your planned route. Are you safe?',
                created_at: '2024-01-15T14:30:00Z',
                status: 'responded',
                trip_id: 1,
                severity: 'medium',
                response: 'safe'
            },
            {
                id: 2,
                type: 'check_in',
                message: 'Regular safety check-in',
                created_at: '2024-01-15T12:00:00Z',
                status: 'responded',
                trip_id: 1,
                response: 'safe',
                severity: 'low'
            }
        ];

        // Add dynamic alerts based on time and random factors
        const now = Date.now();
        const dynamicAlerts = [];

        // Simulate periodic check-in alerts (every 30 minutes in demo)
        if (Math.random() < 0.3) {
            dynamicAlerts.push({
                id: now + 1000,
                type: 'check_in',
                message: 'Time for your regular safety check-in. Are you okay?',
                created_at: new Date(now - Math.random() * 5 * 60 * 1000).toISOString(),
                status: 'active',
                trip_id: 1,
                severity: 'low'
            });
        }

        // Simulate battery alerts
        if (Math.random() < 0.2) {
            const batteryLevel = Math.floor(Math.random() * 20) + 5; // 5-25%
            dynamicAlerts.push({
                id: now + 2000,
                type: 'battery_low',
                message: `Your device battery is running low (${batteryLevel}%). Please charge soon.`,
                created_at: new Date(now - Math.random() * 10 * 60 * 1000).toISOString(),
                status: 'active',
                trip_id: 1,
                severity: batteryLevel < 15 ? 'high' : 'medium'
            });
        }

        // Simulate location deviation alerts
        if (Math.random() < 0.15) {
            dynamicAlerts.push({
                id: now + 3000,
                type: 'location_deviation',
                message: 'You appear to be off your planned route. Please confirm your safety.',
                created_at: new Date(now - Math.random() * 15 * 60 * 1000).toISOString(),
                status: 'active',
                trip_id: 1,
                severity: 'medium'
            });
        }

        // Simulate geofence alerts
        if (Math.random() < 0.1) {
            const areas = ['restricted military zone', 'high-crime area', 'natural disaster zone', 'closed border area'];
            const area = areas[Math.floor(Math.random() * areas.length)];
            dynamicAlerts.push({
                id: now + 4000,
                type: 'geofence',
                message: `You have entered a ${area}. Please exercise caution and consider leaving the area.`,
                created_at: new Date(now - Math.random() * 20 * 60 * 1000).toISOString(),
                status: 'active',
                trip_id: 1,
                severity: 'high'
            });
        }

        // Simulate weather alerts
        if (Math.random() < 0.1) {
            const weatherEvents = [
                'severe thunderstorm warning',
                'flash flood alert',
                'extreme heat advisory',
                'winter storm warning'
            ];
            const event = weatherEvents[Math.floor(Math.random() * weatherEvents.length)];
            dynamicAlerts.push({
                id: now + 5000,
                type: 'weather',
                message: `Weather alert: ${event} in your area. Please take appropriate precautions.`,
                created_at: new Date(now - Math.random() * 30 * 60 * 1000).toISOString(),
                status: 'active',
                trip_id: 1,
                severity: 'medium'
            });
        }

        // Very rarely simulate emergency alerts (for testing)
        if (Math.random() < 0.05) {
            dynamicAlerts.push({
                id: now + 6000,
                type: 'emergency',
                message: 'Emergency alert triggered. Please respond immediately to confirm your safety.',
                created_at: new Date(now - Math.random() * 5 * 60 * 1000).toISOString(),
                status: 'active',
                trip_id: 1,
                severity: 'critical'
            });
        }

        return [...baseAlerts, ...dynamicAlerts];
    }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;