// Alerts Component
import apiClient from '../api/client.js';
import realTimeService from '../services/realtime.js';

class AlertsComponent {
    constructor() {
        this.alerts = [];
        this.activeAlerts = [];
        this.filteredAlerts = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.audioContext = null;
        this.notificationSound = null;
        this.emergencySound = null;
        this.soundEnabled = localStorage.getItem('alertSoundEnabled') !== 'false';
        this.lastAlertIds = new Set(); // Track processed alerts
        this.initAudio();
    }

    async init() {
        await this.loadAlerts();
        this.render();
        this.bindEvents();
        this.setupRealTimeAlerts();
        this.requestNotificationPermission();
    }

    // Initialize audio for alert sounds
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createNotificationSounds();
        } catch (error) {
            console.warn('Audio context not supported:', error);
            this.soundEnabled = false;
        }
    }

    // Create notification sounds using Web Audio API
    createNotificationSounds() {
        if (!this.audioContext) return;

        // Create notification sound (gentle beep)
        this.notificationSound = this.createTone(800, 0.2, 'sine');
        
        // Create emergency sound (urgent beeping)
        this.emergencySound = this.createTone(1000, 0.5, 'square');
    }

    // Create tone using Web Audio API
    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.audioContext || !this.soundEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

    // Request notification permission
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    async loadAlerts() {
        try {
            const newAlerts = await apiClient.getAlerts();
            
            // Check for new active alerts
            const previousActiveIds = this.activeAlerts.map(a => a.id);
            const newActiveAlerts = newAlerts.filter(alert => 
                alert.status === 'active' && !previousActiveIds.includes(alert.id)
            );
            
            // Play sound and show notifications for new alerts
            if (newActiveAlerts.length > 0) {
                this.handleNewAlerts(newActiveAlerts);
            }
            
            this.alerts = newAlerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            this.activeAlerts = this.alerts.filter(alert => alert.status === 'active');
            this.applyFilters();
            
        } catch (error) {
            console.error('Failed to load alerts:', error);
            this.showAlert('Failed to load alerts', 'danger');
        }
    }

    // Handle new alerts with sound and notifications
    handleNewAlerts(newAlerts) {
        newAlerts.forEach(alert => {
            // Play appropriate sound
            if (alert.severity === 'critical' || alert.type === 'emergency') {
                this.playEmergencySound();
                this.showEmergencyModal(alert);
            } else {
                this.playNotificationSound();
            }
            
            // Show browser notification
            this.showBrowserNotification(alert);
            
            // Add visual indicator
            this.addVisualIndicator(alert);
        });
    }

    // Play notification sound
    playNotificationSound() {
        if (this.notificationSound && this.soundEnabled) {
            this.notificationSound();
        }
    }

    // Play emergency sound (multiple beeps)
    playEmergencySound() {
        if (this.emergencySound && this.soundEnabled) {
            this.emergencySound();
            setTimeout(() => this.emergencySound(), 300);
            setTimeout(() => this.emergencySound(), 600);
        }
    }

    // Show browser notification
    showBrowserNotification(alert) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`Safety Alert: ${this.getAlertTitle(alert.type)}`, {
                body: alert.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: `alert-${alert.id}`,
                requireInteraction: alert.severity === 'critical'
            });
            
            notification.onclick = () => {
                window.focus();
                if (alert.status === 'active') {
                    this.showEmergencyModal(alert);
                }
                notification.close();
            };
            
            // Auto-close after 10 seconds for non-critical alerts
            if (alert.severity !== 'critical') {
                setTimeout(() => notification.close(), 10000);
            }
        }
    }

    // Add visual indicator for new alerts
    addVisualIndicator(alert) {
        // Flash the browser tab title
        const originalTitle = document.title;
        let flashCount = 0;
        const flashInterval = setInterval(() => {
            document.title = flashCount % 2 === 0 ? '🚨 New Alert!' : originalTitle;
            flashCount++;
            if (flashCount >= 6) {
                clearInterval(flashInterval);
                document.title = originalTitle;
            }
        }, 500);
        
        // Add pulsing effect to alerts button in navigation
        const alertsNavBtn = document.getElementById('nav-alerts');
        if (alertsNavBtn) {
            alertsNavBtn.classList.add('alert-pulse');
            setTimeout(() => alertsNavBtn.classList.remove('alert-pulse'), 5000);
        }
    }

    render() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="alerts-container">
                <!-- Alert Controls -->
                <div class="alert-controls">
                    <div class="alert-search">
                        <input type="text" id="alert-search" placeholder="Search alerts..." value="${this.searchQuery}">
                        <button id="clear-search" class="btn btn-secondary btn-small" ${this.searchQuery ? '' : 'style="display: none;"'}>Clear</button>
                    </div>
                    <div class="alert-settings">
                        <span id="realtime-status" class="realtime-status status-connecting">🟡 Connecting</span>
                        <button id="sound-toggle" class="btn btn-secondary btn-small">
                            ${this.soundEnabled ? '🔊' : '🔇'} Sound ${this.soundEnabled ? 'On' : 'Off'}
                        </button>
                        <button id="test-alert-btn" class="btn btn-secondary btn-small">Test Alert</button>
                    </div>
                </div>

                <!-- Active Alerts Section -->
                ${this.activeAlerts.length > 0 ? `
                    <div class="card alert-danger">
                        <div class="card-header">
                            <h2 class="card-title">🚨 Active Safety Alerts</h2>
                            <div class="alert-summary">
                                <span class="status-badge status-emergency">${this.activeAlerts.length} Active</span>
                                ${this.getCriticalAlertsCount() > 0 ? `<span class="status-badge status-critical">${this.getCriticalAlertsCount()} Critical</span>` : ''}
                            </div>
                        </div>
                        <div id="active-alerts">
                            ${this.renderActiveAlerts()}
                        </div>
                    </div>
                ` : ''}

                <!-- Alert Statistics -->
                <div class="alert-stats">
                    <div class="stat-item">
                        <span class="stat-number">${this.alerts.length}</span>
                        <span class="stat-label">Total Alerts</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.alerts.filter(a => a.status === 'responded').length}</span>
                        <span class="stat-label">Responded</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.alerts.filter(a => a.status === 'escalated').length}</span>
                        <span class="stat-label">Escalated</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${this.getAverageResponseTime()}</span>
                        <span class="stat-label">Avg Response</span>
                    </div>
                </div>

                <!-- All Alerts Section -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">Alert History</h2>
                        <div class="alert-header-actions">
                            <select id="sort-alerts" class="form-select">
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="severity">By Severity</option>
                                <option value="type">By Type</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="alert-filters">
                        <button class="filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                            All (${this.alerts.length})
                        </button>
                        <button class="filter-btn ${this.currentFilter === 'active' ? 'active' : ''}" data-filter="active">
                            Active (${this.alerts.filter(a => a.status === 'active').length})
                        </button>
                        <button class="filter-btn ${this.currentFilter === 'responded' ? 'active' : ''}" data-filter="responded">
                            Responded (${this.alerts.filter(a => a.status === 'responded').length})
                        </button>
                        <button class="filter-btn ${this.currentFilter === 'escalated' ? 'active' : ''}" data-filter="escalated">
                            Escalated (${this.alerts.filter(a => a.status === 'escalated').length})
                        </button>
                        <button class="filter-btn ${this.currentFilter === 'critical' ? 'active' : ''}" data-filter="critical">
                            Critical (${this.alerts.filter(a => a.severity === 'critical').length})
                        </button>
                    </div>
                    
                    <div id="alerts-list">
                        ${this.renderAlertsList()}
                    </div>
                </div>

                <!-- Enhanced Emergency Response Modal -->
                <div id="emergency-modal" class="modal emergency-modal" style="display: none;">
                    <div class="modal-content">
                        <div class="emergency-header">
                            <div class="emergency-icon">🚨</div>
                            <h2 id="emergency-title">Safety Check Required</h2>
                            <p id="emergency-message">Are you safe?</p>
                            <div id="emergency-severity" class="severity-indicator"></div>
                        </div>
                        <div class="emergency-actions">
                            <button id="respond-safe" class="btn btn-success btn-large">
                                ✅ I'm Safe
                            </button>
                            <button id="respond-help" class="btn btn-danger btn-large">
                                🆘 I Need Help
                            </button>
                            <button id="respond-later" class="btn btn-secondary">
                                ⏰ Remind Me Later (5 min)
                            </button>
                        </div>
                        <div class="emergency-info">
                            <div class="countdown-container">
                                <div class="countdown-circle">
                                    <span id="countdown">15:00</span>
                                </div>
                                <p>Time remaining to respond</p>
                            </div>
                            <div class="escalation-info">
                                <p class="text-small">If you don't respond, emergency contacts will be notified</p>
                                <div id="escalation-steps" class="escalation-steps">
                                    <div class="step">📱 SMS to emergency contacts</div>
                                    <div class="step">📧 Email notifications</div>
                                    <div class="step">🚨 Local authorities (if configured)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addAlertStyles();
    }

    renderActiveAlerts() {
        return this.activeAlerts.map(alert => `
            <div class="active-alert-item severity-${alert.severity}" data-alert-id="${alert.id}">
                <div class="alert-content">
                    <div class="alert-icon ${alert.severity === 'critical' ? 'pulsing' : ''}">
                        ${this.getAlertIcon(alert.type)}
                    </div>
                    <div class="alert-details">
                        <div class="alert-header-inline">
                            <h4>${this.getAlertTitle(alert.type)}</h4>
                            <span class="severity-badge severity-${alert.severity}">${alert.severity}</span>
                        </div>
                        <p>${alert.message}</p>
                        <div class="alert-meta">
                            <small>Triggered: ${this.formatDateTime(alert.created_at)}</small>
                            <small>Duration: ${this.getAlertDuration(alert.created_at)}</small>
                        </div>
                    </div>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-success respond-safe" data-alert-id="${alert.id}">
                        ✅ I'm Safe
                    </button>
                    <button class="btn btn-danger respond-help" data-alert-id="${alert.id}">
                        🆘 Need Help
                    </button>
                    ${alert.severity !== 'critical' ? `
                        <button class="btn btn-secondary btn-small snooze-alert" data-alert-id="${alert.id}">
                            ⏰ Snooze 5min
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderAlertsList() {
        const alertsToShow = this.filteredAlerts.length > 0 ? this.filteredAlerts : this.alerts;
        
        if (alertsToShow.length === 0) {
            if (this.searchQuery) {
                return `
                    <div class="empty-state">
                        <p>No alerts found matching "${this.searchQuery}"</p>
                        <button id="clear-search-empty" class="btn btn-secondary btn-small">Clear Search</button>
                    </div>
                `;
            }
            return `
                <div class="empty-state">
                    <div class="empty-icon">🎉</div>
                    <p>No alerts yet. This is good news!</p>
                    <small>Your safety monitoring is active and working properly.</small>
                </div>
            `;
        }

        return alertsToShow.map(alert => `
            <div class="alert-item ${alert.status} severity-${alert.severity}" data-alert-id="${alert.id}" data-type="${alert.type}">
                <div class="alert-header">
                    <div class="alert-type">
                        <span class="alert-icon">${this.getAlertIcon(alert.type)}</span>
                        <div class="alert-type-info">
                            <span class="alert-title">${this.getAlertTitle(alert.type)}</span>
                            <span class="severity-badge severity-${alert.severity}">${alert.severity}</span>
                        </div>
                    </div>
                    <div class="alert-status">
                        <span class="status-badge status-${alert.status}">${alert.status}</span>
                        <div class="alert-time">
                            <small>${this.formatDateTime(alert.created_at)}</small>
                            <small class="time-ago">${this.getTimeAgo(alert.created_at)}</small>
                        </div>
                    </div>
                </div>
                <div class="alert-message">
                    ${this.highlightSearchTerm(alert.message)}
                </div>
                ${alert.response ? `
                    <div class="alert-response">
                        <div class="response-header">
                            <strong>Response:</strong>
                            <span class="response-type ${alert.response}">${alert.response === 'safe' ? '✅ Safe' : '🆘 Help Needed'}</span>
                        </div>
                        ${alert.response_time ? `<small>Responded: ${this.formatDateTime(alert.response_time)}</small>` : ''}
                    </div>
                ` : ''}
                ${alert.status === 'active' ? `
                    <div class="alert-actions">
                        <button class="btn btn-success btn-small respond-safe" data-alert-id="${alert.id}">
                            ✅ I'm Safe
                        </button>
                        <button class="btn btn-danger btn-small respond-help" data-alert-id="${alert.id}">
                            🆘 Need Help
                        </button>
                        <button class="btn btn-secondary btn-small view-details" data-alert-id="${alert.id}">
                            📋 Details
                        </button>
                    </div>
                ` : ''}
                ${alert.status === 'escalated' ? `
                    <div class="escalation-info">
                        <span class="escalation-badge">⚠️ Escalated to Emergency Contacts</span>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    bindEvents() {
        // Alert response buttons
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('respond-safe')) {
                const alertId = e.target.dataset.alertId;
                await this.respondToAlert(alertId, 'safe');
            }
            
            if (e.target.classList.contains('respond-help')) {
                const alertId = e.target.dataset.alertId;
                await this.respondToAlert(alertId, 'help');
            }

            if (e.target.classList.contains('snooze-alert')) {
                const alertId = e.target.dataset.alertId;
                this.snoozeAlert(alertId, 5 * 60 * 1000); // 5 minutes
            }

            if (e.target.classList.contains('view-details')) {
                const alertId = e.target.dataset.alertId;
                this.showAlertDetails(alertId);
            }
        });

        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.currentFilter = e.target.dataset.filter;
                this.applyFilters();
                this.render();
            }
        });

        // Search functionality
        document.getElementById('alert-search')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.applyFilters();
            this.updateAlertsList();
        });

        document.getElementById('clear-search')?.addEventListener('click', () => {
            this.searchQuery = '';
            document.getElementById('alert-search').value = '';
            this.applyFilters();
            this.render();
        });

        document.getElementById('clear-search-empty')?.addEventListener('click', () => {
            this.searchQuery = '';
            document.getElementById('alert-search').value = '';
            this.applyFilters();
            this.render();
        });

        // Sort functionality
        document.getElementById('sort-alerts')?.addEventListener('change', (e) => {
            this.sortAlerts(e.target.value);
            this.updateAlertsList();
        });

        // Sound toggle
        document.getElementById('sound-toggle')?.addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            localStorage.setItem('alertSoundEnabled', this.soundEnabled);
            this.render();
        });

        // Test alert button
        document.getElementById('test-alert-btn')?.addEventListener('click', () => {
            this.showTestAlert();
        });

        // Emergency modal responses
        document.getElementById('respond-safe')?.addEventListener('click', () => {
            this.handleEmergencyResponse('safe');
        });

        document.getElementById('respond-help')?.addEventListener('click', () => {
            this.handleEmergencyResponse('help');
        });

        document.getElementById('respond-later')?.addEventListener('click', () => {
            this.handleEmergencyResponse('later');
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('emergency-modal').style.display !== 'none') {
                if (e.key === '1' || e.key === 's') {
                    e.preventDefault();
                    this.handleEmergencyResponse('safe');
                } else if (e.key === '2' || e.key === 'h') {
                    e.preventDefault();
                    this.handleEmergencyResponse('help');
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.handleEmergencyResponse('later');
                }
            }
        });
    }

    async respondToAlert(alertId, response) {
        try {
            await apiClient.respondToAlert(alertId, response);
            
            // Update local alert status
            const alert = this.alerts.find(a => a.id == alertId);
            if (alert) {
                alert.status = 'responded';
                alert.response = response;
            }
            
            // Remove from active alerts
            this.activeAlerts = this.activeAlerts.filter(a => a.id != alertId);
            
            // Re-render
            this.render();
            
            const message = response === 'safe' ? 
                'Thank you for confirming you\'re safe!' : 
                'Help is on the way. Stay calm and stay where you are.';
            
            this.showAlert(message, response === 'safe' ? 'success' : 'warning');
            
        } catch (error) {
            this.showAlert('Failed to respond to alert', 'danger');
        }
    }

    // Apply filters and search
    applyFilters() {
        let filtered = [...this.alerts];
        
        // Apply status/type filter
        if (this.currentFilter !== 'all') {
            if (this.currentFilter === 'critical') {
                filtered = filtered.filter(alert => alert.severity === 'critical');
            } else {
                filtered = filtered.filter(alert => alert.status === this.currentFilter);
            }
        }
        
        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(alert => 
                alert.message.toLowerCase().includes(query) ||
                this.getAlertTitle(alert.type).toLowerCase().includes(query) ||
                alert.type.toLowerCase().includes(query) ||
                alert.status.toLowerCase().includes(query) ||
                alert.severity.toLowerCase().includes(query)
            );
        }
        
        this.filteredAlerts = filtered;
    }

    // Update only the alerts list without full re-render
    updateAlertsList() {
        const alertsList = document.getElementById('alerts-list');
        if (alertsList) {
            alertsList.innerHTML = this.renderAlertsList();
        }
        
        // Update filter button counts
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const filter = btn.dataset.filter;
            let count = 0;
            
            if (filter === 'all') {
                count = this.alerts.length;
            } else if (filter === 'critical') {
                count = this.alerts.filter(a => a.severity === 'critical').length;
            } else {
                count = this.alerts.filter(a => a.status === filter).length;
            }
            
            btn.innerHTML = btn.innerHTML.replace(/\(\d+\)/, `(${count})`);
        });
    }

    // Sort alerts
    sortAlerts(sortBy) {
        switch (sortBy) {
            case 'newest':
                this.filteredAlerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                this.filteredAlerts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'severity':
                const severityOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
                this.filteredAlerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
                break;
            case 'type':
                this.filteredAlerts.sort((a, b) => a.type.localeCompare(b.type));
                break;
        }
    }

    // Snooze alert
    snoozeAlert(alertId, duration) {
        const alert = this.alerts.find(a => a.id == alertId);
        if (alert) {
            alert.snoozedUntil = Date.now() + duration;
            this.showAlert(`Alert snoozed for ${duration / 60000} minutes`, 'info');
            this.render();
        }
    }

    // Show alert details modal
    showAlertDetails(alertId) {
        const alert = this.alerts.find(a => a.id == alertId);
        if (!alert) return;

        const modal = document.createElement('div');
        modal.className = 'modal alert-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${this.getAlertIcon(alert.type)} ${this.getAlertTitle(alert.type)}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="alert-detail-item">
                        <strong>Message:</strong>
                        <p>${alert.message}</p>
                    </div>
                    <div class="alert-detail-item">
                        <strong>Severity:</strong>
                        <span class="severity-badge severity-${alert.severity}">${alert.severity}</span>
                    </div>
                    <div class="alert-detail-item">
                        <strong>Status:</strong>
                        <span class="status-badge status-${alert.status}">${alert.status}</span>
                    </div>
                    <div class="alert-detail-item">
                        <strong>Created:</strong>
                        <p>${this.formatDateTime(alert.created_at)} (${this.getTimeAgo(alert.created_at)})</p>
                    </div>
                    ${alert.trip_id ? `
                        <div class="alert-detail-item">
                            <strong>Related Trip:</strong>
                            <p>Trip ID: ${alert.trip_id}</p>
                        </div>
                    ` : ''}
                    ${alert.response ? `
                        <div class="alert-detail-item">
                            <strong>Response:</strong>
                            <p>${alert.response === 'safe' ? '✅ Reported Safe' : '🆘 Requested Help'}</p>
                            ${alert.response_time ? `<small>Responded: ${this.formatDateTime(alert.response_time)}</small>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        // Close modal events
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    showTestAlert() {
        // Create different types of test alerts
        const testAlerts = [
            {
                id: 'test-1',
                type: 'location_deviation',
                message: 'This is a test alert. You seem to be far from your planned route. Are you safe?',
                severity: 'medium'
            },
            {
                id: 'test-2',
                type: 'emergency',
                message: 'CRITICAL: Emergency test alert. This simulates a high-priority safety check.',
                severity: 'critical'
            },
            {
                id: 'test-3',
                type: 'battery_low',
                message: 'Test: Your device battery is running low. Please charge soon.',
                severity: 'high'
            }
        ];
        
        // Randomly select a test alert
        const testAlert = testAlerts[Math.floor(Math.random() * testAlerts.length)];
        
        // Add to alerts list for testing
        testAlert.created_at = new Date().toISOString();
        testAlert.status = 'active';
        testAlert.trip_id = 1;
        
        this.alerts.unshift(testAlert);
        this.activeAlerts.unshift(testAlert);
        
        // Show emergency modal
        this.showEmergencyModal(testAlert);
        
        // Play appropriate sound
        if (testAlert.severity === 'critical') {
            this.playEmergencySound();
        } else {
            this.playNotificationSound();
        }
        
        // Show browser notification
        this.showBrowserNotification(testAlert);
        
        // Re-render to show the new alert
        this.render();
    }

    showEmergencyModal(alert) {
        // Set modal content based on alert
        document.getElementById('emergency-title').textContent = 
            alert.severity === 'critical' ? 'CRITICAL SAFETY ALERT' : 'Safety Check Required';
        document.getElementById('emergency-message').textContent = alert.message;
        
        // Set severity indicator
        const severityIndicator = document.getElementById('emergency-severity');
        severityIndicator.className = `severity-indicator severity-${alert.severity}`;
        severityIndicator.textContent = `${alert.severity.toUpperCase()} PRIORITY`;
        
        // Show modal
        const modal = document.getElementById('emergency-modal');
        modal.style.display = 'flex';
        modal.dataset.alertId = alert.id;
        
        // Add modal classes based on severity
        modal.className = `modal emergency-modal severity-${alert.severity}`;
        
        // Determine countdown time based on severity
        let countdownMinutes = 15;
        if (alert.severity === 'critical') countdownMinutes = 5;
        else if (alert.severity === 'high') countdownMinutes = 10;
        
        // Start countdown timer
        this.startCountdown(countdownMinutes * 60);
        
        // Auto-escalate after timeout
        this.emergencyTimeout = setTimeout(() => {
            this.handleEmergencyTimeout(alert);
        }, countdownMinutes * 60 * 1000);
        
        // Add body class to prevent scrolling
        document.body.classList.add('modal-open');
        
        // Focus on the safe button for accessibility
        setTimeout(() => {
            document.getElementById('respond-safe')?.focus();
        }, 100);
    }

    hideEmergencyModal() {
        const modal = document.getElementById('emergency-modal');
        modal.style.display = 'none';
        modal.className = 'modal emergency-modal';
        
        // Clear timers
        if (this.emergencyTimeout) {
            clearTimeout(this.emergencyTimeout);
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        // Remove body class
        document.body.classList.remove('modal-open');
    }

    handleEmergencyResponse(response) {
        const modal = document.getElementById('emergency-modal');
        const alertId = modal.dataset.alertId;
        
        if (response === 'later') {
            // Snooze for 5 minutes
            this.hideEmergencyModal();
            this.showAlert('Alert snoozed for 5 minutes. You will be reminded again.', 'info');
            
            // Set reminder
            setTimeout(() => {
                const alert = this.alerts.find(a => a.id == alertId);
                if (alert && alert.status === 'active') {
                    this.showEmergencyModal(alert);
                }
            }, 5 * 60 * 1000);
            return;
        }
        
        this.hideEmergencyModal();
        
        // Respond to the alert
        if (alertId) {
            this.respondToAlert(alertId, response);
        }
        
        const messages = {
            'safe': {
                text: 'Thank you for confirming you\'re safe! Continuing to monitor your location.',
                type: 'success'
            },
            'help': {
                text: 'Emergency response activated! Help is on the way. Stay calm and stay where you are.',
                type: 'warning'
            }
        };
        
        const message = messages[response];
        if (message) {
            this.showAlert(message.text, message.type);
        }
        
        // Play confirmation sound
        if (response === 'safe') {
            this.playNotificationSound();
        }
    }

    handleEmergencyTimeout(alert) {
        this.hideEmergencyModal();
        
        // Update alert status to escalated
        const alertIndex = this.alerts.findIndex(a => a.id === alert.id);
        if (alertIndex !== -1) {
            this.alerts[alertIndex].status = 'escalated';
            this.alerts[alertIndex].escalated_at = new Date().toISOString();
        }
        
        // Show escalation notification
        this.showAlert('No response received. Emergency escalation initiated - contacts have been notified.', 'danger');
        
        // Play emergency sound
        this.playEmergencySound();
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Emergency Escalated', {
                body: 'No response received. Emergency contacts have been notified.',
                icon: '/favicon.ico',
                requireInteraction: true
            });
        }
        
        // In real app, this would trigger emergency escalation
        console.log('Emergency escalation triggered for alert:', alert);
        
        // Re-render to show updated status
        this.render();
    }

    startCountdown(seconds) {
        let timeLeft = seconds;
        const countdownElement = document.getElementById('countdown');
        const totalSeconds = seconds;
        
        this.countdownInterval = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            countdownElement.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
            
            // Update countdown circle progress
            const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
            const circle = countdownElement.parentElement;
            if (circle && circle.classList.contains('countdown-circle')) {
                circle.style.background = `conic-gradient(#ef4444 ${progress}%, #e5e7eb ${progress}%)`;
            }
            
            // Change color as time runs out
            if (timeLeft <= 60) {
                countdownElement.style.color = '#ef4444';
                circle.style.borderColor = '#ef4444';
            } else if (timeLeft <= 300) {
                countdownElement.style.color = '#f59e0b';
                circle.style.borderColor = '#f59e0b';
            }
            
            // Play warning sounds
            if (timeLeft === 60 || timeLeft === 30 || timeLeft === 10) {
                this.playEmergencySound();
            }
            
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(this.countdownInterval);
            }
        }, 1000);
    }

    setupRealTimeAlerts() {
        console.log('🔄 Setting up real-time alerts');
        
        // Subscribe to real-time alert updates
        realTimeService.onAlertUpdate((alert) => {
            this.handleRealTimeAlert(alert);
        });
        
        // Subscribe to connection status changes
        realTimeService.onConnectionStatusChange((status) => {
            this.updateConnectionIndicator(status);
        });
        
        // Keep the polling as fallback (but less frequent)
        this.startAlertPolling();
    }

    // Update connection indicator in alerts view
    updateConnectionIndicator(status) {
        const indicator = document.getElementById('realtime-status');
        if (indicator) {
            const statusText = {
                connected: '🟢 Live',
                connecting: '🟡 Connecting',
                disconnected: '🔴 Offline',
                error: '🔴 Error'
            };
            
            indicator.textContent = statusText[status.status] || '🔴 Unknown';
            indicator.className = `realtime-status status-${status.status}`;
        }
    }

    handleRealTimeAlert(alert) {
        console.log('🚨 Real-time alert received:', alert);
        
        // Check if this is a new alert we haven't processed
        if (!this.lastAlertIds.has(alert.id)) {
            this.lastAlertIds.add(alert.id);
            
            // Add to alerts array if not already present
            const existingAlert = this.alerts.find(a => a.id === alert.id);
            if (!existingAlert) {
                this.alerts.unshift(alert); // Add to beginning
                
                // Update active alerts if this is an active alert
                if (alert.status === 'active') {
                    this.activeAlerts.unshift(alert);
                    
                    // Show emergency modal for critical alerts
                    if (alert.severity === 'critical' || alert.type === 'emergency') {
                        this.showEmergencyModal(alert);
                    }
                    
                    // Play sound and show notification
                    this.handleNewAlerts([alert]);
                }
                
                // Re-apply filters and re-render
                this.applyFilters();
                this.render();
            }
        }
    }

    startAlertPolling() {
        // Reduced frequency polling as backup (every 2 minutes)
        this.alertPolling = setInterval(async () => {
            console.log('🔄 Polling for alerts (backup)');
            await this.loadAlerts();
        }, 120000); // 2 minutes
    }

    getAlertIcon(type) {
        const icons = {
            'location_deviation': '📍',
            'check_in': '⏰',
            'emergency': '🚨',
            'geofence': '🚧',
            'battery_low': '🔋',
            'offline': '📶'
        };
        return icons[type] || '⚠️';
    }

    getAlertTitle(type) {
        const titles = {
            'location_deviation': 'Location Deviation',
            'check_in': 'Safety Check-in',
            'emergency': 'Emergency Alert',
            'geofence': 'Geofence Alert',
            'battery_low': 'Low Battery',
            'offline': 'Connection Lost'
        };
        return titles[type] || 'Safety Alert';
    }

    addAlertStyles() {
        if (!document.getElementById('alert-styles')) {
            const style = document.createElement('style');
            style.id = 'alert-styles';
            style.textContent = `
                /* Alert Controls */
                .alert-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                
                .alert-search {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                    flex: 1;
                    min-width: 200px;
                }
                
                .alert-search input {
                    flex: 1;
                    padding: 0.5rem 1rem;
                    border: 2px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 0.875rem;
                }
                
                .alert-search input:focus {
                    outline: none;
                    border-color: #2563eb;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
                
                .alert-settings {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .realtime-status {
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                    border: 1px solid;
                }

                .realtime-status.status-connected {
                    background: #d1fae5;
                    color: #065f46;
                    border-color: #10b981;
                }

                .realtime-status.status-connecting {
                    background: #fef3c7;
                    color: #92400e;
                    border-color: #f59e0b;
                }

                .realtime-status.status-disconnected,
                .realtime-status.status-error {
                    background: #fee2e2;
                    color: #991b1b;
                    border-color: #ef4444;
                }
                
                /* Alert Statistics */
                .alert-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                
                .stat-item {
                    text-align: center;
                    padding: 0.5rem;
                }
                
                .stat-number {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #2563eb;
                }
                
                .stat-label {
                    font-size: 0.75rem;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                
                /* Alert Filters */
                .alert-filters {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #e5e7eb;
                    flex-wrap: wrap;
                }
                
                .filter-btn {
                    padding: 0.5rem 1rem;
                    border: 1px solid #d1d5db;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                
                .filter-btn:hover {
                    border-color: #2563eb;
                    color: #2563eb;
                }
                
                .filter-btn.active {
                    background: #2563eb;
                    color: white;
                    border-color: #2563eb;
                }
                
                /* Alert Header Actions */
                .alert-header-actions {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }
                
                .form-select {
                    padding: 0.5rem;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    background: white;
                    font-size: 0.875rem;
                }
                
                /* Alert Summary */
                .alert-summary {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }
                
                /* Active Alert Items */
                .active-alert-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    border: 2px solid;
                    position: relative;
                    overflow: hidden;
                }
                
                .active-alert-item.severity-low {
                    background: #f0f9ff;
                    border-color: #7dd3fc;
                }
                
                .active-alert-item.severity-medium {
                    background: #fffbeb;
                    border-color: #fbbf24;
                }
                
                .active-alert-item.severity-high {
                    background: #fef2f2;
                    border-color: #fca5a5;
                }
                
                .active-alert-item.severity-critical {
                    background: #fef2f2;
                    border-color: #ef4444;
                    animation: pulse-border 2s infinite;
                }
                
                @keyframes pulse-border {
                    0%, 100% { border-color: #ef4444; }
                    50% { border-color: #dc2626; }
                }
                
                .alert-header-inline {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                
                .alert-meta {
                    display: flex;
                    gap: 1rem;
                    margin-top: 0.5rem;
                }
                
                .alert-meta small {
                    color: #6b7280;
                }
                
                .alert-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .alert-icon {
                    font-size: 2rem;
                }
                
                .alert-icon.pulsing {
                    animation: pulse-icon 1.5s infinite;
                }
                
                @keyframes pulse-icon {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                /* Alert Items */
                .alert-item {
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    transition: all 0.2s;
                }
                
                .alert-item:hover {
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    transform: translateY(-1px);
                }
                
                .alert-item.active {
                    border-color: #fca5a5;
                    background: #fef2f2;
                }
                
                .alert-item.responded {
                    border-color: #86efac;
                    background: #f0fdf4;
                }
                
                .alert-item.escalated {
                    border-color: #ef4444;
                    background: #fef2f2;
                }
                
                .alert-item.severity-critical {
                    border-left: 4px solid #ef4444;
                }
                
                .alert-item.severity-high {
                    border-left: 4px solid #f59e0b;
                }
                
                .alert-item.severity-medium {
                    border-left: 4px solid #3b82f6;
                }
                
                .alert-item.severity-low {
                    border-left: 4px solid #10b981;
                }
                
                .alert-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                
                .alert-type {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                }
                
                .alert-type-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                
                .alert-title {
                    font-weight: 600;
                    color: #374151;
                }
                
                .alert-time {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 0.25rem;
                }
                
                .time-ago {
                    color: #9ca3af;
                    font-style: italic;
                }
                
                .alert-status {
                    text-align: right;
                }
                
                .alert-message {
                    margin: 1rem 0;
                    color: #374151;
                }
                
                .alert-response {
                    margin: 1rem 0;
                    padding: 0.75rem;
                    background: #f3f4f6;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    border-left: 3px solid #10b981;
                }
                
                .response-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                
                .response-type {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                
                .response-type.safe {
                    background: #dcfce7;
                    color: #166534;
                }
                
                .response-type.help {
                    background: #fef2f2;
                    color: #dc2626;
                }
                
                .alert-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
                
                /* Enhanced Emergency Modal */
                .emergency-modal {
                    z-index: 1000;
                }
                
                .emergency-modal .modal-content {
                    max-width: 500px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .emergency-modal.severity-critical .modal-content {
                    border: 3px solid #ef4444;
                    animation: modal-pulse 2s infinite;
                }
                
                @keyframes modal-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                }
                
                .emergency-header {
                    margin-bottom: 2rem;
                    position: relative;
                }
                
                .emergency-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    animation: shake 0.5s infinite;
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                
                .emergency-header h2 {
                    color: #dc2626;
                    margin-bottom: 1rem;
                    font-size: 1.5rem;
                    font-weight: 700;
                }
                
                .severity-indicator {
                    display: inline-block;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
                
                .emergency-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                
                .btn-large {
                    padding: 1rem 2rem;
                    font-size: 1.125rem;
                    font-weight: 600;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                
                .btn-large:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                
                .emergency-info {
                    padding-top: 1.5rem;
                    border-top: 1px solid #e5e7eb;
                    color: #6b7280;
                }
                
                .countdown-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                
                .countdown-circle {
                    width: 80px;
                    height: 80px;
                    border: 4px solid #e5e7eb;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 0.5rem;
                    position: relative;
                    background: white;
                }
                
                .countdown-circle span {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #374151;
                }
                
                /* Modal Open Body Class */
                body.modal-open {
                    overflow: hidden;
                }
                
                /* Alert Details Modal */
                .alert-details-modal .modal-content {
                    max-width: 600px;
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #e5e7eb;
                    margin-bottom: 1.5rem;
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 0.5rem;
                    border-radius: 4px;
                }
                
                .modal-close:hover {
                    background: #f3f4f6;
                    color: #374151;
                }
                
                .alert-detail-item {
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #f3f4f6;
                }
                
                .alert-detail-item:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                }
                
                .alert-detail-item strong {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #374151;
                    font-weight: 600;
                }
                
                .alert-detail-item p {
                    margin: 0;
                    color: #6b7280;
                    line-height: 1.5;
                }
                
                .text-small {
                    font-size: 0.75rem;
                }
                
                /* Severity Badges */
                .severity-badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                
                .severity-low {
                    background: #dcfce7;
                    color: #166534;
                }
                
                .severity-medium {
                    background: #dbeafe;
                    color: #1e40af;
                }
                
                .severity-high {
                    background: #fef3c7;
                    color: #92400e;
                }
                
                .severity-critical {
                    background: #fecaca;
                    color: #991b1b;
                }
                
                /* Status Badges */
                .status-critical {
                    background: #fecaca;
                    color: #991b1b;
                    border: 1px solid #f87171;
                }
                
                /* Escalation Info */
                .escalation-info {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    background: #fef2f2;
                    border-radius: 6px;
                    border-left: 3px solid #ef4444;
                }
                
                .escalation-badge {
                    background: #fecaca;
                    color: #991b1b;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 0.875rem;
                }
                
                .escalation-steps {
                    margin-top: 0.5rem;
                    font-size: 0.75rem;
                    color: #6b7280;
                }
                
                .escalation-steps .step {
                    margin: 0.25rem 0;
                    padding-left: 1rem;
                }
                
                /* Empty State */
                .empty-state {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: #6b7280;
                }
                
                .empty-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                
                /* Search Highlighting */
                mark {
                    background: #fef3c7;
                    color: #92400e;
                    padding: 0.125rem 0.25rem;
                    border-radius: 2px;
                }
                
                /* Navigation Alert Pulse */
                .alert-pulse {
                    animation: nav-pulse 2s infinite;
                    position: relative;
                }
                
                .alert-pulse::after {
                    content: '';
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                    animation: pulse-dot 1s infinite;
                }
                
                @keyframes nav-pulse {
                    0%, 100% { background-color: transparent; }
                    50% { background-color: rgba(239, 68, 68, 0.1); }
                }
                
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
                
                @media (max-width: 768px) {
                    .alert-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .alert-search {
                        min-width: auto;
                    }
                    
                    .alert-settings {
                        justify-content: center;
                    }
                    
                    .alert-stats {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .alert-filters {
                        justify-content: center;
                        gap: 0.25rem;
                    }
                    
                    .filter-btn {
                        font-size: 0.75rem;
                        padding: 0.375rem 0.75rem;
                    }
                    
                    .active-alert-item {
                        flex-direction: column;
                        gap: 1rem;
                        text-align: center;
                    }
                    
                    .alert-content {
                        flex-direction: column;
                        text-align: center;
                        gap: 0.5rem;
                    }
                    
                    .alert-header {
                        flex-direction: column;
                        gap: 0.5rem;
                        text-align: center;
                    }
                    
                    .alert-type {
                        justify-content: center;
                    }
                    
                    .alert-actions {
                        justify-content: center;
                        flex-wrap: wrap;
                    }
                    
                    .emergency-modal .modal-content {
                        margin: 1rem;
                        max-width: calc(100vw - 2rem);
                    }
                    
                    .emergency-actions {
                        gap: 0.75rem;
                    }
                    
                    .btn-large {
                        font-size: 1rem;
                        padding: 0.875rem 1.5rem;
                    }
                    
                    .countdown-circle {
                        width: 60px;
                        height: 60px;
                    }
                    
                    .countdown-circle span {
                        font-size: 0.875rem;
                    }
                    
                    .alert-detail-item {
                        text-align: left;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Get critical alerts count
    getCriticalAlertsCount() {
        return this.activeAlerts.filter(alert => alert.severity === 'critical').length;
    }

    // Get average response time
    getAverageResponseTime() {
        const respondedAlerts = this.alerts.filter(a => a.response_time && a.created_at);
        if (respondedAlerts.length === 0) return 'N/A';
        
        const totalTime = respondedAlerts.reduce((sum, alert) => {
            const responseTime = new Date(alert.response_time) - new Date(alert.created_at);
            return sum + responseTime;
        }, 0);
        
        const avgMinutes = Math.round(totalTime / respondedAlerts.length / 60000);
        return `${avgMinutes}min`;
    }

    // Get alert duration
    getAlertDuration(createdAt) {
        const now = new Date();
        const created = new Date(createdAt);
        const diffMinutes = Math.floor((now - created) / 60000);
        
        if (diffMinutes < 60) {
            return `${diffMinutes}min`;
        } else if (diffMinutes < 1440) {
            return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}min`;
        } else {
            return `${Math.floor(diffMinutes / 1440)}d`;
        }
    }

    // Get time ago
    getTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffSeconds = Math.floor((now - date) / 1000);
        
        if (diffSeconds < 60) return 'just now';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}min ago`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
        return `${Math.floor(diffSeconds / 86400)}d ago`;
    }

    // Highlight search term in text
    highlightSearchTerm(text) {
        if (!this.searchQuery) return text;
        
        const regex = new RegExp(`(${this.searchQuery})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString();
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

    destroy() {
        if (this.alertPolling) {
            clearInterval(this.alertPolling);
        }
        if (this.emergencyTimeout) {
            clearTimeout(this.emergencyTimeout);
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }
}

export default AlertsComponent;