// frontend-service/public/js/permissions.js
document.addEventListener('DOMContentLoaded', () => {
    const permForm = document.getElementById('permForm');
    const userSelect = document.getElementById('permUserId'); // Corrected ID
    const pageSelect = document.getElementById('permPage'); // Corrected ID
    const permTableBody = document.getElementById('permTableBody');

    const USER_API_URL = "http://localhost:4016/api/users"; // User service
    const PERM_API_URL = "http://localhost:4016/api/permissions"; // Permissions within user/auth service

    // Load users into the dropdown
    async function loadUsersForDropdown() {
        if (!userSelect) return;
        try {
            const response = await fetch(USER_API_URL);
            if (!response.ok) throw new Error('Failed to fetch users for dropdown');
            const users = await response.json();
            userSelect.innerHTML = '<option value="">-- Select User --</option>'; // Placeholder
            users.forEach(user => {
                userSelect.add(new Option(`${user.name} (${user.email})`, user.id));
            });
        } catch (err) {
            console.error("Error loading users for dropdown:", err);
            userSelect.innerHTML = '<option value="">-- Error Loading Users --</option>';
        }
    }

    // Load current permissions
    async function loadPermissions() {
        if (!permTableBody) return;
        showLoadingMessage(permTableBody, "Loading permissions...", 5);
        try {
            const response = await fetch(PERM_API_URL);
            if (!response.ok) throw new Error('Failed to fetch permissions');
            const permissions = await response.json(); // Expects array like [{id, user_id, name (user), email, page}]

            permTableBody.innerHTML = "";
            if (permissions.length === 0) {
                showInfoMessage(permTableBody, "No permissions assigned yet.", 5);
                return;
            }
            permissions.forEach((perm, index) => {
                const row = permTableBody.insertRow();
                row.insertCell().textContent = index + 1;
                row.insertCell().textContent = perm.name || perm.user_name || 'N/A'; // User name
                row.insertCell().textContent = perm.email || 'N/A'; // User email
                row.insertCell().textContent = perm.page;
                
                const actionCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Revoke';
                deleteButton.classList.add("action-btn", "delete-btn");
                deleteButton.title = `Revoke permission for ${perm.page} from ${perm.name || perm.user_name}`;
                deleteButton.addEventListener('click', () => removePermission(perm.id, perm.page, perm.name || perm.user_name));
                actionCell.appendChild(deleteButton);
            });
        } catch (err) {
            console.error("Error loading permissions:", err);
            if (permTableBody) showErrorMessage(permTableBody, "Error loading permissions. Check console.", 5);
        }
    }

    // Assign Permission
    if (permForm) {
        permForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = userSelect.value;
            const page = pageSelect.value;

            if (!userId || !page) {
                alert("Please select both a user and a page to assign permission.");
                return;
            }

            try {
                const response = await fetch(PERM_API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user_id: userId, page: page }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(()=>({message: "Failed to assign permission."}));
                    throw new Error(errorData.message);
                }
                alert("✅ Permission assigned successfully!");
                permForm.reset(); // Reset form fields
                loadPermissions(); // Refresh the table
            } catch (err) {
                console.error("❌ Error assigning permission:", err.message);
                alert(`❌ Error: ${err.message}`);
            }
        });
    }

    // Remove Permission
    async function removePermission(permissionId, pageName, userName) {
        if (!confirm(`Are you sure you want to revoke permission for page "${pageName}" from user "${userName}"?`)) return;
        try {
            const response = await fetch(`${PERM_API_URL}/${permissionId}`, { method: "DELETE" });
            if (!response.ok) {
                const errorData = await response.json().catch(()=>({message: "Failed to revoke permission."}));
                throw new Error(errorData.message);
            }
            alert("Permission revoked successfully.");
            loadPermissions(); // Refresh the table
        } catch (err) {
            console.error("❌ Error revoking permission:", err.message);
            alert(`❌ Error: ${err.message}`);
        }
    }
    // window.removePermission = removePermission; // Not needed if using addEventListener

    // Initial Loads
    loadUsersForDropdown();
    loadPermissions();
});
