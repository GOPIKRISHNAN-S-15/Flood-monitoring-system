// ===================================
//    AUTHENTICATION FUNCTIONALITY
// ===================================

class AuthManager {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.prefillDemoCredentials();
        });
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', this.handleSignup.bind(this));
        }

        // Password toggle buttons
        this.setupPasswordToggles();
    }

    setupPasswordToggles() {
        const toggleButtons = document.querySelectorAll('[id^="toggle"]');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePassword(button);
            });
        });
    }

    togglePassword(button) {
        const inputGroup = button.closest('.input-group');
        const input = inputGroup.querySelector('input');
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    prefillDemoCredentials() {
        // Only prefill on the login page
        if (window.location.pathname === '/login') {
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            // Add click handler to demo credentials section
            const demoCredentials = document.querySelector('.demo-credentials');
            if (demoCredentials) {
                demoCredentials.addEventListener('click', () => {
                    if (emailInput) emailInput.value = 'admin@pixelhunters.com';
                    if (passwordInput) passwordInput.value = 'admin123';
                });
                
                // Make it look clickable
                demoCredentials.style.cursor = 'pointer';
                demoCredentials.title = 'Click to fill form';
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const loginBtn = document.getElementById('loginBtn');
        const spinner = document.getElementById('loginSpinner');

        // Get form data
        const data = {
            email: formData.get('email').trim(),
            password: formData.get('password')
        };

        // Basic validation
        if (!this.validateLoginForm(data)) {
            return;
        }

        // Show loading state
        this.setLoadingState(loginBtn, spinner, true);

        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Store token and user data
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                // Show success message
                this.showAlert('Login successful! Redirecting to dashboard...', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
                
            } else {
                throw new Error(result.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert(error.message || 'Login failed. Please try again.', 'danger');
        } finally {
            this.setLoadingState(loginBtn, spinner, false);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const signupBtn = document.getElementById('signupBtn');
        const spinner = document.getElementById('signupSpinner');

        // Get form data
        const data = {
            name: formData.get('name').trim(),
            email: formData.get('email').trim(),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        // Validate form
        if (!this.validateSignupForm(data)) {
            return;
        }

        // Check terms agreement
        const agreeTerms = document.getElementById('agreeTerms');
        if (!agreeTerms.checked) {
            this.showAlert('Please agree to the Terms of Service and Privacy Policy', 'warning');
            return;
        }

        // Show loading state
        this.setLoadingState(signupBtn, spinner, true);

        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    password: data.password
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Store token and user data
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                // Show success message
                this.showAlert('Account created successfully! Redirecting to dashboard...', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
                
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showAlert(error.message || 'Registration failed. Please try again.', 'danger');
        } finally {
            this.setLoadingState(signupBtn, spinner, false);
        }
    }

    validateLoginForm(data) {
        let isValid = true;

        // Email validation
        if (!data.email) {
            this.showAlert('Email is required', 'warning');
            this.focusField('email');
            isValid = false;
        } else if (!this.isValidEmail(data.email)) {
            this.showAlert('Please enter a valid email address', 'warning');
            this.focusField('email');
            isValid = false;
        }

        // Password validation
        if (!data.password) {
            this.showAlert('Password is required', 'warning');
            if (isValid) this.focusField('password');
            isValid = false;
        }

        return isValid;
    }

    validateSignupForm(data) {
        let isValid = true;

        // Name validation
        if (!data.name || data.name.length < 2) {
            this.showAlert('Name must be at least 2 characters long', 'warning');
            this.focusField('name');
            isValid = false;
        }

        // Email validation
        if (!data.email) {
            this.showAlert('Email is required', 'warning');
            if (isValid) this.focusField('email');
            isValid = false;
        } else if (!this.isValidEmail(data.email)) {
            this.showAlert('Please enter a valid email address', 'warning');
            if (isValid) this.focusField('email');
            isValid = false;
        }

        // Password validation
        if (!data.password) {
            this.showAlert('Password is required', 'warning');
            if (isValid) this.focusField('password');
            isValid = false;
        } else if (data.password.length < 6) {
            this.showAlert('Password must be at least 6 characters long', 'warning');
            if (isValid) this.focusField('password');
            isValid = false;
        }

        // Confirm password validation
        if (data.password !== data.confirmPassword) {
            this.showAlert('Passwords do not match', 'warning');
            if (isValid) this.focusField('confirmPassword');
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    focusField(fieldName) {
        const field = document.getElementById(fieldName) || document.querySelector(`input[name="${fieldName}"]`);
        if (field) {
            setTimeout(() => field.focus(), 100);
        }
    }

    setLoadingState(button, spinner, loading) {
        if (loading) {
            button.disabled = true;
            if (spinner) {
                spinner.classList.remove('d-none');
            }
        } else {
            button.disabled = false;
            if (spinner) {
                spinner.classList.add('d-none');
            }
        }
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;

        // Clear existing alerts
        alertContainer.innerHTML = '';

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            <i class="fas ${this.getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        alertContainer.appendChild(alertDiv);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.classList.remove('show');
                setTimeout(() => alertDiv.remove(), 150);
            }
        }, 5000);
    }

    getAlertIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'danger': return 'fa-exclamation-circle';
            case 'info': return 'fa-info-circle';
            default: return 'fa-info-circle';
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('token');
        return !!token;
    }

    // Get current user data
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Logout function
    async logout() {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch(`${this.apiBase}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirect to home
            window.location.href = '/';
        }
    }

    // Auto-login check for protected pages
    checkAuthRequired() {
        const protectedPaths = ['/dashboard'];
        const currentPath = window.location.pathname;
        
        if (protectedPaths.includes(currentPath) && !this.isAuthenticated()) {
            window.location.href = '/login';
            return false;
        }
        
        return true;
    }

    // Redirect authenticated users away from auth pages
    checkAlreadyAuthenticated() {
        const authPaths = ['/login', '/signup'];
        const currentPath = window.location.pathname;
        
        if (authPaths.includes(currentPath) && this.isAuthenticated()) {
            window.location.href = '/dashboard';
            return false;
        }
        
        return true;
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Global functions for use in HTML
window.logout = () => authManager.logout();
window.isAuthenticated = () => authManager.isAuthenticated();
window.getCurrentUser = () => authManager.getCurrentUser();

// Run auth checks
authManager.checkAuthRequired();
authManager.checkAlreadyAuthenticated();