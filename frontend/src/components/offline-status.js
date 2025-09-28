// Offline Status Component
class OfflineStatusComponent {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineQueue = [];
        this.init();
    }

    init() {
        this.createOfflineIndicator();
        this.bindEvents();
        this.updateStatus();
    }

    createOfflineIndicator() {
        // Create offline status bar
        const statusBar = document.createElement('div');
        statusBar.id = 'offline-status';
        statusBar.className = 'offline-status hidden';
        statusBar.innerHTML = `
            <div class="offline-content">
                <span class="offline-icon">📡</span>
                <span class="offline-text">You're offline. Some features may be limited.</span>
                <button class="offline-retry btn-small">Retry Connection</button>
            </div>
        `;
        
        // Insert at top of body
        document.body.insertBefore(statusBar, document.body.firstChild);
        
        // Add styles
        this.addOfflineStyles();
        
        // Bind retry button
        statusBar.querySelector('.offline-retry').addEventListener('click', () => {
            this.checkConnection();
        });
    }

    addOfflineStyles() {
        if (!document.getElementById('offline-status-styles')) {
            const style = document.createElement('style');
            style.id = 'offline-status-styles';
            style.textContent = `
                .offline-status {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    padding: 0.75rem;
                    text-align: center;
                    z-index: 10000;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transform: translateY(-100%);
                    transition: transform 0.3s ease-in-out;
                }
                
                .offline-status.show {
                    transform: translateY(0);
                }
                
                .offline-status.hidden {
                    transform: translateY(-100%);
                }
                
                .offline-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                
                .offline-icon {
                    font-size: 1.2rem;
                }
                
                .offline-text {
                    font-weight: 500;
                }
                
                .offline-retry {
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: background 0.2s;
                }
                
                .offline-retry:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                .offline-queue-indicator {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #f59e0b;
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    z-index: 9999;
                    cursor: pointer;
                }
                
                .offline-data-badge {
                    display: inline-block;
                    background: #f59e0b;
                    color: white;
                    font-size: 0.75rem;
                    padding: 0.125rem 0.375rem;
                    border-radius: 10px;
                    margin-left: 0.5rem;
                    vertical-align: middle;
                }
                
                /* Adjust main content when offline bar is shown */
                body.offline-mode #app {
                    padding-top: 60px;
                }
                
                @media (max-width: 768px) {
                    .offline-content {
                        flex-direction: column;
                        gap: 0.5rem;
                    }
                    
                    .offline-status {
                        padding: 1rem 0.5rem;
                    }
                    
                    body.offline-mode #app {
                        padding-top: 80px;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    bindEvents() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            this.handleOffline();
        });
        
        // Listen for service worker messages
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'OFFLINE_REQUEST_QUEUED') {
                    this.addToOfflineQueue(event.data.request);
                }
            });
        }
    }

    handleOnline() {
        console.log('📡 Connection restored');
        this.isOnline = true;
        this.updateStatus();
        this.syncOfflineQueue();
        this.showConnectionToast('Connection restored', 'success');
    }

    handleOffline() {
        console.log('📡 Connection lost');
        this.isOnline = false;
        this.updateStatus();
        this.showConnectionToast('You are now offline', 'warning');
    }

    updateStatus() {
        const statusBar = document.getElementById('offline-status');
        const body = document.body;
        
        if (this.isOnline) {
            statusBar.classList.remove('show');
            statusBar.classList.add('hidden');
            body.classList.remove('offline-mode');
            this.removeOfflineDataBadges();
        } else {
            statusBar.classList.remove('hidden');
            statusBar.classList.add('show');
            body.classList.add('offline-mode');
            this.addOfflineDataBadges();
        }
        
        // Update queue indicator
        this.updateQueueIndicator();
    }

    addOfflineDataBadges() {
        // Add badges to indicate cached/offline data
        const cards = document.querySelectorAll('.card:not(.has-offline-badge)');
        cards.forEach(card => {
            const badge = document.createElement('span');
            badge.className = 'offline-data-badge';
            badge.textContent = 'Offline Data';
            badge.title = 'This data was loaded from cache';
            
            const header = card.querySelector('.card-header, .card-title');
            if (header) {
                header.appendChild(badge);
                card.classList.add('has-offline-badge');
            }
        });
    }

    removeOfflineDataBadges() {
        const badges = document.querySelectorAll('.offline-data-badge');
        badges.forEach(badge => badge.remove());
        
        const cards = document.querySelectorAll('.has-offline-badge');
        cards.forEach(card => card.classList.remove('has-offline-badge'));
    }

    addToOfflineQueue(request) {
        this.offlineQueue.push({
            ...request,
            timestamp: Date.now()
        });
        this.updateQueueIndicator();
    }

    updateQueueIndicator() {
        let indicator = document.getElementById('offline-queue-indicator');
        
        if (this.offlineQueue.length > 0) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'offline-queue-indicator';
                indicator.className = 'offline-queue-indicator';
                document.body.appendChild(indicator);
                
                indicator.addEventListener('click', () => {
                    this.showQueueDetails();
                });
            }
            
            indicator.textContent = `${this.offlineQueue.length} queued`;
            indicator.title = 'Click to view queued requests';
        } else if (indicator) {
            indicator.remove();
        }
    }

    showQueueDetails() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal offline-queue-modal">
                <div class="modal-header">
                    <h3>Queued Requests</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>These requests will be sent when you're back online:</p>
                    <div class="queue-list">
                        ${this.offlineQueue.map(item => `
                            <div class="queue-item">
                                <div class="queue-method">${item.method}</div>
                                <div class="queue-url">${item.url}</div>
                                <div class="queue-time">${new Date(item.timestamp).toLocaleTimeString()}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-close">Close</button>
                    <button class="btn btn-primary" onclick="this.checkConnection()">Retry Now</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Bind close events
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async syncOfflineQueue() {
        if (this.offlineQueue.length === 0) return;
        
        console.log(`📡 Syncing ${this.offlineQueue.length} offline requests...`);
        
        const successfulSyncs = [];
        
        for (const request of this.offlineQueue) {
            try {
                const response = await fetch(request.url, {
                    method: request.method,
                    headers: request.headers,
                    body: request.body
                });
                
                if (response.ok) {
                    successfulSyncs.push(request);
                    console.log('✅ Synced:', request.method, request.url);
                }
            } catch (error) {
                console.error('❌ Failed to sync:', request.url, error);
            }
        }
        
        // Remove successfully synced requests
        this.offlineQueue = this.offlineQueue.filter(
            request => !successfulSyncs.includes(request)
        );
        
        this.updateQueueIndicator();
        
        if (successfulSyncs.length > 0) {
            this.showConnectionToast(
                `Synced ${successfulSyncs.length} offline requests`, 
                'success'
            );
        }
    }

    async checkConnection() {
        try {
            // Try to fetch a small resource to test connectivity
            const response = await fetch('/manifest.json', { 
                cache: 'no-cache',
                mode: 'no-cors'
            });
            
            if (!this.isOnline) {
                this.handleOnline();
            }
        } catch (error) {
            console.log('Connection check failed:', error);
            this.showConnectionToast('Still offline', 'warning');
        }
    }

    showConnectionToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `connection-toast toast-${type}`;
        toast.textContent = message;
        
        // Add toast styles if not present
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .connection-toast {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    color: white;
                    font-weight: 500;
                    z-index: 10001;
                    animation: slideUp 0.3s ease-out;
                }
                
                .toast-success {
                    background: #10b981;
                }
                
                .toast-warning {
                    background: #f59e0b;
                }
                
                .toast-info {
                    background: #3b82f6;
                }
                
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Public methods for other components to use
    getOfflineStatus() {
        return {
            isOnline: this.isOnline,
            queueLength: this.offlineQueue.length,
            lastSync: this.lastSyncTime
        };
    }

    markDataAsOffline(element) {
        if (!this.isOnline && element && !element.querySelector('.offline-data-badge')) {
            const badge = document.createElement('span');
            badge.className = 'offline-data-badge';
            badge.textContent = 'Cached';
            badge.title = 'This data was loaded from cache';
            element.appendChild(badge);
        }
    }
}

export default OfflineStatusComponent;