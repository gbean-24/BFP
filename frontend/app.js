// Tourism Safety Tracker - Main Application
class TourismSafetyApp {
    constructor() {
        this.currentUser = null;
        this.currentTrip = null;
        this.currentPage = 'dashboard';
        this.map = null;
        this.locationTracking = false;
        this.trackingInterval = null;

        this.init();
    }

    async init() {
        // Initialize services
        notifications.init();

        // Check authentication
        await this.checkAuth();

        // Set up event listeners
        this.setupEventListeners();

        // Hide loading screen
        this.hideLoading();

        // Test backend connection
        await this.testBackendConnection();
    }

    async testBackendConnection() {
        try {
            await api.testConnection();
            notifications.success('Connected to backend server');
        } catch (error) {
            notifications.error('Cannot connect to backend. Make sure the server is running on localhost:8000');
        }
    }

    async checkAuth() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            this.showAuth();
            return;
        }

        try {
            this.currentUser = await api.getCurrentUser();
            this.showMainApp();
            await this.loadDashboard();
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showAuth();
        }
    }

    setupEventListeners() {
        // Auth form listeners
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('show-register').addEventListener('click', (e) => this.showRegisterPage(e));
        document.getElementById('show-login').addEventListener('click', (e) => this.showLoginPage(e));

        // Navigation listeners
        document.getElementById('nav-dashboard').addEventListener('click', () => this.showPage('dashboard'));
        document.getElementById('nav-trips').addEventListener('click', () => this.showPage('trips'));
        document.getElementById('nav-alerts').addEventListener('click', () => this.showPage('alerts'));
        document.getElementById('nav-profile').addEventListener('click', () => this.showPage('profile'));
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Dashboard listeners
        document.getElementById('emergency-btn').addEventListener('click', () => this.showEmergencyModal());
        document.getElementById('create-trip-btn').addEventListener('click', () => this.showTripModal());
        document.getElementById('toggle-location').addEventListener('click', () => this.toggleLocationTracking());
        document.getElementById('manual-checkin').addEventListener('click', () => this.manualCheckin());

        // Trip listeners
        document.getElementById('new-trip-btn').addEventListener('click', () => this.showTripModal());
        document.getElementById('trip-form').addEventListener('submit', (e) => this.handleCreateTrip(e));
        document.getElementById('back-to-trips').addEventListener('click', () => this.showPage('trips'));
        document.getElementById('add-location-btn').addEventListener('click', () => this.showLocationModal());
        document.getElementById('location-form').addEventListener('submit', (e) => this.handleAddLocation(e));

        // Alert listeners
        document.getElementById('alert-response-form').addEventListener('submit', (e) => this.handleAlertResponse(e));

        // Emergency listeners
        document.getElementById('emergency-form').addEventListener('submit', (e) => this.handleEmergencyAlert(e));

        // Modal listeners
        this.setupModalListeners();

        // Alert filter listeners
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterAlerts(e.target.dataset.filter));
        });
    }

    setupModalListeners() {
        // Close modal listeners
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModals();
            });
        });

        // Response button listeners
        document.querySelectorAll('[data-response]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-response]').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                e.target.closest('form').dataset.response = e.target.dataset.response;
            });
        });

        // Click outside to close modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModals();
                }
            });
        });
    }

    // Authentication Methods
    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const credentials = {
                email: formData.get('email') || document.getElementById('login-email').value,
                password: formData.get('password') || document.getElementById('login-password').value
            };

            await api.login(credentials);
            this.currentUser = await api.getCurrentUser();

            notifications.success('Login successful!');
            this.showMainApp();
            await this.loadDashboard();
        } catch (error) {
            notifications.error(`Login failed: ${error.message}`);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const userData = {
                name: formData.get('name') || document.getElementById('register-name').value,
                email: formData.get('email') || document.getElementById('register-email').value,
                password: formData.get('password') || document.getElementById('register-password').value,
                phone: formData.get('phone') || document.getElementById('register-phone').value || null
            };

            await api.register(userData);
            notifications.success('Registration successful! Please login.');
            this.showLoginPage();
        } catch (error) {
            notifications.error(`Registration failed: ${error.message}`);
        }
    }

    handleLogout() {
        api.logout();
        this.currentUser = null;
        this.currentTrip = null;
        this.stopLocationTracking();
        notifications.success('Logged out successfully');
        this.showAuth();
    }

    // UI Navigation Methods
    showAuth() {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
    }

    hideLoading() {
        setTimeout(() => {
            document.getElementById('loading').classList.add('hidden');
        }, 1000);
    }

    showLoginPage(e) {
        if (e) e.preventDefault();
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('register-page').classList.add('hidden');
    }

    showRegisterPage(e) {
        if (e) e.preventDefault();
        document.getElementById('register-page').classList.remove('hidden');
        document.getElementById('login-page').classList.add('hidden');
    }

    showPage(pageName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`nav-${pageName}`).classList.add('active');

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));

        // Show selected page
        document.getElementById(`${pageName}-page`).classList.remove('hidden');

        this.currentPage = pageName;

        // Load page data
        switch (pageName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'trips':
                this.loadTrips();
                break;
            case 'alerts':
                this.loadAlerts();
                break;
            case 'profile':
                this.loadProfile();
                break;
        }
    }

    // Dashboard Methods
    async loadDashboard() {
        try {
            // Load current trip
            const trips = await api.getTrips();
            const activeTrip = trips.find(trip => trip.is_active);

            if (activeTrip) {
                this.currentTrip = activeTrip;
                this.updateCurrentTripDisplay(activeTrip);
            } else {
                this.updateCurrentTripDisplay(null);
            }

            // Load recent alerts
            const alerts = await api.getAlerts();
            this.updateRecentAlertsDisplay(alerts.slice(0, 3));

            // Update location status
            this.updateLocationStatus();

        } catch (error) {
            console.error('Failed to load dashboard:', error);
            notifications.error('Failed to load dashboard data');
        }
    }

    updateCurrentTripDisplay(trip) {
        const container = document.getElementById('current-trip-info');

        if (trip) {
            container.innerHTML = `
                <div class="trip-info">
                    <h4>${trip.name}</h4>
                    <p>${trip.description || 'No description'}</p>
                    <p><strong>Dates:</strong> ${new Date(trip.start_date).toLocaleDateString()} - ${new Date(trip.end_date).toLocaleDateString()}</p>
                    <p><strong>Safety Radius:</strong> ${trip.deviation_threshold_km}km</p>
                    <button class="btn-secondary" onclick="app.viewTripDetails(${trip.id})">View Details</button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <p>No active trip</p>
                <button id="create-trip-btn" class="btn-primary" onclick="app.showTripModal()">Create Trip</button>
            `;
        }
    }

    updateRecentAlertsDisplay(alerts) {
        const container = document.getElementById('recent-alerts');

        if (alerts.length === 0) {
            container.innerHTML = '<p>No recent alerts</p>';
            return;
        }

        container.innerHTML = alerts.map(alert => `
            <div class="alert-item" onclick="app.showAlertDetails(${alert.id})">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-time">${new Date(alert.triggered_at).toLocaleString()}</div>
                <div class="alert-status ${alert.status}">${alert.status.replace('_', ' ')}</div>
            </div>
        `).join('');
    }

    updateLocationStatus() {
        const statusText = document.getElementById('location-status-text');
        const toggleBtn = document.getElementById('toggle-location');

        if (this.locationTracking) {
            statusText.textContent = 'On';
            statusText.style.color = '#059669';
            toggleBtn.textContent = 'Disable Tracking';
            toggleBtn.className = 'btn-secondary';
        } else {
            statusText.textContent = 'Off';
            statusText.style.color = '#dc2626';
            toggleBtn.textContent = 'Enable Tracking';
            toggleBtn.className = 'btn-primary';
        }
    }

    // Trip Methods
    async loadTrips() {
        try {
            const trips = await api.getTrips();
            this.displayTrips(trips);
        } catch (error) {
            console.error('Failed to load trips:', error);
            notifications.error('Failed to load trips');
        }
    }

    displayTrips(trips) {
        const container = document.getElementById('trips-list');

        if (trips.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <p>No trips created yet</p>
                    <button class="btn-primary" onclick="app.showTripModal()">Create Your First Trip</button>
                </div>
            `;
            return;
        }

        container.innerHTML = trips.map(trip => {
            const startDate = new Date(trip.start_date);
            const endDate = new Date(trip.end_date);
            const now = new Date();

            let status = 'upcoming';
            if (now >= startDate && now <= endDate) status = 'active';
            else if (now > endDate) status = 'completed';

            return `
                <div class="trip-card" onclick="app.viewTripDetails(${trip.id})">
                    <h3>${trip.name}</h3>
                    <p>${trip.description || 'No description'}</p>
                    <div class="trip-meta">
                        <span>${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</span>
                        <span class="trip-status ${status}">${status}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    async viewTripDetails(tripId) {
        try {
            const trip = await api.getTrip(tripId);
            this.currentTrip = trip;

            document.getElementById('trip-detail-title').textContent = trip.name;

            // Load trip locations
            const locations = await api.getTripLocations(tripId);
            this.displayLocationHistory(locations);

            // Initialize map
            this.initTripMap(trip, locations);

            // Show trip detail page
            document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
            document.getElementById('trip-detail-page').classList.remove('hidden');

        } catch (error) {
            console.error('Failed to load trip details:', error);
            notifications.error('Failed to load trip details');
        }
    }

    initTripMap(trip, locations) {
        const mapContainer = document.getElementById('trip-map');

        if (this.map) {
            this.map.remove();
        }

        // Default center (Paris if no locations)
        let center = [48.8566, 2.3522];

        if (locations.length > 0) {
            center = [locations[0].latitude, locations[0].longitude];
        }

        this.map = L.map('trip-map').setView(center, 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add location markers
        locations.forEach((location, index) => {
            const marker = L.marker([location.latitude, location.longitude])
                .addTo(this.map)
                .bindPopup(`
                    <b>Location Update ${index + 1}</b><br>
                    Time: ${new Date(location.timestamp).toLocaleString()}<br>
                    Accuracy: ${location.accuracy_meters || 'Unknown'}m
                `);
        });

        // Fit map to show all markers
        if (locations.length > 0) {
            const group = new L.featureGroup(locations.map(loc =>
                L.marker([loc.latitude, loc.longitude])
            ));
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    displayLocationHistory(locations) {
        const container = document.getElementById('location-history');

        if (locations.length === 0) {
            container.innerHTML = '<p>No location updates yet</p>';
            return;
        }

        container.innerHTML = locations.slice(0, 10).map(location => `
            <div class="location-item">
                <div class="location-time">${new Date(location.timestamp).toLocaleString()}</div>
                <div class="location-coords">${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}</div>
                <div class="location-accuracy">Accuracy: ${location.accuracy_meters || 'Unknown'}m</div>
            </div>
        `).join('');
    }

    async handleCreateTrip(e) {
        e.preventDefault();

        try {
            const tripData = {
                name: document.getElementById('trip-name').value,
                description: document.getElementById('trip-description').value,
                start_date: document.getElementById('trip-start').value,
                end_date: document.getElementById('trip-end').value,
                deviation_threshold_km: parseFloat(document.getElementById('deviation-threshold').value),
                monitoring_enabled: true
            };

            const trip = await api.createTrip(tripData);
            notifications.success('Trip created successfully!');
            this.closeModals();
            this.loadTrips();

        } catch (error) {
            console.error('Failed to create trip:', error);
            notifications.error(`Failed to create trip: ${error.message}`);
        }
    }

    async handleAddLocation(e) {
        e.preventDefault();

        if (!this.currentTrip) {
            notifications.error('No trip selected');
            return;
        }

        try {
            const locationData = {
                name: document.getElementById('location-name').value,
                description: document.getElementById('location-description').value,
                latitude: parseFloat(document.getElementById('location-lat').value),
                longitude: parseFloat(document.getElementById('location-lng').value),
                planned_arrival: document.getElementById('location-arrival').value || null,
                is_accommodation: document.getElementById('location-accommodation').checked
            };

            await api.addPlannedLocation(this.currentTrip.id, locationData);
            notifications.success('Location added successfully!');
            this.closeModals();

            // Refresh trip details
            this.viewTripDetails(this.currentTrip.id);

        } catch (error) {
            console.error('Failed to add location:', error);
            notifications.error(`Failed to add location: ${error.message}`);
        }
    }

    // Location Tracking Methods
    async toggleLocationTracking() {
        if (this.locationTracking) {
            this.stopLocationTracking();
        } else {
            await this.startLocationTracking();
        }
    }

    async startLocationTracking() {
        if (!this.currentTrip) {
            notifications.warning('Please create a trip first to enable location tracking');
            return;
        }

        try {
            await locationService.getCurrentPosition();
            notifications.success('Location tracking enabled');

            this.locationTracking = true;
            this.updateLocationStatus();

            // Start periodic location updates
            this.trackingInterval = setInterval(async () => {
                await this.submitLocationUpdate();
            }, 5 * 60 * 1000); // Every 5 minutes

            // Submit initial location
            await this.submitLocationUpdate();

        } catch (error) {
            console.error('Failed to start location tracking:', error);
            notifications.error(`Location tracking failed: ${error.message}`);
        }
    }

    stopLocationTracking() {
        this.locationTracking = false;
        this.updateLocationStatus();

        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }

        locationService.stopTracking();
        notifications.success('Location tracking disabled');
    }

    async submitLocationUpdate() {
        if (!this.currentTrip || !this.locationTracking) return;

        try {
            const position = await locationService.getCurrentPosition();

            const locationData = {
                trip_id: this.currentTrip.id,
                latitude: position.latitude,
                longitude: position.longitude,
                accuracy_meters: position.accuracy,
                timestamp: position.timestamp,
                battery_level: await this.getBatteryLevel(),
                is_manual: false
            };

            const response = await api.submitLocationUpdate(locationData);

            // Check for alerts
            if (response.alerts_triggered && response.alerts_triggered.length > 0) {
                notifications.warning(`Safety alert triggered! ${response.message}`);
                this.loadAlerts(); // Refresh alerts
            }

        } catch (error) {
            console.error('Failed to submit location update:', error);
        }
    }

    async manualCheckin() {
        if (!this.currentTrip) {
            notifications.warning('Please create a trip first');
            return;
        }

        try {
            const position = await locationService.getCurrentPosition();

            const locationData = {
                trip_id: this.currentTrip.id,
                latitude: position.latitude,
                longitude: position.longitude,
                accuracy_meters: position.accuracy,
                timestamp: position.timestamp,
                battery_level: await this.getBatteryLevel(),
                is_manual: true
            };

            const response = await api.submitLocationUpdate(locationData);
            notifications.success('Manual check-in successful!');

            // Check for alerts
            if (response.alerts_triggered && response.alerts_triggered.length > 0) {
                notifications.warning(`Safety alert triggered! ${response.message}`);
            }

        } catch (error) {
            console.error('Manual check-in failed:', error);
            notifications.error(`Manual check-in failed: ${error.message}`);
        }
    }

    async getBatteryLevel() {
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                return Math.round(battery.level * 100);
            }
        } catch (error) {
            console.log('Battery API not available');
        }
        return null;
    }

    // Alert Methods
    async loadAlerts() {
        try {
            const alerts = await api.getAlerts();
            this.displayAlerts(alerts);
        } catch (error) {
            console.error('Failed to load alerts:', error);
            notifications.error('Failed to load alerts');
        }
    }

    displayAlerts(alerts) {
        const container = document.getElementById('alerts-list');

        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <p>No alerts yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = alerts.map(alert => `
            <div class="alert-card ${alert.status}" onclick="app.showAlertDetails(${alert.id})">
                <div class="alert-header">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-time">${new Date(alert.triggered_at).toLocaleString()}</div>
                </div>
                <div class="alert-message">${alert.message}</div>
                <div class="alert-status ${alert.status}">${alert.status.replace('_', ' ')}</div>
                ${alert.distance_from_planned_km ? `<div class="alert-distance">Distance: ${alert.distance_from_planned_km.toFixed(1)}km from planned route</div>` : ''}
            </div>
        `).join('');
    }

    showAlertDetails(alertId) {
        // Find alert and show response modal
        api.getAlerts().then(alerts => {
            const alert = alerts.find(a => a.id === alertId);
            if (alert && alert.status === 'active') {
                this.showAlertResponseModal(alert);
            }
        });
    }

    showAlertResponseModal(alert) {
        document.getElementById('alert-details').innerHTML = `
            <div class="alert-info">
                <h3>${alert.title}</h3>
                <p>${alert.message}</p>
                <p><strong>Time:</strong> ${new Date(alert.triggered_at).toLocaleString()}</p>
                <p><strong>Location:</strong> ${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}</p>
                ${alert.distance_from_planned_km ? `<p><strong>Distance from route:</strong> ${alert.distance_from_planned_km.toFixed(1)}km</p>` : ''}
            </div>
        `;

        document.getElementById('alert-response-form').dataset.alertId = alert.id;
        document.getElementById('alert-modal').classList.remove('hidden');
    }

    async handleAlertResponse(e) {
        e.preventDefault();

        const alertId = e.target.dataset.alertId;
        const response = e.target.dataset.response;
        const message = document.getElementById('response-message').value;

        if (!response) {
            notifications.error('Please select a response (Safe or Help)');
            return;
        }

        try {
            await api.respondToAlert(alertId, {
                response: response,
                message: message || null
            });

            notifications.success('Response sent successfully!');
            this.closeModals();
            this.loadAlerts();

        } catch (error) {
            console.error('Failed to respond to alert:', error);
            notifications.error(`Failed to send response: ${error.message}`);
        }
    }

    filterAlerts(filter) {
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Filter alerts
        const alertCards = document.querySelectorAll('.alert-card');
        alertCards.forEach(card => {
            if (filter === 'all') {
                card.style.display = 'block';
            } else if (filter === 'active') {
                card.style.display = card.classList.contains('active') ? 'block' : 'none';
            } else if (filter === 'responded') {
                card.style.display = card.classList.contains('responded_safe') || card.classList.contains('responded_help') ? 'block' : 'none';
            }
        });
    }

    // Emergency Methods
    showEmergencyModal() {
        document.getElementById('emergency-modal').classList.remove('hidden');
    }

    async handleEmergencyAlert(e) {
        e.preventDefault();

        if (!this.currentTrip) {
            notifications.error('Please create a trip first');
            return;
        }

        const message = document.getElementById('emergency-message').value;

        try {
            await api.createManualAlert(this.currentTrip.id, message);
            notifications.success('Emergency alert sent! Emergency contacts will be notified.');
            this.closeModals();
            this.loadAlerts();

        } catch (error) {
            console.error('Failed to send emergency alert:', error);
            notifications.error(`Failed to send emergency alert: ${error.message}`);
        }
    }

    // Profile Methods
    async loadProfile() {
        try {
            const user = await api.getCurrentUser();
            this.displayUserInfo(user);
        } catch (error) {
            console.error('Failed to load profile:', error);
            notifications.error('Failed to load profile');
        }
    }

    displayUserInfo(user) {
        document.getElementById('user-info').innerHTML = `
            <div class="user-details">
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
                <p><strong>Member since:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
            </div>
        `;
    }

    // Modal Methods
    showTripModal() {
        document.getElementById('trip-modal').classList.remove('hidden');

        // Set default dates
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        document.getElementById('trip-start').value = tomorrow.toISOString().slice(0, 16);
        document.getElementById('trip-end').value = nextWeek.toISOString().slice(0, 16);
    }

    showLocationModal() {
        if (!this.currentTrip) {
            notifications.error('No trip selected');
            return;
        }
        document.getElementById('location-modal').classList.remove('hidden');
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });

        // Reset forms
        document.querySelectorAll('form').forEach(form => {
            if (form.id !== 'login-form' && form.id !== 'register-form') {
                form.reset();
            }
        });

        // Reset response selection
        document.querySelectorAll('[data-response]').forEach(btn => {
            btn.classList.remove('selected');
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TourismSafetyApp();
});

// Service Worker Registration (for PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}