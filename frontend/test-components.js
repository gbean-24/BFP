// Simple test to verify all components load without errors
import AuthComponent from './src/components/auth.js';
import TripsComponent from './src/components/trips.js';
import AlertsComponent from './src/components/alerts.js';
import apiClient from './src/api/client.js';

console.log('Testing component imports...');

try {
    // Test component instantiation
    const auth = new AuthComponent();
    console.log('✅ AuthComponent loaded successfully');
    
    const trips = new TripsComponent();
    console.log('✅ TripsComponent loaded successfully');
    
    const alerts = new AlertsComponent();
    console.log('✅ AlertsComponent loaded successfully');
    
    // Test API client
    console.log('✅ API Client loaded successfully');
    console.log('Mock data mode:', apiClient.useMockData);
    
    console.log('🎉 All components loaded successfully!');
    
} catch (error) {
    console.error('❌ Component loading failed:', error);
}