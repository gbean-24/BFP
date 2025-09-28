// Real-time Service for Tourism Safety Tracker
// Handles WebSocket connections, polling, and live updates

class RealTimeService {
    constructor() {
        this.websocket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.heartbeatInterval = null;
        this.pollingInterval = null;
        this.connectionStatusCallbacks = [];
        this.alertCallbacks = [];
        this.locationCallbacks = [];
        
        // Configuration
        this.config = {
            websocketUrl: 'ws://localhost:8000/ws',
            pollingInterval: 15000, // 15 seconds
            heartbeatInterval: 30000, // 30 seconds
            useWebSocket: true, // Try WebSocket first, fallback to polling
            maxPollingRetries: 3
        };
        
        // Connection state
        this.connectionState = {
            status: 'disconnected', // disconnected, connecting, connected, error
            lastConnected: null,
            lastError: null,
            retryCount: 0
        };
        
        this.init();
    }

    init() {
        console.log('🔄 Initializing Real-time Service');
        this.updateConnectionStatus('connecting');
        
        if (this.config.useWebSocket) {
            this.connectWebSocket();
        } else {
            this.startPolling();
        }
    }

    // WebSocket Connection Management
    connectWebSocket() {
        try {
            console.log('🔌 Attempting WebSocket connection...');
            this.websocket = new WebSocket(this.config.websocketUrl);
            
            this.websocket.onopen = () => {
                console.log('✅ WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus('connected');
                this.startHeartbeat();
                this.sendMessage({ type: 'subscribe', channels: ['alerts', 'locations'] });
            };
            
            this.websocket.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };
            
            this.websocket.onclose = (event) => {
                console.log('🔌 WebSocket disconnected:', event.code, event.reason);
                this.isConnected = false;
                this.stopHeartbeat();
                this.updateConnectionStatus('disconnected');
                
                // Attempt reconnection or fallback to polling
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.scheduleReconnect();
                } else {
                    console.log('🔄 Max reconnection attempts reached, falling back to polling');
                    this.startPolling();
                }
            };
            
            this.websocket.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.updateConnectionStatus('error', error.message);
                
                // Fallback to polling immediately on error
                setTimeout(() => {
                    if (!this.isConnected) {
                        console.log('🔄 WebSocket failed, starting polling fallback');
                        this.startPolling();
                    }
                }, 2000);
            };
            
        } catch (error) {
            console.error('❌ WebSocket connection failed:', error);
            this.updateConnectionStatus('error', error.message);
            this.startPolling();
        }
    }

    scheduleReconnect() {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
        
        console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
        this.updateConnectionStatus('connecting');
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connectWebSocket();
            }
        }, delay);
    }

    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', data);
            
            switch (data.type) {
                case 'alert':
                    this.handleAlertUpdate(data.payload);
                    break;
                case 'location':
                    this.handleLocationUpdate(data.payload);
                    break;
                case 'heartbeat':
                    console.log('💓 Heartbeat received');
                    break;
                case 'error':
                    console.error('❌ Server error:', data.message);
                    this.updateConnectionStatus('error', data.message);
                    break;
                default:
                    console.log('❓ Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
        }
    }

    sendMessage(message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    // Heartbeat to keep connection alive
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.sendMessage({ type: 'heartbeat', timestamp: Date.now() });
            }
        }, this.config.heartbeatInterval);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // Polling Fallback System
    startPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        console.log('🔄 Starting polling mode');
        this.updateConnectionStatus('connected'); // Polling is considered "connected"
        
        // Initial poll
        this.pollForUpdates();
        
        // Set up regular polling
        this.pollingInterval = setInterval(() => {
            this.pollForUpdates();
        }, this.config.pollingInterval);
    }

    async pollForUpdates() {
        try {
            console.log('🔍 Polling for updates...');
            
            // Poll for alerts
            const alerts = await this.pollAlerts();
            if (alerts && alerts.length > 0) {
                alerts.forEach(alert => this.handleAlertUpdate(alert));
            }
            
            // Poll for location updates (if subscribed)
            const locations = await this.pollLocations();
            if (locations && locations.length > 0) {
                locations.forEach(location => this.handleLocationUpdate(location));
            }
            
            // Update connection status
            this.connectionState.lastConnected = new Date();
            this.connectionState.retryCount = 0;
            
        } catch (error) {
            console.error('❌ Polling failed:', error);
            this.connectionState.retryCount++;
            
            if (this.connectionState.retryCount >= this.config.maxPollingRetries) {
                this.updateConnectionStatus('error', 'Polling failed multiple times');
            }
        }
    }

    async pollAlerts() {
        try {
            // Import API client dynamically to avoid circular dependencies
            const { default: apiClient } = await import('../api/client.js');
            const alerts = await apiClient.getAlerts();
            
            // Check for new alerts since last poll
            const newAlerts = alerts.filter(alert => 
                alert.status === 'active' && !this.lastAlertIds.has(alert.id)
            );
            
            // Update tracking set
            alerts.forEach(alert => {
                if (alert.status === 'active') {
                    this.lastAlertIds.add(alert.id);
                }
            });
            
            return newAlerts;
        } catch (error) {
            console.error('❌ Failed to poll alerts:', error);
            throw error;
        }
    }

    async pollLocations() {
        try {
            // This would poll for location updates from other users/contacts
            // For now, return empty array as this feature needs backend support
            return [];
        } catch (error) {
            console.error('❌ Failed to poll locations:', error);
            throw error;
        }
    }

    // Event Handlers
    handleAlertUpdate(alert) {
        console.log('🚨 Alert update received:', alert);
        
        // Notify all registered alert callbacks
        this.alertCallbacks.forEach(callback => {
            try {
                callback(alert);
            } catch (error) {
                console.error('❌ Alert callback error:', error);
            }
        });
        
        // Show browser notification
        this.showNotification(alert);
    }

    handleLocationUpdate(location) {
        console.log('📍 Location update received:', location);
        
        // Notify all registered location callbacks
        this.locationCallbacks.forEach(callback => {
            try {
                callback(location);
            } catch (error) {
                console.error('❌ Location callback error:', error);
            }
        });
    }

    // Notification System
    showNotification(alert) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`Safety Alert: ${this.getAlertTitle(alert.type)}`, {
                body: alert.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `alert-${alert.id}`,
                requireInteraction: alert.severity === 'critical',
                actions: [
                    { action: 'safe', title: "I'm Safe" },
                    { action: 'help', title: 'Need Help' }
                ]
            });
            
            notification.onclick = () => {
                window.focus();
                // Navigate to alerts page
                if (window.app && window.app.showAlerts) {
                    window.app.showAlerts();
                }
                notification.close();
            };
            
            // Handle notification actions
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.addEventListener('notificationclick', (event) => {
                        if (event.action === 'safe') {
                            this.respondToAlert(alert.id, 'safe');
                        } else if (event.action === 'help') {
                            this.respondToAlert(alert.id, 'help');
                        }
                        event.notification.close();
                    });
                });
            }
            
            // Auto-close after 10 seconds for non-critical alerts
            if (alert.severity !== 'critical') {
                setTimeout(() => notification.close(), 10000);
            }
        }
    }

    async respondToAlert(alertId, response) {
        try {
            const { default: apiClient } = await import('../api/client.js');
            await apiClient.respondToAlert(alertId, response);
            console.log(`✅ Alert ${alertId} responded with: ${response}`);
        } catch (error) {
            console.error('❌ Failed to respond to alert:', error);
        }
    }

    getAlertTitle(type) {
        const titles = {
            'location_deviation': 'Location Alert',
            'check_in': 'Safety Check-in',
            'battery_low': 'Battery Warning',
            'geofence': 'Area Alert',
            'emergency': 'Emergency Alert',
            'panic': 'Panic Button',
            'timeout': 'Response Timeout'
        };
        return titles[type] || 'Safety Alert';
    }

    // Connection Status Management
    updateConnectionStatus(status, error = null) {
        const previousStatus = this.connectionState.status;
        this.connectionState.status = status;
        this.connectionState.lastError = error;
        
        if (status === 'connected') {
            this.connectionState.lastConnected = new Date();
        }
        
        console.log(`🔄 Connection status: ${previousStatus} → ${status}`);
        
        // Notify all registered callbacks
        this.connectionStatusCallbacks.forEach(callback => {
            try {
                callback(this.connectionState);
            } catch (error) {
                console.error('❌ Connection status callback error:', error);
            }
        });
    }

    // Public API for subscribing to events
    onConnectionStatusChange(callback) {
        this.connectionStatusCallbacks.push(callback);
        // Immediately call with current status
        callback(this.connectionState);
    }

    onAlertUpdate(callback) {
        this.alertCallbacks.push(callback);
    }

    onLocationUpdate(callback) {
        this.locationCallbacks.push(callback);
    }

    // Location Sharing
    startLocationSharing(tripId) {
        console.log(`📍 Starting location sharing for trip ${tripId}`);
        
        if ('geolocation' in navigator) {
            this.locationWatcher = navigator.geolocation.watchPosition(
                (position) => {
                    const locationData = {
                        trip_id: tripId,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString(),
                        speed: position.coords.speed,
                        heading: position.coords.heading
                    };
                    
                    // Send via WebSocket if connected, otherwise use API
                    if (this.isConnected && this.websocket) {
                        this.sendMessage({
                            type: 'location_update',
                            payload: locationData
                        });
                    } else {
                        this.submitLocationUpdate(locationData);
                    }
                },
                (error) => {
                    console.error('❌ Location sharing error:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 30000
                }
            );
        }
    }

    stopLocationSharing() {
        if (this.locationWatcher) {
            navigator.geolocation.clearWatch(this.locationWatcher);
            this.locationWatcher = null;
            console.log('📍 Location sharing stopped');
        }
    }

    async submitLocationUpdate(locationData) {
        try {
            const { default: apiClient } = await import('../api/client.js');
            await apiClient.submitLocationUpdate(locationData);
        } catch (error) {
            console.error('❌ Failed to submit location update:', error);
        }
    }

    // Cleanup
    destroy() {
        console.log('🧹 Cleaning up Real-time Service');
        
        if (this.websocket) {
            this.websocket.close();
        }
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        if (this.locationWatcher) {
            navigator.geolocation.clearWatch(this.locationWatcher);
        }
        
        // Clear all callbacks
        this.connectionStatusCallbacks = [];
        this.alertCallbacks = [];
        this.locationCallbacks = [];
    }

    // Utility methods for testing
    simulateAlert(alertData) {
        console.log('🧪 Simulating alert:', alertData);
        const mockAlert = {
            id: Date.now(),
            type: alertData.type || 'test',
            message: alertData.message || 'Test alert message',
            severity: alertData.severity || 'medium',
            status: 'active',
            created_at: new Date().toISOString(),
            ...alertData
        };
        
        this.handleAlertUpdate(mockAlert);
    }

    simulateLocationUpdate(locationData) {
        console.log('🧪 Simulating location update:', locationData);
        const mockLocation = {
            user_id: 'test-user',
            lat: locationData.lat || 35.6762,
            lng: locationData.lng || 139.6503,
            timestamp: new Date().toISOString(),
            accuracy: locationData.accuracy || 10,
            ...locationData
        };
        
        this.handleLocationUpdate(mockLocation);
    }

    // Get current connection info
    getConnectionInfo() {
        return {
            ...this.connectionState,
            isWebSocket: this.isConnected && this.websocket,
            isPolling: !!this.pollingInterval,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Create and export singleton instance
const realTimeService = new RealTimeService();
export default realTimeService;