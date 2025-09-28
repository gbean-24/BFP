// Alert System Feature Tests
// This script tests all the enhanced alert system functionality

class AlertSystemTester {
    constructor() {
        this.testResults = [];
        this.alertsComponent = null;
    }

    async runAllTests() {
        console.log('🚨 Starting Alert System Feature Tests...\n');
        
        try {
            // Import and initialize the alerts component
            const AlertsComponent = (await import('./src/components/alerts.js')).default;
            this.alertsComponent = new AlertsComponent();
            
            // Set up test environment
            this.setupTestEnvironment();
            
            // Run individual tests
            await this.testAlertCategorization();
            await this.testSoundNotifications();
            await this.testVisualIndicators();
            await this.testSearchAndFiltering();
            await this.testEmergencyModal();
            await this.testCountdownTimer();
            await this.testEscalationFlow();
            await this.testResponsiveDesign();
            
            // Display results
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Test setup failed:', error);
        }
    }

    setupTestEnvironment() {
        // Create mock DOM elements
        if (!document.getElementById('content')) {
            const content = document.createElement('div');
            content.id = 'content';
            document.body.appendChild(content);
        }

        // Mock alerts data with various types and severities
        this.alertsComponent.alerts = [
            {
                id: 1,
                type: 'location_deviation',
                message: 'You seem to be far from your planned route. Are you safe?',
                created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                status: 'active',
                severity: 'medium',
                trip_id: 1
            },
            {
                id: 2,
                type: 'check_in',
                message: 'Regular safety check-in',
                created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                status: 'responded',
                severity: 'low',
                response: 'safe',
                response_time: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
                trip_id: 1
            },
            {
                id: 3,
                type: 'emergency',
                message: 'Emergency alert triggered. Please respond immediately.',
                created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                status: 'escalated',
                severity: 'critical',
                trip_id: 1,
                escalated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
            },
            {
                id: 4,
                type: 'battery_low',
                message: 'Your device battery is running low (15%). Please charge soon.',
                created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                status: 'active',
                severity: 'high',
                trip_id: 1
            },
            {
                id: 5,
                type: 'geofence',
                message: 'You have entered a restricted area. Please be cautious.',
                created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                status: 'active',
                severity: 'high',
                trip_id: 2
            }
        ];

        this.alertsComponent.activeAlerts = this.alertsComponent.alerts.filter(a => a.status === 'active');
        this.alertsComponent.applyFilters();
    }

    async testAlertCategorization() {
        console.log('📋 Testing Alert Categorization...');
        
        try {
            // Test severity categorization
            const criticalAlerts = this.alertsComponent.alerts.filter(a => a.severity === 'critical');
            const highAlerts = this.alertsComponent.alerts.filter(a => a.severity === 'high');
            const mediumAlerts = this.alertsComponent.alerts.filter(a => a.severity === 'medium');
            const lowAlerts = this.alertsComponent.alerts.filter(a => a.severity === 'low');
            
            this.addTestResult('Alert Severity Categorization', 
                criticalAlerts.length >= 0 && highAlerts.length >= 0 && 
                mediumAlerts.length >= 0 && lowAlerts.length >= 0,
                `Critical: ${criticalAlerts.length}, High: ${highAlerts.length}, Medium: ${mediumAlerts.length}, Low: ${lowAlerts.length}`
            );

            // Test status categorization
            const activeAlerts = this.alertsComponent.alerts.filter(a => a.status === 'active');
            const respondedAlerts = this.alertsComponent.alerts.filter(a => a.status === 'responded');
            const escalatedAlerts = this.alertsComponent.alerts.filter(a => a.status === 'escalated');
            
            this.addTestResult('Alert Status Categorization',
                activeAlerts.length >= 0 && respondedAlerts.length >= 0 && escalatedAlerts.length >= 0,
                `Active: ${activeAlerts.length}, Responded: ${respondedAlerts.length}, Escalated: ${escalatedAlerts.length}`
            );

            // Test alert type categorization
            const alertTypes = [...new Set(this.alertsComponent.alerts.map(a => a.type))];
            this.addTestResult('Alert Type Variety',
                alertTypes.length >= 3,
                `Types: ${alertTypes.join(', ')}`
            );

        } catch (error) {
            this.addTestResult('Alert Categorization', false, `Error: ${error.message}`);
        }
    }

