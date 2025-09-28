// Service Worker for Tourism Safety Tracker PWA
const CACHE_NAME = 'tourism-safety-tracker-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/src/main.js',
    '/src/styles/main.css',
    '/src/components/auth.js',
    '/src/components/trips.js',
    '/src/components/alerts.js',
    '/src/components/connection-status.js',
    '/src/services/realtime.js',
    '/src/api/client.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/axios/dist/axios.min.js'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
    /\/api\/trips/,
    /\/api\/alerts/,
    /\/api\/locations/,
    /\/api\/user/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('SW: Installing service worker...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('SW: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .catch((error) => {
                console.error('SW: Failed to cache static files:', error);
            })
    );
    
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('SW: Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
    );
    
    // Take control of all clients immediately
    self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (request.method === 'GET') {
        if (isStaticFile(request.url)) {
            // Static files - cache first strategy
            event.respondWith(cacheFirst(request));
        } else if (isAPIRequest(request.url)) {
            // API requests - network first with cache fallback
            event.respondWith(networkFirstWithCache(request));
        } else {
            // Other requests - network first
            event.respondWith(networkFirst(request));
        }
    } else if (request.method === 'POST' || request.method === 'PUT') {
        // Handle offline POST/PUT requests
        event.respondWith(handleOfflineWrite(request));
    }
});

// Cache first strategy for static files
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('SW: Cache first failed:', error);
        return new Response('Offline - content not available', { status: 503 });
    }
}

// Network first with cache fallback for API requests
async function networkFirstWithCache(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful API responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        // If network fails, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Add offline indicator to cached response
            const response = cachedResponse.clone();
            response.headers.set('X-Served-From', 'cache');
            return response;
        }
        
        return networkResponse;
    } catch (error) {
        console.log('SW: Network failed, trying cache for:', request.url);
        
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            const response = cachedResponse.clone();
            response.headers.set('X-Served-From', 'cache');
            return response;
        }
        
        // Return offline response for API requests
        if (isAPIRequest(request.url)) {
            return new Response(
                JSON.stringify({
                    error: 'Offline - using cached data',
                    offline: true,
                    data: []
                }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Served-From': 'offline'
                    }
                }
            );
        }
        
        return new Response('Offline - content not available', { status: 503 });
    }
}

// Network first strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response('Offline', { status: 503 });
    }
}

// Handle offline write operations
async function handleOfflineWrite(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        // Store for background sync when online
        await storeOfflineRequest(request);
        
        // Return success response to prevent UI errors
        return new Response(
            JSON.stringify({
                success: true,
                offline: true,
                message: 'Request queued for when online'
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Served-From': 'offline-queue'
                }
            }
        );
    }
}

// Store offline requests for background sync
async function storeOfflineRequest(request) {
    const requestData = {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: await request.text(),
        timestamp: Date.now()
    };
    
    // Store in IndexedDB for background sync
    const db = await openOfflineDB();
    const transaction = db.transaction(['offline-requests'], 'readwrite');
    const store = transaction.objectStore('offline-requests');
    await store.add(requestData);
}

// Open IndexedDB for offline storage
function openOfflineDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('tourism-safety-offline', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object stores
            if (!db.objectStoreNames.contains('offline-requests')) {
                const store = db.createObjectStore('offline-requests', { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                store.createIndex('timestamp', 'timestamp');
            }
            
            if (!db.objectStoreNames.contains('cached-data')) {
                const store = db.createObjectStore('cached-data', { keyPath: 'key' });
                store.createIndex('timestamp', 'timestamp');
            }
        };
    });
}

// Background sync for offline requests
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(syncOfflineRequests());
    }
});

// Sync offline requests when back online
async function syncOfflineRequests() {
    try {
        const db = await openOfflineDB();
        const transaction = db.transaction(['offline-requests'], 'readonly');
        const store = transaction.objectStore('offline-requests');
        const requests = await store.getAll();
        
        for (const requestData of requests) {
            try {
                const response = await fetch(requestData.url, {
                    method: requestData.method,
                    headers: requestData.headers,
                    body: requestData.body
                });
                
                if (response.ok) {
                    // Remove successfully synced request
                    const deleteTransaction = db.transaction(['offline-requests'], 'readwrite');
                    const deleteStore = deleteTransaction.objectStore('offline-requests');
                    await deleteStore.delete(requestData.id);
                    
                    console.log('SW: Synced offline request:', requestData.url);
                }
            } catch (error) {
                console.error('SW: Failed to sync request:', error);
            }
        }
    } catch (error) {
        console.error('SW: Background sync failed:', error);
    }
}

// Utility functions
function isStaticFile(url) {
    return STATIC_FILES.some(file => url.includes(file)) ||
           url.includes('.css') ||
           url.includes('.js') ||
           url.includes('.html') ||
           url.includes('.png') ||
           url.includes('.jpg') ||
           url.includes('.svg');
}

function isAPIRequest(url) {
    return API_CACHE_PATTERNS.some(pattern => pattern.test(url)) ||
           url.includes('/api/');
}

// Handle push notifications
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'New safety alert',
            icon: '/src/assets/icon-192.png',
            badge: '/src/assets/badge-72.png',
            tag: data.tag || 'safety-alert',
            requireInteraction: data.requireInteraction || false,
            actions: [
                {
                    action: 'view',
                    title: 'View Alert'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'Safety Alert', options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/?alert=' + event.notification.tag)
        );
    }
});

// Message handling for communication with main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_OFFLINE_STATUS') {
        event.ports[0].postMessage({
            offline: !navigator.onLine,
            cacheSize: getCacheSize()
        });
    }
});

// Get cache size for status reporting
async function getCacheSize() {
    try {
        const cacheNames = await caches.keys();
        let totalSize = 0;
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            totalSize += keys.length;
        }
        
        return totalSize;
    } catch (error) {
        return 0;
    }
}

console.log('SW: Service worker loaded');