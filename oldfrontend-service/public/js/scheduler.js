async function loadLanguages() {
    const res = await fetch("http://localhost:4004/scheduler/languages");
    const langs = await res.json();
    const dropdown = document.getElementById("language");
    dropdown.innerHTML = `<option value="">Select Language</option>`;
    langs.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l;
      opt.textContent = l.charAt(0).toUpperCase() + l.slice(1);
      dropdown.appendChild(opt);
    });
  }
  
  async function loadAudioFiles(lang) {
    const res = await fetch(`http://localhost:4004/scheduler/audio-files?language=${lang}`);
    const files = await res.json();
    const dropdown = document.getElementById("audio");
    dropdown.innerHTML = `<option value="">Select Audio</option>`;
    files.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f;
      opt.textContent = f;
      dropdown.appendChild(opt);
    });
  }
  
  document.getElementById("language").addEventListener("change", (e) => {
    loadAudioFiles(e.target.value);
  });
  
  document.getElementById("add-timing").addEventListener("click", () => {
    const container = document.getElementById("timing-container");
    const input = document.createElement("input");
    input.type = "time";
    input.className = "timing-field";
    container.appendChild(input);
  });
  
  document.getElementById("scheduler-form").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const name = document.getElementById("name").value;
    const language = document.getElementById("language").value;
    const audioId = document.getElementById("audio").value;
    const timings = Array.from(document.querySelectorAll(".timing-field")).map(i => i.value);
    const startDate = document.getElementById("start-date").value;
    const endDate = document.getElementById("end-date").value;
    const frequency = Array.from(document.getElementById("frequency").selectedOptions).map(opt => opt.value);
  
    const payload = { name, language, audioId, timings, startDate, endDate, frequency };
  
    const res = await fetch("http://localhost:4004/scheduler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  
    if (res.ok) {
      alert("✅ Schedule created!");
      document.getElementById("scheduler-form").reset();
      loadSchedules();
    } else {
      const err = await res.json();
      alert("❌ Failed: " + err.message);
    }
  });
  
  async function loadSchedules() {
    const res = await fetch("http://localhost:4004/scheduler");
    const schedules = await res.json();
    const table = document.getElementById("schedule-table");
    table.innerHTML = "";
    schedules.forEach((s, i) => {
      const timings = Array.isArray(s.timing) ? s.timing : JSON.parse(s.timing);
      const freq = Array.isArray(s.frequency) ? s.frequency : (s.frequency || "").split(",");
      const row = `<tr>
        <td>${i + 1}</td>
        <td>${s.name}</td>
        <td>${s.audioId}</td>
        <td>${timings.join(", ")}</td>
        <td>${s.start_date} → ${s.end_date}</td>
        <td>${freq.join(", ")}</td>
        <td><button onclick="deleteSchedule(${s.id})">🗑</button></td>
      </tr>`;
      table.innerHTML += row;
    });
  }
  
  async function deleteSchedule(id) {
    const res = await fetch(`http://localhost:4004/scheduler/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("Deleted!");
      loadSchedules();
    } else {
      alert("Failed to delete");
    }
  }
  
  loadLanguages();
  loadSchedules();
  