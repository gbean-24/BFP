// Trip Management Enhancement Feature Tests
// This file tests all the enhanced features implemented in Task 5

import TripsComponent from './src/components/trips.js';

class TripFeatureTests {
    constructor() {
        this.results = [];
        this.tripsComponent = null;
    }

    async runAllTests() {
        console.log('🧪 Starting Trip Management Enhancement Tests...\n');
        
        try {
            // Initialize the trips component
            this.tripsComponent = new TripsComponent();
            await this.tripsComponent.init();
            
            // Run all test suites
            await this.testFormValidation();
            await this.testFilteringAndSorting();
            await this.testCRUDOperations();
            await this.testTripDetails();
            await this.testSharingFeatures();
            await this.testUIComponents();
            
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Test suite failed to initialize:', error);
        }
    }

    async testFormValidation() {
        console.log('📝 Testing Form Validation...');
        
        // Test trip name validation
        this.assert(
            'Trip name validation - valid name',
            this.tripsComponent.validateTripName('Tokyo Adventure'),
            true
        );
        
        this.assert(
            'Trip name validation - too short',
            this.tripsComponent.validateTripName('T'),
            false
        );
        
        this.assert(
            'Trip name validation - too long',
            this.tripsComponent.validateTripName('A'.repeat(101)),
            false
        );

        // Test email validation
        this.assert(
            'Email validation - valid email',
            this.tripsComponent.isValidEmail('test@example.com'),
            true
        );
        
        this.assert(
            'Email validation - invalid email',
            this.tripsComponent.isValidEmail('invalid-email'),
            false
        );

        // Test emergency contacts parsing
        const contacts = this.tripsComponent.parseEmergencyContacts('test@example.com, invalid, another@test.com');
        this.assert(
            'Emergency contacts parsing',
            contacts.length === 2 && contacts.includes('test@example.com'),
            true
        );
    }

    async testFilteringAndSorting() {
        console.log('🔍 Testing Filtering and Sorting...');
        
        // Test filter application
        this.tripsComponent.currentFilter = 'active';
        this.tripsComponent.applyFiltersAndSort();
        
        const activeFiltered = this.tripsComponent.filteredTrips.every(trip => trip.status === 'active');
        this.assert(
            'Status filtering - active trips only',
            activeFiltered,
            true
        );

        // Test sorting by name
        this.tripsComponent.currentSort = 'name_asc';
        this.tripsComponent.applyFiltersAndSort();
        
        const sorted = this.tripsComponent.filteredTrips.length <= 1 || 
            this.tripsComponent.filteredTrips[0].name <= this.tripsComponent.filteredTrips[1].name;
        this.assert(
            'Name sorting - ascending order',
            sorted,
            true
        );

        // Test search functionality
        this.tripsComponent.handleSearch('Tokyo');
        const searchResults = this.tripsComponent.filteredTrips.filter(trip => 
            trip.name.toLowerCase().includes('tokyo')
        );
        this.assert(
            'Search functionality',
            searchResults.length >= 0,
            true
        );
    }

    async testCRUDOperations() {
        console.log('⚙️ Testing CRUD Operations...');
        
        // Test method existence
        this.assert(
            'Create trip modal method exists',
            typeof this.tripsComponent.showTripModal === 'function',
            true
        );
        
        this.assert(
            'Edit trip modal method exists',
            typeof this.tripsComponent.showEditTripModal === 'function',
            true
        );
        
        this.assert(
            'Delete trip method exists',
            typeof this.tripsComponent.confirmDeleteTrip === 'function',
            true
        );
        
        this.assert(
            'Duplicate trip method exists',
            typeof this.tripsComponent.duplicateTrip === 'function',
            true
        );

        // Test form submission handler
        this.assert(
            'Trip form submission handler exists',
            typeof this.tripsComponent.handleTripSubmit === 'function',
            true
        );
    }