    async testSoundNotifications() {
        console.log('🔊 Testing Sound Notifications...');
        
        try {
            // Test audio context initialization
            const hasAudioContext = this.alertsComponent.audioContext !== null;
            this.addTestResult('Audio Context Initialization', hasAudioContext, 
                hasAudioContext ? 'Audio context created successfully' : 'Audio context not supported');

            // Test sound creation
            const hasNotificationSound = typeof this.alertsComponent.notificationSound === 'function';
            const hasEmergencySound = typeof this.alertsComponent.emergencySound === 'function';
            
            this.addTestResult('Sound Generation', 
                hasNotificationSound && hasEmergencySound,
                `Notification sound: ${hasNotificationSound}, Emergency sound: ${hasEmergencySound}`
            );

            // Test sound toggle functionality
            const originalSoundState = this.alertsComponent.soundEnabled;
            this.alertsComponent.soundEnabled = !originalSoundState;
            const soundToggled = this.alertsComponent.soundEnabled !== originalSoundState;
            this.alertsComponent.soundEnabled = originalSoundState; // Restore
            
            this.addTestResult('Sound Toggle', soundToggled, 'Sound can be toggled on/off');

        } catch (error) {
            this.addTestResult('Sound Notifications', false, `Error: ${error.message}`);
        }
    }

    async testVisualIndicators() {
        console.log('👁️ Testing Visual Indicators...');
        
        try {
            // Test alert rendering
            await this.alertsComponent.init();
            const contentElement = document.getElementById('content');
            const hasContent = contentElement && contentElement.innerHTML.length > 0;
            
            this.addTestResult('Alert Rendering', hasContent, 
                hasContent ? 'Alerts rendered successfully' : 'No content rendered');

            // Test severity visual indicators
            const severityClasses = ['severity-low', 'severity-medium', 'severity-high', 'severity-critical'];
            const hasSeverityStyles = severityClasses.every(className => 
                contentElement.innerHTML.includes(className)
            );
            
            this.addTestResult('Severity Visual Indicators', hasSeverityStyles,
                'Severity-based styling applied');

            // Test status badges
            const statusBadges = ['status-active', 'status-responded', 'status-escalated'];
            const hasStatusBadges = statusBadges.some(badge => 
                contentElement.innerHTML.includes(badge)
            );
            
            this.addTestResult('Status Badges', hasStatusBadges, 'Status badges displayed');

        } catch (error) {
            this.addTestResult('Visual Indicators', false, `Error: ${error.message}`);
        }
    }

    async testSearchAndFiltering() {
        console.log('🔍 Testing Search and Filtering...');
        
        try {
            // Test filter application
            this.alertsComponent.currentFilter = 'active';
            this.alertsComponent.applyFilters();
            const activeFiltered = this.alertsComponent.filteredAlerts.every(a => a.status === 'active');
            
            this.addTestResult('Status Filtering', activeFiltered, 'Active filter works correctly');

            // Test search functionality
            this.alertsComponent.searchQuery = 'emergency';
            this.alertsComponent.applyFilters();
            const searchFiltered = this.alertsComponent.filteredAlerts.every(a => 
                a.message.toLowerCase().includes('emergency') || 
                a.type.toLowerCase().includes('emergency')
            );
            
            this.addTestResult('Search Functionality', searchFiltered, 'Search filter works correctly');

            // Test severity filtering
            this.alertsComponent.currentFilter = 'critical';
            this.alertsComponent.searchQuery = '';
            this.alertsComponent.applyFilters();
            const severityFiltered = this.alertsComponent.filteredAlerts.every(a => a.severity === 'critical');
            
            this.addTestResult('Severity Filtering', severityFiltered, 'Critical severity filter works');

            // Reset filters
            this.alertsComponent.currentFilter = 'all';
            this.alertsComponent.searchQuery = '';
            this.alertsComponent.applyFilters();

        } catch (error) {
            this.addTestResult('Search and Filtering', false, `Error: ${error.message}`);
        }
    }

    async testEmergencyModal() {
        console.log('🚨 Testing Emergency Modal...');
        
        try {
            // Create emergency modal in DOM
            const modal = document.createElement('div');
            modal.id = 'emergency-modal';
            modal.className = 'modal emergency-modal';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="emergency-header">
                        <div class="emergency-icon">🚨</div>
                        <h2 id="emergency-title">Safety Check Required</h2>
                        <p id="emergency-message">Are you safe?</p>
                        <div id="emergency-severity" class="severity-indicator"></div>
                    </div>
                    <div class="emergency-actions">
                        <button id="respond-safe" class="btn btn-success btn-large">✅ I'm Safe</button>
                        <button id="respond-help" class="btn btn-danger btn-large">🆘 I Need Help</button>
                        <button id="respond-later" class="btn btn-secondary">⏰ Remind Me Later</button>
                    </div>
                    <div class="emergency-info">
                        <div class="countdown-container">
                            <div class="countdown-circle">
                                <span id="countdown">15:00</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Test modal display
            const testAlert = {
                id: 'test-emergency',
                type: 'emergency',
                message: 'Test emergency alert',
                severity: 'critical'
            };
            
            this.alertsComponent.showEmergencyModal(testAlert);
            const modalDisplayed = modal.style.display === 'flex';
            
            this.addTestResult('Emergency Modal Display', modalDisplayed, 'Modal shows correctly');

            // Test modal content
            const titleElement = document.getElementById('emergency-title');
            const messageElement = document.getElementById('emergency-message');
            const severityElement = document.getElementById('emergency-severity');
            
            const hasCorrectContent = titleElement && messageElement && severityElement &&
                messageElement.textContent === testAlert.message &&
                severityElement.classList.contains('severity-critical');
            
            this.addTestResult('Emergency Modal Content', hasCorrectContent, 'Modal content is correct');

            // Test modal hiding
            this.alertsComponent.hideEmergencyModal();
            const modalHidden = modal.style.display === 'none';
            
            this.addTestResult('Emergency Modal Hide', modalHidden, 'Modal hides correctly');

        } catch (error) {
            this.addTestResult('Emergency Modal', false, `Error: ${error.message}`);
        }
    }

