// Main Application Entry Point
import AuthComponent from './components/auth.js';
import TripsComponent from './components/trips.js';
import AlertsComponent from './components/alerts.js';
import ConnectionStatusComponent from './components/connection-status.js';
import OfflineStatusComponent from './components/offline-status.js';
import PWAInstallComponent from './components/pwa-install.js';
import realTimeService from './services/realtime.js';
import offlineSyncService from './services/offline-sync.js';
import apiClient from './api/client.js';
import MobileUtils from './utils/mobileUtils.js';
import PerformanceOptimizer from './utils/performanceOptimizer.js';

class TourismSafetyApp {
    constructor() {
        this.auth = new AuthComponent();
        this.trips = new TripsComponent();
        this.alerts = new AlertsComponent();
        this.connectionStatus = new ConnectionStatusComponent();
        this.offlineStatus = new OfflineStatusComponent();
        this.pwaInstall = new PWAInstallComponent();
        this.currentComponent = null;
        
        // Initialize mobile utilities and performance optimizer
        this.mobileUtils = new MobileUtils();
        this.performanceOptimizer = new PerformanceOptimizer();
        
        // Make app globally available
        window.app = this;
    }

    init() {
        console.log('🛡️ Tourism Safety Tracker - Frontend Initialized');
        this.bindNavigation();
        this.initializeRealTimeFeatures();
        this.initializePWAFeatures();
        this.initializeMobileFeatures();
        this.showTrips(); // Default view
    }

    initializeRealTimeFeatures() {
        console.log('🔄 Initializing real-time features...');
        
        // Initialize real-time service
        realTimeService.init();
        
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }
        
        // Set up global alert handlers
        realTimeService.onAlertUpdate((alert) => {
            this.handleGlobalAlert(alert);
        });
        
