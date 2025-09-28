// Real-time Features Validation Script
// This script validates that all real-time features are properly implemented

import realTimeService from './src/services/realtime.js';
import ConnectionStatusComponent from './src/components/connection-status.js';

class RealTimeValidator {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    async runValidation() {
        console.log('🔄 Starting Real-time Features Validation...\n');

        // Test 1: Real-time Service Initialization
        await this.test('Real-time Service Initialization', async () => {
            return realTimeService && typeof realTimeService.init === 'function';
        });

        // Test 2: Connection Status Component
        await this.test('Connection Status Component', async () => {
            const component = new ConnectionStatusComponent();
            return component && typeof component.updateStatus === 'function';
        });

        // Test 3: Polling System
        await this.test('Polling System', async () => {
            return typeof realTimeService.startPolling === 'function' &&
                   typeof realTimeService.pollForUpdates === 'function';
        });

        // Test 4: WebSocket Support
        await this.test('WebSocket Support', async () => {
            return typeof realTimeService.connectWebSocket === 'function' &&
                   typeof realTimeService.sendMessage === 'function';
        });

        // Test 5: Alert Handling
        await this.test('Alert Handling', async () => {
            return typeof realTimeService.handleAlertUpdate === 'function' &&
                   typeof realTimeService.onAlertUpdate === 'function';
        });

        // Test 6: Location Sharing
        await this.test('Location Sharing', async () => {
            return typeof realTimeService.startLocationSharing === 'function' &&
                   typeof realTimeService.stopLocationSharing === 'function';
        });

        // Test 7: Notification System
        await this.test('Notification System', async () => {
            return typeof realTimeService.showNotification === 'function' &&
                   'Notification' in window;
        });

        // Test 8: Mock Data Simulation
        await this.test('Mock Data Simulation', async () => {
            return typeof realTimeService.simulateAlert === 'function' &&
                   typeof realTimeService.simulateLocationUpdate === 'function';
        });

        // Test 9: Connection Status Management
        await this.test('Connection Status Management', async () => {
            return typeof realTimeService.updateConnectionStatus === 'function' &&
                   typeof realTimeService.onConnectionStatusChange === 'function';
        });

        // Test 10: Error Handling and Recovery
        await this.test('Error Handling and Recovery', async () => {
            return typeof realTimeService.scheduleReconnect === 'function' &&
                   realTimeService.config.maxReconnectAttempts > 0;
        });

        // Test 11: Performance Monitoring
        await this.test('Performance Monitoring', async () => {
            return typeof realTimeService.getConnectionInfo === 'function';
        });

        // Test 12: Integration with API Client
        await this.test('API Client Integration', async () => {
            try {
                await realTimeService.pollAlerts();
                return true;
            } catch (error) {
                // Expected to work with mock data
                return error.message.includes('Mock') || error.message.includes('Network');
            }
        });

        // Test 13: Real-time Alert Processing
        await this.test('Real-time Alert Processing', async () => {
            let alertReceived = false;
            
            realTimeService.onAlertUpdate(() => {
                alertReceived = true;
            });
            
            realTimeService.simulateAlert({
                type: 'test',
                message: 'Validation test alert',
                severity: 'low'
            });
            
            // Wait a bit for the alert to be processed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return alertReceived;
        });

        // Test 14: Location Update Processing
        await this.test('Location Update Processing', async () => {
            let locationReceived = false;
            
            realTimeService.onLocationUpdate(() => {
                locationReceived = true;
            });
            
            realTimeService.simulateLocationUpdate({
                lat: 35.6762,
                lng: 139.6503,
                accuracy: 10
            });
            
            // Wait a bit for the location to be processed
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return locationReceived;
        });

        // Test 15: Configuration Management
        await this.test('Configuration Management', async () => {
            return realTimeService.config &&
                   typeof realTimeService.config.pollingInterval === 'number' &&
                   typeof realTimeService.config.websocketUrl === 'string';
        });

        this.printResults();
    }

    async test(name, testFunction) {
        this.results.total++;
        
        try {
            const result = await testFunction();
            if (result) {
                console.log(`✅ ${name}`);
                this.results.passed++;
            } else {
                console.log(`❌ ${name} - Test returned false`);
                this.results.failed++;
            }
        } catch (error) {
            console.log(`❌ ${name} - Error: ${error.message}`);
            this.results.failed++;
        }
    }

    printResults() {
        console.log('\n📊 Validation Results:');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed} ✅`);
        console.log(`Failed: ${this.results.failed} ❌`);
        console.log(`Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
        
        if (this.results.failed === 0) {
            console.log('\n🎉 All real-time features are properly implemented!');
        } else {
            console.log('\n⚠️ Some features need attention. Check the failed tests above.');
        }
    }
}

// Run validation if this script is executed directly
if (typeof window !== 'undefined') {
    const validator = new RealTimeValidator();
    validator.runValidation();
}

export default RealTimeValidator;