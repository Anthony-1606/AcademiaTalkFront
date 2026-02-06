/**
 * Authentication Module
 * 
 * Handles user login and registration functionality.
 * Manages form submissions, API calls, and user feedback.
 */

// API_BASE_URL is defined in config.js

/**
 * Show a message to the user
 * @param {string} message - The message text
 * @param {string} type - Message type: 'success', 'error', or 'info'
 */
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message message-${type} show`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 5000);
}

/**
 * Show/hide loading spinner
 * @param {boolean} show - Whether to show or hide the spinner
 */
function toggleLoading(show) {
    const loadingDiv = document.getElementById('loading');
    if (show) {
        loadingDiv.classList.add('show');
    } else {
        loadingDiv.classList.remove('show');
    }
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Handle user registration
 * @param {Event} event - Form submit event
 */
async function handleRegister(event) {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    // Client-side validation
    if (name.length < 3 || name.length > 100) {
        showMessage('Name must be between 3 and 100 characters', 'error');
        return;
    }
    
    if (!isValidEmail(email) || email.length > 100) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Show loading spinner
    toggleLoading(true);
    
    try {
        // Make API request
        const response = await fetch(`${API_BASE_URL}/auth/register.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        // Hide loading spinner
        toggleLoading(false);
        
        if (data.success) {
            showMessage(data.message + ' Please login to continue.', 'success');
            // Clear registration form
            document.getElementById('registerForm').reset();
        } else {
            showMessage(data.message, 'error');
        }
        
    } catch (error) {
        toggleLoading(false);
        console.error('Registration error:', error);
        showMessage('Failed to connect to server. Please try again later.', 'error');
    }
}

/**
 * Handle user login
 * @param {Event} event - Form submit event
 */
async function handleLogin(event) {
    event.preventDefault();
    
    // Get form values
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Client-side validation
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (!password) {
        showMessage('Password is required', 'error');
        return;
    }
    
    // Show loading spinner
    toggleLoading(true);
    
    try {
        // Make API request
        const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for session cookies
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        // Hide loading spinner
        toggleLoading(false);
        
        if (data.success) {
            // Store user info in localStorage for quick access
            localStorage.setItem('user', JSON.stringify(data.data));
            localStorage.setItem('isLoggedIn', 'true');
            
            showMessage(data.message + ' Redirecting...', 'success');
            
            // Redirect to forum page after short delay
            setTimeout(() => {
                window.location.href = 'forum.html';
            }, 1000);
        } else {
            showMessage(data.message, 'error');
        }
        
    } catch (error) {
        toggleLoading(false);
        console.error('Login error:', error);
        showMessage('Failed to connect to server. Please try again later.', 'error');
    }
}

/**
 * Check if user is already logged in
 * If yes, redirect to forum page
 */
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        // Verify session with backend
        verifySession();
    }
}

/**
 * Verify session with backend
 * Redirects to forum if session is valid
 */
async function verifySession() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile.php`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Session is valid, redirect to forum
            window.location.href = 'forum.html';
        } else {
            // Session expired or invalid
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
        }
    } catch (error) {
        console.error('Session verification error:', error);
        // Don't show error message, just continue on login page
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    checkLoginStatus();
    
    // Attach form submit handlers
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});
