const BASE_URL = "http://localhost:4006";

// ✅ Load languages
async function loadLanguages() {
  try {
    const res = await fetch(`${BASE_URL}/announcementtype/languages`);
    const langs = await res.json();

    const tabs = document.querySelector(".language-tabs");
    tabs.innerHTML = "";

    langs.forEach((lang, i) => {
      const btn = document.createElement("button");
      btn.className = `language-tab ${i === 0 ? "active" : ""}`;
      btn.setAttribute("data-lang", lang);
      btn.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
      btn.onclick = () => {
        document.querySelector(".language-tab.active")?.classList.remove("active");
        btn.classList.add("active");
        loadAnnouncementTypes(lang);
        loadScripts();
      };
      tabs.appendChild(btn);
    });

    if (langs.length > 0) {
      loadAnnouncementTypes(langs[0]);
      loadScripts();
    }
  } catch (err) {
    console.error("❌ Error loading languages:", err.message);
  }
}

function getSelectedLanguage() {
  return document.querySelector(".language-tab.active")?.getAttribute("data-lang") || "english";
}

// ✅ Load announcement types
async function loadAnnouncementTypes(language = getSelectedLanguage()) {
  const area = document.getElementById("area")?.value;
  if (!language || !area) return;

  const res = await fetch(`${BASE_URL}/announcementtype/types?language=${encodeURIComponent(language)}&area=${encodeURIComponent(area)}`);
  const types = await res.json();

  const dropdown = document.getElementById("announcementType");
  dropdown.innerHTML = `<option disabled selected>Select Announcement Type</option>`;
  types.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    dropdown.appendChild(opt);
  });
}

// ✅ Load scripts
async function loadScripts() {
  const language = getSelectedLanguage();
  const area = document.getElementById("area")?.value;
  if (!language || !area) return;

  const res = await fetch(`${BASE_URL}/scriptmanager/scripts?language=${language}&area=${area}`);
  const scripts = await res.json();

  const tbody = document.getElementById("scriptsTable");
  tbody.innerHTML = "";

  scripts.forEach((s, i) => {
    const row = `<tr>
      <td>${i + 1}</td>
      <td>${s.announcement_type}</td>
      <td>${s.sequence}</td>
      <td>${s.transcription || "N/A"}</td>
      <td>
        <button onclick="editScript(${s.id})">✏️ Edit</button>
        <button onclick="deleteScript(${s.id})">🗑 Delete</button>
      </td>
    </tr>`;
    tbody.innerHTML += row;
  });
}

// ✅ Edit script
async function editScript(id) {
  const res = await fetch(`${BASE_URL}/scriptmanager/scripts/${id}`);
  const s = await res.json();

  document.getElementById("script-id").value = s.id;
  document.getElementById("announcementType").value = s.announcement_type;
  document.getElementById("sequence").value = s.sequence;
  document.getElementById("transcription").value = s.transcription;
  document.getElementById("add-script-btn").textContent = "Update Sequence";
}

// ✅ Delete script
async function deleteScript(id) {
  const res = await fetch(`${BASE_URL}/scriptmanager/scripts/${id}`, { method: "DELETE" });
  if (res.ok) {
    alert("✅ Deleted!");
    loadScripts();
  } else {
    alert("❌ Failed to delete");
  }
}

// ✅ Get transcription
async function getTranscription() {
  const language = getSelectedLanguage();
  const sequence = document.getElementById("sequence").value.trim();
  if (!sequence) return;

  const res = await fetch(`${BASE_URL}/scriptmanager/transcriptions?sequence=${encodeURIComponent(sequence)}&language=${encodeURIComponent(language)}`);
  const data = await res.json();
  document.getElementById("transcription").value = data.transcriptions.join(" ");
}

// ✅ Submit
async function addOrUpdateScript(e) {
  e.preventDefault();

  const id = document.getElementById("script-id").value;
  const language = getSelectedLanguage();
  const announcementType = document.getElementById("announcementType").value;
  const sequence = document.getElementById("sequence").value;
  const transcription = document.getElementById("transcription").value;
  const area = document.getElementById("area").value;

  const payload = { language, announcementType, sequence, transcription, area };
  const method = id ? "PUT" : "POST";
  const url = id ? `${BASE_URL}/scriptmanager/scripts/${id}` : `${BASE_URL}/scriptmanager/scripts`;

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert("✅ Saved!");
    resetForm();
    loadScripts();
  } else {
    const err = await res.json();
    alert("❌ Error: " + err.message);
  }
}

function resetForm() {
  document.getElementById("script-id").value = "";
  document.getElementById("announcementType").value = "";
  document.getElementById("sequence").value = "";
  document.getElementById("transcription").value = "";
  document.getElementById("add-script-btn").textContent = "Add Sequence";
}

document.getElementById("get-transcription").addEventListener("click", getTranscription);
document.getElementById("scriptmanager-form").addEventListener("submit", addOrUpdateScript);
document.getElementById("area").addEventListener("change", () => {
  const lang = getSelectedLanguage();
  loadAnnouncementTypes(lang);
});
loadLanguages();
