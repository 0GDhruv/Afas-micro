const BASE_URL = "http://localhost:4006";

// ✅ Fetch and populate languages dynamically
async function loadLanguages() {
  try {
    console.log("📢 Fetching languages...");
    const response = await fetch(`${BASE_URL}/announcementtype/languages`);
    if (!response.ok) throw new Error(`Failed to fetch languages. Status: ${response.status}`);

    const languages = await response.json();
    console.log("✅ Available Languages:", languages);

    const languageTabs = document.querySelector(".language-tabs");
    languageTabs.innerHTML = "";

    languages.forEach((language, index) => {
      const button = document.createElement("button");
      button.className = `language-tab ${index === 0 ? "active" : ""}`;
      button.setAttribute("data-lang", language);
      button.textContent = language.charAt(0).toUpperCase() + language.slice(1);

      button.addEventListener("click", () => {
        document.querySelector(".language-tab.active").classList.remove("active");
        button.classList.add("active");
        loadAnnouncementTypes(language);
      });

      languageTabs.appendChild(button);
    });

    if (languages.length > 0) {
      loadAnnouncementTypes(languages[0]);
    }
  } catch (err) {
    console.error("❌ Error fetching languages:", err.message);
  }
}

// ✅ Fetch announcement types
async function loadAnnouncementTypes(language) {
  const area = document.getElementById("area")?.value;
  if (!language || !area) return;

  try {
    const response = await fetch(`${BASE_URL}/announcementtype/types?language=${encodeURIComponent(language)}&area=${encodeURIComponent(area)}`);
    if (!response.ok) throw new Error(`Failed to fetch types. Status: ${response.status}`);

    const types = await response.json();
    const typeTable = document.getElementById("typesTable");
    typeTable.innerHTML = "";

    types.forEach((type, index) => {
      const row = `<tr>
        <td>${index + 1}</td>
        <td>${language}</td>
        <td>${area}</td>
        <td>${type}</td>
        <td><button onclick="deleteType('${type}', '${language}', '${area}')">🗑 Delete</button></td>
      </tr>`;
      typeTable.innerHTML += row;
    });
  } catch (err) {
    console.error("❌ Error loading announcement types:", err.message);
  }
}

// ✅ Add new type
async function addAnnouncementType(e) {
  e.preventDefault();

  const language = document.querySelector(".language-tab.active")?.getAttribute("data-lang");
  const area = document.getElementById("area").value;
  const newType = document.getElementById("newType").value.trim();

  if (!language || !newType || !area) {
    alert("⚠️ Please select all fields.");
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/announcementtype/types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, type: newType, area }),
    });

    if (response.ok) {
      alert("✅ Announcement Type added!");
      loadAnnouncementTypes(language);
    }
  } catch (err) {
    console.error("❌ Error adding type:", err.message);
  }
}

// ✅ Delete type
async function deleteType(type, language, area) {
  if (!confirm(`Delete '${type}'?`)) return;

  try {
    const response = await fetch(`${BASE_URL}/announcementtype/types/${encodeURIComponent(type)}?language=${encodeURIComponent(language)}&area=${encodeURIComponent(area)}`, {
      method: "DELETE"
    });

    if (response.ok) {
      alert("✅ Deleted!");
      loadAnnouncementTypes(language);
    } else {
      alert("❌ Delete failed");
    }
  } catch (err) {
    console.error("❌ Error deleting type:", err.message);
  }
}

document.getElementById("announcementtype-form").addEventListener("submit", addAnnouncementType);
loadLanguages();
