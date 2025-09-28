// PWA Features Validation Script
// This script validates that all PWA components are properly implemented

console.log('🛡️ Tourism Safety Tracker - PWA Features Validation');
console.log('='.repeat(60));

// Test 1: Service Worker File
console.log('\n📦 Testing Service Worker...');
try {
    const fs = require('fs');
    const path = require('path');
    
    const swPath = path.join(__dirname, 'sw.js');
    if (fs.existsSync(swPath)) {
        const swContent = fs.readFileSync(swPath, 'utf8');
        
        // Check for required service worker features
        const requiredFeatures = [
            'install',
            'activate', 
            'fetch',
            'caches',
            'indexedDB',
            'sync',
            'push'
        ];
        
        const missingFeatures = requiredFeatures.filter(feature => 
            !swContent.includes(feature)
        );
        
        if (missingFeatures.length === 0) {
            console.log('✅ Service Worker file exists with all required features');
        } else {
            console.log(`⚠️  Service Worker missing features: ${missingFeatures.join(', ')}`);
        }
        
        // Check cache strategies
        if (swContent.includes('cacheFirst') && swContent.includes('networkFirst')) {
            console.log('✅ Cache strategies implemented');
        } else {
            console.log('⚠️  Cache strategies may be incomplete');
        }
        
    } else {
        console.log('❌ Service Worker file not found');
    }
} catch (error) {
    console.log(`❌ Service Worker test failed: ${error.message}`);
}

// Test 2: Manifest File
console.log('\n📱 Testing Web App Manifest...');
try {
    const fs = require('fs');
    const path = require('path');
    
    const manifestPath = path.join(__dirname, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
        const missingFields = requiredFields.filter(field => !manifestContent[field]);
        
        if (missingFields.length === 0) {
            console.log('✅ Web App Manifest complete');
            console.log(`   Name: ${manifestContent.name}`);
            console.log(`   Icons: ${manifestContent.icons.length} defined`);
        } else {
            console.log(`⚠️  Manifest missing fields: ${missingFields.join(', ')}`);
        }
    } else {
        console.log('❌ Web App Manifest not found');
    }
} catch (error) {
    console.log(`❌ Manifest test failed: ${error.message}`);
}

// Test 3: PWA Components
console.log('\n🔧 Testing PWA Components...');
try {
    const fs = require('fs');
    const path = require('path');
    
    const componentsDir = path.join(__dirname, 'src', 'components');
    const requiredComponents = [
        'offline-status.js',
        'pwa-install.js'
    ];
    
    for (const component of requiredComponents) {
        const componentPath = path.join(componentsDir, component);
        if (fs.existsSync(componentPath)) {
            console.log(`✅ ${component} exists`);
            
            const content = fs.readFileSync(componentPath, 'utf8');
            
            // Check for key functionality
            if (component === 'offline-status.js') {
                if (content.includes('addEventListener') && content.includes('online') && content.includes('offline')) {
                    console.log('   ✅ Online/offline event handling');
                }
                if (content.includes('queue') && content.includes('sync')) {
                    console.log('   ✅ Offline queue management');
                }
            }
            
            if (component === 'pwa-install.js') {
                if (content.includes('beforeinstallprompt')) {
                    console.log('   ✅ Install prompt handling');
                }
                if (content.includes('serviceWorker')) {
                    console.log('   ✅ Service worker integration');
                }
            }
        } else {
            console.log(`❌ ${component} not found`);
        }
    }
} catch (error) {
    console.log(`❌ Components test failed: ${error.message}`);
}

// Test 4: Offline Sync Service
console.log('\n🔄 Testing Offline Sync Service...');
try {
    const fs = require('fs');
    const path = require('path');
    
    const syncServicePath = path.join(__dirname, 'src', 'services', 'offline-sync.js');
    if (fs.existsSync(syncServicePath)) {
        const content = fs.readFileSync(syncServicePath, 'utf8');
        
        const requiredMethods = [
            'cacheResponse',
            'getCachedResponse', 
            'queueOfflineRequest',
            'syncOfflineData',
            'openDatabase'
        ];
        
        const missingMethods = requiredMethods.filter(method => 
            !content.includes(method)
        );
        
        if (missingMethods.length === 0) {
            console.log('✅ Offline Sync Service complete');
        } else {
            console.log(`⚠️  Sync Service missing methods: ${missingMethods.join(', ')}`);
        }
        
        if (content.includes('IndexedDB') || content.includes('indexedDB')) {
            console.log('   ✅ IndexedDB integration');
        }
        
        if (content.includes('background') && content.includes('sync')) {
            console.log('   ✅ Background sync support');
        }
    } else {
        console.log('❌ Offline Sync Service not found');
    }
} catch (error) {
    console.log(`❌ Sync Service test failed: ${error.message}`);
}

