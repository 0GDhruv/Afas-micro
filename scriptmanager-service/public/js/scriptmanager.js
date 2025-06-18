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
        document.querySelector(".language-tab.active").classList.remove("active");
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

// ✅ Fetch transcriptions only when "Get Transcription" button is clicked
async function getTranscription() {
  const sequence = document.getElementById("sequence").value.trim();
  if (!sequence) {
    alert("⚠️ Please enter a sequence before fetching transcriptions.");
    return;
  }

  try {
    const language = getSelectedLanguage(); // ✅ Get selected language
    const response = await fetch(`/scriptmanager/transcriptions?sequence=${encodeURIComponent(sequence)}&language=${language}`);

    if (!response.ok) throw new Error("Failed to fetch transcriptions.");

    const data = await response.json();
    document.getElementById("transcription").value = data.transcriptions.join(" ");
  } catch (err) {
    console.error("❌ Error fetching transcription:", err.message);
  }
}

// ✅ Add event listener for the "Get Transcription" button
document.getElementById("get-transcription").addEventListener("click", getTranscription);

// ✅ Get the selected language from active tab
function getSelectedLanguage() {
  return document.querySelector(".language-tab.active")?.getAttribute("data-lang") || "";
}

// ✅ Load Announcement Types based on selected language
async function loadAnnouncementTypes(language = getSelectedLanguage()) {
  if (!language) return;

  try {
    console.log(`🔄 Fetching announcement types for: ${language}`);
    const response = await fetch(`/announcementtype/types?language=${language}`);
    if (!response.ok) throw new Error("Failed to fetch announcement types.");

    const types = await response.json();
    console.log("✅ Announcement Types:", types);

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

async function addOrUpdateScript(e) {
  e.preventDefault();

  const scriptId = document.getElementById("script-id").value || "";
  const language = getSelectedLanguage();
  const announcementType = document.getElementById("announcementType").value;
  const sequence = document.getElementById("sequence").value.trim();
  const transcription = document.getElementById("transcription").value.trim();

  if (!language || !announcementType || !sequence) {
    alert("⚠️ All fields are required.");
    return;
  }

  const payload = { language, announcementType, sequence, transcription };
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

      // ✅ Reset the form after successful add/edit
      resetForm();

      // ✅ Immediately refresh table to reflect new script
      loadScripts();
    } else {
      alert("❌ Failed to save script.");
    }
  } catch (err) {
    console.error("❌ Error saving script:", err.message);
  }
}

// ✅ Load existing scripts for selected language
async function loadScripts() {
  const language = getSelectedLanguage();
  if (!language) return;

  try {
    console.log(`🔄 Fetching scripts for: ${language}`);
    const response = await fetch(`/scriptmanager/scripts?language=${language}`);
    if (!response.ok) throw new Error("Failed to fetch scripts.");

    const scripts = await response.json();
    console.log("✅ Loaded Scripts:", scripts);

    const tableBody = document.getElementById("scriptsTable");
    tableBody.innerHTML = "";

    scripts.forEach((script, index) => {
      // ✅ Ensure `announcement_type` exists
      const announcementType = script.announcement_type
        ? script.announcement_type.replace(/\s+/g, "").toLowerCase()
        : "undefined";

      // ✅ Ensure `language` is also properly formatted
      const scriptLanguage = script.language ? script.language.toLowerCase() : "unknown";

      // ✅ Format as "arrivaldelayed_english"
      const announcementFormatted = `${announcementType}_${scriptLanguage}`;

      const row = `<tr>
        <td>${index + 1}</td>
        <td>${announcementFormatted}</td> 
        <td>${Array.isArray(script.sequence) ? script.sequence.join(", ") : "N/A"}</td>
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



async function editScript(id) {
  try {
    console.log(`🔍 Fetching script details for ID: ${id}`);
    
    const response = await fetch(`/scriptmanager/scripts/${id}`);
    if (!response.ok) throw new Error("Failed to fetch script details.");

    const script = await response.json();
    console.log("✅ Script loaded:", script);

    // ✅ Ensure form elements exist before setting values
    const scriptIdField = document.getElementById("script-id");
    const announcementDropdown = document.getElementById("announcementType");
    const sequenceInput = document.getElementById("sequence");
    const transcriptionInput = document.getElementById("transcription");

    if (!scriptIdField || !announcementDropdown || !sequenceInput || !transcriptionInput) {
      console.error("❌ Error: One or more form fields are missing.");
      return;
    }

    // ✅ Populate form with fetched data
    scriptIdField.value = script.id;
    announcementDropdown.value = script.announcement_type;
    sequenceInput.value = script.sequence.join(", ");
    transcriptionInput.value = script.transcription || "";

    // ✅ Change button text to indicate editing mode
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

// ✅ Reset form
function resetForm() {
  document.getElementById("script-id").value = "";
  document.getElementById("announcementType").value = "";
  document.getElementById("sequence").value = "";
  document.getElementById("transcription").value = "";
  document.getElementById("add-script-btn").textContent = "Add Sequence";
}

// ✅ Initialize event listeners
document.getElementById("scriptmanager-form").addEventListener("submit", addOrUpdateScript);

// ✅ Load languages on page load
console.log("🔄 Page Loaded: Fetching Languages...");
loadLanguages();
