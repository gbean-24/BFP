// Trip Management Component
import apiClient from '../api/client.js';
import mapUtils from '../utils/mapUtils.js';
import locationSearchComponent from './locationSearch.js';
import realTimeService from '../services/realtime.js';

class TripsComponent {
    constructor() {
        this.trips = [];
        this.currentTrip = null;
        this.map = null;
        this.filteredTrips = [];
        this.currentFilter = 'all';
        this.currentSort = 'date_desc';
        this.liveLocations = new Map(); // Store live location updates
        this.locationMarkers = new Map(); // Store location markers on map
    }

    async init() {
        await this.loadTrips();
        this.render();
        this.bindEvents();
        this.setupRealTimeLocation();
    }

    async loadTrips() {
        try {
            this.trips = await apiClient.getTrips();
            this.applyFiltersAndSort();
        } catch (error) {
            console.error('Failed to load trips:', error);
            this.showAlert('Failed to load trips', 'danger');
        }
    }

    applyFiltersAndSort() {
        // Apply filters
        let filtered = [...this.trips];
        
        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(trip => trip.status === 'active');
                break;
            case 'planned':
                filtered = filtered.filter(trip => trip.status === 'planned');
                break;
            case 'completed':
                filtered = filtered.filter(trip => trip.status === 'completed');
                break;
            case 'cancelled':
                filtered = filtered.filter(trip => trip.status === 'cancelled');
                break;
            default:
                // 'all' - no filtering
                break;
        }

        // Apply sorting
        switch (this.currentSort) {
            case 'date_asc':
                filtered.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
                break;
            case 'date_desc':
                filtered.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
                break;
            case 'name_asc':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name_desc':
                filtered.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }

