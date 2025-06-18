function getSelectedLanguage() {
    return document.querySelector(".language-tab.active")?.getAttribute("data-lang") || "english";
  }
  
  async function loadLanguages() {
    try {
      const res = await fetch("http://localhost:4003/languages");
      const langs = await res.json();
      const tabs = document.getElementById("language-tabs");
      tabs.innerHTML = "";
  
      langs.forEach((lang, i) => {
        const btn = document.createElement("button");
        btn.textContent = lang;
        btn.className = "language-tab" + (i === 0 ? " active" : "");
        btn.setAttribute("data-lang", lang);
        btn.onclick = () => {
          document.querySelector(".language-tab.active")?.classList.remove("active");
          btn.classList.add("active");
          loadAudios();
        };
        tabs.appendChild(btn);
      });
  
      if (langs.length > 0) loadAudios();
    } catch (err) {
      console.error("❌ Failed to load languages:", err.message);
    }
  }
  
  async function loadAudios() {
    const lang = getSelectedLanguage();
    try {
      const res = await fetch(`http://localhost:4003/upload?language=${lang}`);
      const audios = await res.json();
      const table = document.getElementById("audio-table");
      table.innerHTML = "";
  
      audios.forEach((a, i) => {
        const row = `<tr>
          <td>${i + 1}</td>
          <td><a href="/uploads/${a.filePath}" target="_blank">${a.filePath.split("/").pop()}</a></td>
          <td>${a.transcription || "N/A"}</td>
          <td>${a.remarks || "N/A"}</td>
          <td><button onclick="deleteAudio(${a.id})">🗑</button></td>
        </tr>`;
        table.innerHTML += row;
      });
    } catch (err) {
      console.error("❌ Error loading audios:", err.message);
    }
  }
  
  async function deleteAudio(id) {
    try {
      const res = await fetch(`http://localhost:4003/upload/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("✅ Audio deleted");
        loadAudios();
      }
    } catch (err) {
      console.error("❌ Error deleting audio:", err.message);
    }
  }
  
  document.getElementById("upload-form").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const language = getSelectedLanguage();
    const audioType = document.getElementById("audioType").value;
    const file = document.getElementById("audioFile").files[0];
    const transcription = document.getElementById("transcription").value;
    const remarks = document.getElementById("remarks").value;
  
    if (!file) return alert("Please select a file");
  
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("language", language);
    formData.append("audioType", audioType);
    formData.append("transcription", transcription);
    formData.append("remarks", remarks);
  
    try {
      const res = await fetch("http://localhost:4003/upload", {
        method: "POST",
        body: formData
      });
  
      if (res.ok) {
        alert("✅ Audio uploaded");
        loadAudios();
        e.target.reset();
      } else {
        alert("❌ Upload failed");
      }
    } catch (err) {
      console.error("❌ Upload error:", err.message);
    }
  });
  
  loadLanguages();
  