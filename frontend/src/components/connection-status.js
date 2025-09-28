// Connection Status Component
// Shows real-time connection status and provides connection controls

import realTimeService from '../services/realtime.js';

class ConnectionStatusComponent {
    constructor() {
        this.isVisible = false;
        this.connectionInfo = null;
        this.statusElement = null;
        this.detailsElement = null;
        
        this.init();
    }

    init() {
        this.createStatusIndicator();
        this.bindEvents();
        
        // Subscribe to connection status changes
        realTimeService.onConnectionStatusChange((connectionState) => {
            this.updateStatus(connectionState);
        });
    }

    createStatusIndicator() {
        // Create floating connection status indicator
        this.statusElement = document.createElement('div');
        this.statusElement.id = 'connection-status';
        this.statusElement.className = 'connection-status';
        this.statusElement.innerHTML = `
            <div class="status-indicator">
                <div class="status-dot"></div>
                <span class="status-text">Connecting...</span>
            </div>
        `;
        
        // Create detailed status panel (hidden by default)
        this.detailsElement = document.createElement('div');
        this.detailsElement.id = 'connection-details';
        this.detailsElement.className = 'connection-details hidden';
        
        document.body.appendChild(this.statusElement);
        document.body.appendChild(this.detailsElement);
        
        this.addStyles();
    }

