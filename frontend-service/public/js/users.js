const userForm = document.getElementById('user-form');
const userTable = document.getElementById('user-table-body');
const searchInput = document.getElementById('search-input');
const pagination = document.getElementById('pagination');
const accessDropdown = document.getElementById('access-dropdown');

let currentPage = 1;
const limit = 10;

// Fetch and display all users
async function fetchUsers() {
  const search = searchInput.value;
  const response = await fetch(
    `http://localhost:3000/user/users?search=${search}&page=${currentPage}&limit=${limit}`
  );
  
  if (!response.ok) {
    // Provide a fallback or show an error message
    throw new Error(`Server returned ${response.status} - ${response.statusText}`);
  }

  const { users, total } = await response.json();

  // Clear table
  userTable.innerHTML = '';
  const userAccess = Array.isArray(username.access) ? user.access : [];

  users.forEach((user, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${(currentPage - 1) * limit + index + 1}</td>
      <td>${user.username}</td>
      <td>${userAccess.join(', ')}</td>
      <td>
          <button onclick="editUser(${user.id})">✏️</button>
          <button onclick="deleteUser(${user.id})">🗑️</button>
      </td>
    `;
    userTable.appendChild(row);
  });

  // Update pagination
  const totalPages = Math.ceil(total / limit);
  pagination.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.innerText = i;
    btn.disabled = i === currentPage;
    btn.onclick = () => changePage(i);
    pagination.appendChild(btn);
  }
}

function changePage(page) {
  currentPage = page;
  fetchUsers();
}

// Fetch pages for dropdown
async function fetchPages() {
  const response = await fetch('http://localhost:3000/user/users/pages');
  const pages = await response.json();

  accessDropdown.innerHTML = '';
  pages.forEach((page) => {
    const option = document.createElement('option');
    option.value = page;
    option.textContent = page;
    accessDropdown.appendChild(option);
  });
}

// Add new user
if (userForm) {
  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(userForm);
    const user = {
      username: formData.get('username'),
      password: formData.get('password'),
      access: [formData.get('access')] // or multiple if you're using multi-select
    };

    await fetch('http://localhost:3000/user/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });

    userForm.reset();
    fetchUsers();
  });
}

// Delete user
async function deleteUser(id) {
  await fetch(`http://localhost:3000/user/users/${id}`, { method: 'DELETE' });
  fetchUsers();
}

// Stub for editing user
function editUser(id) {
  alert(`Edit user ID ${id} not yet implemented.`);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (searchInput) {
    searchInput.addEventListener('keyup', () => {
      currentPage = 1;
      fetchUsers();
    });
  }
  fetchPages();
  fetchUsers();
});
