// API Configuration
const API_BASE_URL = 'http://10.89.169.146:8000/api';
const SECURE_API_URL = `${API_BASE_URL}/secure`;
const SIMPLE_API_URL = `${API_BASE_URL}/simple`;

// API Client Class
class APIClient {
    constructor() {
        this.token = localStorage.getItem('auth_token');
    }

    // Get auth headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic API request method
    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getHeaders(options.auth !== false),
                    ...options.headers,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Authentication Methods
    async register(userData) {
        const response = await this.request(`${SECURE_API_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify(userData),
            auth: false,
        });
        return response;
    }

    async login(credentials) {
        const response = await this.request(`${SECURE_API_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify(credentials),
            auth: false,
        });
        
        if (response.access_token) {
            this.token = response.access_token;
            localStorage.setItem('auth_token', this.token);
        }
        
        return response;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
    }

    // User Methods
    async getCurrentUser() {
        return await this.request(`${SECURE_API_URL}/users/me`);
    }

    // Trip Methods
    async getTrips() {
        return await this.request(`${SECURE_API_URL}/trips`);
    }

    async createTrip(tripData) {
        return await this.request(`${SECURE_API_URL}/trips`, {
            method: 'POST',
            body: JSON.stringify(tripData),
        });
    }

    async getTrip(tripId) {
        return await this.request(`${SECURE_API_URL}/trips/${tripId}`);
    }

    // Planned Location Methods
    async addPlannedLocation(tripId, locationData) {
        return await this.request(`${SECURE_API_URL}/trips/${tripId}/planned-locations`, {
            method: 'POST',
            body: JSON.stringify(locationData),
        });
    }

    // Location Update Methods
    async submitLocationUpdate(locationData) {
        return await this.request(`${SECURE_API_URL}/location-updates`, {
            method: 'POST',
            body: JSON.stringify(locationData),
        });
    }

    async getTripLocations(tripId) {
        return await this.request(`${SECURE_API_URL}/trips/${tripId}/locations`);
    }

    // Alert Methods
    async getAlerts() {
        return await this.request(`${SECURE_API_URL}/alerts`);
    }

    async respondToAlert(alertId, response) {
        return await this.request(`${SECURE_API_URL}/alerts/${alertId}/respond`, {
            method: 'POST',
            body: JSON.stringify(response),
        });
    }

    async createManualAlert(tripId, message) {
        return await this.request(`${SECURE_API_URL}/safety/manual-alert?trip_id=${tripId}&message=${encodeURIComponent(message)}`, {
            method: 'POST',
        });
    }

    // Test Methods (using simple API)
    async testConnection() {
        try {
            const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
            return await response.json();
        } catch (error) {
            throw new Error('Cannot connect to backend server');
        }
    }
}

// Location Service
class LocationService {
    constructor() {
        this.watchId = null;
        this.currentPosition = null;
        this.isTracking = false;
    }

    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentPosition = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString(),
                    };
                    resolve(this.currentPosition);
                },
                (error) => {
                    reject(new Error(`Location error: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000,
                }
            );
        });
    }

    startTracking(callback) {
        if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported');
        }

        this.isTracking = true;
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.currentPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString(),
                };
                callback(this.currentPosition);
            },
            (error) => {
                console.error('Location tracking error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 60000,
            }
        );
    }

    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this.isTracking = false;
    }
}

// Notification Service
class NotificationService {
    constructor() {
        this.container = null;
    }

    init() {
        this.container = document.getElementById('notifications');
    }

    show(message, type = 'info', duration = 5000) {
        if (!this.container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <p>${message}</p>
            </div>
        `;

        this.container.appendChild(notification);

        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);

        return notification;
    }

    success(message) {
        return this.show(message, 'success');
    }

    error(message) {
        return this.show(message, 'error');
    }

    warning(message) {
        return this.show(message, 'warning');
    }
}

// Storage Service
class StorageService {
    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Storage error:', error);
        }
    }

    static get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage error:', error);
            return null;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Storage error:', error);
        }
    }

    static clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Storage error:', error);
        }
    }
}

// Initialize services
const api = new APIClient();
const locationService = new LocationService();
const notifications = new NotificationService();

// Export for use in other files
window.api = api;
window.locationService = locationService;
window.notifications = notifications;
window.StorageService = StorageService;