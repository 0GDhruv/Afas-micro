// Handle language tab switching
document.querySelectorAll(".language-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelector(".language-tab.active").classList.remove("active");
    tab.classList.add("active");
    loadAnnouncementTypes();
    loadScripts();
  });
});

function getSelectedLanguage() {
  return document.querySelector(".language-tab.active").getAttribute("data-lang");
}

// Load Announcement Types based on selected language
async function loadAnnouncementTypes() {
  const language = getSelectedLanguage();
  try {
    const response = await fetch(`/announcementtype?language=${language}`);
    if (!response.ok) throw new Error("Failed to fetch announcement types.");
    const types = await response.json();

    const typeDropdown = document.getElementById("announcementType");
    typeDropdown.innerHTML = "<option value='' disabled selected>Select Announcement Type</option>";
    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      typeDropdown.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading announcement types:", err.message);
  }
}

async function fetchTranscriptions(audioSequence) {
  const sequenceArray = audioSequence.split(",").map((s) => s.trim());
  const transcriptions = [];

  for (const audio of sequenceArray) {
    if (audio.startsWith("*") && audio.endsWith("*")) {
      // Dynamic variable placeholder
      const variableName = audio.slice(1, -1); // Remove surrounding '*'
      transcriptions.push(`*${variableName}*`);
    } else {
      // Fetch transcription for uploaded audio
      try {
        const response = await fetch(`/scriptmanager/transcription?audio=${audio}`);
        if (response.ok) {
          const { transcription } = await response.json();
          transcriptions.push(transcription || "N/A");
        } else {
          transcriptions.push("N/A");
        }
      } catch (err) {
        console.error(`Error fetching transcription for ${audio}:`, err.message);
        transcriptions.push("N/A");
      }
    }
  }

  return transcriptions.join(" ");
}

async function addScript(e) {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const language = getSelectedLanguage();
  const announcementType = document.getElementById("announcementType").value;
  const sequence = document.getElementById("sequence").value.trim();

  if (!name || !language || !announcementType || !sequence) {
    alert("All fields are required.");
    return;
  }

  // Fetch transcriptions for the sequence
  const transcription = await fetchTranscriptions(sequence);

  try {
    const response = await fetch("/scriptmanager/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, language, announcementType, sequence, transcription }),
    });

    if (response.ok) {
      alert("Script added successfully!");
      loadScripts();
    } else {
      alert("Failed to add script.");
    }
  } catch (err) {
    console.error("Error adding script:", err.message);
  }
}


  try {
    const response = await fetch("/scriptmanager/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, announcementType, sequence }),
    });
    if (response.ok) {
      alert("Script added successfully!");
      loadScripts();
    } else {
      alert("Failed to add script.");
    }
  } catch (err) {
    console.error("Error adding script:", err.message);
  }

// Load existing scripts
async function loadScripts() {
  const language = getSelectedLanguage();
  try {
    const response = await fetch(`/scriptmanager/scripts?language=${language}`);
    if (!response.ok) throw new Error("Failed to fetch scripts.");
    const scripts = await response.json();

    const tableBody = document.getElementById("scriptsTable");
    tableBody.innerHTML = "";
    scripts.forEach((script, index) => {
      const row = `<tr>
        <td>${index + 1}</td>
        <td>${script.announcementType}</td>
        <td>${script.sequence}</td>
        <td>${script.transcription || "N/A"}</td>
        <td><button onclick="deleteScript(${script.id})">Delete</button></td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  } catch (err) {
    console.error("Error loading scripts:", err.message);
  }
}

// Delete a script
async function deleteScript(id) {
  try {
    const response = await fetch(`/scriptmanager/scripts/${id}`, { method: "DELETE" });
    if (response.ok) {
      alert("Script deleted successfully!");
      loadScripts();
    } else {
      alert("Failed to delete script.");
    }
  } catch (err) {
    console.error("Error deleting script:", err.message);
  }
}

// Event Listeners
document.getElementById("scriptmanager-form").addEventListener("submit", addScript);

// Initialize
loadAnnouncementTypes();
loadScripts();
