import db from "../config/db.config.js";

// Fetch announcement types by language
export const getAnnouncementTypes = async (req, res) => {
  const { language } = req.query;

  try {
    const [types] = await db.execute(
      `SELECT type FROM announcement_types WHERE language = ?`,
      [language]
    );

    res.json(types.map((row) => row.type));
  } catch (err) {
    console.error("Error fetching announcement types:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// Add a new announcement type
export const addAnnouncementType = async (req, res) => {
  const { language, type } = req.body;

  try {
    await db.execute(
      `INSERT INTO announcement_types (language, type) VALUES (?, ?)`,
      [language, type]
    );
    res.status(201).json({ message: "Announcement type added successfully" });
  } catch (err) {
    console.error("Error adding announcement type:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// Fetch all announcement types
export const getAllAnnouncementTypes = async (req, res) => {
  try {
    const [types] = await db.execute(`SELECT * FROM announcement_types`);
    res.json(types);
  } catch (err) {
    console.error("Error fetching all announcement types:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// Delete an announcement type
export const deleteAnnouncementType = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute(`DELETE FROM announcement_types WHERE id = ?`, [id]);
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting announcement type:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};
