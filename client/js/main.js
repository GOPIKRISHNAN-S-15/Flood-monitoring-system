// ===================================
//    MAIN APPLICATION UTILITIES
// ===================================

class FloodGuardApp {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.checkAuthOnPages();
    }

    setupEventListeners() {
        // Navigation toggle for mobile
        document.addEventListener('DOMContentLoaded', () => {
            this.setupMobileNavigation();
            this.setupSmoothScrolling();
            this.setupFormEnhancements();
        });
    }

    setupMobileNavigation() {
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');
        
        if (navbarToggler && navbarCollapse) {
            navbarToggler.addEventListener('click', () => {
                navbarCollapse.classList.toggle('show');
            });

            // Close mobile nav when clicking outside
            document.addEventListener('click', (e) => {
                if (!navbarToggler.contains(e.target) && !navbarCollapse.contains(e.target)) {
                    navbarCollapse.classList.remove('show');
                }
            });
        }
    }

    setupSmoothScrolling() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupFormEnhancements() {
        // Password toggle functionality
        document.querySelectorAll('[id^="toggle"]').forEach(button => {
            button.addEventListener('click', this.togglePasswordVisibility);
        });

        // Form validation enhancements
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('blur', this.validateField);
            input.addEventListener('input', this.clearFieldErrors);
        });
    }

    togglePasswordVisibility(e) {
        e.preventDefault();
        const button = e.target.closest('button');
        const input = button.closest('.input-group').querySelector('input');
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    validateField(e) {
        const field = e.target;
        const value = field.value.trim();
        const type = field.type;
        const name = field.name;

        // Remove existing validation feedback
        this.clearFieldErrors(e);

        let isValid = true;
        let message = '';

        // Email validation
        if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Please enter a valid email address';
            }
        }

        // Password validation
        if ((name === 'password' || type === 'password') && value) {
            if (value.length < 6) {
                isValid = false;
                message = 'Password must be at least 6 characters long';
            }
        }

        // Confirm password validation
        if (name === 'confirmPassword' && value) {
            const password = document.querySelector('input[name="password"]');
            if (password && value !== password.value) {
                isValid = false;
                message = 'Passwords do not match';
            }
        }

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            message = 'This field is required';
        }

        if (!isValid) {
            this.showFieldError(field, message);
        }

        return isValid;
    }

    clearFieldErrors(e) {
        const field = e.target;
        field.classList.remove('is-invalid');
        const feedback = field.parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    }

    showFieldError(field, message) {
        field.classList.add('is-invalid');
        
        // Remove existing feedback
        const existingFeedback = field.parentElement.querySelector('.invalid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Add new feedback
        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.textContent = message;
        field.parentElement.appendChild(feedback);
    }

    loadUserData() {
        const token = localStorage.getItem('token');
        if (token) {
            // Update navigation to show user state
            this.updateNavigationAuth(true);
        }
    }

    checkAuthOnPages() {
        const protectedPages = ['/dashboard'];
        const currentPath = window.location.pathname;
        const token = localStorage.getItem('token');

        if (protectedPages.includes(currentPath) && !token) {
            window.location.href = '/login';
            return;
        }

        // Redirect to dashboard if already logged in and on auth pages
        const authPages = ['/login', '/signup'];
        if (authPages.includes(currentPath) && token) {
            window.location.href = '/dashboard';
            return;
        }
    }

    updateNavigationAuth(isAuthenticated) {
        const loginLink = document.querySelector('a[href="/login"]');
        const signupLink = document.querySelector('a[href="/signup"]');
        const dashboardLink = document.querySelector('a[href="/dashboard"]');

        if (isAuthenticated) {
            // Show dashboard, hide auth links
            if (loginLink) loginLink.style.display = 'none';
            if (signupLink) signupLink.style.display = 'none';
            if (dashboardLink) dashboardLink.style.display = 'block';
        } else {
            // Show auth links, hide dashboard
            if (loginLink) loginLink.style.display = 'block';
            if (signupLink) signupLink.style.display = 'block';
            if (dashboardLink) dashboardLink.style.display = 'none';
        }
    }

    // API Helper Methods
    async makeRequest(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, mergedOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Utility Methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return this.formatDate(dateString);
    }

    getStatusColor(status) {
        switch (status.toLowerCase()) {
            case 'normal': return '#28a745';
            case 'warning': return '#ffc107';
            case 'danger': return '#dc3545';
            default: return '#6c757d';
        }
    }

    getStatusIcon(status) {
        switch (status.toLowerCase()) {
            case 'normal': return 'fas fa-check-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            case 'danger': return 'fas fa-exclamation-circle';
            default: return 'fas fa-question-circle';
        }
    }

    showAlert(message, type = 'info', duration = 5000) {
        const alertContainer = document.getElementById('alert-container') || document.body;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        alertContainer.appendChild(alert);

        // Auto remove after duration
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, duration);

        return alert;
    }

    showLoading(element, show = true) {
        if (show) {
            element.disabled = true;
            const spinner = element.querySelector('.spinner-border');
            if (spinner) {
                spinner.classList.remove('d-none');
            }
        } else {
            element.disabled = false;
            const spinner = element.querySelector('.spinner-border');
            if (spinner) {
                spinner.classList.add('d-none');
            }
        }
    }

    // Status monitoring
    async checkSystemHealth() {
        try {
            const data = await this.makeRequest('/health');
            return data.success;
        } catch (error) {
            console.error('System health check failed:', error);
            return false;
        }
    }

    // Local storage helpers
    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('LocalStorage set failed:', error);
        }
    }

    getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('LocalStorage get failed:', error);
            return defaultValue;
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('LocalStorage remove failed:', error);
        }
    }
}

// Initialize the application
const floodGuardApp = new FloodGuardApp();

// Global utility functions for backward compatibility
window.formatDate = (date) => floodGuardApp.formatDate(date);
window.formatTimeAgo = (date) => floodGuardApp.formatTimeAgo(date);
window.getStatusColor = (status) => floodGuardApp.getStatusColor(status);
window.getStatusIcon = (status) => floodGuardApp.getStatusIcon(status);
window.showAlert = (message, type, duration) => floodGuardApp.showAlert(message, type, duration);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FloodGuardApp;
}