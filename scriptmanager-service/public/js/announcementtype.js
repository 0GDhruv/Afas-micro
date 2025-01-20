async function loadAnnouncementTypes() {
    const response = await fetch("/announcementtype");
    const types = await response.json();
  
    const tableBody = document.getElementById("typesTable");
    tableBody.innerHTML = "";
  
    types.forEach((type) => {
      const row = `<tr>
        <td>${type.id}</td>
        <td>${type.language}</td>
        <td>${type.type}</td>
        <td>
          <button onclick="deleteType(${type.id})">Delete</button>
        </td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  }
  
  async function addType() {
    const language = document.getElementById("language").value;
    const type = document.getElementById("newType").value;
  
    const response = await fetch("/announcementtype", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, type }),
    });
  
    if (response.ok) {
      loadAnnouncementTypes();
    } else {
      alert("Failed to add announcement type.");
    }
  }
  
  async function deleteType(id) {
    const response = await fetch(`/announcementtype/${id}`, { method: "DELETE" });
  
    if (response.ok) {
      loadAnnouncementTypes();
    } else {
      alert("Failed to delete announcement type.");
    }
  }
  
  document.getElementById("addType").addEventListener("click", addType);
  loadAnnouncementTypes();
  