    bindEvents() {
        // Toggle details on click
        this.statusElement.addEventListener('click', () => {
            this.toggleDetails();
        });

        // Close details when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.statusElement.contains(e.target) && !this.detailsElement.contains(e.target)) {
                this.hideDetails();
            }
        });

        // Keyboard shortcut to toggle (Ctrl+Shift+C)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.toggleDetails();
            }
        });
    }

    updateStatus(connectionState) {
        this.connectionInfo = {
            ...connectionState,
            ...realTimeService.getConnectionInfo()
        };
        
        const statusDot = this.statusElement.querySelector('.status-dot');
        const statusText = this.statusElement.querySelector('.status-text');
        
        // Update status indicator
        statusDot.className = `status-dot status-${connectionState.status}`;
        
        switch (connectionState.status) {
            case 'connected':
                statusText.textContent = this.connectionInfo.isWebSocket ? 'Live' : 'Polling';
                this.statusElement.className = 'connection-status connected';
                break;
            case 'connecting':
                statusText.textContent = 'Connecting...';
                this.statusElement.className = 'connection-status connecting';
                break;
            case 'disconnected':
                statusText.textContent = 'Offline';
                this.statusElement.className = 'connection-status disconnected';
                break;
            case 'error':
                statusText.textContent = 'Error';
                this.statusElement.className = 'connection-status error';
                break;
        }
        
        // Update details panel if visible
        if (this.isVisible) {
            this.updateDetails();
        }
    }

    toggleDetails() {
        if (this.isVisible) {
            this.hideDetails();
        } else {
            this.showDetails();
        }
    }

    showDetails() {
        this.isVisible = true;
        this.updateDetails();
        this.detailsElement.classList.remove('hidden');
        
        // Position details panel near status indicator
        const statusRect = this.statusElement.getBoundingClientRect();
        this.detailsElement.style.top = `${statusRect.bottom + 10}px`;
        this.detailsElement.style.right = '20px';
    }

    hideDetails() {
        this.isVisible = false;
        this.detailsElement.classList.add('hidden');
    }

    updateDetails() {
        if (!this.connectionInfo) return;
        
        const info = this.connectionInfo;
        const lastConnected = info.lastConnected ? 
            new Date(info.lastConnected).toLocaleTimeString() : 'Never';
        
        this.detailsElement.innerHTML = `
            <div class="connection-details-content">
                <div class="details-header">
                    <h4>Connection Status</h4>
                    <button class="close-btn">&times;</button>
                </div>
                
                <div class="details-body">
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value status-${info.status}">
                            ${this.getStatusText(info.status)}
                        </span>
                    </div>
                    
                    <div class="detail-item">
                        <span class="detail-label">Connection Type:</span>
                        <span class="detail-value">
                            ${info.isWebSocket ? '🔌 WebSocket' : '🔄 Polling'}
                        </span>
                    </div>
                    
                    <div class="detail-item">
                        <span class="detail-label">Last Connected:</span>
                        <span class="detail-value">${lastConnected}</span>
                    </div>
                    
                    ${info.status === 'error' && info.lastError ? `
                        <div class="detail-item">
                            <span class="detail-label">Error:</span>
                            <span class="detail-value error">${info.lastError}</span>
                        </div>
                    ` : ''}
                    
                    ${info.reconnectAttempts > 0 ? `
                        <div class="detail-item">
                            <span class="detail-label">Reconnect Attempts:</span>
                            <span class="detail-value">${info.reconnectAttempts}</span>
                        </div>
                    ` : ''}
                    
                    <div class="detail-item">
                        <span class="detail-label">Retry Count:</span>
                        <span class="detail-value">${info.retryCount || 0}</span>
                    </div>
                </div>
                
                <div class="details-actions">
                    <button id="test-connection" class="btn btn-secondary btn-small">
                        Test Connection
                    </button>
                    <button id="simulate-alert" class="btn btn-secondary btn-small">
                        Test Alert
                    </button>
                    <button id="simulate-location" class="btn btn-secondary btn-small">
                        Test Location
                    </button>
                </div>
                
                <div class="details-info">
                    <small>Press Ctrl+Shift+C to toggle this panel</small>
                </div>
            </div>
        `;
        
        // Bind action buttons
        this.bindDetailsActions();
    }

    bindDetailsActions() {
        const closeBtn = this.detailsElement.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideDetails());
        }

        const testConnectionBtn = this.detailsElement.querySelector('#test-connection');
        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', () => this.testConnection());
        }

        const simulateAlertBtn = this.detailsElement.querySelector('#simulate-alert');
        if (simulateAlertBtn) {
            simulateAlertBtn.addEventListener('click', () => this.simulateAlert());
        }

        const simulateLocationBtn = this.detailsElement.querySelector('#simulate-location');
        if (simulateLocationBtn) {
            simulateLocationBtn.addEventListener('click', () => this.simulateLocation());
        }
    }

    getStatusText(status) {
        const statusTexts = {
            'connected': '✅ Connected',
            'connecting': '🔄 Connecting',
            'disconnected': '❌ Disconnected',
            'error': '⚠️ Error'
        };
        return statusTexts[status] || status;
    }

    async testConnection() {
        console.log('🧪 Testing connection...');
        
        try {
            // Try to poll for updates manually
            await realTimeService.pollForUpdates();
            this.showMessage('Connection test successful!', 'success');
        } catch (error) {
            this.showMessage(`Connection test failed: ${error.message}`, 'error');
        }
    }

    simulateAlert() {
        console.log('🧪 Simulating test alert...');
        
        const testAlerts = [
            {
                type: 'test',
                message: 'This is a test alert to verify real-time functionality',
                severity: 'medium'
            },
            {
                type: 'battery_low',
                message: 'Test: Battery level is low (20%)',
                severity: 'high'
            },
            {
                type: 'location_deviation',
                message: 'Test: You appear to be off your planned route',
                severity: 'medium'
            }
        ];
        
        const randomAlert = testAlerts[Math.floor(Math.random() * testAlerts.length)];
        realTimeService.simulateAlert(randomAlert);
        
        this.showMessage('Test alert sent!', 'success');
    }

    simulateLocation() {
        console.log('🧪 Simulating location update...');
        
        // Generate random location near Tokyo
        const baseLocation = { lat: 35.6762, lng: 139.6503 };
        const randomOffset = () => (Math.random() - 0.5) * 0.01; // ~1km radius
        
        const testLocation = {
            lat: baseLocation.lat + randomOffset(),
            lng: baseLocation.lng + randomOffset(),
            accuracy: Math.floor(Math.random() * 20) + 5,
            user_id: 'test-user'
        };
        
        realTimeService.simulateLocationUpdate(testLocation);
        this.showMessage('Test location update sent!', 'success');
    }

    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `connection-message message-${type}`;
        messageEl.textContent = message;
        
        this.detailsElement.appendChild(messageEl);
        
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    addStyles() {
        if (!document.getElementById('connection-status-styles')) {
            const style = document.createElement('style');
            style.id = 'connection-status-styles';
            style.textContent = `
                .connection-status {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    background: white;
                    border-radius: 20px;
                    padding: 8px 16px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid #e5e7eb;
                }

                .connection-status:hover {
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    transform: translateY(-1px);
                }

                .connection-status.connected {
                    border-color: #10b981;
                    background: #f0fdf4;
                }

                .connection-status.connecting {
                    border-color: #f59e0b;
                    background: #fffbeb;
                }

                .connection-status.disconnected {
                    border-color: #6b7280;
                    background: #f9fafb;
                }

                .connection-status.error {
                    border-color: #ef4444;
                    background: #fef2f2;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                }

                .status-dot.status-connected {
                    background: #10b981;
                    animation: pulse-green 2s infinite;
                }

                .status-dot.status-connecting {
                    background: #f59e0b;
                    animation: pulse-yellow 1s infinite;
                }

                .status-dot.status-disconnected {
                    background: #6b7280;
                }

                .status-dot.status-error {
                    background: #ef4444;
                    animation: pulse-red 1s infinite;
                }

                @keyframes pulse-green {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                @keyframes pulse-yellow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                @keyframes pulse-red {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                .status-text {
                    font-size: 14px;
                    font-weight: 500;
                    color: #374151;
                }

                .connection-details {
                    position: fixed;
                    z-index: 1001;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                    border: 1px solid #e5e7eb;
                    min-width: 300px;
                    max-width: 400px;
                    transition: all 0.3s ease;
                }

                .connection-details.hidden {
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(-10px);
                }

                .connection-details-content {
                    padding: 0;
                }

                .details-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f9fafb;
                    border-radius: 12px 12px 0 0;
                }

                .details-header h4 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1f2937;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #6b7280;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                }

                .close-btn:hover {
                    background: #e5e7eb;
                    color: #374151;
                }

                .details-body {
                    padding: 16px 20px;
                }

                .detail-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .detail-item:last-child {
                    margin-bottom: 0;
                }

                .detail-label {
                    font-weight: 500;
                    color: #6b7280;
                    font-size: 14px;
                }

                .detail-value {
                    font-weight: 600;
                    color: #1f2937;
                    font-size: 14px;
                }

                .detail-value.status-connected {
                    color: #10b981;
                }

                .detail-value.status-connecting {
                    color: #f59e0b;
                }

                .detail-value.status-disconnected {
                    color: #6b7280;
                }

                .detail-value.status-error,
                .detail-value.error {
                    color: #ef4444;
                }

                .details-actions {
                    padding: 16px 20px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .details-actions .btn {
                    flex: 1;
                    min-width: 80px;
                }

                .details-info {
                    padding: 12px 20px;
                    background: #f9fafb;
                    border-radius: 0 0 12px 12px;
                    border-top: 1px solid #e5e7eb;
                }

                .details-info small {
                    color: #6b7280;
                    font-size: 12px;
                }

                .connection-message {
                    margin-top: 8px;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .connection-message.message-success {
                    background: #d1fae5;
                    color: #065f46;
                    border: 1px solid #a7f3d0;
                }

                .connection-message.message-error {
                    background: #fee2e2;
                    color: #991b1b;
                    border: 1px solid #fca5a5;
                }

                .connection-message.message-info {
                    background: #dbeafe;
                    color: #1e40af;
                    border: 1px solid #93c5fd;
                }

                /* Mobile responsiveness */
                @media (max-width: 768px) {
                    .connection-status {
                        top: 10px;
                        right: 10px;
                        padding: 6px 12px;
                    }

                    .status-text {
                        font-size: 12px;
                    }

                    .connection-details {
                        right: 10px;
                        left: 10px;
                        min-width: auto;
                        max-width: none;
                    }

                    .details-actions {
                        flex-direction: column;
                    }

                    .details-actions .btn {
                        width: 100%;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Public API
    show() {
        this.statusElement.style.display = 'block';
    }

    hide() {
        this.statusElement.style.display = 'none';
        this.hideDetails();
    }

    destroy() {
        if (this.statusElement && this.statusElement.parentNode) {
            this.statusElement.parentNode.removeChild(this.statusElement);
        }
        if (this.detailsElement && this.detailsElement.parentNode) {
            this.detailsElement.parentNode.removeChild(this.detailsElement);
        }
    }
}

export default ConnectionStatusComponent;