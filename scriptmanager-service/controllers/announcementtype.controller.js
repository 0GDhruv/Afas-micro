import db from "../config/db.config.js";

export const getAnnouncementTypes = async (req, res) => {
  const { language } = req.query;

  if (!language) {
    return res.status(400).json({ message: "Language parameter is required." });
  }

  try {
    const [types] = await db.execute(
      "SELECT type FROM announcement_types WHERE language = ?",
      [language]
    );
    res.json(types.map(row => row.type));
  } catch (err) {
    console.error("Error fetching announcement types:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

export const addAnnouncementType = async (req, res) => {
  const { language, type } = req.body;

  if (!language || !type) {
    return res.status(400).json({ message: "Both language and type are required." });
  }

  try {
    await db.execute(
      "INSERT INTO announcement_types (language, type) VALUES (?, ?)",
      [language, type]
    );
    res.status(201).json({ message: "Announcement type added successfully." });
  } catch (err) {
    console.error("Error adding announcement type:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

export const deleteAnnouncementType = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute("DELETE FROM announcement_types WHERE type = ?", [id]);
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting announcement type:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};
