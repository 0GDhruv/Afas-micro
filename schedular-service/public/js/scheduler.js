async function loadLanguages() {
  const response = await fetch("/scheduler/languages");
  const languages = await response.json();

  const languageDropdown = document.getElementById("language");
  languageDropdown.innerHTML = "<option value='' disabled selected>Select a language</option>";

  languages.forEach((language) => {
    const option = document.createElement("option");
    option.value = language;
    option.textContent = language.charAt(0).toUpperCase() + language.slice(1);
    languageDropdown.appendChild(option);
  });
}

async function loadAudioFiles(language) {
  const response = await fetch(`/scheduler/audio-files?language=${language}`);
  const audioFiles = await response.json();

  const audioDropdown = document.getElementById("audio");
  audioDropdown.innerHTML = "<option value='' disabled selected>Select an announcement</option>";

  audioFiles.forEach((file) => {
    const option = document.createElement("option");
    option.value = file;
    option.textContent = file;
    audioDropdown.appendChild(option);
  });
}

document.getElementById("language").addEventListener("change", (e) => {
  const selectedLanguage = e.target.value;
  loadAudioFiles(selectedLanguage);
});

// Add new timing input
document.getElementById("add-timing").addEventListener("click", () => {
  const timingContainer = document.getElementById("timing-container");

  const newTimingInput = document.createElement("input");
  newTimingInput.type = "time";
  newTimingInput.className = "timing-field";
  timingContainer.appendChild(newTimingInput);
});

// Save a schedule
document.getElementById("scheduler-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const language = document.getElementById("language").value;
  const audioId = document.getElementById("audio").value;

  const timings = Array.from(document.querySelectorAll(".timing-field")).map((input) => input.value);
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  const frequency = Array.from(document.getElementById("frequency").selectedOptions).map((option) => option.value);

  try {
    const response = await fetch("/scheduler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, audioId, timings, startDate, endDate, frequency }),
    });

    if (response.ok) {
      alert("Schedule saved successfully!");
      loadSchedules();
    } else {
      alert("Error saving schedule.");
    }
  } catch (error) {
    console.error("Error saving schedule:", error.message);
  }
});

async function loadSchedules() {
  const response = await fetch("/scheduler");
  const schedules = await response.json();

  const tableBody = document.getElementById("schedule-table");
  tableBody.innerHTML = "";

  schedules.forEach((schedule, index) => {
    const row = `<tr>
      <td>${index + 1}</td>
      <td>${schedule.audioId}</td>
      <td>${JSON.parse(schedule.timing).join(", ")}</td>
      <td>${schedule.start_date} - ${schedule.end_date}</td>
      <td>${schedule.frequency}</td>
      <td><button onclick="deleteSchedule(${schedule.id})">Delete</button></td>
    </tr>`;
    tableBody.innerHTML += row;
  });
}

// Delete a schedule
async function deleteSchedule(id) {
  try {
    const response = await fetch(`/scheduler/${id}`, { method: "DELETE" });
    if (response.ok) {
      loadSchedules();
    } else {
      alert("Error deleting schedule.");
    }
  } catch (error) {
    console.error("Error deleting schedule:", error.message);
  }
}

loadLanguages();
loadSchedules();
