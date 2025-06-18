const orderList = document.getElementById("language-order");

function createLanguageItem(lang) {
  const li = document.createElement("li");
  li.textContent = lang;
  li.draggable = true;

  li.ondragstart = (e) => {
    e.dataTransfer.setData("text/plain", e.target.textContent);
  };

  li.ondragover = (e) => e.preventDefault();

  li.ondrop = (e) => {
    e.preventDefault();
    const dragged = e.dataTransfer.getData("text/plain");
    const draggedItem = [...orderList.children].find(li => li.textContent === dragged);
    if (draggedItem && draggedItem !== e.target) {
      orderList.insertBefore(draggedItem, e.target);
    }
  };

  orderList.appendChild(li);
}

async function loadSettings() {
  try {
    const res = await fetch("http://localhost:4010/settings");
    if (!res.ok) throw new Error("Failed to fetch settings");
    const data = await res.json();

    document.getElementById("english").checked = data.languages.english;
    document.getElementById("hindi").checked = data.languages.hindi;
    document.getElementById("regional").checked = data.languages.regional;

    orderList.innerHTML = "";
    data.language_order.forEach(createLanguageItem);

    document.getElementById("frequency").value = data.frequency;
    document.getElementById("audio-lag").value = data.audio_lag;
    document.getElementById("advance-time").value = data.advance_minutes;
  } catch (err) {
    console.error("❌ Error loading settings:", err.message);
  }
}

async function saveSettings() {
  const languages = {
    english: document.getElementById("english").checked,
    hindi: document.getElementById("hindi").checked,
    regional: document.getElementById("regional").checked,
  };

  const language_order = [...orderList.children].map(li => li.textContent);
  const frequency = parseInt(document.getElementById("frequency").value);
  const audio_lag = parseInt(document.getElementById("audio-lag").value);
  const advance_minutes = parseInt(document.getElementById("advance-time").value);

  try {
    const res = await fetch("http://localhost:4010/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ languages, language_order, frequency, audio_lag, advance_minutes }),
    });

    const result = await res.json();
    alert(result.message);
  } catch (err) {
    console.error("❌ Error saving settings:", err.message);
    alert("Failed to save settings.");
  }
}

document.getElementById("save-button").addEventListener("click", saveSettings);
loadSettings();
