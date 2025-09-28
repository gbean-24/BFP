// Offline Data Synchronization Service
class OfflineSyncService {
    constructor() {
        this.dbName = 'tourism-safety-offline';
        this.dbVersion = 1;
        this.db = null;
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.lastSyncTime = localStorage.getItem('lastSyncTime') || null;
        this.init();
    }

    async init() {
        await this.openDatabase();
        this.bindEvents();
        this.startPeriodicSync();
    }

    async openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open offline database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('📦 Offline database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createObjectStores(db);
            };
        });
    }

    createObjectStores(db) {
        // Offline requests queue
        if (!db.objectStoreNames.contains('offline-requests')) {
            const requestStore = db.createObjectStore('offline-requests', {
                keyPath: 'id',
                autoIncrement: true
            });
            requestStore.createIndex('timestamp', 'timestamp');
            requestStore.createIndex('method', 'method');
            requestStore.createIndex('url', 'url');
        }

        // Cached API responses
        if (!db.objectStoreNames.contains('cached-responses')) {
            const responseStore = db.createObjectStore('cached-responses', {
                keyPath: 'key'
            });
            responseStore.createIndex('timestamp', 'timestamp');
            responseStore.createIndex('expiry', 'expiry');
        }

        // User data cache
        if (!db.objectStoreNames.contains('user-data')) {
            const userStore = db.createObjectStore('user-data', {
                keyPath: 'type'
            });
            userStore.createIndex('lastModified', 'lastModified');
        }

        // Trip data cache
        if (!db.objectStoreNames.contains('trips-cache')) {
            const tripsStore = db.createObjectStore('trips-cache', {
                keyPath: 'id'
            });
            tripsStore.createIndex('lastModified', 'lastModified');
            tripsStore.createIndex('status', 'status');
        }

        // Alerts cache
        if (!db.objectStoreNames.contains('alerts-cache')) {
            const alertsStore = db.createObjectStore('alerts-cache', {
                keyPath: 'id'
            });
            alertsStore.createIndex('timestamp', 'timestamp');
            alertsStore.createIndex('severity', 'severity');
        }

        console.log('📦 Offline database schema created');
    }

    bindEvents() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // Listen for visibility change to sync when app becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline) {
                this.syncOfflineData();
            }
        });
    }

    startPeriodicSync() {
        // Sync every 5 minutes when online
        setInterval(() => {
            if (this.isOnline) {
                this.syncOfflineData();
            }
        }, 5 * 60 * 1000);
    }

    // Cache API responses
    async cacheResponse(key, data, ttl = 3600000) { // Default 1 hour TTL
        if (!this.db) return;

        const expiry = Date.now() + ttl;
        const cacheEntry = {
            key,
            data,
            timestamp: Date.now(),
            expiry
        };

        try {
            const transaction = this.db.transaction(['cached-responses'], 'readwrite');
            const store = transaction.objectStore('cached-responses');
            await store.put(cacheEntry);
            console.log('📦 Cached response:', key);
        } catch (error) {
            console.error('Failed to cache response:', error);
        }
    }

    // Get cached response
    async getCachedResponse(key) {
        if (!this.db) return null;

        try {
            const transaction = this.db.transaction(['cached-responses'], 'readonly');
            const store = transaction.objectStore('cached-responses');
            const result = await store.get(key);

            if (result && result.expiry > Date.now()) {
                console.log('📦 Retrieved cached response:', key);
                return result.data;
            } else if (result) {
                // Remove expired cache
                this.removeCachedResponse(key);
            }

            return null;
        } catch (error) {
            console.error('Failed to get cached response:', error);
            return null;
        }
    }

    // Remove cached response
    async removeCachedResponse(key) {
        if (!this.db) return;

        try {
            const transaction = this.db.transaction(['cached-responses'], 'readwrite');
            const store = transaction.objectStore('cached-responses');
            await store.delete(key);
        } catch (error) {
            console.error('Failed to remove cached response:', error);
        }
    }

    // Queue offline request
    async queueOfflineRequest(method, url, data = null, headers = {}) {
        if (!this.db) return;

        const request = {
            method,
            url,
            data,
            headers,
            timestamp: Date.now(),
            retryCount: 0
        };

        try {
            const transaction = this.db.transaction(['offline-requests'], 'readwrite');
            const store = transaction.objectStore('offline-requests');
            const result = await store.add(request);
            
            console.log('📦 Queued offline request:', method, url);
            this.syncQueue.push({ ...request, id: result });
            
            return result;
        } catch (error) {
            console.error('Failed to queue offline request:', error);
        }
    }

    // Get all offline requests
    async getOfflineRequests() {
        if (!this.db) return [];

        try {
            const transaction = this.db.transaction(['offline-requests'], 'readonly');
            const store = transaction.objectStore('offline-requests');
            const requests = await store.getAll();
            return requests;
        } catch (error) {
            console.error('Failed to get offline requests:', error);
            return [];
        }
    }

    // Remove offline request
    async removeOfflineRequest(id) {
        if (!this.db) return;

        try {
            const transaction = this.db.transaction(['offline-requests'], 'readwrite');
            const store = transaction.objectStore('offline-requests');
            await store.delete(id);
            
            // Remove from sync queue
            this.syncQueue = this.syncQueue.filter(req => req.id !== id);
        } catch (error) {
            console.error('Failed to remove offline request:', error);
        }
    }

    // Sync offline data
    async syncOfflineData() {
        if (!this.isOnline || !this.db) return;

        console.log('🔄 Starting offline data sync...');

        const requests = await this.getOfflineRequests();
        let successCount = 0;
        let failCount = 0;

        for (const request of requests) {
            try {
                const response = await fetch(request.url, {
                    method: request.method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...request.headers
                    },
                    body: request.data ? JSON.stringify(request.data) : null
                });

                if (response.ok) {
                    await this.removeOfflineRequest(request.id);
                    successCount++;
                    console.log('✅ Synced offline request:', request.method, request.url);
                } else {
                    // Increment retry count
                    request.retryCount = (request.retryCount || 0) + 1;
                    
                    // Remove if too many retries
                    if (request.retryCount >= 3) {
                        await this.removeOfflineRequest(request.id);
                        console.warn('❌ Removed failed request after 3 retries:', request.url);
                    }
                    failCount++;
                }
            } catch (error) {
                console.error('❌ Failed to sync request:', request.url, error);
                failCount++;
            }
        }

        this.lastSyncTime = new Date().toISOString();
        localStorage.setItem('lastSyncTime', this.lastSyncTime);

        if (successCount > 0 || failCount > 0) {
            console.log(`🔄 Sync complete: ${successCount} success, ${failCount} failed`);
            
            // Notify other components about sync completion
            window.dispatchEvent(new CustomEvent('offline-sync-complete', {
                detail: { successCount, failCount }
            }));
        }
    }

    // Cache trips data
    async cacheTrips(trips) {
        if (!this.db) return;

        try {
            const transaction = this.db.transaction(['trips-cache'], 'readwrite');
            const store = transaction.objectStore('trips-cache');

            for (const trip of trips) {
                await store.put({
                    ...trip,
                    lastModified: Date.now()
                });
            }

            console.log('📦 Cached trips data');
        } catch (error) {
            console.error('Failed to cache trips:', error);
        }
    }

    // Get cached trips
    async getCachedTrips() {
        if (!this.db) return [];

        try {
            const transaction = this.db.transaction(['trips-cache'], 'readonly');
            const store = transaction.objectStore('trips-cache');
            const trips = await store.getAll();
            
            console.log('📦 Retrieved cached trips');
            return trips;
        } catch (error) {
            console.error('Failed to get cached trips:', error);
            return [];
        }
    }

    // Cache alerts data
    async cacheAlerts(alerts) {
        if (!this.db) return;

        try {
            const transaction = this.db.transaction(['alerts-cache'], 'readwrite');
            const store = transaction.objectStore('alerts-cache');

            for (const alert of alerts) {
                await store.put(alert);
            }

            console.log('📦 Cached alerts data');
        } catch (error) {
            console.error('Failed to cache alerts:', error);
        }
    }

    // Get cached alerts
    async getCachedAlerts() {
        if (!this.db) return [];

        try {
            const transaction = this.db.transaction(['alerts-cache'], 'readonly');
            const store = transaction.objectStore('alerts-cache');
            const alerts = await store.getAll();
            
            console.log('📦 Retrieved cached alerts');
            return alerts;
        } catch (error) {
            console.error('Failed to get cached alerts:', error);
            return [];
        }
    }

    // Cache user data
    async cacheUserData(type, data) {
        if (!this.db) return;

        try {
            const transaction = this.db.transaction(['user-data'], 'readwrite');
            const store = transaction.objectStore('user-data');
            
            await store.put({
                type,
                data,
                lastModified: Date.now()
            });

            console.log('📦 Cached user data:', type);
        } catch (error) {
            console.error('Failed to cache user data:', error);
        }
    }

    // Get cached user data
    async getCachedUserData(type) {
        if (!this.db) return null;

        try {
            const transaction = this.db.transaction(['user-data'], 'readonly');
            const store = transaction.objectStore('user-data');
            const result = await store.get(type);
            
            if (result) {
                console.log('📦 Retrieved cached user data:', type);
                return result.data;
            }

            return null;
        } catch (error) {
            console.error('Failed to get cached user data:', error);
            return null;
        }
    }

    // Clean expired cache
    async cleanExpiredCache() {
        if (!this.db) return;

        try {
            const transaction = this.db.transaction(['cached-responses'], 'readwrite');
            const store = transaction.objectStore('cached-responses');
            const index = store.index('expiry');
            const range = IDBKeyRange.upperBound(Date.now());
            
            const expiredEntries = await index.getAll(range);
            
            for (const entry of expiredEntries) {
                await store.delete(entry.key);
            }

            if (expiredEntries.length > 0) {
                console.log(`📦 Cleaned ${expiredEntries.length} expired cache entries`);
            }
        } catch (error) {
            console.error('Failed to clean expired cache:', error);
        }
    }

    // Get sync status
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            lastSyncTime: this.lastSyncTime,
            queueLength: this.syncQueue.length,
            dbReady: !!this.db
        };
    }

    // Force sync
    async forceSync() {
        if (this.isOnline) {
            await this.syncOfflineData();
            await this.cleanExpiredCache();
        }
    }
}

// Create singleton instance
const offlineSyncService = new OfflineSyncService();

export default offlineSyncService;