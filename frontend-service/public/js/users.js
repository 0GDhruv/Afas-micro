// frontend-service/public/js/users.js
document.addEventListener('DOMContentLoaded', () => {
    const userForm = document.getElementById('userForm');
    const userNameInput = document.getElementById('userName'); // Changed from 'name' to 'userName' to match HTML
    const userEmailInput = document.getElementById('userEmail'); // Changed from 'email' to 'userEmail'
    const userPasswordInput = document.getElementById('userPassword'); // Changed from 'password' to 'userPassword'
    const userRoleSelect = document.getElementById('userRole'); // Changed from 'role' to 'userRole'
    const usersTableBody = document.getElementById('usersTableBody');

    const API_BASE_URL = "http://localhost:4016/api/users"; // Assuming user-service runs on 4016

    // Load Users
    async function loadUsers() {
        if (!usersTableBody) return;
        showLoadingMessage(usersTableBody, "Loading users...", 5); // Use helper
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
            const users = await response.json();

            usersTableBody.innerHTML = ""; // Clear loading/previous
            if (users.length === 0) {
                showInfoMessage(usersTableBody, "No users found.", 5);
                return;
            }
            users.forEach((user, index) => {
                const row = usersTableBody.insertRow();
                row.insertCell().textContent = index + 1;
                row.insertCell().textContent = user.name;
                row.insertCell().textContent = user.email;
                row.insertCell().textContent = user.role;
                
                const actionCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
                deleteButton.classList.add("action-btn", "delete-btn");
                deleteButton.title = `Delete user ${user.name}`;
                deleteButton.addEventListener('click', () => deleteUser(user.id, user.name));
                actionCell.appendChild(deleteButton);
            });
        } catch (err) {
            console.error("Error loading users:", err);
            if (usersTableBody) showErrorMessage(usersTableBody, "Error loading users. Check console.", 5);
        }
    }

    // Create User
    if (userForm) {
        userForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = userNameInput.value.trim();
            const email = userEmailInput.value.trim();
            const password = userPasswordInput.value.trim();
            const role = userRoleSelect.value;

            if (!name || !email || !password || !role) {
                alert("All fields are required to create a user.");
                return;
            }

            try {
                const response = await fetch(API_BASE_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password, role }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({message: "Failed to create user."}));
                    throw new Error(errorData.message);
                }
                alert("✅ User created successfully!");
                userForm.reset();
                loadUsers(); // Refresh the table
            } catch (err) {
                console.error("❌ Error creating user:", err.message);
                alert(`❌ Error: ${err.message}`);
            }
        });
    }

    // Delete User
    async function deleteUser(id, userName) {
        if (!confirm(`Are you sure you want to delete user "${userName}" (ID: ${id})?`)) return;
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({message: "Failed to delete user."}));
                throw new Error(errorData.message);
            }
            alert(`User "${userName}" deleted successfully.`);
            loadUsers(); // Refresh the table
        } catch (err) {
            console.error("❌ Error deleting user:", err.message);
            alert(`❌ Error: ${err.message}`);
        }
    }
    // window.deleteUser = deleteUser; // Not needed if using addEventListener

    // Initial Load
    loadUsers();
});
