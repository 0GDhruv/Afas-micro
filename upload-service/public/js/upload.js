document.querySelectorAll(".language-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelector(".language-tab.active").classList.remove("active");
    tab.classList.add("active");
    loadAudios();
  });
});

function getSelectedLanguage() {
  return document.querySelector(".language-tab.active").getAttribute("data-lang");
}

document.getElementById("upload-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("language", getSelectedLanguage());
  formData.append("audioType", document.getElementById("audioType").value);
  formData.append("audio", document.getElementById("audioFile").files[0]);
  formData.append("transcription", document.getElementById("transcription").value);
  formData.append("remarks", document.getElementById("remarks").value);

  const response = await fetch("/upload", {
    method: "POST",
    body: formData,
  });

  if (response.ok) {
    alert("Audio uploaded successfully!");
    loadAudios();
  } else {
    alert("Error uploading audio.");
  }
});

async function loadAudios() {
  const language = getSelectedLanguage(); // Fetch active language tab
  const response = await fetch(`/upload?language=${language}`);
  const audios = await response.json();

  const tableBody = document.getElementById("audio-table");
  tableBody.innerHTML = "";

  audios.forEach((audio, index) => {
    const row = `<tr>
      <td>${index + 1}</td>
      <td><a href="/uploads/${audio.filePath}" target="_blank">${audio.filePath.split("/").pop()}</a></td>
      <td>${audio.transcription}</td>
      <td>${audio.remarks}</td>
      <td><button onclick="deleteAudio('${audio.id}')">Delete</button></td>
    </tr>`;
    tableBody.innerHTML += row;
  });
}


async function deleteAudio(id) {
  const response = await fetch(`/upload/${id}`, { method: "DELETE" });
  if (response.ok) {
    loadAudios();
  } else {
    alert("Error deleting audio.");
  }
}

loadAudios();
