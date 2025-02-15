// ✅ Fetch and display languages dynamically from Upload Service
async function loadLanguages() {
  try {
    console.log("📢 Fetching languages from API...");
    const response = await fetch("/announcementtype/languages"); // ✅ Correct endpoint
    if (!response.ok) throw new Error(`Failed to fetch languages. Status: ${response.status}`);

    const languages = await response.json();
    console.log("✅ Fetched languages:", languages);

    // ✅ Populate language tabs
    const languageTabs = document.querySelector(".language-tabs");
    languageTabs.innerHTML = ""; // ✅ Clear previous tabs

    languages.forEach((language, index) => {
      const button = document.createElement("button");
      button.className = `language-tab ${index === 0 ? "active" : ""}`;
      button.setAttribute("data-lang", language);
      button.textContent = language.charAt(0).toUpperCase() + language.slice(1);

      button.addEventListener("click", () => {
        document.querySelector(".language-tab.active").classList.remove("active");
        button.classList.add("active");

        // ✅ Fetch announcement types **ONLY AFTER** a language is selected
        loadAnnouncementTypes(language);
      });

      languageTabs.appendChild(button);
    });

    console.log("✅ Language tabs created successfully.");
  } catch (err) {
    console.error("❌ Error loading languages:", err.message);
  }
}

// ✅ Fetch announcement types for the selected language (ONLY after language selection)
async function loadAnnouncementTypes(language) {
  if (!language) {
    console.error("🚨 No language selected. Cannot load announcement types.");
    return;
  }

  console.log(`🔗 Requesting: /announcementtype?language=${language}`);

  try {
    const response = await fetch(`/announcementtype?language=${encodeURIComponent(language)}`);
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
        <td><button onclick="deleteType('${type}', '${language}')">Delete</button></td>
      </tr>`;
      typeTable.innerHTML += row;
    });

    console.log("✅ Announcement types updated successfully.");
  } catch (err) {
    console.error("❌ Error loading announcement types:", err.message);
  }
}

// ✅ Initialize Page (Only Fetch Languages, NOT Announcement Types Yet)
console.log("🔄 Page Loaded: Fetching Languages...");
loadLanguages();
