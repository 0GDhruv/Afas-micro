// Auto-logout after 10 minutes of inactivity
let logoutTimer;

const resetLogoutTimer = () => {
    clearTimeout(logoutTimer);
    logoutTimer = setTimeout(() => {
        alert('You have been logged out due to inactivity.');
        logout();
    }, 10 * 60 * 1000); // 10 minutes
};

document.addEventListener('mousemove', resetLogoutTimer);
document.addEventListener('keypress', resetLogoutTimer);

resetLogoutTimer(); // Initialize timer

// Logout function
document.getElementById('logoutButton').addEventListener('click', logout);

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}