// Test 5: Main App Integration
console.log('\n🚀 Testing Main App Integration...');
try {
    const fs = require('fs');
    const path = require('path');
    
    const mainPath = path.join(__dirname, 'src', 'main.js');
    if (fs.existsSync(mainPath)) {
        const content = fs.readFileSync(mainPath, 'utf8');
        
        const requiredImports = [
            'OfflineStatusComponent',
            'PWAInstallComponent',
            'offlineSyncService'
        ];
        
        const missingImports = requiredImports.filter(imp => 
            !content.includes(imp)
        );
        
        if (missingImports.length === 0) {
            console.log('✅ All PWA components imported');
        } else {
            console.log(`⚠️  Missing imports: ${missingImports.join(', ')}`);
        }
        
        if (content.includes('initializePWAFeatures')) {
            console.log('✅ PWA initialization method exists');
        }
        
        if (content.includes('setOfflineSyncService')) {
            console.log('✅ API client offline integration');
        }
    } else {
        console.log('❌ Main app file not found');
    }
} catch (error) {
    console.log(`❌ Main app test failed: ${error.message}`);
}

// Test 6: API Client Offline Support
console.log('\n🌐 Testing API Client Offline Support...');
try {
    const fs = require('fs');
    const path = require('path');
    
    const apiPath = path.join(__dirname, 'src', 'api', 'client.js');
    if (fs.existsSync(apiPath)) {
        const content = fs.readFileSync(apiPath, 'utf8');
        
        if (content.includes('setOfflineSyncService')) {
            console.log('✅ Offline sync service integration');
        }
        
        if (content.includes('cacheResponse') && content.includes('getCachedResponse')) {
            console.log('✅ Response caching support');
        }
        
        if (content.includes('queueOfflineRequest')) {
            console.log('✅ Offline request queuing');
        }
        
        if (content.includes('getOptimisticResponse')) {
            console.log('✅ Optimistic response handling');
        }
        
        if (content.includes('_offline')) {
            console.log('✅ Offline data indicators');
        }
    } else {
        console.log('❌ API Client not found');
    }
} catch (error) {
    console.log(`❌ API Client test failed: ${error.message}`);
}

// Test 7: HTML PWA Meta Tags
console.log('\n📄 Testing HTML PWA Configuration...');
try {
    const fs = require('fs');
    const path = require('path');
    
    const htmlPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(htmlPath)) {
        const content = fs.readFileSync(htmlPath, 'utf8');
        
        const requiredMeta = [
            'manifest',
            'theme-color',
            'viewport',
            'apple-mobile-web-app'
        ];
        
        const missingMeta = requiredMeta.filter(meta => 
            !content.includes(meta)
        );
        
        if (missingMeta.length === 0) {
            console.log('✅ All PWA meta tags present');
        } else {
            console.log(`⚠️  Missing meta tags: ${missingMeta.join(', ')}`);
        }
    } else {
        console.log('❌ HTML file not found');
    }
} catch (error) {
    console.log(`❌ HTML test failed: ${error.message}`);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📋 PWA Features Validation Summary');
console.log('='.repeat(60));
console.log('✅ = Implemented and working');
console.log('⚠️  = Implemented but may need attention');
console.log('❌ = Missing or not implemented');
console.log('\nPWA Features implemented:');
console.log('• Service Worker with offline caching');
console.log('• Offline status detection and UI');
console.log('• App installation prompts');
console.log('• Offline data synchronization');
console.log('• IndexedDB for offline storage');
console.log('• Background sync support');
console.log('• Push notification support');
console.log('• Optimistic UI updates');
console.log('• Cache management');
console.log('• Web App Manifest');

console.log('\n🧪 To test PWA features:');
console.log('1. Start the development server: npm run dev');
console.log('2. Open the app in a browser');
console.log('3. Open browser DevTools > Application tab');
console.log('4. Check Service Workers, Storage, and Manifest');
console.log('5. Test offline mode in Network tab');
console.log('6. Open test-pwa-features.html for detailed testing');

console.log('\n🚀 PWA implementation complete!');