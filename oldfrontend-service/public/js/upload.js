document.getElementById("upload-form").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const language = getSelectedLanguage();
    const audioType = document.getElementById("audioType").value;
    const fileInput = document.getElementById("audioFile");
    const transcription = document.getElementById("transcription").value.trim();
    const remarks = document.getElementById("remarks").value.trim();
  
    if (!fileInput.files.length) {
      alert("⚠️ Please select an audio file to upload.");
      return;
    }
  
    const formData = new FormData();
    formData.append("audio", fileInput.files[0]);
    formData.append("language", language);
    formData.append("audioType", audioType);
    formData.append("transcription", transcription);
    formData.append("remarks", remarks);
  
    try {
      console.log("🔄 Uploading audio...");
      const response = await fetch("http://localhost:4003/upload", {   // ✅ UPDATE
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error(`Upload failed. Status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log("✅ Upload successful:", result);
      alert("✅ Audio uploaded successfully!");
      loadAudios();
    } catch (err) {
      console.error("❌ Error uploading audio:", err.message);
      alert("❌ Failed to upload audio.");
    }
  });
  
  document.querySelectorAll(".language-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelector(".language-tab.active").classList.remove("active");
      tab.classList.add("active");
      loadAudios();
    });
  });
  
  function getSelectedLanguage() {
    return document.querySelector(".language-tab.active")?.getAttribute("data-lang") || "english";
  }
  
  async function loadLanguages() {
    try {
      const response = await fetch("http://localhost:4003/languages");  // ✅ UPDATE
      if (!response.ok) throw new Error("Failed to fetch languages.");
  
      const languages = await response.json();
      console.log("✅ Available Languages:", languages);
  
      const tabsContainer = document.querySelector(".language-tabs");
      tabsContainer.innerHTML = "";
  
      languages.forEach((lang) => {
        const button = document.createElement("button");
        button.className = "language-tab";
        button.setAttribute("data-lang", lang);
        button.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
  
        button.addEventListener("click", () => {
          document.querySelector(".language-tab.active")?.classList.remove("active");
          button.classList.add("active");
          loadAudios();
        });
  
        tabsContainer.appendChild(button);
      });
  
      if (tabsContainer.firstChild) {
        tabsContainer.firstChild.classList.add("active");
        loadAudios();
      }
    } catch (err) {
      console.error("❌ Error loading languages:", err.message);
    }
  }
  
  async function loadAudios() {
    const language = getSelectedLanguage();
    console.log(`🔄 Fetching audios for language: ${language}`);
  
    try {
      const response = await fetch(`http://localhost:4003/upload?language=${language}`);  // ✅ UPDATE
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
          <td><a href="http://localhost:4003/uploads/${audio.filePath}" target="_blank">${audio.filePath.split("/").pop()}</a></td>  <!-- ✅ UPDATE -->
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
  
  async function deleteAudio(id) {
    try {
      const response = await fetch(`http://localhost:4003/upload/${id}`, { method: "DELETE" });  // ✅ UPDATE
      if (response.ok) {
        console.log(`✅ Audio ${id} deleted successfully.`);
        loadAudios();
      } else {
        alert("Error deleting audio.");
      }
    } catch (err) {
      console.error("❌ Error deleting audio:", err.message);
    }
  }
  
  window.onload = () => {
    console.log("🔄 Page loaded. Fetching available languages...");
    loadLanguages();
  };
  