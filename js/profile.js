/**
 * Profile Module
 * 
 * Handles user profile display and authentication state.
 * Loads and displays user information from the backend.
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
 * Check if user is authenticated
 * Redirects to login page if not authenticated
 */
function checkAuthentication() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (isLoggedIn !== 'true') {
        // Not logged in, redirect to login page
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

/**
 * Handle user logout
 */
async function handleLogout() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout.php`, {
            method: 'POST',
            credentials: 'include'
        });
        
        // Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        
        // Redirect to login page
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if API call fails
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        window.location.href = 'index.html';
    }
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Load and display user profile information
 */
async function loadProfile() {
    toggleLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile.php`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        toggleLoading(false);
        
        if (data.success) {
            // Update profile information in the UI
            document.getElementById('profileName').textContent = data.data.name;
            document.getElementById('profileEmail').textContent = data.data.email;
            document.getElementById('profileUserId').textContent = data.data.user_id;
            document.getElementById('profileCreatedAt').textContent = formatDate(data.data.created_at);
            
            // Show profile card
            document.getElementById('profileCard').style.display = 'block';
            
            // Update localStorage with fresh data
            localStorage.setItem('user', JSON.stringify(data.data));
            
        } else {
            if (response.status === 401) {
                // Session expired
                showMessage('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    localStorage.removeItem('user');
                    localStorage.removeItem('isLoggedIn');
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showMessage(data.message, 'error');
            }
        }
        
    } catch (error) {
        toggleLoading(false);
        console.error('Load profile error:', error);
        showMessage('Failed to load profile information', 'error');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!checkAuthentication()) {
        return; // Will be redirected
    }
    
    // Load profile information
    loadProfile();
    
    // Attach logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
});
