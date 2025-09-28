// Node.js test runner for API validation
// This can be run directly with: node run-api-tests.js

// Mock browser environment for Node.js
global.window = {
    location: { pathname: '/test' },
    localStorage: {
        data: {},
        getItem(key) { return this.data[key] || null; },
        setItem(key, value) { this.data[key] = value; },
        removeItem(key) { delete this.data[key]; }
    }
};

global.fetch = async (url, options) => {
    // Simulate fetch for Node.js environment
    throw new Error('Backend not available');
};

// Simple module loader for Node.js
const fs = require('fs');
const path = require('path');

// Load and execute the API client
const apiClientCode = fs.readFileSync(path.join(__dirname, 'src/api/client.js'), 'utf8');
const modifiedApiClient = apiClientCode
    .replace('export default apiClient;', 'module.exports = apiClient;')
    .replace(/import .* from .*;/g, '');

eval(modifiedApiClient);
const apiClient = module.exports;

// Load and execute the validator
const validatorCode = fs.readFileSync(path.join(__dirname, 'src/test/api-validation.js'), 'utf8');
const modifiedValidator = validatorCode
    .replace('import apiClient from \'../api/client.js\';', '')
    .replace('export default ApiValidator;', 'module.exports = ApiValidator;')
    .replace(/if \(typeof window.*\n.*\n.*\n.*\n.*\n.*\}/g, '');

eval(modifiedValidator);
const ApiValidator = module.exports;

// Run the tests
async function runTests() {
    console.log('🧪 Starting API Mock Data Validation Tests (Node.js)...\n');
    
    try {
        const validator = new ApiValidator();
        const results = await validator.runAllTests();
        
        console.log('\n✅ All tests completed successfully!');
        console.log(`📊 Final Results: ${results.passed}/${results.total} tests passed (${results.successRate}%)`);
        
        if (results.failed > 0) {
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

// Execute tests
runTests();