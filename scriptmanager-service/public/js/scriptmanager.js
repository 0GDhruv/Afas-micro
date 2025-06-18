// ✅ Load languages dynamically from Upload Service
async function loadLanguages() {
  try {
    console.log("📢 Fetching languages...");
    const response = await fetch("/announcementtype/languages");
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
        document.querySelector(".language-tab.active")?.classList.remove("active");
        button.classList.add("active");
        loadAnnouncementTypes(language);
        loadScripts();
      });

      languageTabs.appendChild(button);
    });

    if (languages.length > 0) {
      loadAnnouncementTypes(languages[0]);
      loadScripts();
    }
  } catch (err) {
    console.error("❌ Error fetching languages:", err.message);
  }
}

// ✅ Get the selected language from active tab
function getSelectedLanguage() {
  return document.querySelector(".language-tab.active")?.getAttribute("data-lang") || "english"; // Default to English
}

// ✅ Fetch Announcement Types based on Language & Area
async function loadAnnouncementTypes(language = getSelectedLanguage()) {
  const area = document.getElementById("area")?.value;
  if (!language || !area) return;

  console.log(`🔗 Fetching announcement types for: ${language}, Area: ${area}`);

  try {
    const response = await fetch(`/announcementtype/types?language=${encodeURIComponent(language)}&area=${encodeURIComponent(area)}`);
    
    if (!response.ok) throw new Error(`Failed to fetch announcement types. Status: ${response.status}`);

    const types = await response.json();
    console.log("✅ Fetched announcement types:", types);

    const typeDropdown = document.getElementById("announcementType");
    typeDropdown.innerHTML = "<option value='' disabled selected>Select Announcement Type</option>";

    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      typeDropdown.appendChild(option);
    });

  } catch (err) {
    console.error("❌ Error loading announcement types:", err.message);
  }
}

// ✅ Fetch transcriptions from Upload Audio Service
async function getTranscription() {
  const sequence = document.getElementById("sequence").value.trim();
  if (!sequence) {
    alert("⚠️ Please enter a sequence before fetching transcriptions.");
    return;
  }

  try {
    const language = getSelectedLanguage();
    console.log(`🔍 Fetching transcription for: ${sequence} in ${language}`);

    const response = await fetch(`/scriptmanager/transcriptions?sequence=${encodeURIComponent(sequence)}&language=${encodeURIComponent(language)}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch transcriptions. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Transcription Response:", data);

    document.getElementById("transcription").value = data.transcriptions.join(" ");
  } catch (err) {
    console.error("❌ Error fetching transcription:", err.message);
    alert("❌ Failed to fetch transcription.");
  }
}

// ✅ Attach event listener to "Get Transcription" button
document.getElementById("get-transcription").addEventListener("click", getTranscription);


// ✅ Fetch scripts based on language & area
async function loadScripts() {
  const language = getSelectedLanguage();
  const area = document.getElementById("area")?.value;

  if (!language || !area) {
    console.warn("🚨 No language or area selected. Skipping API call.");
    return;
  }

  console.log(`🔄 Fetching scripts for: ${language}, Area: ${area}`);

  try {
    const response = await fetch(`/scriptmanager/scripts?language=${encodeURIComponent(language)}&area=${encodeURIComponent(area)}`);
    if (!response.ok) throw new Error("Failed to fetch scripts.");

    const scripts = await response.json();
    console.log("✅ Loaded Scripts:", scripts);

    const tableBody = document.getElementById("scriptsTable");
    tableBody.innerHTML = "";

    scripts.forEach((script, index) => {
      const row = `<tr>
        <td>${index + 1}</td>
        <td>${script.announcement_type}</td> 
        <td>${script.sequence}</td>
        <td>${script.transcription || "N/A"}</td>
        <td>
          <button onclick="editScript(${script.id})">✏️ Edit</button>
          <button onclick="deleteScript(${script.id})">🗑 Delete</button>
        </td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  } catch (err) {
    console.error("❌ Error loading scripts:", err.message);
  }
}

// ✅ Edit a script
async function editScript(id) {
  try {
    console.log(`🔍 Fetching script details for ID: ${id}`);
    
    const response = await fetch(`/scriptmanager/scripts/${id}`);
    if (!response.ok) throw new Error("Failed to fetch script details.");

    const script = await response.json();
    console.log("✅ Script loaded:", script);

    document.getElementById("script-id").value = script.id;
    document.getElementById("announcementType").value = script.announcement_type;
    document.getElementById("sequence").value = script.sequence;
    document.getElementById("transcription").value = script.transcription || "";

    document.getElementById("add-script-btn").textContent = "Update Sequence";
  } catch (err) {
    console.error("❌ Error editing script:", err.message);
  }
}

// ✅ Delete a script
async function deleteScript(id) {
  try {
    const response = await fetch(`/scriptmanager/scripts/${id}`, { method: "DELETE" });
    if (response.ok) {
      alert("✅ Script deleted successfully!");
      loadScripts();
    } else {
      alert("❌ Failed to delete script.");
    }
  } catch (err) {
    console.error("❌ Error deleting script:", err.message);
  }
}

// ✅ Update announcement types when area changes
document.getElementById("area").addEventListener("change", () => {
  const language = getSelectedLanguage();
  loadAnnouncementTypes(language);
});

// ✅ Reset form fields after adding or updating a script
function resetForm() {
  document.getElementById("script-id").value = "";
  document.getElementById("announcementType").value = "";
  document.getElementById("sequence").value = "";
  document.getElementById("transcription").value = "";
  document.getElementById("add-script-btn").textContent = "Add Sequence";
}

// ✅ Add or update a script
async function addOrUpdateScript(e) {
  e.preventDefault();

  const scriptId = document.getElementById("script-id").value || "";
  const language = getSelectedLanguage();
  const announcementType = document.getElementById("announcementType").value;
  const sequence = document.getElementById("sequence").value.trim();
  const transcription = document.getElementById("transcription").value.trim();
  const area = document.getElementById("area").value; // ✅ Added area

  if (!language || !announcementType || !sequence || !area) {
    alert("⚠️ All fields are required.");
    return;
  }

  const payload = { language, announcementType, sequence, transcription, area };
  const method = scriptId ? "PUT" : "POST";
  const url = scriptId ? `/scriptmanager/scripts/${scriptId}` : "/scriptmanager/scripts";

  try {
    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert(scriptId ? "✅ Script updated successfully!" : "✅ Script added successfully!");
      resetForm();
      loadScripts();
    } else {
      const errorData = await response.json();
      console.error("❌ Failed to save script:", errorData);
      alert("❌ Failed to save script: " + errorData.message);
    }
  } catch (err) {
    console.error("❌ Error saving script:", err.message);
  }
}

// ✅ Attach event listener to form submission
document.getElementById("scriptmanager-form").addEventListener("submit", addOrUpdateScript);

// ✅ Initialize Page
console.log("🔄 Page Loaded: Fetching Languages...");
loadLanguages();
