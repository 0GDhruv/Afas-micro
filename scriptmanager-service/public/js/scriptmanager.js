async function loadLanguages() {
    const response = await fetch("/scriptmanager/languages");
    const languages = await response.json();
  
    const languageDropdown = document.getElementById("language");
    languageDropdown.innerHTML = "<option disabled selected>Select Language</option>";
  
    languages.forEach((language) => {
      const option = document.createElement("option");
      option.value = language;
      option.textContent = language.charAt(0).toUpperCase() + language.slice(1);
      languageDropdown.appendChild(option);
    });
  }
  
  async function loadAnnouncementTypes(language) {
    const response = await fetch(`/scriptmanager/announcement-types?language=${language}`);
    const types = await response.json();
  
    const typeDropdown = document.getElementById("announcementType");
    typeDropdown.innerHTML = "<option disabled selected>Select Announcement Type</option>";
  
    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      typeDropdown.appendChild(option);
    });
  }
  
  async function addScript() {
    const language = document.getElementById("language").value;
    const announcementType = document.getElementById("announcementType").value;
    const scriptName = document.getElementById("scriptName").value;
    const sequence = document.getElementById("sequence").value.split(",");
  
    const response = await fetch("/scriptmanager/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, announcementType, name: scriptName, sequence }),
    });
  
    if (response.ok) {
      alert("Script added successfully!");
      loadScripts();
    } else {
      alert("Failed to add script.");
    }
  }
  
  async function loadScripts() {
    const response = await fetch("/scriptmanager/scripts");
    const scripts = await response.json();
  
    const tableBody = document.getElementById("scriptsTable");
    tableBody.innerHTML = "";
  
    scripts.forEach((script, index) => {
      const row = `<tr>
        <td>${index + 1}</td>
        <td>${script.name}</td>
        <td>${script.language}</td>
        <td>${script.announcement_type}</td>
        <td>${JSON.parse(script.sequence).join(", ")}</td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  }
  
  document.getElementById("language").addEventListener("change", (e) => {
    const selectedLanguage = e.target.value;
    loadAnnouncementTypes(selectedLanguage);
  });
  
  document.getElementById("addScriptButton").addEventListener("click", addScript);
  
  loadLanguages();
  loadScripts();
  