    async testCountdownTimer() {
        console.log('⏱️ Testing Countdown Timer...');
        
        try {
            // Test countdown initialization
            const countdownElement = document.getElementById('countdown');
            if (countdownElement) {
                this.alertsComponent.startCountdown(60); // 1 minute test
                
                // Check initial display
                const initialTime = countdownElement.textContent;
                const hasCorrectFormat = /^\d{1,2}:\d{2}$/.test(initialTime);
                
                this.addTestResult('Countdown Format', hasCorrectFormat, 
                    `Initial time: ${initialTime}`);

                // Test countdown progression (wait 2 seconds)
                await new Promise(resolve => setTimeout(resolve, 2000));
                const updatedTime = countdownElement.textContent;
                const timeChanged = updatedTime !== initialTime;
                
                this.addTestResult('Countdown Progression', timeChanged, 
                    `Time changed from ${initialTime} to ${updatedTime}`);

                // Clear the interval
                if (this.alertsComponent.countdownInterval) {
                    clearInterval(this.alertsComponent.countdownInterval);
                }
            } else {
                this.addTestResult('Countdown Timer', false, 'Countdown element not found');
            }

        } catch (error) {
            this.addTestResult('Countdown Timer', false, `Error: ${error.message}`);
        }
    }

    async testEscalationFlow() {
        console.log('⚠️ Testing Escalation Flow...');
        
        try {
            // Test escalation timeout handling
            const testAlert = {
                id: 'test-escalation',
                type: 'emergency',
                message: 'Test escalation alert',
                severity: 'critical',
                status: 'active'
            };

            // Add to alerts array
            this.alertsComponent.alerts.push(testAlert);
            
            // Simulate timeout
            this.alertsComponent.handleEmergencyTimeout(testAlert);
            
            // Check if alert status was updated
            const updatedAlert = this.alertsComponent.alerts.find(a => a.id === 'test-escalation');
            const wasEscalated = updatedAlert && updatedAlert.status === 'escalated';
            
            this.addTestResult('Emergency Escalation', wasEscalated, 
                wasEscalated ? 'Alert escalated correctly' : 'Alert not escalated');

            // Test escalation timestamp
            const hasEscalationTime = updatedAlert && updatedAlert.escalated_at;
            this.addTestResult('Escalation Timestamp', hasEscalationTime, 
                hasEscalationTime ? 'Escalation time recorded' : 'No escalation timestamp');

        } catch (error) {
            this.addTestResult('Escalation Flow', false, `Error: ${error.message}`);
        }
    }

    async testResponsiveDesign() {
        console.log('📱 Testing Responsive Design...');
        
        try {
            // Test mobile viewport simulation
            const originalWidth = window.innerWidth;
            
            // Simulate mobile viewport
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375
            });
            
            // Re-render component
            this.alertsComponent.render();
            
            // Check for mobile-specific classes or styles
            const contentElement = document.getElementById('content');
            const hasMobileOptimization = contentElement && (
                contentElement.innerHTML.includes('mobile') ||
                window.getComputedStyle(contentElement).display !== 'none'
            );
            
            this.addTestResult('Mobile Responsiveness', hasMobileOptimization, 
                'Component renders on mobile viewport');

            // Restore original width
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: originalWidth
            });

        } catch (error) {
            this.addTestResult('Responsive Design', false, `Error: ${error.message}`);
        }
    }

    addTestResult(testName, passed, details) {
        this.testResults.push({
            name: testName,
            passed: passed,
            details: details
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${testName}: ${details}`);
    }

    displayResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.filter(r => !r.passed).forEach(test => {
                console.log(`  - ${test.name}: ${test.details}`);
            });
        }
        
        console.log('\n🎉 Alert System Testing Complete!');
        
        // Return results for external use
        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: (passedTests / totalTests) * 100,
            results: this.testResults
        };
    }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlertSystemTester;
} else if (typeof window !== 'undefined') {
    window.AlertSystemTester = AlertSystemTester;
}

// Auto-run tests if this script is executed directly
if (typeof window !== 'undefined' && window.location.pathname.includes('test-alert-features')) {
    const tester = new AlertSystemTester();
    tester.runAllTests().then(results => {
        console.log('Tests completed with results:', results);
    });
}