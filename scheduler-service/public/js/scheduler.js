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

  const name = document.getElementById("name").value;
  const language = document.getElementById("language").value;
  const audioId = document.getElementById("audio").value;

  const timings = Array.from(document.querySelectorAll(".timing-field")).map((input) => input.value);
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  const frequency = Array.from(document.getElementById("frequency").selectedOptions).map((option) => option.value);

  console.log("Submitting schedule:", { name, language, audioId, timings, startDate, endDate, frequency });

  try {
    const response = await fetch("/scheduler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, language, audioId, timings, startDate, endDate, frequency }),
    });

    if (response.ok) {
      alert("Schedule saved successfully!");
      loadSchedules();
    } else {
      const error = await response.json();
      console.error("Error response from server:", error);
      alert("Error saving schedule: " + error.message);
    }
  } catch (error) {
    console.error("Error saving schedule:", error.message);
  }
});


async function loadSchedules() {
  try {
    const response = await fetch("/scheduler");

    if (!response.ok) {
      throw new Error(`Failed to fetch schedules: ${response.statusText}`);
    }

    const textResponse = await response.text(); // Get raw response
    console.log("Raw response from /scheduler:", textResponse); // Debug log

    const schedules = JSON.parse(textResponse.replace(/^\uFEFF/, "")); // Remove BOM if present
    console.log("Parsed schedules:", schedules); // Debug log

    const tableBody = document.getElementById("schedule-table");
    tableBody.innerHTML = ""; // Clear the table

    schedules.forEach((schedule, index) => {
      // Directly use the timing field if it's already an array
      const timings = Array.isArray(schedule.timing) ? schedule.timing : JSON.parse(schedule.timing);

      // Parse frequency if it’s a stringified JSON array
      let frequency;
      try {
        frequency = JSON.parse(schedule.frequency);
      } catch (e) {
        frequency = schedule.frequency; // Use as-is if not JSON
      }

      const row = `<tr>
        <td>${index + 1}</td>
        <td>${schedule.name || "Unnamed Schedule"}</td>
        <td>${schedule.audioId}</td>
        <td>${timings.join(", ")}</td>
        <td>${new Date(schedule.start_date).toLocaleDateString()} - ${new Date(schedule.end_date).toLocaleDateString()}</td>
        <td>${Array.isArray(frequency) ? frequency.join(", ") : frequency}</td>
        <td><button onclick="deleteSchedule(${schedule.id})">Delete</button></td>
      </tr>`;
      tableBody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error loading schedules:", error.message);
  }
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