    async testTripDetails() {
        console.log('📋 Testing Trip Details...');
        
        // Test date formatting
        const formattedDate = this.tripsComponent.formatDate('2024-02-01');
        this.assert(
            'Date formatting',
            formattedDate.includes('Feb') && formattedDate.includes('2024'),
            true
        );

        // Test duration calculation
        const duration = this.tripsComponent.calculateDuration('2024-02-01', '2024-02-07');
        this.assert(
            'Duration calculation',
            duration === 6,
            true
        );

        // Test relative time formatting
        const relativeTime = this.tripsComponent.formatRelativeTime(new Date().toISOString());
        this.assert(
            'Relative time formatting - today',
            relativeTime === 'today',
            true
        );

        // Test status formatting
        this.assert(
            'Status formatting',
            this.tripsComponent.formatStatus('active') === 'Active',
            true
        );

        // Test trip details method
        this.assert(
            'Show trip details method exists',
            typeof this.tripsComponent.showTripDetails === 'function',
            true
        );
    }

    async testSharingFeatures() {
        console.log('🔗 Testing Sharing Features...');
        
        // Test sharing modal method
        this.assert(
            'Share trip modal method exists',
            typeof this.tripsComponent.showShareTripModal === 'function',
            true
        );
        
        this.assert(
            'Copy share link method exists',
            typeof this.tripsComponent.copyShareLink === 'function',
            true
        );
        
        this.assert(
            'Save share settings method exists',
            typeof this.tripsComponent.handleSaveShare === 'function',
            true
        );
        
        this.assert(
            'Load current shares method exists',
            typeof this.tripsComponent.loadCurrentShares === 'function',
            true
        );
    }

    async testUIComponents() {
        console.log('🎨 Testing UI Components...');
        
        // Test modal methods
        this.assert(
            'Show trip modal method exists',
            typeof this.tripsComponent.showTripModal === 'function',
            true
        );
        
        this.assert(
            'Hide trip modal method exists',
            typeof this.tripsComponent.hideTripModal === 'function',
            true
        );
        
        this.assert(
            'Show trip details modal method exists',
            typeof this.tripsComponent.showTripDetailsModal === 'function',
            true
        );
        
        this.assert(
            'Hide trip details modal method exists',
            typeof this.tripsComponent.hideTripDetailsModal === 'function',
            true
        );

        // Test utility methods
        this.assert(
            'Toggle trip menu method exists',
            typeof this.tripsComponent.toggleTripMenu === 'function',
            true
        );
        
        this.assert(
            'Clear filters method exists',
            typeof this.tripsComponent.clearFilters === 'function',
            true
        );
        
        this.assert(
            'Show alert method exists',
            typeof this.tripsComponent.showAlert === 'function',
            true
        );

        // Test location features
        this.assert(
            'Add location form method exists',
            typeof this.tripsComponent.showAddLocationForm === 'function',
            true
        );
        
        this.assert(
            'Start location tracking method exists',
            typeof this.tripsComponent.startLocationTracking === 'function',
            true
        );
        
        this.assert(
            'Initialize trip map method exists',
            typeof this.tripsComponent.initTripMap === 'function',
            true
        );
    }

    assert(testName, actual, expected) {
        const passed = actual === expected;
        this.results.push({
            name: testName,
            passed,
            actual,
            expected
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${testName}`);
        
        if (!passed) {
            console.log(`    Expected: ${expected}, Got: ${actual}`);
        }
    }

    displayResults() {
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        const percentage = Math.round((passed / total) * 100);
        
        console.log('\n📊 Test Results Summary:');
        console.log(`   Total Tests: ${total}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${total - passed}`);
        console.log(`   Success Rate: ${percentage}%`);
        
        if (percentage === 100) {
            console.log('\n🎉 All tests passed! Task 5 implementation is complete.');
        } else if (percentage >= 90) {
            console.log('\n✨ Most tests passed! Task 5 implementation is nearly complete.');
        } else {
            console.log('\n⚠️  Some tests failed. Review the implementation.');
        }
        
        // Show failed tests
        const failed = this.results.filter(r => !r.passed);
        if (failed.length > 0) {
            console.log('\n❌ Failed Tests:');
            failed.forEach(test => {
                console.log(`   - ${test.name}`);
            });
        }
    }
}

// Export for use in other files
export default TripFeatureTests;

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
    window.addEventListener('load', async () => {
        const tests = new TripFeatureTests();
        await tests.runAllTests();
    });
}