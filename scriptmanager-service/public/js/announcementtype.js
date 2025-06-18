// ✅ Fetch and populate languages dynamically from Upload Service
async function loadLanguages() {
  try {
    console.log("📢 Fetching languages...");
    const response = await fetch("/announcementtype/languages"); // ✅ Fetch from Upload Service
    if (!response.ok) throw new Error(`Failed to fetch languages. Status: ${response.status}`);

    const languages = await response.json();
    console.log("✅ Available Languages:", languages);

    // ✅ Populate language tabs dynamically
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

    // ✅ Auto-load announcement types for the first language
    if (languages.length > 0) {
      loadAnnouncementTypes(languages[0]);
    }
  } catch (err) {
    console.error("❌ Error fetching languages:", err.message);
  }
}

// ✅ Fetch announcement types only after the user selects a language
async function loadAnnouncementTypes(language) {
  if (!language) {
    console.warn("🚨 No language selected. Skipping API call.");
    return;
  }

  console.log(`🔗 Fetching announcement types for: ${language}`);

  try {
    const response = await fetch(`/announcementtype/types?language=${encodeURIComponent(language)}`);
    if (!response.ok) throw new Error(`Failed to fetch announcement types. Status: ${response.status}`);

    const types = await response.json();
    console.log("✅ Fetched announcement types:", types);

    const typeTable = document.getElementById("typesTable");
    typeTable.innerHTML = "";

    types.forEach((type, index) => {
      const row = `<tr>
        <td>${index + 1}</td>
        <td>${language}</td>
        <td>${type}</td>
        <td><button onclick="deleteType('${type}', '${language}')">🗑 Delete</button></td>
      </tr>`;
      typeTable.innerHTML += row;
    });

  } catch (err) {
    console.error("❌ Error loading announcement types:", err.message);
  }
}

// ✅ Add a new announcement type
async function addAnnouncementType(e) {
  e.preventDefault();

  const language = document.querySelector(".language-tab.active")?.getAttribute("data-lang");
  const newType = document.getElementById("newType").value.trim();

  if (!language || !newType) {
    alert("⚠️ Please select a language and enter an announcement type.");
    return;
  }

  try {
    const response = await fetch("/announcementtype/types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, type: newType }),
    });

    if (response.ok) {
      alert("✅ Announcement Type added successfully!");
      loadAnnouncementTypes(language);
    } else {
      alert("❌ Failed to add Announcement Type.");
    }
  } catch (err) {
    console.error("❌ Error adding Announcement Type:", err.message);
  }
}

// ✅ Delete an announcement type
async function deleteType(type, language) {
  if (!confirm(`⚠️ Are you sure you want to delete '${type}'?`)) return;

  try {
    const response = await fetch(`/announcementtype/types/${encodeURIComponent(type)}?language=${encodeURIComponent(language)}`, { method: "DELETE" });

    if (response.ok) {
      alert("✅ Announcement Type deleted successfully!");
      loadAnnouncementTypes(language);
    } else {
      alert("❌ Failed to delete Announcement Type.");
    }
  } catch (err) {
    console.error("❌ Error deleting Announcement Type:", err.message);
  }
}

// ✅ Initialize Page
console.log("🔄 Page Loaded: Fetching Languages...");
loadLanguages();

// ✅ Event Listener
document.getElementById("announcementtype-form").addEventListener("submit", addAnnouncementType);
