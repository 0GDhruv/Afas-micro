import db from "../config/db.config.js";

// Fetch transcription for a specific audio file
export const getTranscriptions = async (req, res) => {
  const { sequence } = req.query;

  if (!sequence) {
    return res.status(400).json({ message: "Sequence parameter is required." });
  }

  const sequenceArray = sequence.split(",").map(s => s.trim());
  const transcriptions = [];

  for (const audio of sequenceArray) {
    if (audio.startsWith("*") && audio.endsWith("*")) {
      // ✅ Handle placeholders (e.g., *flight_number*)
      transcriptions.push(audio);
    } else {
      try {
        const [result] = await db.execute(
          "SELECT transcription FROM uploaded_audios WHERE file_name = ?",
          [audio]
        );
        transcriptions.push(result.length > 0 ? result[0].transcription || "N/A" : "N/A");
      } catch (err) {
        console.error(`❌ Error fetching transcription for ${audio}:`, err.message);
        transcriptions.push("N/A");
      }
    }
  }

  res.json({ transcriptions });
};

// Add a script
export const addScript = async (req, res) => {
  const { name, language, announcementType, sequence, transcription } = req.body;

  if (!name || !language || !announcementType || !sequence || !transcription) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if script with same name already exists for the announcement type
    const [existing] = await db.execute(
      "SELECT id FROM scripts WHERE name = ? AND announcement_type = ?",
      [name, announcementType]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "A script with this name already exists." });
    }

    await db.execute(
      "INSERT INTO scripts (name, language, announcement_type, sequence, transcription) VALUES (?, ?, ?, ?, ?)",
      [name, language, announcementType, JSON.stringify(sequence.split(",")), transcription]
    );

    res.status(201).json({ message: "Script added successfully." });
  } catch (err) {
    console.error("Error adding script:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};


export const getLanguages = async (req, res) => {
  try {
    const [languages] = await db.execute("SELECT DISTINCT language FROM announcement_types");
    res.json(languages.map(row => row.language));
  } catch (err) {
    console.error("Error fetching languages:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

export const getScripts = async (req, res) => {
  try {
    const [scripts] = await db.execute("SELECT * FROM scripts");
    res.json(scripts);
  } catch (err) {
    console.error("Error fetching scripts:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};


export const deleteScript = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute("DELETE FROM scripts WHERE id = ?", [id]);
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting script:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};
