// public/js/users.js
const userForm = document.getElementById("user-form");
const userTable = document.getElementById("user-table");

userForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const access = Array.from(
    document.getElementById("access").selectedOptions
  ).map((opt) => opt.value);

  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, access }),
  });

  if (response.ok) {
    alert("User created!");
    loadUsers();
  } else {
    alert("Error creating user.");
  }
});

async function loadUsers() {
  const response = await fetch("/api/users");
  const users = await response.json();
  userTable.innerHTML = users
    .map(
      (user) => `
    <tr>
      <td>${user.username}</td>
      <td>${user.access.join(", ")}</td>
      <td>
        <button onclick="deleteUser('${user.id}')">Delete</button>
      </td>
    </tr>`
    )
    .join("");
}

async function deleteUser(id) {
  await fetch(`/api/users/${id}`, { method: "DELETE" });
  loadUsers();
}

loadUsers();