        this.filteredTrips = filtered;
    }

    render() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="trips-container">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">My Trips (${this.filteredTrips.length})</h2>
                        <button id="create-trip-btn" class="btn btn-primary">Create New Trip</button>
                    </div>
                    
                    <!-- Filters and Search -->
                    <div class="trips-controls">
                        <div class="search-container">
                            <input type="text" id="trip-search" placeholder="Search trips..." class="search-input">
                        </div>
                        <div class="filter-container">
                            <select id="trip-filter" class="filter-select">
                                <option value="all">All Trips</option>
                                <option value="active">Active</option>
                                <option value="planned">Planned</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <select id="trip-sort" class="filter-select">
                                <option value="date_desc">Newest First</option>
                                <option value="date_asc">Oldest First</option>
                                <option value="name_asc">Name A-Z</option>
                                <option value="name_desc">Name Z-A</option>
                            </select>
                        </div>
                    </div>
                    
                    <div id="trips-list" class="trip-list">
                        ${this.renderTripsList()}
                    </div>
                </div>

                <!-- Create/Edit Trip Modal -->
                <div id="trip-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="trip-modal-title">Create New Trip</h3>
                            <button id="close-trip-modal" class="btn btn-secondary">×</button>
                        </div>
                        <form id="trip-form">
                            <div class="form-group">
                                <label for="trip-name">Trip Name *</label>
                                <input type="text" id="trip-name" required placeholder="e.g., Tokyo Adventure" minlength="2" maxlength="100">
                                <div class="form-error" id="trip-name-error"></div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="start-date">Start Date *</label>
                                    <input type="date" id="start-date" required>
                                    <div class="form-error" id="start-date-error"></div>
                                </div>
                                <div class="form-group">
                                    <label for="end-date">End Date *</label>
                                    <input type="date" id="end-date" required>
                                    <div class="form-error" id="end-date-error"></div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="trip-description">Description</label>
                                <textarea id="trip-description" rows="3" placeholder="Brief description of your trip" maxlength="500"></textarea>
                                <div class="character-count">
                                    <span id="description-count">0</span>/500 characters
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="emergency-contacts">Emergency Contacts</label>
                                <textarea id="emergency-contacts" rows="2" placeholder="Enter email addresses separated by commas"></textarea>
                                <div class="form-help">Separate multiple email addresses with commas</div>
                            </div>
                            <div class="form-actions">
                                <button type="button" id="cancel-trip" class="btn btn-secondary">Cancel</button>
                                <button type="submit" class="btn btn-primary" id="submit-trip">Create Trip</button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Trip Details Modal -->
                <div id="trip-details-modal" class="modal" style="display: none;">
                    <div class="modal-content modal-large">
                        <div class="modal-header">
                            <h3 id="trip-details-title">Trip Details</h3>
                            <div class="modal-actions">
                                <button id="edit-trip-from-details" class="btn btn-secondary btn-small">Edit</button>
                                <button id="share-trip-from-details" class="btn btn-primary btn-small">Share</button>
                                <button id="close-details-modal" class="btn btn-secondary">×</button>
                            </div>
                        </div>
                        <div id="trip-details-content">
                            <!-- Trip details will be loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Share Trip Modal -->
                <div id="share-trip-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Share Trip</h3>
                            <button id="close-share-modal" class="btn btn-secondary">×</button>
                        </div>
                        <div id="share-trip-content">
                            <div class="share-section">
                                <h4>Share with People</h4>
                                <div class="form-group">
                                    <label for="share-emails">Email Addresses</label>
                                    <textarea id="share-emails" rows="3" placeholder="Enter email addresses separated by commas"></textarea>
                                    <div class="form-help">People you share with can view your trip details and receive safety alerts</div>
                                </div>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="share-location" checked>
                                        Share real-time location during trip
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="share-alerts">
                                        Send safety alerts to shared contacts
                                    </label>
                                </div>
                            </div>
                            
                            <div class="share-section">
                                <h4>Share Link</h4>
                                <div class="share-link-container">
                                    <input type="text" id="share-link" readonly placeholder="Generating share link...">
                                    <button id="copy-share-link" class="btn btn-secondary btn-small">Copy</button>
                                </div>
                                <div class="form-help">Anyone with this link can view your trip itinerary</div>
                            </div>

                            <div class="share-section">
                                <h4>Current Shares</h4>
                                <div id="current-shares">
                                    <!-- Current shares will be loaded here -->
                                </div>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button id="cancel-share" class="btn btn-secondary">Cancel</button>
                            <button id="save-share" class="btn btn-primary">Save Sharing Settings</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        this.addModalStyles();
    }

    renderTripsList() {
        if (this.filteredTrips.length === 0) {
            if (this.trips.length === 0) {
                return `
                    <div class="empty-state">
                        <div class="empty-icon">✈️</div>
                        <h3>No trips yet</h3>
                        <p>Create your first trip to get started on your adventure!</p>
                        <button class="btn btn-primary" onclick="document.getElementById('create-trip-btn').click()">
                            Create Your First Trip
                        </button>
                    </div>
                `;
            } else {
                return `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No trips match your filters</h3>
                        <p>Try adjusting your search or filter criteria.</p>
                        <button class="btn btn-secondary" onclick="this.clearFilters()">Clear Filters</button>
                    </div>
                `;
            }
        }

        return this.filteredTrips.map(trip => `
            <div class="trip-card" data-trip-id="${trip.id}">
                <div class="trip-card-header">
                    <h3>${trip.name}</h3>
                    <div class="trip-card-menu">
                        <button class="btn-menu" data-trip-id="${trip.id}" aria-label="Trip options">⋮</button>
                        <div class="trip-menu" id="menu-${trip.id}" style="display: none;">
                            <button class="menu-item edit-trip" data-trip-id="${trip.id}">✏️ Edit</button>
                            <button class="menu-item share-trip" data-trip-id="${trip.id}">📤 Share</button>
                            <button class="menu-item duplicate-trip" data-trip-id="${trip.id}">📋 Duplicate</button>
                            <button class="menu-item delete-trip" data-trip-id="${trip.id}">🗑️ Delete</button>
                        </div>
                    </div>
                </div>
                <div class="trip-meta">
                    <div class="trip-dates">
                        <span>📅 ${this.formatDate(trip.start_date)} - ${this.formatDate(trip.end_date)}</span>
                        <span class="trip-duration">(${this.calculateDuration(trip.start_date, trip.end_date)} days)</span>
                    </div>
                    <span class="status-badge status-${trip.status}">${this.formatStatus(trip.status)}</span>
                </div>
                <div class="trip-stats">
                    <div class="stat-item">
                        <span class="stat-icon">📍</span>
                        <span>${trip.locations_count || 0} locations</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">👥</span>
                        <span>${trip.shared_with?.length || 0} shared</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-icon">🕒</span>
                        <span>Updated ${this.formatRelativeTime(trip.updated_at || trip.created_at)}</span>
                    </div>
                </div>
                ${trip.description ? `<div class="trip-description">${trip.description}</div>` : ''}
                <div class="trip-actions">
                    <button class="btn btn-secondary btn-small view-trip" data-trip-id="${trip.id}">
                        View Details
                    </button>
                    <button class="btn btn-primary btn-small add-location" data-trip-id="${trip.id}">
                        Add Location
                    </button>
                    ${trip.status === 'planned' || trip.status === 'active' ? 
                        `<button class="btn btn-success btn-small start-tracking" data-trip-id="${trip.id}">
                            ${trip.status === 'active' ? 'Continue Tracking' : 'Start Tracking'}
                        </button>` : ''
                    }
                </div>
            </div>
        `).join('');
    }

    calculateDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    formatStatus(status) {
        const statusMap = {
            'active': 'Active',
            'planned': 'Planned',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }

    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }

    bindEvents() {
        // Create trip button
        document.getElementById('create-trip-btn')?.addEventListener('click', () => {
            this.showTripModal();
        });

        // Trip form
        document.getElementById('trip-form')?.addEventListener('submit', (e) => {
            this.handleTripSubmit(e);
        });

        // Modal close buttons
        document.getElementById('close-trip-modal')?.addEventListener('click', () => {
            this.hideTripModal();
        });

        document.getElementById('cancel-trip')?.addEventListener('click', () => {
            this.hideTripModal();
        });

        document.getElementById('close-details-modal')?.addEventListener('click', () => {
            this.hideTripDetailsModal();
        });

        // Share modal events
        document.getElementById('close-share-modal')?.addEventListener('click', () => {
            this.hideShareModal();
        });

        document.getElementById('cancel-share')?.addEventListener('click', () => {
            this.hideShareModal();
        });

        document.getElementById('save-share')?.addEventListener('click', (e) => {
            this.handleSaveShare(e);
        });

        document.getElementById('copy-share-link')?.addEventListener('click', () => {
            this.copyShareLink();
        });

        // Trip details modal actions
        document.getElementById('edit-trip-from-details')?.addEventListener('click', (e) => {
            const tripId = e.target.dataset.tripId;
            this.hideTripDetailsModal();
            this.showEditTripModal(tripId);
        });

        document.getElementById('share-trip-from-details')?.addEventListener('click', (e) => {
            const tripId = e.target.dataset.tripId;
            this.showShareTripModal(tripId);
        });

        // Search and filters
        document.getElementById('trip-search')?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        document.getElementById('trip-filter')?.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.applyFiltersAndSort();
            this.refreshTripsList();
        });

        document.getElementById('trip-sort')?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.applyFiltersAndSort();
            this.refreshTripsList();
        });

        // Form validation
        document.getElementById('trip-name')?.addEventListener('input', (e) => {
            this.validateTripName(e.target.value);
        });

        document.getElementById('start-date')?.addEventListener('change', (e) => {
            this.validateDates();
        });

        document.getElementById('end-date')?.addEventListener('change', (e) => {
            this.validateDates();
        });

        document.getElementById('trip-description')?.addEventListener('input', (e) => {
            this.updateCharacterCount(e.target.value);
        });

        // Trip action buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-trip')) {
                const tripId = e.target.dataset.tripId;
                this.showTripDetails(tripId);
            }
            
            if (e.target.classList.contains('add-location')) {
                const tripId = e.target.dataset.tripId;
                this.showAddLocationForm(tripId);
            }
            
            if (e.target.classList.contains('start-tracking')) {
                const tripId = e.target.dataset.tripId;
                this.startLocationTracking(tripId);
            }

            if (e.target.classList.contains('edit-trip')) {
                const tripId = e.target.dataset.tripId;
                this.showEditTripModal(tripId);
            }

            if (e.target.classList.contains('delete-trip')) {
                const tripId = e.target.dataset.tripId;
                this.confirmDeleteTrip(tripId);
            }

            if (e.target.classList.contains('share-trip')) {
                const tripId = e.target.dataset.tripId;
                this.showShareTripModal(tripId);
            }

            if (e.target.classList.contains('duplicate-trip')) {
                const tripId = e.target.dataset.tripId;
                this.duplicateTrip(tripId);
            }

            if (e.target.classList.contains('btn-menu')) {
                const tripId = e.target.dataset.tripId;
                this.toggleTripMenu(tripId);
            }
        });

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-menu')) {
                document.querySelectorAll('.trip-menu').forEach(menu => {
                    menu.style.display = 'none';
                });
            }
        });
    }

    setupRealTimeLocation() {
        console.log('🔄 Setting up real-time location sharing');
        
        // Subscribe to real-time location updates
        realTimeService.onLocationUpdate((locationData) => {
            this.handleRealTimeLocationUpdate(locationData);
        });
    }

    handleRealTimeLocationUpdate(locationData) {
        console.log('📍 Real-time location update received:', locationData);
        
        // Store the location update
        this.liveLocations.set(locationData.user_id, {
            ...locationData,
            received_at: new Date()
        });
        
        // Update map if currently showing trip details
        if (this.map && this.currentTrip) {
            this.updateLocationMarkerOnMap(locationData);
        }
        
        // Update UI indicators
        this.updateLocationIndicators(locationData);
    }

    updateLocationMarkerOnMap(locationData) {
        const { user_id, lat, lng, accuracy, timestamp } = locationData;
        
        // Create or update marker for this user
        let marker = this.locationMarkers.get(user_id);
        
        if (!marker) {
            // Create new marker
            marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'live-location-marker',
                    html: `
                        <div class="live-marker-content">
                            <div class="live-marker-dot"></div>
                            <div class="live-marker-pulse"></div>
                        </div>
                    `,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(this.map);
            
            // Add popup with user info
            marker.bindPopup(`
                <div class="live-location-popup">
                    <h4>📍 Live Location</h4>
                    <p><strong>User:</strong> ${user_id}</p>
                    <p><strong>Accuracy:</strong> ±${accuracy}m</p>
                    <p><strong>Updated:</strong> ${new Date(timestamp).toLocaleTimeString()}</p>
                </div>
            `);
            
            this.locationMarkers.set(user_id, marker);
        } else {
            // Update existing marker position
            marker.setLatLng([lat, lng]);
            
            // Update popup content
            marker.setPopupContent(`
                <div class="live-location-popup">
                    <h4>📍 Live Location</h4>
                    <p><strong>User:</strong> ${user_id}</p>
                    <p><strong>Accuracy:</strong> ±${accuracy}m</p>
                    <p><strong>Updated:</strong> ${new Date(timestamp).toLocaleTimeString()}</p>
                </div>
            `);
        }
        
        // Add accuracy circle
        if (accuracy && accuracy > 0) {
            const accuracyCircle = L.circle([lat, lng], {
                radius: accuracy,
                fillColor: '#3b82f6',
                fillOpacity: 0.1,
                color: '#3b82f6',
                weight: 1,
                opacity: 0.3
            }).addTo(this.map);
            
            // Remove old accuracy circle
            const oldCircle = this.locationMarkers.get(`${user_id}_accuracy`);
            if (oldCircle) {
                this.map.removeLayer(oldCircle);
            }
            this.locationMarkers.set(`${user_id}_accuracy`, accuracyCircle);
        }
    }

    updateLocationIndicators(locationData) {
        // Update any UI indicators showing live location status
        const locationIndicators = document.querySelectorAll('.live-location-indicator');
        locationIndicators.forEach(indicator => {
            const userId = indicator.dataset.userId;
            if (userId === locationData.user_id) {
                indicator.classList.add('active');
                indicator.title = `Last seen: ${new Date(locationData.timestamp).toLocaleTimeString()}`;
                
                // Add pulsing animation
                indicator.classList.add('pulse');
                setTimeout(() => indicator.classList.remove('pulse'), 2000);
            }
        });
    }

    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        if (searchTerm === '') {
            this.filteredTrips = [...this.trips];
        } else {
            this.filteredTrips = this.trips.filter(trip => 
                trip.name.toLowerCase().includes(searchTerm) ||
                (trip.description && trip.description.toLowerCase().includes(searchTerm))
            );
        }
        this.applyFiltersAndSort();
        this.refreshTripsList();
    }

    validateTripName(name) {
        const errorElement = document.getElementById('trip-name-error');
        if (name.length < 2) {
            errorElement.textContent = 'Trip name must be at least 2 characters long';
            return false;
        } else if (name.length > 100) {
            errorElement.textContent = 'Trip name must be less than 100 characters';
            return false;
        } else {
            errorElement.textContent = '';
            return true;
        }
    }

    validateDates() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const startError = document.getElementById('start-date-error');
        const endError = document.getElementById('end-date-error');
        
        let isValid = true;

        if (startDate && new Date(startDate) < new Date().setHours(0, 0, 0, 0)) {
            startError.textContent = 'Start date cannot be in the past';
            isValid = false;
        } else {
            startError.textContent = '';
        }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            endError.textContent = 'End date must be after start date';
            isValid = false;
        } else {
            endError.textContent = '';
        }

        return isValid;
    }

    updateCharacterCount(text) {
        const count = text.length;
        document.getElementById('description-count').textContent = count;
        
        const countElement = document.getElementById('description-count');
        if (count > 450) {
            countElement.style.color = 'var(--danger-600)';
        } else if (count > 400) {
            countElement.style.color = 'var(--warning-600)';
        } else {
            countElement.style.color = 'var(--gray-600)';
        }
    }

    toggleTripMenu(tripId) {
        const menu = document.getElementById(`menu-${tripId}`);
        const isVisible = menu.style.display !== 'none';
        
        // Close all menus first
        document.querySelectorAll('.trip-menu').forEach(m => {
            m.style.display = 'none';
        });
        
        // Toggle current menu
        menu.style.display = isVisible ? 'none' : 'block';
    }

    async handleTripSubmit(event) {
        event.preventDefault();
        
        // Validate form
        const name = document.getElementById('trip-name').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        
        if (!this.validateTripName(name) || !this.validateDates()) {
            this.showAlert('Please fix the validation errors before submitting', 'danger');
            return;
        }

        const formData = {
            name: name.trim(),
            start_date: startDate,
            end_date: endDate,
            description: document.getElementById('trip-description').value.trim(),
            emergency_contacts: this.parseEmergencyContacts(document.getElementById('emergency-contacts').value)
        };

        const submitBtn = document.getElementById('submit-trip');
        const isEditing = submitBtn.dataset.tripId;

        try {
            this.setLoading(submitBtn, true);
            
            let result;
            if (isEditing) {
                result = await apiClient.updateTrip(isEditing, formData);
                // Update trip in local array
                const index = this.trips.findIndex(t => t.id == isEditing);
                if (index !== -1) {
                    this.trips[index] = { ...this.trips[index], ...result };
                }
                this.showAlert('Trip updated successfully!', 'success');
            } else {
                result = await apiClient.createTrip(formData);
                this.trips.unshift(result);
                this.showAlert('Trip created successfully!', 'success');
            }
            
            this.hideTripModal();
            this.applyFiltersAndSort();
            this.refreshTripsList();
            
        } catch (error) {
            this.showAlert(error.message || `Failed to ${isEditing ? 'update' : 'create'} trip`, 'danger');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    parseEmergencyContacts(contactsString) {
        if (!contactsString.trim()) return [];
        
        return contactsString
            .split(',')
            .map(email => email.trim())
            .filter(email => email && this.isValidEmail(email));
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async showEditTripModal(tripId) {
        try {
            const trip = await apiClient.getTrip(tripId);
            
            document.getElementById('trip-modal-title').textContent = 'Edit Trip';
            document.getElementById('submit-trip').textContent = 'Update Trip';
            document.getElementById('submit-trip').dataset.tripId = tripId;
            
            // Populate form with existing data
            document.getElementById('trip-name').value = trip.name;
            document.getElementById('start-date').value = trip.start_date;
            document.getElementById('end-date').value = trip.end_date;
            document.getElementById('trip-description').value = trip.description || '';
            document.getElementById('emergency-contacts').value = trip.emergency_contacts?.join(', ') || '';
            
            this.updateCharacterCount(trip.description || '');
            this.showTripModal();
            
        } catch (error) {
            this.showAlert('Failed to load trip details', 'danger');
        }
    }

    async confirmDeleteTrip(tripId) {
        const trip = this.trips.find(t => t.id == tripId);
        if (!trip) return;

        const confirmed = confirm(`Are you sure you want to delete "${trip.name}"? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            await apiClient.deleteTrip(tripId);
            this.trips = this.trips.filter(t => t.id != tripId);
            this.applyFiltersAndSort();
            this.refreshTripsList();
            this.showAlert('Trip deleted successfully', 'success');
        } catch (error) {
            this.showAlert('Failed to delete trip', 'danger');
        }
    }

    async duplicateTrip(tripId) {
        try {
            const trip = await apiClient.getTrip(tripId);
            
            // Create a copy with modified name and future dates
            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(today.getDate() + 1);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + this.calculateDuration(trip.start_date, trip.end_date));

            const duplicateData = {
                name: `${trip.name} (Copy)`,
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                description: trip.description,
                emergency_contacts: trip.emergency_contacts || []
            };

            const newTrip = await apiClient.createTrip(duplicateData);
            this.trips.unshift(newTrip);
            this.applyFiltersAndSort();
            this.refreshTripsList();
            this.showAlert('Trip duplicated successfully!', 'success');
            
        } catch (error) {
            this.showAlert('Failed to duplicate trip', 'danger');
        }
    }

    async showTripDetails(tripId) {
        try {
            const trip = await apiClient.getTrip(tripId);
            const locations = await apiClient.getTripLocations(tripId);
            
            document.getElementById('trip-details-title').textContent = trip.name;
            document.getElementById('edit-trip-from-details').dataset.tripId = tripId;
            document.getElementById('share-trip-from-details').dataset.tripId = tripId;
            
            document.getElementById('trip-details-content').innerHTML = `
                <div class="trip-details">
                    <div class="trip-overview">
                        <div class="trip-info-grid">
                            <div class="info-card">
                                <h4>📅 Duration</h4>
                                <p>${this.formatDate(trip.start_date)} - ${this.formatDate(trip.end_date)}</p>
                                <small>${this.calculateDuration(trip.start_date, trip.end_date)} days</small>
                            </div>
                            <div class="info-card">
                                <h4>📊 Status</h4>
                                <span class="status-badge status-${trip.status}">${this.formatStatus(trip.status)}</span>
                            </div>
                            <div class="info-card">
                                <h4>📍 Locations</h4>
                                <p>${locations.length} planned</p>
                            </div>
                            <div class="info-card">
                                <h4>👥 Shared</h4>
                                <p>${trip.shared_with?.length || 0} people</p>
                            </div>
                        </div>
                        
                        ${trip.description ? `
                            <div class="trip-description-full">
                                <h4>Description</h4>
                                <p>${trip.description}</p>
                            </div>
                        ` : ''}

                        ${trip.emergency_contacts?.length ? `
                            <div class="emergency-contacts">
                                <h4>🚨 Emergency Contacts</h4>
                                <div class="contacts-list">
                                    ${trip.emergency_contacts.map(contact => `
                                        <span class="contact-badge">${contact}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="trip-locations">
                        <div class="locations-header">
                            <h4>Planned Locations (${locations.length})</h4>
                            <button id="add-location-btn" class="btn btn-primary btn-small" data-trip-id="${tripId}">
                                Add Location
                            </button>
                        </div>
                        
                        ${locations.length > 0 ? `
                            <div id="trip-map" class="map-container"></div>
                            <div class="locations-list">
                                ${this.renderLocationsList(locations)}
                            </div>
                        ` : `
                            <div class="empty-locations">
                                <p>No locations added yet. Start planning your itinerary!</p>
                            </div>
                        `}
                    </div>

                    <div class="trip-timeline">
                        <h4>📈 Trip Timeline</h4>
                        <div class="timeline">
                            <div class="timeline-item">
                                <div class="timeline-marker created"></div>
                                <div class="timeline-content">
                                    <strong>Trip Created</strong>
                                    <small>${this.formatDateTime(trip.created_at)}</small>
                                </div>
                            </div>
                            ${trip.updated_at !== trip.created_at ? `
                                <div class="timeline-item">
                                    <div class="timeline-marker updated"></div>
                                    <div class="timeline-content">
                                        <strong>Last Updated</strong>
                                        <small>${this.formatDateTime(trip.updated_at)}</small>
                                    </div>
                                </div>
                            ` : ''}
                            ${trip.status === 'active' ? `
                                <div class="timeline-item">
                                    <div class="timeline-marker active"></div>
                                    <div class="timeline-content">
                                        <strong>Trip Started</strong>
                                        <small>Currently active</small>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
            
            this.showTripDetailsModal();
            if (locations.length > 0) {
                this.initTripMap(locations);
            }
            
        } catch (error) {
            this.showAlert('Failed to load trip details', 'danger');
        }
    }

    renderLocationsList(locations) {
        if (locations.length === 0) {
            return '<p class="text-center">No locations added yet.</p>';
        }

        return locations.map(location => `
            <div class="location-item">
                <div class="location-info">
                    <h5>${location.name}</h5>
                    <p>📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</p>
                    <p>🕒 ${this.formatDateTime(location.planned_time)}</p>
                </div>
                <div class="location-actions">
                    <button class="btn btn-small btn-secondary">Edit</button>
                    <button class="btn btn-small btn-danger">Remove</button>
                </div>
            </div>
        `).join('');
    }

    async initTripMap(locations) {
        // Initialize enhanced Leaflet map
        setTimeout(async () => {
            const mapContainer = document.getElementById('trip-map');
            if (mapContainer && window.L) {
                this.map = L.map('trip-map').setView([35.6762, 139.6503], 10);
                
                // Add base tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(this.map);

                // Add enhanced map controls
                mapUtils.addMapControls(this.map, {
                    showScale: true,
                    showLocation: true,
                    showLayers: true,
                    showFullscreen: false
                });

                // Add enhanced markers for each location
                const markers = [];
                locations.forEach((location, index) => {
                    const marker = mapUtils.createEnhancedMarker(location, {
                        type: location.type || 'default',
                        isActive: false,
                        showPopup: true,
                        tripId: this.currentTrip?.id
                    });
                    marker.addTo(this.map);
                    markers.push(marker);
                });

                // Create route visualization if multiple locations
                if (locations.length > 1) {
                    try {
                        const route = await mapUtils.createRoute(locations, {
                            color: '#2563eb',
                            weight: 3,
                            opacity: 0.7
                        });
                        
                        // Add route polyline
                        route.polyline.addTo(this.map);
                        
                        // Add route info
                        this.addRouteInfo(route);
                        
                    } catch (error) {
                        console.warn('Route creation failed:', error);
                    }
                }

                // Fit map to show all locations
                if (locations.length > 0) {
                    const group = new L.featureGroup(markers);
                    this.map.fitBounds(group.getBounds().pad(0.1));
                } else {
                    // Try to get user's location for empty trips
                    try {
                        await mapUtils.getCurrentLocation(this.map);
                    } catch (error) {
                        console.log('Could not get user location:', error);
                    }
                }
            }
        }, 100);
    }

    showAddLocationForm(tripId) {
        // Show enhanced location search modal
        locationSearchComponent.renderSearchModal(tripId, async (tripId, locationData) => {
            await this.addLocationToTrip(tripId, locationData);
        });
    }

    async addLocationToTrip(tripId, locationData) {
        try {
            await apiClient.addTripLocation(tripId, locationData);
            this.showAlert('Location added successfully!', 'success');
            
            // Refresh the trip details if modal is open
            if (document.getElementById('trip-details-modal').style.display !== 'none') {
                this.showTripDetails(tripId);
            }
        } catch (error) {
            this.showAlert('Failed to add location', 'danger');
        }
    }

    async startLocationTracking(tripId) {
        if ('geolocation' in navigator) {
            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            };

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const locationData = {
                        trip_id: parseInt(tripId),
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                    
                    try {
                        await apiClient.submitLocationUpdate(locationData);
                        
                        // Show accuracy information
                        const accuracyMsg = position.coords.accuracy < 10 ? 
                            'High accuracy GPS signal' : 
                            position.coords.accuracy < 50 ? 
                            'Good GPS signal' : 
                            'GPS signal may be inaccurate';
                            
                        this.showAlert(`Location tracking started! ${accuracyMsg} (±${Math.round(position.coords.accuracy)}m)`, 'success');
                        
                        // Start continuous tracking
                        this.startContinuousTracking(tripId, options);
                        
                    } catch (error) {
                        this.showAlert('Failed to start tracking', 'danger');
                    }
                },
                (error) => {
                    let message = 'Location access failed';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Location access denied. Please enable location services.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Location unavailable. Please check your GPS settings.';
                            break;
                        case error.TIMEOUT:
                            message = 'Location request timed out. Please try again.';
                            break;
                    }
                    this.showAlert(message, 'warning');
                },
                options
            );
        } else {
            this.showAlert('Geolocation not supported by this browser', 'warning');
        }
    }

    startContinuousTracking(tripId, options) {
        console.log(`📍 Starting continuous tracking for trip ${tripId}`);
        
        // Use the real-time service for location sharing
        realTimeService.startLocationSharing(tripId);
        
        // Also keep the interval-based tracking as backup
        this.trackingInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const locationData = {
                        trip_id: parseInt(tripId),
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString(),
                        speed: position.coords.speed,
                        heading: position.coords.heading
                    };
                    
                    try {
                        await apiClient.submitLocationUpdate(locationData);
                        console.log('Location updated via polling:', locationData);
                    } catch (error) {
                        console.error('Failed to update location:', error);
                    }
                },
                (error) => {
                    console.warn('Continuous tracking error:', error);
                },
                options
            );
        }, 60000); // Update every minute as backup
    }

    stopLocationTracking() {
        console.log('📍 Stopping location tracking');
        
        // Stop real-time location sharing
        realTimeService.stopLocationSharing();
        
        // Stop interval-based tracking
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
        
        this.showAlert('Location tracking stopped', 'info');
    }

    addRouteInfo(route) {
        // Add route information to the map
        const routeInfoControl = L.control({ position: 'bottomright' });
        routeInfoControl.onAdd = function() {
            const div = L.DomUtil.create('div', 'route-info-control');
            div.innerHTML = `
                <div class="route-info">
                    <h5>📍 Route Information</h5>
                    <p><strong>Distance:</strong> ${mapUtils.formatDistance(route.distance)}</p>
                    <p><strong>Est. Time:</strong> ${mapUtils.formatDuration(route.duration)}</p>
                    <p><strong>Stops:</strong> ${route.markers.length}</p>
                </div>
            `;
            return div;
        };
        routeInfoControl.addTo(this.map);
    }

    showTripModal(tripId = null) {
        const modal = document.getElementById('trip-modal');
        const title = document.getElementById('trip-modal-title');
        const submitBtn = document.getElementById('submit-trip');
        
        if (tripId) {
            title.textContent = 'Edit Trip';
            submitBtn.textContent = 'Update Trip';
            submitBtn.dataset.tripId = tripId;
        } else {
            title.textContent = 'Create New Trip';
            submitBtn.textContent = 'Create Trip';
            delete submitBtn.dataset.tripId;
            
            // Set default dates
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('start-date').value = today;
            
            // Clear form
            document.getElementById('trip-form').reset();
            this.clearFormErrors();
        }
        
        modal.style.display = 'flex';
    }

    hideTripModal() {
        document.getElementById('trip-modal').style.display = 'none';
        document.getElementById('trip-form').reset();
        this.clearFormErrors();
        delete document.getElementById('submit-trip').dataset.tripId;
    }

    clearFormErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.textContent = '';
        });
        document.getElementById('description-count').textContent = '0';
        document.getElementById('description-count').style.color = 'var(--gray-600)';
    }

    async showShareTripModal(tripId) {
        try {
            const trip = await apiClient.getTrip(tripId);
            
            document.getElementById('share-trip-modal').style.display = 'flex';
            document.getElementById('save-share').dataset.tripId = tripId;
            
            // Generate share link
            const shareLink = `${window.location.origin}/shared-trip/${tripId}`;
            document.getElementById('share-link').value = shareLink;
            
            // Load current shares
            this.loadCurrentShares(trip);
            
        } catch (error) {
            this.showAlert('Failed to load sharing options', 'danger');
        }
    }

    loadCurrentShares(trip) {
        const container = document.getElementById('current-shares');
        
        if (!trip.shared_with || trip.shared_with.length === 0) {
            container.innerHTML = '<p class="text-center">No one has access to this trip yet.</p>';
            return;
        }

        container.innerHTML = trip.shared_with.map(share => `
            <div class="share-item">
                <div class="share-info">
                    <strong>${share.email}</strong>
                    <div class="share-permissions">
                        ${share.can_view_location ? '📍 Location' : ''} 
                        ${share.receives_alerts ? '🚨 Alerts' : ''}
                    </div>
                </div>
                <button class="btn btn-danger btn-small remove-share" data-email="${share.email}">
                    Remove
                </button>
            </div>
        `).join('');
    }

    showTripDetailsModal() {
        document.getElementById('trip-details-modal').style.display = 'flex';
    }

    hideTripDetailsModal() {
        document.getElementById('trip-details-modal').style.display = 'none';
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    refreshTripsList() {
        document.getElementById('trips-list').innerHTML = this.renderTripsList();
    }

    addModalStyles() {
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    padding: 2rem;
                    width: 90%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .modal-large {
                    max-width: 900px;
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #e5e7eb;
                }

                .modal-actions {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }
                
                .form-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    margin-top: 1.5rem;
                }

                .form-error {
                    color: var(--danger-600);
                    font-size: var(--font-size-sm);
                    margin-top: 0.25rem;
                }

                .form-help {
                    color: var(--gray-500);
                    font-size: var(--font-size-sm);
                    margin-top: 0.25rem;
                }

                .character-count {
                    text-align: right;
                    font-size: var(--font-size-sm);
                    color: var(--gray-500);
                    margin-top: 0.25rem;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    margin-bottom: 0.5rem;
                }

                .trips-controls {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .search-container {
                    flex: 1;
                    min-width: 200px;
                }

                .search-input {
                    width: 100%;
                    padding: 0.5rem 1rem;
                    border: 1px solid var(--gray-300);
                    border-radius: var(--radius-md);
                    font-size: var(--font-size-sm);
                }

                .filter-container {
                    display: flex;
                    gap: 0.5rem;
                }

                .filter-select {
                    padding: 0.5rem;
                    border: 1px solid var(--gray-300);
                    border-radius: var(--radius-md);
                    font-size: var(--font-size-sm);
                    background: white;
                }

                .trip-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }

                .trip-card-menu {
                    position: relative;
                }

                .btn-menu {
                    background: none;
                    border: none;
                    padding: 0.25rem 0.5rem;
                    cursor: pointer;
                    border-radius: var(--radius-sm);
                    color: var(--gray-500);
                    font-size: 1.2rem;
                    line-height: 1;
                }

                .btn-menu:hover {
                    background: var(--gray-100);
                    color: var(--gray-700);
                }

                .trip-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border: 1px solid var(--gray-200);
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-lg);
                    z-index: 10;
                    min-width: 150px;
                }

                .menu-item {
                    display: block;
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: none;
                    background: none;
                    text-align: left;
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                    color: var(--gray-700);
                    transition: background-color var(--transition-fast);
                }

                .menu-item:hover {
                    background: var(--gray-50);
                }

                .menu-item:last-child {
                    color: var(--danger-600);
                }

                .menu-item:last-child:hover {
                    background: var(--danger-50);
                }

                .trip-dates {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .trip-duration {
                    color: var(--gray-500);
                    font-size: var(--font-size-sm);
                }

                .trip-stats {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                }

                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: var(--font-size-sm);
                    color: var(--gray-600);
                }

                .stat-icon {
                    font-size: 1rem;
                }

                .trip-description {
                    color: var(--gray-600);
                    font-size: var(--font-size-sm);
                    margin-bottom: 1rem;
                    line-height: 1.4;
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: var(--gray-500);
                }

                .empty-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .empty-state h3 {
                    margin-bottom: 0.5rem;
                    color: var(--gray-700);
                }

                .trip-info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .info-card {
                    background: var(--gray-50);
                    padding: 1rem;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--gray-200);
                }

                .info-card h4 {
                    margin-bottom: 0.5rem;
                    font-size: var(--font-size-sm);
                    color: var(--gray-600);
                    font-weight: 500;
                }

                .info-card p {
                    margin-bottom: 0.25rem;
                    font-weight: 600;
                    color: var(--gray-900);
                }

                .info-card small {
                    color: var(--gray-500);
                    font-size: var(--font-size-xs);
                }

                .trip-description-full {
                    margin-bottom: 2rem;
                }

                .trip-description-full h4 {
                    margin-bottom: 0.5rem;
                    color: var(--gray-700);
                }

                .emergency-contacts {
                    margin-bottom: 2rem;
                }

                .emergency-contacts h4 {
                    margin-bottom: 0.5rem;
                    color: var(--gray-700);
                }

                .contacts-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .contact-badge {
                    background: var(--primary-50);
                    color: var(--primary-700);
                    padding: 0.25rem 0.75rem;
                    border-radius: var(--radius-full);
                    font-size: var(--font-size-sm);
                    border: 1px solid var(--primary-200);
                }

                .locations-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .locations-header h4 {
                    color: var(--gray-700);
                }

                .empty-locations {
                    text-align: center;
                    padding: 2rem;
                    color: var(--gray-500);
                    background: var(--gray-50);
                    border-radius: var(--radius-lg);
                    border: 2px dashed var(--gray-300);
                }

                .timeline {
                    border-left: 2px solid var(--gray-200);
                    padding-left: 1rem;
                }

                .timeline-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1rem;
                    position: relative;
                }

                .timeline-marker {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 1rem;
                    margin-left: -1.5rem;
                    border: 2px solid white;
                }

                .timeline-marker.created {
                    background: var(--primary-500);
                }

                .timeline-marker.updated {
                    background: var(--warning-500);
                }

                .timeline-marker.active {
                    background: var(--success-500);
                }

                .timeline-content strong {
                    display: block;
                    color: var(--gray-900);
                    font-size: var(--font-size-sm);
                }

                .timeline-content small {
                    color: var(--gray-500);
                    font-size: var(--font-size-xs);
                }

                .share-section {
                    margin-bottom: 2rem;
                    padding-bottom: 1.5rem;
                    border-bottom: 1px solid var(--gray-200);
                }

                .share-section:last-child {
                    border-bottom: none;
                }

                .share-section h4 {
                    margin-bottom: 1rem;
                    color: var(--gray-700);
                }

                .share-link-container {
                    display: flex;
                    gap: 0.5rem;
                }

                .share-link-container input {
                    flex: 1;
                    padding: 0.5rem;
                    border: 1px solid var(--gray-300);
                    border-radius: var(--radius-md);
                    background: var(--gray-50);
                }

                .share-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: var(--gray-50);
                    border-radius: var(--radius-md);
                    margin-bottom: 0.5rem;
                }

                .share-permissions {
                    font-size: var(--font-size-sm);
                    color: var(--gray-500);
                    margin-top: 0.25rem;
                }

                .location-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    border: 1px solid var(--gray-200);
                    border-radius: var(--radius-md);
                    margin-bottom: 0.5rem;
                    background: white;
                }

                .location-info h5 {
                    margin-bottom: 0.25rem;
                    color: var(--gray-900);
                }

                .location-info p {
                    margin-bottom: 0.25rem;
                    font-size: var(--font-size-sm);
                    color: var(--gray-600);
                }

                .location-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                @media (max-width: 768px) {
                    .trips-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .filter-container {
                        justify-content: space-between;
                    }

                    .filter-select {
                        flex: 1;
                    }

                    .trip-info-grid {
                        grid-template-columns: 1fr;
                    }

                    .modal-content {
                        padding: 1.5rem;
                        margin: 1rem;
                    }

                    .modal-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }

                    .modal-actions {
                        align-self: flex-end;
                    }

                    .share-link-container {
                        flex-direction: column;
                    }
                }

                /* Live Location Markers */
                .live-location-marker {
                    background: transparent !important;
                    border: none !important;
                }

                .live-marker-content {
                    position: relative;
                    width: 20px;
                    height: 20px;
                }

                .live-marker-dot {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 8px;
                    height: 8px;
                    background: #3b82f6;
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    z-index: 2;
                }

                .live-marker-pulse {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 20px;
                    height: 20px;
                    background: #3b82f6;
                    border-radius: 50%;
                    opacity: 0.3;
                    animation: pulse-location 2s infinite;
                    z-index: 1;
                }

                @keyframes pulse-location {
                    0% {
                        transform: translate(-50%, -50%) scale(0.5);
                        opacity: 0.7;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(2);
                        opacity: 0;
                    }
                }

                .live-location-popup {
                    min-width: 200px;
                }

                .live-location-popup h4 {
                    margin: 0 0 8px 0;
                    color: #1f2937;
                    font-size: 14px;
                }

                .live-location-popup p {
                    margin: 4px 0;
                    font-size: 12px;
                    color: #6b7280;
                }

                .live-location-indicator {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    background: #6b7280;
                    border-radius: 50%;
                    margin-right: 4px;
                    transition: all 0.3s ease;
                }

                .live-location-indicator.active {
                    background: #10b981;
                    animation: pulse-green 2s infinite;
                }

                .live-location-indicator.pulse {
                    animation: pulse-notification 0.5s ease-in-out;
                }

                @keyframes pulse-notification {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.5); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    }

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString();
    }

    setLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            const originalText = button.textContent;
            button.dataset.originalText = originalText;
            button.textContent = originalText.includes('Update') ? 'Updating...' : 
                               originalText.includes('Create') ? 'Creating...' : 'Loading...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Submit';
        }
    }

    clearFilters() {
        document.getElementById('trip-search').value = '';
        document.getElementById('trip-filter').value = 'all';
        document.getElementById('trip-sort').value = 'date_desc';
        this.currentFilter = 'all';
        this.currentSort = 'date_desc';
        this.applyFiltersAndSort();
        this.refreshTripsList();
    }

    hideShareModal() {
        document.getElementById('share-trip-modal').style.display = 'none';
    }

    async handleSaveShare(event) {
        const tripId = event.target.dataset.tripId;
        const emails = document.getElementById('share-emails').value;
        const shareLocation = document.getElementById('share-location').checked;
        const shareAlerts = document.getElementById('share-alerts').checked;

        const emailList = this.parseEmergencyContacts(emails);
        
        if (emailList.length === 0 && emails.trim()) {
            this.showAlert('Please enter valid email addresses', 'danger');
            return;
        }

        try {
            const shareData = {
                emails: emailList,
                permissions: {
                    can_view_location: shareLocation,
                    receives_alerts: shareAlerts
                }
            };

            // Mock API call for sharing
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.hideShareModal();
            this.showAlert('Sharing settings saved successfully!', 'success');
            
        } catch (error) {
            this.showAlert('Failed to save sharing settings', 'danger');
        }
    }

    copyShareLink() {
        const shareLink = document.getElementById('share-link');
        shareLink.select();
        shareLink.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            this.showAlert('Share link copied to clipboard!', 'success');
        } catch (error) {
            this.showAlert('Failed to copy link', 'danger');
        }
    }

    showAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        const content = document.getElementById('content');
        content.insertBefore(alert, content.firstChild);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    hideTripDetailsModal() {
        document.getElementById('trip-details-modal').style.display = 'none';
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }

    async showShareTripModal(tripId) {
        try {
            const trip = await apiClient.getTrip(tripId);
            
            // Set trip ID for save handler
            document.getElementById('save-share').dataset.tripId = tripId;
            
            // Generate share link
            const shareLink = `${window.location.origin}/shared-trip/${tripId}`;
            document.getElementById('share-link').value = shareLink;
            
            // Load current shares
            this.loadCurrentShares(tripId);
            
            // Show modal
            document.getElementById('share-trip-modal').style.display = 'flex';
            
        } catch (error) {
            this.showAlert('Failed to load trip sharing options', 'danger');
        }
    }

    async loadCurrentShares(tripId) {
        try {
            // Mock current shares - in real app this would come from API
            const currentShares = [
                { email: 'john@example.com', permissions: { can_view_location: true, receives_alerts: true } },
                { email: 'jane@example.com', permissions: { can_view_location: true, receives_alerts: false } }
            ];
            
            const sharesContainer = document.getElementById('current-shares');
            if (currentShares.length === 0) {
                sharesContainer.innerHTML = '<p class="text-muted">No one has access to this trip yet.</p>';
            } else {
                sharesContainer.innerHTML = currentShares.map(share => `
                    <div class="share-item">
                        <div class="share-email">${share.email}</div>
                        <div class="share-permissions">
                            ${share.permissions.can_view_location ? '📍 Location' : ''}
                            ${share.permissions.receives_alerts ? '🚨 Alerts' : ''}
                        </div>
                        <button class="btn btn-danger btn-small remove-share" data-email="${share.email}">Remove</button>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to load current shares:', error);
        }
    }

    async showAddLocationForm(tripId) {
        // For now, show a simple prompt - this would be enhanced with a proper modal
        const locationName = prompt('Enter location name:');
        if (!locationName) return;
        
        const address = prompt('Enter address or coordinates:');
        if (!address) return;
        
        try {
            // Mock geocoding - in real app this would use a geocoding service
            const mockLocation = {
                name: locationName,
                address: address,
                lat: 40.7128 + (Math.random() - 0.5) * 0.1, // Mock NYC area
                lng: -74.0060 + (Math.random() - 0.5) * 0.1,
                planned_time: new Date().toISOString()
            };
            
            await apiClient.addLocationToTrip(tripId, mockLocation);
            this.showAlert('Location added successfully!', 'success');
            
            // Refresh trip details if modal is open
            if (document.getElementById('trip-details-modal').style.display !== 'none') {
                this.showTripDetails(tripId);
            }
        } catch (error) {
            this.showAlert('Failed to add location', 'danger');
        }
    }

    async startLocationTracking(tripId) {
        if (!navigator.geolocation) {
            this.showAlert('Geolocation is not supported by this browser', 'danger');
            return;
        }

        try {
            // Update trip status to active
            await apiClient.updateTrip(tripId, { status: 'active' });
            
            // Start location tracking
            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: new Date().toISOString(),
                        accuracy: position.coords.accuracy
                    };
                    
                    // Send location update to API
                    apiClient.updateTripLocation(tripId, location).catch(console.error);
                },
                (error) => {
                    console.error('Location tracking error:', error);
                    this.showAlert('Location tracking failed', 'danger');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
            
            // Store watch ID for later cleanup
            this.locationWatchId = watchId;
            
            // Update trip in local array
            const tripIndex = this.trips.findIndex(t => t.id == tripId);
            if (tripIndex !== -1) {
                this.trips[tripIndex].status = 'active';
                this.applyFiltersAndSort();
                this.refreshTripsList();
            }
            
            this.showAlert('Location tracking started!', 'success');
            
        } catch (error) {
            this.showAlert('Failed to start location tracking', 'danger');
        }
    }

    initTripMap(locations) {
        // Remove existing map if any
        if (this.map) {
            this.map.remove();
        }
        
        // Create map centered on first location or default
        const center = locations.length > 0 ? [locations[0].lat, locations[0].lng] : [40.7128, -74.0060];
        this.map = L.map('trip-map').setView(center, 10);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Add markers for each location
        locations.forEach((location, index) => {
            const marker = L.marker([location.lat, location.lng]).addTo(this.map);
            marker.bindPopup(`
                <strong>${location.name}</strong><br>
                ${this.formatDateTime(location.planned_time)}
            `);
        });
        
        // Fit map to show all locations
        if (locations.length > 1) {
            const group = new L.featureGroup(locations.map(loc => L.marker([loc.lat, loc.lng])));
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    addModalStyles() {
        // Add CSS styles for modals if not already added
        if (document.getElementById('trip-modal-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'trip-modal-styles';
        styles.textContent = `
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                align-items: center;
                justify-content: center;
            }
            
            .modal-content {
                background-color: white;
                padding: 0;
                border-radius: 8px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            
            .modal-large {
                max-width: 800px;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 1.5rem;
                border-bottom: 1px solid #e5e7eb;
                background-color: #f9fafb;
                border-radius: 8px 8px 0 0;
            }
            
            .modal-actions {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }
            
            .trip-menu {
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 100;
                min-width: 150px;
            }
            
            .menu-item {
                display: block;
                width: 100%;
                padding: 0.5rem 1rem;
                border: none;
                background: none;
                text-align: left;
                cursor: pointer;
                font-size: 0.875rem;
            }
            
            .menu-item:hover {
                background-color: #f3f4f6;
            }
            
            .share-section {
                margin-bottom: 1.5rem;
                padding-bottom: 1.5rem;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .share-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }
            
            .share-link-container {
                display: flex;
                gap: 0.5rem;
            }
            
            .share-link-container input {
                flex: 1;
            }
            
            .share-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                margin-bottom: 0.5rem;
            }
            
            .share-email {
                font-weight: 500;
            }
            
            .share-permissions {
                font-size: 0.875rem;
                color: #6b7280;
            }
            
            #trip-map {
                height: 300px;
                width: 100%;
                border-radius: 6px;
                margin-top: 1rem;
            }
        `;
        
        document.head.appendChild(styles);
    }
}

export default TripsComponent;