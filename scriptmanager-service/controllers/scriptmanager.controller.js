import db from "../config/db.config.js";

// Fetch announcement types by language
export const getAnnouncementTypes = async (req, res) => {
  const { language } = req.query;

  try {
    const [types] = await db.execute(
      `SELECT DISTINCT announcement_type 
       FROM announcement_types 
       WHERE language = ?`,
      [language]
    );

    res.json(types.map((type) => type.announcement_type));
  } catch (err) {
    console.error("Error fetching announcement types:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// Fetch audio files for sequence
export const getAudioFiles = async (req, res) => {
  try {
    const response = await axios.get("http://localhost:4003/audio-files");
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching audio files:", err.message);
    res.status(500).json({ message: "Error fetching audio files", error: err.message });
  }
};

// Add a new script
export const addScript = async (req, res) => {
  const { name, language, announcementType, sequence } = req.body;

  const scriptName = `${language}_${announcementType}_${name}`;
  try {
    await db.execute(
      "INSERT INTO scripts (name, language, announcement_type, sequence) VALUES (?, ?, ?, ?)",
      [scriptName, language, announcementType, JSON.stringify(sequence)]
    );

    res.status(201).json({ message: "Script added successfully", scriptName });
  } catch (err) {
    console.error("Error adding script:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// Fetch all scripts
export const getScripts = async (req, res) => {
  try {
    const [scripts] = await db.execute("SELECT * FROM scripts");

    res.json(scripts);
  } catch (err) {
    console.error("Error fetching scripts:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};
