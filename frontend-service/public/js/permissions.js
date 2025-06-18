document.addEventListener('DOMContentLoaded', () => {
    // This one line now secures the page and builds the sidebar.
    window.initializePage('permissions');

    const permForm = document.getElementById('permForm');
    const userSelect = document.getElementById('permUserId');
    const pageSelect = document.getElementById('permPage');
    const permTableBody = document.getElementById('permTableBody');
    const authToken = window.getToken();
    const USER_API_URL = "http://localhost:4016/api/users";
    const PERM_API_URL_BASE = "http://localhost:4016/api/permissions";

    async function loadUsersForDropdown() {
        if (!userSelect) return;
        userSelect.innerHTML = '<option value="">Loading users...</option>';
        try {
            const response = await fetch(USER_API_URL, { headers: { 'Authorization': authToken } });
            if (response.status === 401) return window.logout();
            if (!response.ok) throw new Error('Failed to fetch users');
            const users = await response.json();
            userSelect.innerHTML = '<option value="">-- Select User --</option>';
            if (users && users.length > 0) {
                users.forEach(user => userSelect.add(new Option(`${user.name} (${user.email})`, user.id)));
            } else {
                userSelect.innerHTML = '<option value="">-- No users found --</option>';
            }
        } catch (err) {
            console.error("Error loading users for dropdown:", err);
            userSelect.innerHTML = '<option value="">-- Error Loading Users --</option>';
        }
    }

    async function loadPermissions(userId = null) {
        if (!permTableBody) return;
        window.showLoadingMessage(permTableBody, "Loading permissions...", 5);
        const url = userId ? `${PERM_API_URL_BASE}/user/${userId}` : PERM_API_URL_BASE;
        try {
            const response = await fetch(url, { headers: { 'Authorization': authToken } });
            if (response.status === 401) return window.logout();
            if (!response.ok) throw new Error('Failed to fetch permissions');
            const permissions = await response.json();
            renderPermissionsTable(permissions);
        } catch (err) {
            console.error("Error loading permissions:", err);
            window.showErrorMessage(permTableBody, "Error loading permissions.", 5);
        }
    }

    function renderPermissionsTable(permissions) {
        permTableBody.innerHTML = "";
        if (!permissions || permissions.length === 0) {
            const message = userSelect.value ? "No permissions assigned to this user." : "Select a user to see their permissions.";
            return window.showInfoMessage(permTableBody, message, 5);
        }
        permissions.forEach((perm, index) => {
            const row = permTableBody.insertRow();
            row.insertCell().textContent = index + 1;
            row.insertCell().textContent = perm.name || 'N/A';
            row.insertCell().textContent = perm.email || 'N/A';
            row.insertCell().textContent = perm.page;
            const actionCell = row.insertCell();
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Revoke';
            deleteButton.classList.add("action-btn", "delete-btn");
            deleteButton.addEventListener('click', () => removePermission(perm.id, perm.page, perm.name));
            actionCell.appendChild(deleteButton);
        });
    }

    if (permForm) {
        permForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = userSelect.value;
            const selectedPages = Array.from(pageSelect.selectedOptions).map(option => option.value);
            if (!userId || selectedPages.length === 0) {
                return alert("Please select a user and at least one page.");
            }
            try {
                const response = await fetch(PERM_API_URL_BASE, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", 'Authorization': authToken },
                    body: JSON.stringify({ user_id: userId, pages: selectedPages }),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: "Failed to assign permission." }));
                    throw new Error(errorData.message);
                }
                alert("✅ Permissions assigned successfully!");
                loadPermissions(userId);
                pageSelect.selectedIndex = -1;
            } catch (err) {
                console.error("❌ Error assigning permissions:", err.message);
                alert(`❌ Error: ${err.message}`);
            }
        });
    }

    async function removePermission(permissionId, pageName, userName) {
        if (!confirm(`Revoke permission for "${pageName}" from "${userName}"?`)) return;
        try {
            const response = await fetch(`${PERM_API_URL_BASE}/${permissionId}`, {
                method: "DELETE",
                headers: { 'Authorization': authToken }
            });
            if (!response.ok) throw new Error('Failed to revoke permission.');
            alert("Permission revoked successfully.");
            loadPermissions(userSelect.value || null);
        } catch (err) {
            console.error("❌ Error revoking permission:", err.message);
            alert(`❌ Error: ${err.message}`);
        }
    }

    userSelect.addEventListener('change', () => {
        loadPermissions(userSelect.value || null);
    });

    loadUsersForDropdown();
    loadPermissions(null);
});
