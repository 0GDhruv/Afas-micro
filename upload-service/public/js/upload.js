document.querySelectorAll(".language-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelector(".language-tab.active").classList.remove("active");
    tab.classList.add("active");
    loadAudios(); // Reload audio list when language changes
  });
});

function getSelectedLanguage() {
  return document.querySelector(".language-tab.active")?.getAttribute("data-lang") || "english"; // Default to English
}

// 🛠 Fetch languages dynamically from `/languages` API instead of hardcoding them
async function loadLanguages() {
  try {
    const response = await fetch("/languages");
    if (!response.ok) throw new Error("Failed to fetch languages.");

    const languages = await response.json();
    console.log("✅ Available Languages:", languages);

    const tabsContainer = document.querySelector(".language-tabs");
    tabsContainer.innerHTML = ""; // Clear existing tabs

    languages.forEach((lang) => {
      const button = document.createElement("button");
      button.className = "language-tab";
      button.setAttribute("data-lang", lang);
      button.textContent = lang.charAt(0).toUpperCase() + lang.slice(1); // Capitalize first letter

      button.addEventListener("click", () => {
        document.querySelector(".language-tab.active")?.classList.remove("active");
        button.classList.add("active");
        loadAudios(); // Reload audio list when language changes
      });

      tabsContainer.appendChild(button);
    });

    // Set the first language as active by default
    if (tabsContainer.firstChild) {
      tabsContainer.firstChild.classList.add("active");
      loadAudios();
    }
  } catch (err) {
    console.error("❌ Error loading languages:", err.message);
  }
}

// 🛠 Load uploaded audio files for the selected language
async function loadAudios() {
  const language = getSelectedLanguage();
  console.log(`🔄 Fetching audios for language: ${language}`);

  try {
    const response = await fetch(`/upload?language=${language}`);
    if (!response.ok) throw new Error(`Failed to fetch audios. Status: ${response.status}`);

    const audios = await response.json();
    console.log("✅ Fetched audios:", audios);

    const tableBody = document.getElementById("audio-table");
    tableBody.innerHTML = "";

    if (!Array.isArray(audios)) {
      console.warn("⚠ API response is not an array:", audios);
      return;
    }

    audios.forEach((audio, index) => {
      const row = `<tr>
        <td>${index + 1}</td>
        <td><a href="/uploads/${audio.filePath}" target="_blank">${audio.filePath.split("/").pop()}</a></td>
        <td>${audio.transcription || "N/A"}</td>
        <td>${audio.remarks || "N/A"}</td>
        <td><button onclick="deleteAudio('${audio.id}')">Delete</button></td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  } catch (err) {
    console.error("❌ Error loading audios:", err.message);
  }
}


// 🛠 Delete an audio file
async function deleteAudio(id) {
  try {
    const response = await fetch(`/upload/${id}`, { method: "DELETE" });
    if (response.ok) {
      console.log(`✅ Audio ${id} deleted successfully.`);
      loadAudios(); // Refresh the list
    } else {
      alert("Error deleting audio.");
    }
  } catch (err) {
    console.error("❌ Error deleting audio:", err.message);
  }
}

// 🔄 Load languages and initialize UI
window.onload = () => {
  console.log("🔄 Page loaded. Fetching available languages...");
  loadLanguages();
};
