// ✅ Reuse logic from working scriptmanager.js

async function loadLanguages() {
    const res = await fetch("http://localhost:4006/announcementtype/languages");
    const langs = await res.json();
    const tabContainer = document.querySelector(".language-tabs");
    tabContainer.innerHTML = "";
  
    langs.forEach((lang, i) => {
      const btn = document.createElement("button");
      btn.className = "language-tab" + (i === 0 ? " active" : "");
      btn.textContent = lang;
      btn.setAttribute("data-lang", lang);
      btn.onclick = () => {
        document.querySelector(".language-tab.active")?.classList.remove("active");
        btn.classList.add("active");
        loadAnnouncementTypes(lang);
        loadScripts();
      };
      tabContainer.appendChild(btn);
    });
  
    if (langs[0]) {
      loadAnnouncementTypes(langs[0]);
      loadScripts();
    }
  }
  
  function getSelectedLanguage() {
    return document.querySelector(".language-tab.active")?.getAttribute("data-lang");
  }
  
  async function loadAnnouncementTypes(lang) {
    const area = document.getElementById("area").value;
    const res = await fetch(`http://localhost:4006/announcementtype/types?language=${lang}&area=${area}`);
    const types = await res.json();
    const dropdown = document.getElementById("announcementType");
    dropdown.innerHTML = `<option value="">Select</option>`;
    types.forEach(type => {
      const opt = document.createElement("option");
      opt.value = type;
      opt.textContent = type;
      dropdown.appendChild(opt);
    });
  }
  
  document.getElementById("area").addEventListener("change", () => {
    const lang = getSelectedLanguage();
    if (lang) loadAnnouncementTypes(lang);
    loadScripts();
  });
  
  document.getElementById("get-transcription").addEventListener("click", async () => {
    const lang = getSelectedLanguage();
    const seq = document.getElementById("sequence").value;
    const res = await fetch(`http://localhost:4006/scriptmanager/transcriptions?language=${lang}&sequence=${seq}`);
    const data = await res.json();
    document.getElementById("transcription").value = data.transcriptions.join(" ");
  });
  
  document.getElementById("scriptmanager-form").addEventListener("submit", async e => {
    e.preventDefault();
    const id = document.getElementById("script-id").value;
    const lang = getSelectedLanguage();
    const body = {
      language: lang,
      announcementType: document.getElementById("announcementType").value,
      sequence: document.getElementById("sequence").value,
      transcription: document.getElementById("transcription").value,
      area: document.getElementById("area").value
    };
  
    const res = await fetch(`http://localhost:4006/scriptmanager/scripts${id ? "/" + id : ""}`, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
  
    if (res.ok) {
      alert(id ? "Updated!" : "Added!");
      document.getElementById("scriptmanager-form").reset();
      loadScripts();
    }
  });
  
  async function loadScripts() {
    const lang = getSelectedLanguage();
    const area = document.getElementById("area").value;
    const res = await fetch(`http://localhost:4006/scriptmanager/scripts?language=${lang}&area=${area}`);
    const data = await res.json();
    const tbody = document.getElementById("scriptsTable");
    tbody.innerHTML = "";
    data.forEach((s, i) => {
      const row = `<tr>
        <td>${i + 1}</td>
        <td>${s.announcement_type}</td>
        <td>${s.sequence}</td>
        <td>${s.transcription}</td>
        <td>
          <button onclick="editScript(${s.id})">✏️</button>
          <button onclick="deleteScript(${s.id})">🗑</button>
        </td>
      </tr>`;
      tbody.innerHTML += row;
    });
  }
  
  async function editScript(id) {
    const res = await fetch(`http://localhost:4006/scriptmanager/scripts/${id}`);
    const s = await res.json();
    document.getElementById("script-id").value = s.id;
    document.getElementById("announcementType").value = s.announcement_type;
    document.getElementById("sequence").value = s.sequence;
    document.getElementById("transcription").value = s.transcription;
    document.getElementById("add-script-btn").textContent = "Update Sequence";
  }
  
  async function deleteScript(id) {
    await fetch(`http://localhost:4006/scriptmanager/scripts/${id}`, { method: "DELETE" });
    loadScripts();
  }
  
  loadLanguages();
  