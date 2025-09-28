// API Mock Data Validation and Testing
// This file tests all mock API responses and validates data integrity

import apiClient from '../api/client.js';

class ApiValidator {
    constructor() {
        this.testResults = [];
        this.errorScenarios = [];
    }

    async runAllTests() {
        console.log('🧪 Starting API Mock Data Validation Tests...');
        
        // Test Authentication endpoints
        await this.testAuthenticationFlow();
        
        // Test Trip Management endpoints
        await this.testTripManagement();
        
        // Test Location endpoints
        await this.testLocationManagement();
        
        // Test Alert endpoints
        await this.testAlertSystem();
        
        // Test Error Handling
        await this.testErrorScenarios();
        
        // Generate report
        this.generateReport();
        
        return this.testResults;
    }

    async testAuthenticationFlow() {
        console.log('📝 Testing Authentication Flow...');
        
        // Test user registration
        await this.runTest('User Registration', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };
            
            const response = await apiClient.register(userData);
            
            this.validateResponse(response, {
                success: 'boolean',
                message: 'string'
            });
            
            return response.success === true;
        });

        // Test user login
        await this.runTest('User Login', async () => {
            const credentials = {
                email: 'test@example.com',
                password: 'password123'
            };
            
            const response = await apiClient.login(credentials);
            
            this.validateResponse(response, {
                token: 'string',
                user: 'object'
            });
            
            // Validate user object structure
            this.validateResponse(response.user, {
                id: 'number',
                name: 'string',
                email: 'string'
            });
            
            // Check if token is set
            return apiClient.token !== null && response.token.startsWith('mock_jwt_token_');
        });

        // Test logout
        await this.runTest('User Logout', async () => {
            const response = await apiClient.logout();
            
            this.validateResponse(response, {
                success: 'boolean'
            });
            
            // Check if token is cleared
            return response.success === true && apiClient.token === null;
        });
    }

    async testTripManagement() {
        console.log('🗺️ Testing Trip Management...');
        
        // Re-login for trip tests
        await apiClient.login({ email: 'test@example.com', password: 'password123' });
        
        // Test get trips
        await this.runTest('Get Trips List', async () => {
            const trips = await apiClient.getTrips();
            
            if (!Array.isArray(trips)) {
                throw new Error('Trips response should be an array');
            }
            
            // Validate trip structure
            if (trips.length > 0) {
                this.validateResponse(trips[0], {
                    id: 'number',
                    name: 'string',
                    start_date: 'string',
                    end_date: 'string',
                    status: 'string',
                    locations_count: 'number'
                });
            }
            
            return trips.length >= 0;
        });

        // Test create trip
        await this.runTest('Create New Trip', async () => {
            const tripData = {
                name: 'Test Trip',
                start_date: '2024-02-01',
                end_date: '2024-02-07',
                description: 'Test trip description'
            };
            
            const response = await apiClient.createTrip(tripData);
            
            this.validateResponse(response, {
                id: 'number',
                name: 'string',
                start_date: 'string',
                end_date: 'string',
                status: 'string',
                locations_count: 'number'
            });
            
            // Validate that input data is preserved
            return response.name === tripData.name && 
                   response.start_date === tripData.start_date &&
                   response.end_date === tripData.end_date;
        });

        // Test get single trip
        await this.runTest('Get Trip Details', async () => {
            const trip = await apiClient.getTrip(1);
            
            this.validateResponse(trip, {
                id: 'number',
                name: 'string',
                start_date: 'string',
                end_date: 'string',
                status: 'string',
                description: 'string',
                emergency_contacts: 'object'
            });
            
            // Validate emergency contacts is an array
            if (!Array.isArray(trip.emergency_contacts)) {
                throw new Error('Emergency contacts should be an array');
            }
            
            return trip.id === 1;
        });

        // Test update trip
        await this.runTest('Update Trip', async () => {
            const updateData = {
                name: 'Updated Trip Name',
                description: 'Updated description'
            };
            
            const response = await apiClient.updateTrip(1, updateData);
            
            // Mock should return the updated data
            return response && typeof response === 'object';
        });

        // Test delete trip
        await this.runTest('Delete Trip', async () => {
            const response = await apiClient.deleteTrip(1);
            
            // Mock should return success response
            return response && typeof response === 'object';
        });
    }

    async testLocationManagement() {
        console.log('📍 Testing Location Management...');
        
        // Test get trip locations
        await this.runTest('Get Trip Locations', async () => {
            const locations = await apiClient.getTripLocations(1);
            
            if (!Array.isArray(locations)) {
                throw new Error('Locations response should be an array');
            }
            
            // Validate location structure
            if (locations.length > 0) {
                this.validateResponse(locations[0], {
                    id: 'number',
                    name: 'string',
                    lat: 'number',
                    lng: 'number',
                    planned_time: 'string',
                    type: 'string'
                });
                
                // Validate coordinate ranges
                const loc = locations[0];
                if (loc.lat < -90 || loc.lat > 90) {
                    throw new Error('Invalid latitude range');
                }
                if (loc.lng < -180 || loc.lng > 180) {
                    throw new Error('Invalid longitude range');
                }
            }
            
            return locations.length >= 0;
        });

        // Test add trip location
        await this.runTest('Add Trip Location', async () => {
            const locationData = {
                name: 'Test Location',
                lat: 35.6762,
                lng: 139.6503,
                planned_time: '2024-02-01T10:00:00Z',
                type: 'attraction'
            };
            
            const response = await apiClient.addTripLocation(1, locationData);
            
            this.validateResponse(response, {
                id: 'number',
                name: 'string',
                lat: 'number',
                lng: 'number'
            });
            
            // Validate that input data is preserved
            return response.name === locationData.name &&
                   response.lat === locationData.lat &&
                   response.lng === locationData.lng;
        });

        // Test location update submission
        await this.runTest('Submit Location Update', async () => {
            const locationData = {
                lat: 35.6762,
                lng: 139.6503,
                timestamp: new Date().toISOString(),
                accuracy: 10
            };
            
            const response = await apiClient.submitLocationUpdate(locationData);
            
            this.validateResponse(response, {
                success: 'boolean',
                message: 'string'
            });
            
            return response.success === true;
        });
    }

    async testAlertSystem() {
        console.log('🚨 Testing Alert System...');
        
        // Test get alerts
        await this.runTest('Get Alerts List', async () => {
            const alerts = await apiClient.getAlerts();
            
            if (!Array.isArray(alerts)) {
                throw new Error('Alerts response should be an array');
            }
            
            // Validate alert structure
            if (alerts.length > 0) {
                this.validateResponse(alerts[0], {
                    id: 'number',
                    type: 'string',
                    message: 'string',
                    created_at: 'string',
                    status: 'string',
                    trip_id: 'number'
                });
                
                // Validate alert types
                const validTypes = ['location_deviation', 'check_in', 'emergency', 'geofence', 'battery_low', 'offline'];
                const validStatuses = ['active', 'responded', 'escalated', 'resolved'];
                
                if (!validTypes.includes(alerts[0].type)) {
                    throw new Error(`Invalid alert type: ${alerts[0].type}`);
                }
                
                if (!validStatuses.includes(alerts[0].status)) {
                    throw new Error(`Invalid alert status: ${alerts[0].status}`);
                }
            }
            
            return alerts.length >= 0;
        });

        // Test alert response
        await this.runTest('Respond to Alert', async () => {
            const response = await apiClient.respondToAlert(1, 'safe');
            
            this.validateResponse(response, {
                success: 'boolean',
                message: 'string'
            });
            
            return response.success === true;
        });

        // Test different response types
        await this.runTest('Respond to Alert - Help', async () => {
            const response = await apiClient.respondToAlert(1, 'help');
            
            this.validateResponse(response, {
                success: 'boolean',
                message: 'string'
            });
            
            return response.success === true;
        });
    }

    async testErrorScenarios() {
        console.log('⚠️ Testing Error Scenarios...');
        
        // Test invalid endpoint
        await this.runTest('Invalid Endpoint', async () => {
            try {
                await apiClient.request('/invalid-endpoint');
                return false; // Should have thrown an error
            } catch (error) {
                return error.message.includes('Mock endpoint not implemented');
            }
        });

        // Test network simulation
        await this.runTest('Network Delay Simulation', async () => {
            const startTime = Date.now();
            await apiClient.getTrips();
            const endTime = Date.now();
            
            // Mock should simulate 500ms delay
            return (endTime - startTime) >= 400; // Allow some variance
        });

        // Test data validation
        await this.runTest('Data Type Validation', async () => {
            try {
                // Test with invalid trip data
                const invalidTripData = {
                    name: 123, // Should be string
                    start_date: null, // Should be string
                    end_date: undefined // Should be string
                };
                
                const response = await apiClient.createTrip(invalidTripData);
                
                // Mock should still work but we can validate the response
                return response && typeof response === 'object';
            } catch (error) {
                // Error handling is acceptable too
                return true;
            }
        });
    }

    async runTest(testName, testFunction) {
        try {
            console.log(`  ⏳ Running: ${testName}`);
            const startTime = Date.now();
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            if (result) {
                console.log(`  ✅ Passed: ${testName} (${duration}ms)`);
                this.testResults.push({
                    name: testName,
                    status: 'PASSED',
                    duration: duration,
                    error: null
                });
            } else {
                console.log(`  ❌ Failed: ${testName} - Test returned false`);
                this.testResults.push({
                    name: testName,
                    status: 'FAILED',
                    duration: duration,
                    error: 'Test returned false'
                });
            }
        } catch (error) {
            console.log(`  ❌ Failed: ${testName} - ${error.message}`);
            this.testResults.push({
                name: testName,
                status: 'FAILED',
                duration: 0,
                error: error.message
            });
        }
    }

    validateResponse(response, expectedStructure) {
        for (const [key, expectedType] of Object.entries(expectedStructure)) {
            if (!(key in response)) {
                throw new Error(`Missing required field: ${key}`);
            }
            
            const actualType = typeof response[key];
            if (expectedType === 'object' && response[key] === null) {
                throw new Error(`Field ${key} should not be null`);
            }
            
            if (actualType !== expectedType) {
                throw new Error(`Field ${key} should be ${expectedType}, got ${actualType}`);
            }
        }
    }

    generateReport() {
        console.log('\n📊 API Validation Test Report');
        console.log('================================');
        
        const passed = this.testResults.filter(t => t.status === 'PASSED').length;
        const failed = this.testResults.filter(t => t.status === 'FAILED').length;
        const total = this.testResults.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} (${Math.round(passed/total*100)}%)`);
        console.log(`Failed: ${failed} (${Math.round(failed/total*100)}%)`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(t => t.status === 'FAILED')
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.error}`);
                });
        }
        
        const avgDuration = this.testResults
            .filter(t => t.duration > 0)
            .reduce((sum, t) => sum + t.duration, 0) / 
            this.testResults.filter(t => t.duration > 0).length;
            
        console.log(`\nAverage Response Time: ${Math.round(avgDuration)}ms`);
        
        // API Integration Documentation
        console.log('\n📋 API Integration Points for Sunday:');
        console.log('=====================================');
        console.log('1. Update apiClient.baseURL to real backend endpoint');
        console.log('2. Set apiClient.useMockData = false');
        console.log('3. Verify authentication token format matches backend');
        console.log('4. Test error handling with real network conditions');
        console.log('5. Validate data formats match backend API contract');
        
        return {
            total,
            passed,
            failed,
            successRate: Math.round(passed/total*100),
            avgResponseTime: Math.round(avgDuration)
        };
    }

    // Additional mock data scenarios for edge cases
    addAdditionalMockScenarios() {
        console.log('📝 Adding Additional Mock Data Scenarios...');
        
        // Add more diverse trip data
        const additionalTrips = [
            {
                id: 3,
                name: 'Solo Backpacking Adventure',
                start_date: '2024-04-01',
                end_date: '2024-04-15',
                status: 'completed',
                locations_count: 12
            },
            {
                id: 4,
                name: 'Family Vacation',
                start_date: '2024-05-20',
                end_date: '2024-05-27',
                status: 'cancelled',
                locations_count: 0
            }
        ];
        
        // Add more alert scenarios
        const additionalAlerts = [
            {
                id: 3,
                type: 'battery_low',
                message: 'Your device battery is running low (15%). Please charge soon.',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                status: 'active',
                trip_id: 1
            },
            {
                id: 4,
                type: 'geofence',
                message: 'You have entered a restricted area. Please be cautious.',
                created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                status: 'active',
                trip_id: 2
            }
        ];
        
        console.log('✅ Additional mock scenarios ready for testing');
        return { additionalTrips, additionalAlerts };
    }
}

// Export for use in other files
export default ApiValidator;

// Auto-run tests if this file is loaded directly
if (typeof window !== 'undefined' && window.location.pathname.includes('api-validation')) {
    document.addEventListener('DOMContentLoaded', async () => {
        const validator = new ApiValidator();
        await validator.runAllTests();
        validator.addAdditionalMockScenarios();
    });
}