        // Set up location sharing if user has an active trip
        this.checkAndStartLocationSharing();
    }

    handleGlobalAlert(alert) {
        // Show global notification for critical alerts
        if (alert.severity === 'critical' || alert.type === 'emergency') {
            this.showGlobalAlert(`🚨 ${alert.message}`, 'danger');
            
            // Flash the alerts navigation button
            const alertsNavBtn = document.getElementById('nav-alerts');
            if (alertsNavBtn) {
                alertsNavBtn.classList.add('alert-pulse');
                setTimeout(() => alertsNavBtn.classList.remove('alert-pulse'), 5000);
            }
        }
    }

    async checkAndStartLocationSharing() {
        try {
            // Check if user has an active trip
            const trips = await apiClient.getTrips();
            const activeTrip = trips.find(trip => trip.status === 'active');
            
            if (activeTrip) {
                console.log(`🗺️ Starting location sharing for active trip: ${activeTrip.name}`);
                realTimeService.startLocationSharing(activeTrip.id);
            }
        } catch (error) {
            console.log('Could not check for active trips:', error.message);
        }
    }

    bindNavigation() {
        // Navigation buttons
        document.getElementById('nav-trips')?.addEventListener('click', () => {
            this.showTrips();
        });

        document.getElementById('nav-alerts')?.addEventListener('click', () => {
            this.showAlerts();
        });

        document.getElementById('nav-profile')?.addEventListener('click', () => {
            this.showProfile();
        });

        // Update active nav button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-btn') && !e.target.classList.contains('logout')) {
                document.querySelectorAll('.nav-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
            }
        });
    }

    async showTrips() {
        this.currentComponent = 'trips';
        await this.trips.init();
    }

    async showAlerts() {
        this.currentComponent = 'alerts';
        await this.alerts.init();
    }

    showProfile() {
        this.currentComponent = 'profile';
        this.renderProfile();
    }

    renderProfile() {
        const content = document.getElementById('content');
        const user = this.auth.getCurrentUser();
        
        content.innerHTML = `
            <div class="profile-container">
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Profile Settings</h2>
                    </div>
                    
                    <div class="profile-section">
                        <h3>Account Information</h3>
                        <div class="profile-info">
                            <p><strong>Name:</strong> ${user?.name || 'Test User'}</p>
                            <p><strong>Email:</strong> ${user?.email || 'test@example.com'}</p>
                            <p><strong>Member since:</strong> ${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3>Emergency Contacts</h3>
                        <div id="emergency-contacts">
                            <div class="contact-item">
                                <div class="contact-info">
                                    <strong>John Doe</strong><br>
                                    <span>john@example.com</span><br>
                                    <span>+1 (555) 123-4567</span>
                                </div>
                                <button class="btn btn-secondary btn-small">Edit</button>
                            </div>
                            <button class="btn btn-primary">Add Emergency Contact</button>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3>Safety Settings</h3>
                        <div class="settings-group">
                            <label class="setting-item">
                                <input type="checkbox" checked> Enable location tracking
                            </label>
                            <label class="setting-item">
                                <input type="checkbox" checked> Send safety alerts
                            </label>
                            <label class="setting-item">
                                <input type="checkbox"> Share location with emergency contacts
                            </label>
                        </div>
                        
                        <div class="settings-group">
                            <label for="alert-frequency">Alert frequency:</label>
                            <select id="alert-frequency">
                                <option value="15">Every 15 minutes</option>
                                <option value="30" selected>Every 30 minutes</option>
                                <option value="60">Every hour</option>
                            </select>
                        </div>
                        
                        <div class="settings-group">
                            <label for="deviation-threshold">Deviation threshold:</label>
                            <select id="deviation-threshold">
                                <option value="1000">1 km</option>
                                <option value="2000" selected>2 km</option>
                                <option value="5000">5 km</option>
                            </select>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h3>App Information</h3>
                        <div class="app-info">
                            <p><strong>Version:</strong> 0.1.0</p>
                            <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
                            <p><strong>Status:</strong> <span class="status-badge status-active">Connected</span></p>
                        </div>
                        
                        <div class="app-actions">
                            <button class="btn btn-secondary">Export Data</button>
                            <button class="btn btn-secondary">Privacy Policy</button>
                            <button class="btn btn-danger">Delete Account</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addProfileStyles();
    }

    addProfileStyles() {
        if (!document.getElementById('profile-styles')) {
            const style = document.createElement('style');
            style.id = 'profile-styles';
            style.textContent = `
                .profile-section {
                    margin-bottom: 2rem;
                    padding-bottom: 2rem;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .profile-section:last-child {
                    border-bottom: none;
                }
                
                .profile-section h3 {
                    margin-bottom: 1rem;
                    color: #1e293b;
                }
                
                .profile-info p {
                    margin-bottom: 0.5rem;
                    color: #374151;
                }
                
                .contact-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: #f9fafb;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }
                
                .contact-info {
                    color: #374151;
                }
                
                .settings-group {
                    margin-bottom: 1.5rem;
                }
                
                .setting-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    cursor: pointer;
                }
                
                .setting-item input[type="checkbox"] {
                    margin: 0;
                }
                
                .settings-group label:not(.setting-item) {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: #374151;
                }
                
                .settings-group select {
                    width: 100%;
                    max-width: 200px;
                    padding: 0.5rem;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                }
                
                .app-info p {
                    margin-bottom: 0.5rem;
                }
                
                .app-actions {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                    margin-top: 1rem;
                }
                
                /* PWA Status Styles */
                .pwa-status {
                    margin-bottom: 1rem;
                }

                .status-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                    padding: 0.5rem;
                    background: #f9fafb;
                    border-radius: 6px;
                }

                .status-label {
                    font-weight: 500;
                    color: #374151;
                }

                .status-value {
                    font-weight: 600;
                }

                .status-success {
                    color: #10b981;
                }

                .status-warning {
                    color: #f59e0b;
                }

                .status-inactive {
                    color: #6b7280;
                }

                .pwa-actions {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                @media (max-width: 768px) {
                    .contact-item {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }
                    
                    .app-actions {
                        flex-direction: column;
                    }
                    
                    .app-actions .btn {
                        width: 100%;
                    }

                    .pwa-actions {
                        flex-direction: column;
                    }

                    .pwa-actions .btn {
                        width: 100%;
                    }
                }

                /* Alert pulse animation for navigation */
                .alert-pulse {
                    animation: alertPulse 1s ease-in-out infinite;
                }

                @keyframes alertPulse {
                    0%, 100% {
                        background-color: inherit;
                        transform: scale(1);
                    }
                    50% {
                        background-color: #fee2e2;
                        transform: scale(1.05);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Utility methods
    showGlobalAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.style.maxWidth = '300px';
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }

    // Location tracking utilities
    startLocationTracking() {
        if ('geolocation' in navigator) {
            this.locationWatcher = navigator.geolocation.watchPosition(
                (position) => {
                    this.handleLocationUpdate(position);
                },
                (error) => {
                    console.error('Location tracking error:', error);
                    this.showGlobalAlert('Location tracking error', 'warning');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        }
    }

    stopLocationTracking() {
        if (this.locationWatcher) {
            navigator.geolocation.clearWatch(this.locationWatcher);
            this.locationWatcher = null;
        }
    }

    async handleLocationUpdate(position) {
        const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy
        };

        try {
            // Submit location update to backend
            await apiClient.submitLocationUpdate(locationData);
            console.log('Location updated:', locationData);
        } catch (error) {
            console.error('Failed to update location:', error);
        }
    }

    // PWA Features Initialization
    initializePWAFeatures() {
        console.log('📱 Initializing PWA features...');
        
        // Initialize offline sync service
        offlineSyncService.init();
        
        // Connect API client with offline sync service
        apiClient.setOfflineSyncService(offlineSyncService);
        
        // Listen for sync events
        window.addEventListener('offline-sync-complete', (event) => {
            const { successCount, failCount } = event.detail;
            if (successCount > 0) {
                this.showGlobalAlert(`Synced ${successCount} offline requests`, 'success');
            }
        });
        
        // Add PWA controls to profile section
        this.addPWAControls();
    }

    // Mobile Features Initialization
    initializeMobileFeatures() {
        console.log('📱 Initializing mobile features...');
        
        // Setup pull-to-refresh
        document.addEventListener('pull-to-refresh', () => {
            this.handlePullToRefresh();
        });
        
        // Setup mobile-specific event handlers
        this.setupMobileEventHandlers();
        
        // Optimize for mobile performance
        this.mobileUtils.optimizeForMobile();
        
        // Log performance metrics periodically
        if (this.mobileUtils.isMobile) {
            setInterval(() => {
                this.performanceOptimizer.logPerformanceMetrics();
            }, 60000); // Every minute
        }
    }

    // Setup mobile-specific event handlers
    setupMobileEventHandlers() {
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 500);
        });

        // Handle app visibility changes for battery optimization
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseNonEssentialOperations();
            } else {
                this.resumeNonEssentialOperations();
            }
        });

        // Handle network changes
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.handleNetworkChange();
            });
        }
    }

    // Handle pull-to-refresh
    async handlePullToRefresh() {
        try {
            // Trigger haptic feedback
            if (this.mobileUtils.supportsHaptic) {
                this.mobileUtils.triggerHapticFeedback('medium');
            }

            // Refresh current component data
            if (this.currentComponent === 'trips') {
                await this.trips.loadTrips();
                this.trips.render();
            } else if (this.currentComponent === 'alerts') {
                await this.alerts.loadAlerts();
                this.alerts.render();
            }

            this.showGlobalAlert('Content refreshed', 'success');
        } catch (error) {
            this.showGlobalAlert('Failed to refresh content', 'danger');
        }
    }

    // Handle orientation changes
    handleOrientationChange() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // Update navigation layout
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (isLandscape && this.mobileUtils.isMobile) {
                navbar.classList.add('landscape-mode');
            } else {
                navbar.classList.remove('landscape-mode');
            }
        }

        // Adjust emergency modal if open
        const emergencyModal = document.querySelector('.emergency-modal');
        if (emergencyModal && emergencyModal.style.display !== 'none') {
            this.adjustEmergencyModalForOrientation(isLandscape);
        }
    }

    // Adjust emergency modal for orientation
    adjustEmergencyModalForOrientation(isLandscape) {
        const modalContent = document.querySelector('.emergency-modal .modal-content');
        if (!modalContent) return;

        if (isLandscape) {
            modalContent.style.maxHeight = 'calc(100vh - 20px)';
            modalContent.style.margin = '10px';
            
            // Adjust button layout
            const actions = modalContent.querySelector('.emergency-actions');
            if (actions) {
                actions.style.flexDirection = 'row';
            }
        } else {
            modalContent.style.maxHeight = 'calc(100vh - 40px)';
            modalContent.style.margin = '20px';
            
            // Reset button layout
            const actions = modalContent.querySelector('.emergency-actions');
            if (actions) {
                actions.style.flexDirection = 'column';
            }
        }
    }

    // Handle network changes
    handleNetworkChange() {
        const connection = navigator.connection;
        const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                                connection.effectiveType === '2g' ||
                                connection.effectiveType === '3g';

        if (isSlowConnection || connection.saveData) {
            // Enable data saving mode
            document.body.classList.add('data-saver');
            this.showGlobalAlert('Data saver mode enabled', 'info');
        } else {
            document.body.classList.remove('data-saver');
        }
    }

    // Pause non-essential operations
    pauseNonEssentialOperations() {
        // Reduce polling frequency
        if (realTimeService.pollingInterval) {
            realTimeService.setPollingInterval(60000); // 1 minute
        }

        // Pause animations
        document.body.classList.add('paused-animations');
    }

    // Resume non-essential operations
    resumeNonEssentialOperations() {
        // Restore normal polling frequency
        if (realTimeService.pollingInterval) {
            realTimeService.setPollingInterval(5000); // 5 seconds
        }

        // Resume animations
        document.body.classList.remove('paused-animations');
    }

    addPWAControls() {
        // Add PWA status and controls to the profile section
        const addPWASection = () => {
            const profileContainer = document.querySelector('.profile-container');
            if (profileContainer && !document.getElementById('pwa-section')) {
                const pwaSection = document.createElement('div');
                pwaSection.id = 'pwa-section';
                pwaSection.className = 'profile-section';
                pwaSection.innerHTML = `
                    <h3>App Features</h3>
                    <div class="pwa-status">
                        <div class="status-item">
                            <span class="status-label">Installation:</span>
                            <span id="install-status" class="status-value">Checking...</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Offline Mode:</span>
                            <span id="offline-status" class="status-value">Available</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Last Sync:</span>
                            <span id="sync-status" class="status-value">Never</span>
                        </div>
                    </div>
                    <div class="pwa-actions">
                        <button id="install-app-btn" class="btn btn-primary" style="display: none;">Install App</button>
                        <button id="force-sync-btn" class="btn btn-secondary">Sync Now</button>
                        <button id="clear-cache-btn" class="btn btn-secondary">Clear Cache</button>
                    </div>
                `;
                
                profileContainer.querySelector('.card').appendChild(pwaSection);
                this.bindPWAControls();
                this.updatePWAStatus();
            }
        };

        // Add section when profile is shown
        const originalShowProfile = this.showProfile.bind(this);
        this.showProfile = function() {
            originalShowProfile();
            setTimeout(addPWASection, 100);
        };
    }

    bindPWAControls() {
        const installBtn = document.getElementById('install-app-btn');
        const syncBtn = document.getElementById('force-sync-btn');
        const clearBtn = document.getElementById('clear-cache-btn');

        if (installBtn) {
            installBtn.addEventListener('click', () => {
                this.pwaInstall.triggerInstallPrompt();
            });
        }

        if (syncBtn) {
            syncBtn.addEventListener('click', async () => {
                syncBtn.textContent = 'Syncing...';
                syncBtn.disabled = true;
                
                try {
                    await offlineSyncService.forceSync();
                    this.showGlobalAlert('Sync completed', 'success');
                } catch (error) {
                    this.showGlobalAlert('Sync failed', 'error');
                }
                
                syncBtn.textContent = 'Sync Now';
                syncBtn.disabled = false;
                this.updatePWAStatus();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                if (confirm('Clear all cached data? This will remove offline content.')) {
                    try {
                        const cacheNames = await caches.keys();
                        await Promise.all(cacheNames.map(name => caches.delete(name)));
                        
                        // Clear IndexedDB
                        if (offlineSyncService.db) {
                            offlineSyncService.db.close();
                            await new Promise((resolve) => {
                                const deleteReq = indexedDB.deleteDatabase('tourism-safety-offline');
                                deleteReq.onsuccess = () => resolve();
                                deleteReq.onerror = () => resolve();
                            });
                        }
                        
                        this.showGlobalAlert('Cache cleared', 'success');
                        setTimeout(() => window.location.reload(), 1000);
                    } catch (error) {
                        this.showGlobalAlert('Failed to clear cache', 'error');
                    }
                }
            });
        }
    }

    updatePWAStatus() {
        const installStatus = document.getElementById('install-status');
        const offlineStatus = document.getElementById('offline-status');
        const syncStatus = document.getElementById('sync-status');
        const installBtn = document.getElementById('install-app-btn');

        if (installStatus) {
            const pwaStatus = this.pwaInstall.getInstallStatus();
            if (pwaStatus.isInstalled) {
                installStatus.textContent = 'Installed';
                installStatus.className = 'status-value status-success';
            } else if (pwaStatus.canInstall) {
                installStatus.textContent = 'Available';
                installStatus.className = 'status-value status-warning';
                if (installBtn) installBtn.style.display = 'inline-block';
            } else {
                installStatus.textContent = 'Not Available';
                installStatus.className = 'status-value status-inactive';
            }
        }

        if (offlineStatus) {
            const offlineInfo = this.offlineStatus.getOfflineStatus();
            if (offlineInfo.isOnline) {
                offlineStatus.textContent = 'Online';
                offlineStatus.className = 'status-value status-success';
            } else {
                offlineStatus.textContent = `Offline (${offlineInfo.queueLength} queued)`;
                offlineStatus.className = 'status-value status-warning';
            }
        }

        if (syncStatus) {
            const syncInfo = offlineSyncService.getSyncStatus();
            if (syncInfo.lastSyncTime) {
                const lastSync = new Date(syncInfo.lastSyncTime);
                syncStatus.textContent = lastSync.toLocaleString();
                syncStatus.className = 'status-value status-success';
            } else {
                syncStatus.textContent = 'Never';
                syncStatus.className = 'status-value status-inactive';
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new TourismSafetyApp();
    
    // Hide loading spinner
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
    }, 1000);
    
    // Initialize app
    app.init();
});

// Export for global access
export default TourismSafetyApp;
