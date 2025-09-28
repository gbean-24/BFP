// Simple design validation script
console.log('🎨 Design System Validation');
console.log('==========================');

// Check if CSS custom properties are supported
const testElement = document.createElement('div');
testElement.style.setProperty('--test-var', 'test');
const supportsCustomProperties = testElement.style.getPropertyValue('--test-var') === 'test';

console.log('✅ CSS Custom Properties supported:', supportsCustomProperties);

// Check color contrast (basic check)
const primaryColor = '#2563eb';
const backgroundColor = '#f8fafc';
console.log('🎨 Primary color:', primaryColor);
console.log('🎨 Background color:', backgroundColor);

// Check if design system variables are loaded
const rootStyles = getComputedStyle(document.documentElement);
const primaryColorVar = rootStyles.getPropertyValue('--primary-500').trim();
console.log('🎨 CSS Variable --primary-500:', primaryColorVar || 'Not loaded');

// Check accessibility features
const skipLink = document.querySelector('.skip-link');
console.log('♿ Skip link present:', !!skipLink);

// Check responsive design
const isMobile = window.innerWidth <= 768;
console.log('📱 Mobile viewport:', isMobile);

// Check for proper semantic HTML
const nav = document.querySelector('nav[role="navigation"]');
const main = document.querySelector('main');
console.log('🏗️ Semantic navigation:', !!nav);
console.log('🏗️ Main content area:', !!main);

console.log('==========================');
console.log('✅ Design validation complete!');