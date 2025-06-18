import db from "../config/db.config.js";
import axios from "axios";

// ✅ Fetch languages dynamically from Upload Service
export const getLanguages = async (req, res) => {
  try {
    console.log("📢 Fetching languages from Upload Service...");
    const response = await axios.get("http://localhost:4003/languages");
    console.log("✅ Languages Fetched:", response.data);
    res.json(response.data);
  } catch (err) {
    console.error("❌ Error fetching languages from Upload Service:", err.message);
    res.status(500).json({ message: "Error fetching languages", error: err.message });
  }
};

// ✅ Fetch announcement types for a selected language
export const getAnnouncementTypes = async (req, res) => {
  const response = await axios.get("http://localhost:4003/languages");
  
  const { language } = req.query;
  if (!language) {
    console.error("🚨 No language provided in request! Expected format: /announcementtype?language=English");
    return res.status(400).json({ message: "Language parameter is required." });
  }

  try {
    console.log(`🔍 Fetching announcement types for language: ${language}`);
    const [types] = await db.execute(
      "SELECT type FROM announcement_types WHERE language = ?",
      [language]
    );

    console.log("✅ Fetched announcement types:", types);
    res.json(types.map(row => row.type));
  } catch (err) {
    console.error("❌ Error fetching announcement types:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// ✅ Add a new announcement type for a selected language
export const addAnnouncementType = async (req, res) => {
  const { language, type } = req.body;

  if (!language || !type) {
    return res.status(400).json({ message: "Both language and type are required." });
  }

  try {
    console.log(`➕ Adding new announcement type: ${type} for language: ${language}`);
    
    const [existing] = await db.execute(
      "SELECT type FROM announcement_types WHERE language = ? AND type = ?",
      [language, type]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: "❌ Announcement type already exists!" });
    }

    await db.execute(
      "INSERT INTO announcement_types (language, type) VALUES (?, ?)",
      [language, type]
    );

    console.log("✅ Announcement Type added successfully!");
    res.status(201).json({ message: "Announcement type added successfully." });
  } catch (err) {
    console.error("❌ Error adding announcement type:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// ✅ Delete an announcement type for a selected language
export const deleteAnnouncementType = async (req, res) => {
  const { type } = req.params;
  const { language } = req.query;

  if (!language || !type) {
    return res.status(400).json({ message: "Language and type are required." });
  }

  try {
    console.log(`🗑 Deleting announcement type: ${type} for language: ${language}`);

    await db.execute(
      "DELETE FROM announcement_types WHERE language = ? AND type = ?",
      [language, type]
    );

    console.log("✅ Announcement Type deleted successfully!");
    res.status(204).send();
  } catch (err) {
    console.error("❌ Error deleting announcement type:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};
