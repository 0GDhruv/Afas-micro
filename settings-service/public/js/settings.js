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
    const res = await fetch("/settings");
    if (!res.ok) throw new Error("Failed to fetch settings");

    const data = await res.json();

    const languages = data.languages || { english: true, hindi: false, regional: false };
    const language_order = data.language_order?.length ? data.language_order : ["english", "hindi", "regional"];
    const frequency = data.frequency || 1;
    const audio_lag = data.audio_lag || 2;
    const advance_minutes = data.advance_minutes || 15;

    document.getElementById("english").checked = languages.english;
    document.getElementById("hindi").checked = languages.hindi;
    document.getElementById("regional").checked = languages.regional;

    orderList.innerHTML = "";
    language_order.forEach(createLanguageItem);

    document.getElementById("frequency").value = frequency;
    document.getElementById("audio-lag").value = audio_lag;
    document.getElementById("advance-time").value = advance_minutes;

  } catch (err) {
    console.error("❌ Error loading settings:", err.message);
    alert("Failed to load settings. Check server log.");
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
    const res = await fetch("/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ languages, language_order, frequency, audio_lag, advance_minutes })
    });

    const result = await res.json();
    alert(result.message);
  } catch (err) {
    console.error("❌ Error saving settings:", err.message);
    alert("Error saving settings.");
  }
}

document.getElementById("save-button").addEventListener("click", saveSettings);

// Load on page load
loadSettings();
