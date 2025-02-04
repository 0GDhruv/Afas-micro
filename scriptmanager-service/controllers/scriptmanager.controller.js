import db from "../config/db.config.js";

// Fetch transcription for a specific audio file
export const getTranscription = async (req, res) => {
  const { audio } = req.query;

  if (!audio) {
    return res.status(400).json({ message: "Audio file name is required." });
  }

  try {
    const [result] = await db.execute(
      "SELECT transcription FROM uploaded_audios WHERE file_name = ?",
      [audio]
    );

    if (result.length > 0) {
      res.json({ transcription: result[0].transcription || "N/A" });
    } else {
      res.status(404).json({ transcription: "N/A" });
    }
  } catch (err) {
    console.error("Error fetching transcription:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// Add a script
export const addScript = async (req, res) => {
  const { name, language, announcementType, sequence, transcription } = req.body;

  if (!name || !language || !announcementType || !sequence || !transcription) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
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
