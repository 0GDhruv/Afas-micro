async function loadAnnouncementTypes(language) {
  try {
    const response = await fetch(`/announcementtype?language=${language}`);
    if (!response.ok) throw new Error("Failed to fetch announcement types.");
    
    const types = await response.json();
    const typeTable = document.getElementById("typesTable");
    typeTable.innerHTML = "";

    types.forEach((type, index) => {
      const row = `<tr>
        <td>${index + 1}</td>
        <td>${language}</td>
        <td>${type}</td>
        <td><button onclick="deleteType('${type}')">Delete</button></td>
      </tr>`;
      typeTable.innerHTML += row;
    });
  } catch (err) {
    console.error("Error loading announcement types:", err.message);
  }
}

async function addAnnouncementType(e) {
  e.preventDefault();

  const language = document.getElementById("language").value;
  const newType = document.getElementById("newType").value.trim();

  if (!language || !newType) {
    alert("Please select a language and enter an announcement type.");
    return;
  }

  const response = await fetch("/announcementtype", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, type: newType }),
  });

  if (response.ok) {
    loadAnnouncementTypes(language);
  } else {
    alert("Failed to add announcement type.");
  }
}

async function deleteType(type) {
  const language = document.getElementById("language").value;

  if (!confirm(`Are you sure you want to delete the type '${type}'?`)) {
    return;
  }

  const response = await fetch(`/announcementtype/${type}`, { method: "DELETE" });

  if (response.ok) {
    loadAnnouncementTypes(language);
  } else {
    alert("Failed to delete type.");
  }
}

document.getElementById("language").addEventListener("change", (e) => {
  loadAnnouncementTypes(e.target.value);
});

document.getElementById("announcementtype-form").addEventListener("submit", addAnnouncementType);
