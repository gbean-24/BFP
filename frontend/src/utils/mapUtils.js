// Map utilities for enhanced Leaflet.js integration
// Provides geocoding, routing, and advanced map controls

class MapUtils {
    constructor() {
        this.geocodingCache = new Map();
        this.routingCache = new Map();
    }

    // Enhanced marker creation with custom icons and popups
    createEnhancedMarker(location, options = {}) {
        const { type = 'default', isActive = false, showPopup = true } = options;
        
        // Custom marker icons based on location type
        const iconConfig = this.getMarkerIcon(type, isActive);
        const marker = L.marker([location.lat, location.lng], { icon: iconConfig });
        
        if (showPopup) {
            const popupContent = this.createPopupContent(location, options);
            marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: `custom-popup ${type}-popup`
            });
        }
        
        return marker;
    }

    // Get custom marker icons based on type
    getMarkerIcon(type, isActive = false) {
        const iconSize = [32, 32];
        const iconAnchor = [16, 32];
        const popupAnchor = [0, -32];
        
        const icons = {
            default: '📍',
            accommodation: '🏨',
            transport: '🚉',
            attraction: '🎯',
            food: '🍽️',
            emergency: '🚨',
            current: '📍'
        };
        
        const emoji = icons[type] || icons.default;
        const color = isActive ? '#ef4444' : '#2563eb';
        
        return L.divIcon({
            html: `<div class="custom-marker ${type}-marker ${isActive ? 'active' : ''}" style="background-color: ${color};">
                     <span class="marker-emoji">${emoji}</span>
                   </div>`,
            className: 'custom-marker-container',
            iconSize: iconSize,
            iconAnchor: iconAnchor,
            popupAnchor: popupAnchor
        });
    }

    // Create enhanced popup content
    createPopupContent(location, options = {}) {
        const { showActions = true, tripId = null } = options;
        
        return `
            <div class="location-popup">
                <div class="popup-header">
                    <h4>${location.name}</h4>
                    <span class="location-type">${location.type || 'Location'}</span>
                </div>
                <div class="popup-details">
                    <p class="coordinates">📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</p>
                    ${location.planned_time ? `<p class="planned-time">🕒 ${this.formatDateTime(location.planned_time)}</p>` : ''}
                    ${location.notes ? `<p class="notes">${location.notes}</p>` : ''}
                </div>
                ${showActions ? `
                    <div class="popup-actions">
                        <button class="btn btn-small btn-primary" onclick="mapUtils.getDirections(${location.lat}, ${location.lng})">
                            🧭 Directions
                        </button>
                        <button class="btn btn-small btn-secondary" onclick="mapUtils.shareLocation(${location.lat}, ${location.lng})">
                            📤 Share
                        </button>
                        ${tripId ? `<button class="btn btn-small btn-secondary" onclick="mapUtils.editLocation(${tripId}, ${location.id})">✏️ Edit</button>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Geocoding functionality with caching
    async geocodeAddress(address) {
        if (this.geocodingCache.has(address)) {
            return this.geocodingCache.get(address);
        }

        try {
            // Using Nominatim (OpenStreetMap) geocoding service
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5`
            );
            
            if (!response.ok) {
                throw new Error('Geocoding service unavailable');
            }
            
            const results = await response.json();
            const locations = results.map(result => ({
                name: result.display_name,
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                type: result.type,
                importance: result.importance
            }));
            
            this.geocodingCache.set(address, locations);
            return locations;
            
        } catch (error) {
            console.error('Geocoding failed:', error);
            throw new Error('Unable to find location. Please try a different search term.');
        }
    }

    // Reverse geocoding to get address from coordinates
    async reverseGeocode(lat, lng) {
        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        if (this.geocodingCache.has(key)) {
            return this.geocodingCache.get(key);
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            
            if (!response.ok) {
                throw new Error('Reverse geocoding failed');
            }
            
            const result = await response.json();
            const address = {
                display_name: result.display_name,
                address: result.address,
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon)
            };
            
            this.geocodingCache.set(key, address);
            return address;
            
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            return null;
        }
    }

    // Route visualization between locations
    async createRoute(locations, options = {}) {
        if (locations.length < 2) {
            throw new Error('At least 2 locations required for routing');
        }

        const { color = '#2563eb', weight = 4, opacity = 0.7 } = options;
        const routeKey = locations.map(l => `${l.lat},${l.lng}`).join('|');
        
        if (this.routingCache.has(routeKey)) {
            return this.routingCache.get(routeKey);
        }

        try {
            // Create simple polyline for basic routing
            const coordinates = locations.map(loc => [loc.lat, loc.lng]);
            const polyline = L.polyline(coordinates, {
                color: color,
                weight: weight,
                opacity: opacity,
                dashArray: '10, 5'
            });

            // Add route markers
            const routeMarkers = [];
            locations.forEach((location, index) => {
                const isStart = index === 0;
                const isEnd = index === locations.length - 1;
                const markerType = isStart ? 'start' : isEnd ? 'end' : 'waypoint';
                
                const marker = this.createRouteMarker(location, markerType, index + 1);
                routeMarkers.push(marker);
            });

            const route = {
                polyline: polyline,
                markers: routeMarkers,
                distance: this.calculateTotalDistance(locations),
                duration: this.estimateTravelTime(locations)
            };

            this.routingCache.set(routeKey, route);
            return route;
            
        } catch (error) {
            console.error('Route creation failed:', error);
            throw new Error('Unable to create route between locations');
        }
    }

    // Create route markers with numbering
    createRouteMarker(location, type, number) {
        const icons = {
            start: '🚀',
            end: '🏁',
            waypoint: number.toString()
        };
        
        const colors = {
            start: '#10b981',
            end: '#ef4444',
            waypoint: '#f59e0b'
        };

        const icon = L.divIcon({
            html: `<div class="route-marker ${type}-marker" style="background-color: ${colors[type]};">
                     <span class="route-number">${icons[type]}</span>
                   </div>`,
            className: 'route-marker-container',
            iconSize: [28, 28],
            iconAnchor: [14, 28],
            popupAnchor: [0, -28]
        });

        const marker = L.marker([location.lat, location.lng], { icon });
        marker.bindPopup(`
            <div class="route-popup">
                <h5>${type === 'start' ? 'Start' : type === 'end' ? 'End' : `Stop ${number}`}</h5>
                <p><strong>${location.name}</strong></p>
                <p class="coordinates">📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</p>
            </div>
        `);

        return marker;
    }

    // Calculate distance between locations
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Calculate total distance for route
    calculateTotalDistance(locations) {
        let totalDistance = 0;
        for (let i = 0; i < locations.length - 1; i++) {
            const current = locations[i];
            const next = locations[i + 1];
            totalDistance += this.calculateDistance(current.lat, current.lng, next.lat, next.lng);
        }
        return totalDistance;
    }

    // Estimate travel time (basic calculation)
    estimateTravelTime(locations) {
        const distance = this.calculateTotalDistance(locations);
        const averageSpeed = 50; // km/h average speed
        return distance / averageSpeed; // hours
    }

    // Enhanced map controls
    addMapControls(map, options = {}) {
        const { showScale = true, showFullscreen = true, showLocation = true, showLayers = true } = options;

        // Scale control
        if (showScale) {
            L.control.scale({
                position: 'bottomleft',
                metric: true,
                imperial: false
            }).addTo(map);
        }

        // Custom location control
        if (showLocation) {
            const locationControl = L.control({ position: 'topright' });
            locationControl.onAdd = function() {
                const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
                div.innerHTML = `
                    <a href="#" class="location-control" title="Find my location">
                        <span class="location-icon">📍</span>
                    </a>
                `;
                
                L.DomEvent.on(div, 'click', function(e) {
                    L.DomEvent.preventDefault(e);
                    mapUtils.getCurrentLocation(map);
                });
                
                return div;
            };
            locationControl.addTo(map);
        }

        // Layer control for different map types
        if (showLayers) {
            const baseLayers = {
                'Street Map': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }),
                'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: '© Esri'
                }),
                'Terrain': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenTopoMap contributors'
                })
            };

            L.control.layers(baseLayers, null, { position: 'topleft' }).addTo(map);
        }

        // Custom zoom control with better styling
        map.removeControl(map.zoomControl);
        L.control.zoom({ position: 'topright' }).addTo(map);
    }

    // Get user's current location
    async getCurrentLocation(map) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const accuracy = position.coords.accuracy;

                    // Add current location marker
                    const currentLocationMarker = L.marker([lat, lng], {
                        icon: this.getMarkerIcon('current', true)
                    }).addTo(map);

                    currentLocationMarker.bindPopup(`
                        <div class="current-location-popup">
                            <h5>📍 Your Current Location</h5>
                            <p>Accuracy: ±${Math.round(accuracy)}m</p>
                            <p class="coordinates">${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                            <button class="btn btn-small btn-primary" onclick="mapUtils.addCurrentLocationToTrip()">
                                Add to Trip
                            </button>
                        </div>
                    `).openPopup();

                    // Add accuracy circle
                    L.circle([lat, lng], {
                        radius: accuracy,
                        color: '#2563eb',
                        fillColor: '#2563eb',
                        fillOpacity: 0.1,
                        weight: 2
                    }).addTo(map);

                    map.setView([lat, lng], 16);
                    resolve({ lat, lng, accuracy });
                },
                (error) => {
                    let message = 'Unable to get your location';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Location access denied by user';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Location information unavailable';
                            break;
                        case error.TIMEOUT:
                            message = 'Location request timed out';
                            break;
                    }
                    reject(new Error(message));
                },
                options
            );
        });
    }

    // Utility functions
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDistance(km) {
        if (km < 1) {
            return `${Math.round(km * 1000)}m`;
        }
        return `${km.toFixed(1)}km`;
    }

    formatDuration(hours) {
        if (hours < 1) {
            return `${Math.round(hours * 60)}min`;
        }
        return `${hours.toFixed(1)}h`;
    }

    // Action handlers for popup buttons
    getDirections(lat, lng) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    }

    shareLocation(lat, lng) {
        const url = `https://www.google.com/maps?q=${lat},${lng}`;
        if (navigator.share) {
            navigator.share({
                title: 'Location',
                text: 'Check out this location',
                url: url
            });
        } else {
            navigator.clipboard.writeText(url).then(() => {
                alert('Location link copied to clipboard!');
            });
        }
    }

    editLocation(tripId, locationId) {
        // This would trigger the edit location modal
        console.log(`Edit location ${locationId} for trip ${tripId}`);
    }

    addCurrentLocationToTrip() {
        // This would trigger adding current location to active trip
        console.log('Add current location to trip');
    }
}

// Create and export singleton instance
const mapUtils = new MapUtils();
export default mapUtils;

// Make available globally for popup actions
window.mapUtils = mapUtils;