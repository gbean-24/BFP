// Location Search Component with Geocoding
// Provides search functionality for adding locations to trips

import mapUtils from '../utils/mapUtils.js';

class LocationSearchComponent {
    constructor() {
        this.searchResults = [];
        this.selectedLocation = null;
        this.onLocationSelected = null;
        this.searchTimeout = null;
    }

    // Render the location search modal
    renderSearchModal(tripId, onLocationSelected) {
        this.onLocationSelected = onLocationSelected;
        
        const modalHTML = `
            <div id="location-search-modal" class="modal">
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h3>Add Location to Trip</h3>
                        <button id="close-location-search" class="btn btn-secondary">×</button>
                    </div>
                    
                    <div class="location-search-container">
                        <!-- Search Section -->
                        <div class="search-section">
                            <div class="form-group">
                                <label for="location-search-input">Search for a location</label>
                                <div class="search-input-container">
                                    <input 
                                        type="text" 
                                        id="location-search-input" 
                                        placeholder="Enter address, landmark, or coordinates..."
                                        class="search-input"
                                        autocomplete="off"
                                    >
                                    <button id="search-current-location" class="btn btn-secondary btn-small" title="Use current location">
                                        📍
                                    </button>
                                </div>
                                <div class="search-help">
                                    Try: "Tokyo Station", "35.6812, 139.7671", or "Times Square New York"
                                </div>
                            </div>
                            
                            <!-- Search Results -->
                            <div id="search-results" class="search-results" style="display: none;">
                                <!-- Results will be populated here -->
                            </div>
                        </div>
                        
                        <!-- Map Section -->
                        <div class="map-section">
                            <div id="location-search-map" class="location-search-map"></div>
                            <div class="map-instructions">
                                Click on the map to select a location or search above
                            </div>
                        </div>
                    </div>
                    
                    <!-- Location Details Form -->
                    <div id="location-details-form" class="location-details" style="display: none;">
                        <h4>Location Details</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="location-name">Location Name *</label>
                                <input type="text" id="location-name" required placeholder="e.g., Tokyo Station">
                            </div>
                            <div class="form-group">
                                <label for="location-type">Type</label>
                                <select id="location-type">
                                    <option value="attraction">Attraction</option>
                                    <option value="accommodation">Accommodation</option>
                                    <option value="transport">Transport</option>
                                    <option value="food">Food & Dining</option>
                                    <option value="emergency">Emergency</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="planned-datetime">Planned Visit Time</label>
                                <input type="datetime-local" id="planned-datetime">
                            </div>
                            <div class="form-group">
                                <label for="location-coordinates">Coordinates</label>
                                <input type="text" id="location-coordinates" readonly class="coordinates-display">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="location-notes">Notes</label>
                            <textarea id="location-notes" rows="3" placeholder="Any special notes or instructions..."></textarea>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button id="cancel-location-search" class="btn btn-secondary">Cancel</button>
                        <button id="add-location-btn" class="btn btn-primary" disabled>Add Location</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Initialize map and bind events
        this.initializeSearchMap();
        this.bindSearchEvents(tripId);
        
        // Show modal
        document.getElementById('location-search-modal').style.display = 'flex';
    }

    // Initialize the search map
    initializeSearchMap() {
        setTimeout(() => {
            const mapContainer = document.getElementById('location-search-map');
            if (mapContainer && window.L) {
                this.searchMap = L.map('location-search-map').setView([35.6762, 139.6503], 10);
                
                // Add tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(this.searchMap);
                
                // Add map controls
                mapUtils.addMapControls(this.searchMap, {
                    showScale: true,
                    showLocation: true,
                    showLayers: true
                });
                
                // Add click handler for map selection
                this.searchMap.on('click', (e) => {
                    this.selectLocationFromMap(e.latlng.lat, e.latlng.lng);
                });
                
                // Add marker for selected location
                this.selectedMarker = null;
            }
        }, 100);
    }

    // Bind search events
    bindSearchEvents(tripId) {
        const searchInput = document.getElementById('location-search-input');
        const currentLocationBtn = document.getElementById('search-current-location');
        const closeBtn = document.getElementById('close-location-search');
        const cancelBtn = document.getElementById('cancel-location-search');
        const addBtn = document.getElementById('add-location-btn');

        // Search input with debouncing
        searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 3) {
                this.hideSearchResults();
                return;
            }
            
            this.searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 500);
        });

        // Current location button
        currentLocationBtn.addEventListener('click', () => {
            this.useCurrentLocation();
        });

        // Modal close buttons
        closeBtn.addEventListener('click', () => {
            this.closeSearchModal();
        });
        
        cancelBtn.addEventListener('click', () => {
            this.closeSearchModal();
        });

        // Add location button
        addBtn.addEventListener('click', () => {
            this.addSelectedLocation(tripId);
        });

        // Form validation
        document.getElementById('location-name').addEventListener('input', () => {
            this.validateLocationForm();
        });
    }

    // Perform location search
    async performSearch(query) {
        try {
            this.showSearchLoading();
            
            // Check if query looks like coordinates
            const coordMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
            if (coordMatch) {
                const lat = parseFloat(coordMatch[1]);
                const lng = parseFloat(coordMatch[2]);
                if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    this.selectLocationFromMap(lat, lng);
                    this.hideSearchResults();
                    return;
                }
            }
            
            // Perform geocoding search
            const results = await mapUtils.geocodeAddress(query);
            this.displaySearchResults(results);
            
        } catch (error) {
            this.showSearchError(error.message);
        }
    }

    // Display search results
    displaySearchResults(results) {
        const resultsContainer = document.getElementById('search-results');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-no-results">
                    <p>No locations found. Try a different search term.</p>
                </div>
            `;
        } else {
            resultsContainer.innerHTML = results.map((result, index) => `
                <div class="search-result-item" data-index="${index}">
                    <div class="result-info">
                        <h5>${this.truncateText(result.name, 60)}</h5>
                        <p class="result-coordinates">${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}</p>
                        <p class="result-type">${result.type || 'Location'}</p>
                    </div>
                    <button class="btn btn-small btn-primary select-result" data-index="${index}">
                        Select
                    </button>
                </div>
            `).join('');
            
            // Bind result selection
            resultsContainer.querySelectorAll('.select-result').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.dataset.index);
                    this.selectSearchResult(results[index]);
                });
            });
        }
        
        resultsContainer.style.display = 'block';
    }

    // Select a search result
    selectSearchResult(result) {
        this.selectLocationFromMap(result.lat, result.lng, result.name);
        this.hideSearchResults();
        
        // Clear search input
        document.getElementById('location-search-input').value = '';
    }

    // Select location from map click or search
    async selectLocationFromMap(lat, lng, name = null) {
        // Remove existing marker
        if (this.selectedMarker) {
            this.searchMap.removeLayer(this.selectedMarker);
        }
        
        // Add new marker
        this.selectedMarker = mapUtils.createEnhancedMarker(
            { lat, lng, name: name || 'Selected Location' },
            { type: 'default', isActive: true, showPopup: false }
        );
        this.selectedMarker.addTo(this.searchMap);
        
        // Center map on location
        this.searchMap.setView([lat, lng], 15);
        
        // Store selected location
        this.selectedLocation = { lat, lng, name };
        
        // Try to get address if name not provided
        if (!name) {
            try {
                const address = await mapUtils.reverseGeocode(lat, lng);
                if (address) {
                    this.selectedLocation.name = address.display_name;
                }
            } catch (error) {
                console.warn('Reverse geocoding failed:', error);
            }
        }
        
        // Show location details form
        this.showLocationDetailsForm();
    }

    // Show location details form
    showLocationDetailsForm() {
        const form = document.getElementById('location-details-form');
        const nameInput = document.getElementById('location-name');
        const coordinatesInput = document.getElementById('location-coordinates');
        
        // Populate form
        nameInput.value = this.selectedLocation.name || '';
        coordinatesInput.value = `${this.selectedLocation.lat.toFixed(6)}, ${this.selectedLocation.lng.toFixed(6)}`;
        
        // Set default planned time to current time + 1 hour
        const defaultTime = new Date();
        defaultTime.setHours(defaultTime.getHours() + 1);
        document.getElementById('planned-datetime').value = defaultTime.toISOString().slice(0, 16);
        
        form.style.display = 'block';
        this.validateLocationForm();
    }

    // Use current location
    async useCurrentLocation() {
        try {
            const location = await mapUtils.getCurrentLocation(this.searchMap);
            this.selectLocationFromMap(location.lat, location.lng, 'Current Location');
        } catch (error) {
            this.showAlert(error.message, 'warning');
        }
    }

    // Validate location form
    validateLocationForm() {
        const nameInput = document.getElementById('location-name');
        const addBtn = document.getElementById('add-location-btn');
        
        const isValid = nameInput.value.trim().length >= 2 && this.selectedLocation;
        addBtn.disabled = !isValid;
    }

    // Add selected location
    async addSelectedLocation(tripId) {
        const locationData = {
            name: document.getElementById('location-name').value.trim(),
            lat: this.selectedLocation.lat,
            lng: this.selectedLocation.lng,
            type: document.getElementById('location-type').value,
            planned_time: document.getElementById('planned-datetime').value || null,
            notes: document.getElementById('location-notes').value.trim()
        };
        
        try {
            if (this.onLocationSelected) {
                await this.onLocationSelected(tripId, locationData);
            }
            this.closeSearchModal();
        } catch (error) {
            this.showAlert('Failed to add location: ' + error.message, 'danger');
        }
    }

    // Utility functions
    showSearchLoading() {
        document.getElementById('search-results').innerHTML = `
            <div class="search-loading">
                <div class="spinner-small"></div>
                <p>Searching...</p>
            </div>
        `;
        document.getElementById('search-results').style.display = 'block';
    }

    showSearchError(message) {
        document.getElementById('search-results').innerHTML = `
            <div class="search-error">
                <p>❌ ${message}</p>
            </div>
        `;
        document.getElementById('search-results').style.display = 'block';
    }

    hideSearchResults() {
        document.getElementById('search-results').style.display = 'none';
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    closeSearchModal() {
        const modal = document.getElementById('location-search-modal');
        if (modal) {
            modal.remove();
        }
        
        // Clean up map
        if (this.searchMap) {
            this.searchMap.remove();
            this.searchMap = null;
        }
        
        this.selectedLocation = null;
        this.selectedMarker = null;
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        // Add to modal
        const modal = document.querySelector('.modal-content');
        if (modal) {
            modal.insertBefore(alert, modal.firstChild);
            
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 5000);
        }
    }
}

// Export singleton instance
const locationSearchComponent = new LocationSearchComponent();
export default locationSearchComponent;