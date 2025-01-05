document.addEventListener('DOMContentLoaded', async () => {
  const usersTable = document.getElementById('usersTable');
  try {
      const response = await fetch('http://localhost:3000/user/users'); // Gateway endpoint
      const users = await response.json();

      console.log('Fetched users:', users); // Debugging log

      users.forEach(user => {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${user.id}</td>
              <td>${user.username}</td>
          `;
          usersTable.appendChild(row);
      });
  } catch (err) {
      console.error('Error fetching users:', err);
  }
});
