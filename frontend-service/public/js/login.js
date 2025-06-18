document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('loginButton');
    const errorMessageDiv = document.getElementById('login-error-message');

    // If a user is already logged in, redirect them to the dashboard
    if (localStorage.getItem('afas_token')) {
        window.location.href = '/dashboard';
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Disable button and clear previous errors
            loginButton.disabled = true;
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            errorMessageDiv.style.display = 'none';

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                showError("Email and password are required.");
                return;
            }

            try {
                const response = await fetch('http://localhost:4016/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Login failed.');
                }

                // On successful login, store token and user info
                localStorage.setItem('afas_token', data.token);
                localStorage.setItem('afas_user', JSON.stringify(data.user));

                // Redirect to the dashboard
                window.location.href = '/dashboard';

            } catch (err) {
                showError(err.message);
            } finally {
                loginButton.disabled = false;
                loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            }
        });
    }

    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
        loginButton.disabled = false;
        loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    }
});
