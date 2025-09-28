// Authentication Component
import apiClient from '../api/client.js';

class AuthComponent {
    constructor() {
        this.currentUser = null;
        this.validationRules = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            password: /^.{6,}$/,
            name: /^.{2,}$/
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
        this.addCustomStyles();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('login');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            this.addRealTimeValidation(loginForm);
        }

        // Register form
        const registerForm = document.getElementById('register');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            this.addRealTimeValidation(registerForm);
        }

        // Auth form switching
        const showRegister = document.getElementById('show-register');
        const showLogin = document.getElementById('show-login');
        
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.currentUser.token = token;
                
                // Validate token is still valid (in production, you'd check with backend)
                if (this.isTokenValid(token)) {
                    this.showMainApp();
                } else {
                    this.handleTokenExpired();
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.clearStoredAuth();
                this.showAuthForms();
            }
        } else {
            this.showAuthForms();
        }
    }

    isTokenValid(token) {
        // In production, you'd validate with backend
        // For now, just check if token exists and is not too old
        try {
            const tokenData = token.split('_');
            const timestamp = parseInt(tokenData[tokenData.length - 1]);
            const now = Date.now();
            const tokenAge = now - timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            return tokenAge < maxAge;
        } catch (error) {
            return false;
        }
    }

    handleTokenExpired() {
        this.clearStoredAuth();
        this.showAuthForms();
        this.showAlert('Your session has expired. Please login again.', 'warning');
    }

    clearStoredAuth() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        this.currentUser = null;
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const submitBtn = form.querySelector('button[type="submit"]');

        // Clear previous alerts
        this.clearAlerts();

        // Validate form
        if (!this.validateForm(form)) {
            return;
        }

        try {
            this.setLoading(submitBtn, true);
            this.showAlert('Signing you in...', 'info');
            
            const response = await apiClient.login({ email, password });
            
            if (response.token) {
                this.currentUser = response.user;
                localStorage.setItem('auth_token', response.token);
                localStorage.setItem('user_data', JSON.stringify(response.user));
                
                this.showAlert('Welcome back! Redirecting...', 'success');
                
                // Smooth transition to main app
                setTimeout(() => {
                    this.showMainApp();
                }, 1000);
            }
        } catch (error) {
            this.showAlert(this.getErrorMessage(error), 'danger');
            this.shakeForm(form);
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const submitBtn = form.querySelector('button[type="submit"]');

        // Clear previous alerts
        this.clearAlerts();

        // Validate form
        if (!this.validateForm(form)) {
            return;
        }

        try {
            this.setLoading(submitBtn, true);
            this.showAlert('Creating your account...', 'info');
            
            await apiClient.register({ name, email, password });
            
            this.showAlert('Account created! Signing you in...', 'success');
            
            // After successful registration, automatically log in
            const loginResponse = await apiClient.login({ email, password });
            
            if (loginResponse.token) {
                this.currentUser = loginResponse.user;
                localStorage.setItem('auth_token', loginResponse.token);
                localStorage.setItem('user_data', JSON.stringify(loginResponse.user));
                
                this.showAlert('Welcome to Tourism Safety Tracker!', 'success');
                
                // Smooth transition to main app
                setTimeout(() => {
                    this.showMainApp();
                }, 1500);
            }
        } catch (error) {
            this.showAlert(this.getErrorMessage(error), 'danger');
            this.shakeForm(form);
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async handleLogout() {
        try {
            // Show confirmation dialog
            if (!confirm('Are you sure you want to logout?')) {
                return;
            }

            const logoutBtn = document.getElementById('logout-btn');
            const originalText = logoutBtn.textContent;
            logoutBtn.textContent = 'Logging out...';
            logoutBtn.disabled = true;

            await apiClient.logout();
            
            // Clear stored data
            this.currentUser = null;
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            
            // Stop any location tracking
            if (window.app && window.app.stopLocationTracking) {
                window.app.stopLocationTracking();
            }
            
            this.showAuthForms();
            this.showAlert('You have been logged out successfully', 'info');
            
        } catch (error) {
            console.error('Logout error:', error);
            this.showAlert('Logout failed. Please try again.', 'warning');
        } finally {
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.textContent = 'Logout';
                logoutBtn.disabled = false;
            }
        }
    }

    showLoginForm() {
        this.clearAlerts();
        this.clearFormErrors();
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        
        // Focus on email field
        setTimeout(() => {
            document.getElementById('login-email').focus();
        }, 100);
    }

    showRegisterForm() {
        this.clearAlerts();
        this.clearFormErrors();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        
        // Focus on name field
        setTimeout(() => {
            document.getElementById('register-name').focus();
        }, 100);
    }

    showAuthForms() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-app').style.display = 'none';
        document.getElementById('auth-container').style.display = 'flex';
        this.showLoginForm();
    }

    showMainApp() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        
        // Initialize main app components
        if (window.app) {
            window.app.init();
        }
    }

    setLoading(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
            const originalText = button.textContent;
            button.dataset.originalText = originalText;
            button.innerHTML = `
                <span class="loading-spinner"></span>
                Loading...
            `;
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            button.textContent = button.dataset.originalText || 
                (button.closest('#login') ? 'Login' : 'Create Account');
        }
    }

    showAlert(message, type = 'info') {
        // Clear existing alerts
        this.clearAlerts();
        
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `auth-alert alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">${this.getAlertIcon(type)}</span>
                <span class="alert-message">${message}</span>
            </div>
        `;
        
        // Insert at top of current form
        const activeForm = document.querySelector('.auth-form:not([style*="display: none"])');
        if (activeForm) {
            const header = activeForm.querySelector('.auth-header');
            header.insertAdjacentElement('afterend', alert);
            
            // Animate in
            setTimeout(() => alert.classList.add('show'), 10);
            
            // Remove after 5 seconds for non-persistent alerts
            if (type !== 'info') {
                setTimeout(() => {
                    if (alert.parentNode) {
                        alert.classList.remove('show');
                        setTimeout(() => {
                            if (alert.parentNode) {
                                alert.parentNode.removeChild(alert);
                            }
                        }, 300);
                    }
                }, 5000);
            }
        }
    }

    clearAlerts() {
        const alerts = document.querySelectorAll('.auth-alert');
        alerts.forEach(alert => {
            alert.classList.remove('show');
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        });
    }

    getAlertIcon(type) {
        const icons = {
            success: '✅',
            danger: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    // Form validation methods
    validateForm(form) {
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    validateField(input) {
        const value = input.value.trim();
        const fieldType = input.type === 'email' ? 'email' : 
                         input.id.includes('password') ? 'password' :
                         input.id.includes('name') ? 'name' : 'text';

        let isValid = true;
        let errorMessage = '';

        // Check if field is empty
        if (!value) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(input)} is required`;
        } else {
            // Validate based on field type
            switch (fieldType) {
                case 'email':
                    if (!this.validationRules.email.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address';
                    }
                    break;
                case 'password':
                    if (!this.validationRules.password.test(value)) {
                        isValid = false;
                        errorMessage = 'Password must be at least 6 characters long';
                    }
                    break;
                case 'name':
                    if (!this.validationRules.name.test(value)) {
                        isValid = false;
                        errorMessage = 'Name must be at least 2 characters long';
                    }
                    break;
            }
        }

        this.showFieldError(input, isValid ? '' : errorMessage);
        return isValid;
    }

    addRealTimeValidation(form) {
        const inputs = form.querySelectorAll('input');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });

            input.addEventListener('input', () => {
                // Clear error on input
                this.showFieldError(input, '');
            });
        });
    }

    showFieldError(input, message) {
        const formGroup = input.closest('.form-group');
        let errorElement = formGroup.querySelector('.field-error');

        if (message) {
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                formGroup.appendChild(errorElement);
            }
            errorElement.textContent = message;
            input.classList.add('error');
        } else {
            if (errorElement) {
                errorElement.remove();
            }
            input.classList.remove('error');
        }
    }

    clearFormErrors() {
        const errors = document.querySelectorAll('.field-error');
        const errorInputs = document.querySelectorAll('input.error');
        
        errors.forEach(error => error.remove());
        errorInputs.forEach(input => input.classList.remove('error'));
    }

    getFieldLabel(input) {
        const label = input.closest('.form-group').querySelector('label');
        return label ? label.textContent : input.placeholder || 'Field';
    }

    getErrorMessage(error) {
        // Map common error messages to user-friendly ones
        const errorMessages = {
            'Network error': 'Unable to connect. Please check your internet connection.',
            'HTTP 401': 'Invalid email or password. Please try again.',
            'HTTP 409': 'An account with this email already exists.',
            'HTTP 500': 'Server error. Please try again later.',
            'Failed to fetch': 'Unable to connect to server. Please try again.'
        };

        const message = error.message || error.toString();
        return errorMessages[message] || message || 'An unexpected error occurred';
    }

    shakeForm(form) {
        form.classList.add('shake');
        setTimeout(() => {
            form.classList.remove('shake');
        }, 600);
    }

    addCustomStyles() {
        if (!document.getElementById('auth-custom-styles')) {
            const style = document.createElement('style');
            style.id = 'auth-custom-styles';
            style.textContent = `
                /* Enhanced Authentication Styles */
                .auth-container {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    position: relative;
                    overflow: hidden;
                }

                .auth-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
                    opacity: 0.3;
                }

                .auth-form {
                    position: relative;
                    z-index: 1;
                    backdrop-filter: blur(10px);
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    transition: transform 0.3s ease;
                }

                .auth-form:hover {
                    transform: translateY(-2px);
                }

                .auth-header h1 {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-weight: 700;
                }

                .form-group input {
                    transition: all 0.3s ease;
                    background: rgba(255, 255, 255, 0.9);
                }

                .form-group input:focus {
                    background: white;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                    transform: translateY(-1px);
                }

                .form-group input.error {
                    border-color: #ef4444;
                    background: #fef2f2;
                }

                .field-error {
                    color: #ef4444;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .field-error::before {
                    content: '⚠️';
                    font-size: 0.75rem;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }

                .btn-primary::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transition: left 0.5s;
                }

                .btn-primary:hover::before {
                    left: 100%;
                }

                .btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
                }

                .btn-primary.loading {
                    background: #9ca3af;
                    cursor: not-allowed;
                }

                .loading-spinner {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-right: 0.5rem;
                }

                .auth-alert {
                    margin: 1rem 0;
                    padding: 1rem;
                    border-radius: 8px;
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.3s ease;
                }

                .auth-alert.show {
                    opacity: 1;
                    transform: translateY(0);
                }

                .alert-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .alert-icon {
                    font-size: 1.1rem;
                }

                .alert-success {
                    background: #f0fdf4;
                    border: 1px solid #22c55e;
                    color: #166534;
                }

                .alert-danger {
                    background: #fef2f2;
                    border: 1px solid #ef4444;
                    color: #991b1b;
                }

                .alert-warning {
                    background: #fffbeb;
                    border: 1px solid #f59e0b;
                    color: #92400e;
                }

                .alert-info {
                    background: #eff6ff;
                    border: 1px solid #3b82f6;
                    color: #1e40af;
                }

                .shake {
                    animation: shake 0.6s ease-in-out;
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }

                .auth-switch a {
                    transition: all 0.2s ease;
                    position: relative;
                }

                .auth-switch a::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 0;
                    height: 2px;
                    background: #2563eb;
                    transition: width 0.3s ease;
                }

                .auth-switch a:hover::after {
                    width: 100%;
                }

                .auth-footer {
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                }

                .demo-notice {
                    background: #f0f9ff;
                    border: 1px solid #0ea5e9;
                    color: #0c4a6e;
                    padding: 0.75rem;
                    border-radius: 6px;
                    font-size: 0.875rem;
                    margin: 0;
                }

                .form-group input::placeholder {
                    color: #9ca3af;
                    opacity: 1;
                }

                .form-group label {
                    font-size: 0.875rem;
                    font-weight: 600;
                    letter-spacing: 0.025em;
                }

                /* Mobile enhancements */
                @media (max-width: 768px) {
                    .auth-form {
                        margin: 1rem;
                        padding: 1.5rem;
                    }
                    
                    .form-group input {
                        font-size: 16px; /* Prevents zoom on iOS */
                    }

                    .auth-header h1 {
                        font-size: 1.5rem;
                    }

                    .auth-header p {
                        font-size: 0.875rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

export default AuthComponent;