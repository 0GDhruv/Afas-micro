// ✅ Load languages dynamically from Upload Service
async function loadLanguages() {
  try {
    console.log("📢 Fetching languages...");
    const response = await fetch("/announcementtype/languages"); // Correct API Call
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
        loadScripts();
      });

      languageTabs.appendChild(button);
    });

    // ✅ Auto-load announcement types and scripts for the first language
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
  return document.querySelector(".language-tab.active")?.getAttribute("data-lang") || "";
}

// ✅ Load Announcement Types based on selected language
async function loadAnnouncementTypes(language = getSelectedLanguage()) {
  if (!language) return;

  try {
    console.log(`🔄 Fetching announcement types for: ${language}`);
    const response = await fetch(`/announcementtype?language=${language}`);
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

// ✅ Fetch transcriptions for a given sequence
async function fetchTranscriptions(sequence) {
  if (!sequence) return "";

  const sequenceArray = sequence.split(",").map((s) => s.trim());
  const transcriptions = [];

  const audioFiles = sequenceArray.filter(audio => !audio.startsWith("*")); // ✅ Ignore variables
  const placeholders = sequenceArray.filter(audio => audio.startsWith("*")); // ✅ Store placeholders

  if (audioFiles.length > 0) {
    try {
      const response = await fetch(`/scriptmanager/transcriptions?sequence=${audioFiles.join(",")}`);
      const data = await response.json();
      transcriptions.push(...data.transcriptions);
    } catch (err) {
      console.error("❌ Error fetching transcriptions:", err.message);
      transcriptions.push(...Array(audioFiles.length).fill("N/A"));
    }
  }

  transcriptions.push(...placeholders.map(p => p)); // ✅ Keep placeholders as-is

  return transcriptions.join(" ");
}

// ✅ Auto-fill transcription when sequence is entered
document.getElementById("sequence").addEventListener("input", async () => {
  const sequence = document.getElementById("sequence").value.trim();
  if (!sequence) {
    document.getElementById("transcription").value = "";
    return;
  }

  const transcription = await fetchTranscriptions(sequence);
  document.getElementById("transcription").value = transcription;
});

// ✅ Add a script
async function addScript(e) {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const language = getSelectedLanguage();
  const announcementType = document.getElementById("announcementType").value;
  const sequence = document.getElementById("sequence").value.trim();
  const transcription = document.getElementById("transcription").value;

  if (!name || !language || !announcementType || !sequence) {
    alert("⚠️ All fields are required.");
    return;
  }

  try {
    const response = await fetch("/scriptmanager/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, language, announcementType, sequence, transcription }),
    });

    if (response.ok) {
      alert("✅ Script added successfully!");
      loadScripts();
    } else {
      alert("❌ Failed to add script.");
    }
  } catch (err) {
    console.error("❌ Error adding script:", err.message);
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
      const row = `<tr>
        <td>${index + 1}</td>
        <td>${script.announcementType}</td>
        <td>${script.sequence}</td>
        <td>${script.transcription || "N/A"}</td>
        <td><button onclick="deleteScript(${script.id})">🗑 Delete</button></td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  } catch (err) {
    console.error("❌ Error loading scripts:", err.message);
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

// ✅ Event Listeners
document.getElementById("scriptmanager-form").addEventListener("submit", addScript);

// ✅ Load languages on page load
console.log("🔄 Page Loaded: Fetching Languages...");
loadLanguages();
