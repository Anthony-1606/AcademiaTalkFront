/**
 * Forum Module
 * 
 * Handles forum post creation, listing, and user interactions.
 * Manages authentication state and logout functionality.
 */

// Configuration
const API_BASE_URL = 'https://your-backend-url.onrender.com/api'; // TODO: Update with your Render backend URL

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
async function checkAuthentication() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    if (isLoggedIn !== 'true') {
        // Not logged in locally, redirect to login
        window.location.href = 'index.html';
        return false;
    }
    
    // Verify session with backend
    try {
        const response = await fetch(`${API_BASE_URL}/users/profile.php`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!data.success) {
            // Session expired or invalid
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            window.location.href = 'index.html';
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('Authentication check error:', error);
        showMessage('Failed to verify authentication', 'error');
        return false;
    }
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
        
        const data = await response.json();
        
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
 * Update character count for text inputs
 * @param {HTMLElement} input - The input element
 * @param {HTMLElement} counter - The counter element
 */
function updateCharCount(input, counter) {
    const currentLength = input.value.length;
    counter.textContent = currentLength;
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
}

/**
 * Create HTML for a single post
 * @param {Object} post - Post data object
 * @returns {string} HTML string for the post
 */
function createPostHTML(post) {
    return `
        <div class="post">
            <div class="post-header">
                <div>
                    <h3 class="post-title">${escapeHtml(post.title)}</h3>
                    <div class="post-meta">
                        <span class="post-author">${escapeHtml(post.author_name)}</span>
                        <span class="post-date">${formatDate(post.created_at)}</span>
                    </div>
                </div>
            </div>
            <div class="post-content">${escapeHtml(post.content)}</div>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Load and display all forum posts
 */
async function loadPosts() {
    const postsContainer = document.getElementById('postsContainer');
    toggleLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts/list.php`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        toggleLoading(false);
        
        if (data.success) {
            if (data.data.length === 0) {
                postsContainer.innerHTML = '<div class="no-posts">No posts yet. Be the first to share your thoughts!</div>';
            } else {
                // Create HTML for all posts
                const postsHTML = data.data.map(post => createPostHTML(post)).join('');
                postsContainer.innerHTML = postsHTML;
            }
        } else {
            showMessage(data.message, 'error');
            postsContainer.innerHTML = '<div class="no-posts">Failed to load posts</div>';
        }
        
    } catch (error) {
        toggleLoading(false);
        console.error('Load posts error:', error);
        showMessage('Failed to connect to server', 'error');
        postsContainer.innerHTML = '<div class="no-posts">Failed to load posts</div>';
    }
}

/**
 * Handle post creation
 * @param {Event} event - Form submit event
 */
async function handleCreatePost(event) {
    event.preventDefault();
    
    // Get form values
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    
    // Client-side validation
    if (title.length < 5 || title.length > 200) {
        showMessage('Title must be between 5 and 200 characters', 'error');
        return;
    }
    
    if (content.length < 10 || content.length > 5000) {
        showMessage('Content must be between 10 and 5000 characters', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts/create.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ title, content })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message, 'success');
            
            // Clear form
            document.getElementById('createPostForm').reset();
            document.getElementById('titleCount').textContent = '0';
            document.getElementById('contentCount').textContent = '0';
            
            // Reload posts to show the new one
            loadPosts();
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
        console.error('Create post error:', error);
        showMessage('Failed to create post. Please try again.', 'error');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
        return; // Will be redirected by checkAuthentication
    }
    
    // Load posts
    loadPosts();
    
    // Attach form submit handler
    const createPostForm = document.getElementById('createPostForm');
    if (createPostForm) {
        createPostForm.addEventListener('submit', handleCreatePost);
    }
    
    // Attach logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // Character count for title
    const titleInput = document.getElementById('postTitle');
    const titleCounter = document.getElementById('titleCount');
    if (titleInput && titleCounter) {
        titleInput.addEventListener('input', function() {
            updateCharCount(titleInput, titleCounter);
        });
    }
    
    // Character count for content
    const contentInput = document.getElementById('postContent');
    const contentCounter = document.getElementById('contentCount');
    if (contentInput && contentCounter) {
        contentInput.addEventListener('input', function() {
            updateCharCount(contentInput, contentCounter);
        });
    }
});
