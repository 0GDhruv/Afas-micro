// --- Authentication Helper Functions ---

function getToken() {
    const token = localStorage.getItem('afas_token');
    return token ? `Bearer ${token}` : null;
}

function getUser() {
    const user = localStorage.getItem('afas_user');
    return user ? JSON.parse(user) : null;
}

function logout() {
    localStorage.removeItem('afas_token');
    localStorage.removeItem('afas_user');
    window.location.href = '/login';
}

/**
 * ✅ NEW: This is the main function to secure a page and build the UI.
 * It checks for a valid token and then builds the sidebar based on user role and permissions.
 * @param {string} currentPage - The identifier for the current page (e.g., 'dashboard', 'users').
 */
async function initializePage(currentPage) {
    const user = getUser();
    const token = getToken();

    // 1. Check for token. If missing, redirect to login immediately.
    if (!token || !user) {
        window.location.href = '/login';
        return;
    }

    // 2. Define all possible sidebar links.
    const allPages = [
        { id: 'dashboard', href: '/dashboard', icon: 'fa-tachometer-alt', text: 'Dashboard' },
        { id: 'upload', href: '/upload', icon: 'fa-upload', text: 'Upload Audio' },
        { id: 'announcement-type', href: '/announcement-type', icon: 'fa-bullhorn', text: 'Announcement Type' },
        { id: 'sequence', href: '/sequence', icon: 'fa-list-ol', text: 'Sequence' },
        { id: 'scheduler', href: '/scheduler', icon: 'fa-calendar-alt', text: 'Scheduler' },
        { id: 'zones', href: '/zones', icon: 'fa-map-marker-alt', text: 'Zones' },
        { id: 'users', href: '/users', icon: 'fa-users', text: 'Users' },
        { id: 'permissions', href: '/permissions', icon: 'fa-user-shield', text: 'Permissions' },
        { id: 'settings', href: '/settings', icon: 'fa-cog', text: 'Global Settings' },
        { id: 'tts-utility', href: '/tts-utility', icon: 'fa-microphone-lines', text: 'TTS Utility' },
        { id: 'logs', href: '/logs', icon: 'fa-history', text: 'System Logs' },
    ];

    let permittedPages = [];

    // 3. Determine which pages the user can see.
    if (user.role === 'admin') {
        // Admins can see all pages.
        permittedPages = allPages.map(p => p.id);
    } else {
        // For non-admins, fetch their specific permissions.
        try {
            const response = await fetch('http://localhost:4016/api/users/me/permissions', {
                headers: { 'Authorization': token }
            });
            if (response.status === 401) return logout(); // Bad token
            if (!response.ok) throw new Error('Could not fetch permissions.');
            
            const data = await response.json();
            permittedPages = data.pages || [];
        } catch (error) {
            console.error(error);
            alert("Could not verify your permissions. Logging you out.");
            logout();
            return;
        }
    }

    // 4. Check if the user is allowed to be on the current page.
    // The dashboard is a fallback page everyone is allowed to see.
    if (currentPage !== 'dashboard' && !permittedPages.includes(currentPage)) {
        alert("You do not have permission to access this page.");
        window.location.href = '/dashboard'; // Redirect to a safe page
        return;
    }
    
    // 5. Build the sidebar dynamically.
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        // Filter the links the user is allowed to see
        const linksToRender = allPages.filter(page => permittedPages.includes(page.id));
        
        // Clear existing static links and build new ones
        sidebar.innerHTML = `<h2>AFAS</h2>`; // Keep the title
        linksToRender.forEach(page => {
            const link = document.createElement('a');
            link.href = page.href;
            link.innerHTML = `<i class="fas ${page.icon} fa-fw"></i> ${page.text}`;
            if (page.id === currentPage) {
                link.classList.add('active');
            }
            sidebar.appendChild(link);
        });
    }
}


// --- UI Helper Functions ---
function showLoadingMessage(tableBody, message = "Loading...", colSpan = 5) {
  if (tableBody) {
    tableBody.innerHTML = `<tr><td colspan="${colSpan}" class="loading-text">${message}</td></tr>`;
  }
}
function showErrorMessage(tableBody, message = "An error occurred.", colSpan = 5) {
  if (tableBody) {
    tableBody.innerHTML = `<tr><td colspan="${colSpan}" class="error-message">${message}</td></tr>`;
  }
}
function showInfoMessage(tableBody, message, colSpan = 5) {
  if (tableBody) {
    tableBody.innerHTML = `<tr><td colspan="${colSpan}" class="no-data-text">${message}</td></tr>`;
  }
}


// --- Make functions available globally ---
window.getToken = getToken;
window.getUser = getUser;
window.logout = logout;
window.initializePage = initializePage; // ✅ Expose the new function
window.showLoadingMessage = showLoadingMessage;
window.showErrorMessage = showErrorMessage;
window.showInfoMessage = showInfoMessage;
