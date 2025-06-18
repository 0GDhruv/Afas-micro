document.addEventListener('DOMContentLoaded', () => {
    // This one line now secures the page and builds the sidebar.
    window.initializePage('users');

    const userForm = document.getElementById('userForm');
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userPasswordInput = document.getElementById('userPassword');
    const userRoleSelect = document.getElementById('userRole');
    const usersTableBody = document.getElementById('usersTableBody');
    const authToken = window.getToken();
    const API_BASE_URL = "http://localhost:4016/api/users";

    async function loadUsers() {
        if (!usersTableBody) return;
        window.showLoadingMessage(usersTableBody, "Loading users...", 5);
        try {
            const response = await fetch(API_BASE_URL, {
                headers: { 'Authorization': authToken }
            });
            if (response.status === 401) {
                return window.logout();
            }
            if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
            const users = await response.json();
            usersTableBody.innerHTML = "";
            if (users.length === 0) {
                return window.showInfoMessage(usersTableBody, "No users found.", 5);
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
                deleteButton.addEventListener('click', () => deleteUser(user.id, user.name));
                actionCell.appendChild(deleteButton);
            });
        } catch (err) {
            console.error("Error loading users:", err);
            if (usersTableBody) window.showErrorMessage(usersTableBody, "Error loading users. You may not have permission.", 5);
        }
    }

    if (userForm) {
        userForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = userNameInput.value.trim();
            const email = userEmailInput.value.trim();
            const password = userPasswordInput.value.trim();
            const role = userRoleSelect.value;
            if (!name || !email || !password || !role) {
                return alert("All fields are required to create a user.");
            }
            try {
                const response = await fetch(API_BASE_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", 'Authorization': authToken },
                    body: JSON.stringify({ name, email, password, role }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: "Failed to create user." }));
                    throw new Error(errorData.message);
                }
                alert("✅ User created successfully!");
                userForm.reset();
                loadUsers();
            } catch (err) {
                console.error("❌ Error creating user:", err.message);
                alert(`❌ Error: ${err.message}`);
            }
        });
    }

    async function deleteUser(id, userName) {
        if (!confirm(`Are you sure you want to delete user "${userName}" (ID: ${id})?`)) return;
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: "DELETE",
                headers: { 'Authorization': authToken }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to delete user." }));
                throw new Error(errorData.message);
            }
            alert(`User "${userName}" deleted successfully.`);
            loadUsers();
        } catch (err) {
            console.error("❌ Error deleting user:", err.message);
            alert(`❌ Error: ${err.message}`);
        }
    }

    loadUsers();
});
