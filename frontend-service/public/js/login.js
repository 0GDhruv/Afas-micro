document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    try {
      const response = await fetch('http://localhost:3000/auth/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
  
      const data = await response.json();
      if (response.ok) {
        const token = data.token;
  
        // Decode JWT to get expiry
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = decoded.exp * 1000;
  
        localStorage.setItem('token', token);
  
        // Auto-logout timer
        setTimeout(() => {
          alert('Session expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/';
        }, expiryTime - Date.now());
  
        // Go to dashboard
        window.location.href = '/dashboard';
      } else {
        document.getElementById('errorMessage').textContent = data.message;
        document.getElementById('errorMessage').style.display = 'block';
      }
    } catch (err) {
      console.error('Error logging in:', err);
      document.getElementById('errorMessage').textContent = 'Server error. Please try again later.';
      document.getElementById('errorMessage').style.display = 'block';
    }
  });
  