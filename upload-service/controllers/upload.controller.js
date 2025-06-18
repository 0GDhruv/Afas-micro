import fs from "fs";
import path from "path";
import db from "../config/db.config.js";

// Upload and Save Audio Data
// ✅ Upload and Save Audio Data
export const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { audioType, transcription, remarks, language } = req.body;
    const file = req.file;

    // ✅ Create a proper upload directory
    const uploadDir = path.join("uploads", language, audioType.replace(/\s/g, "").toLowerCase());
    fs.mkdirSync(uploadDir, { recursive: true });

    // ✅ Move file to directory
    const filePath = path.join(uploadDir, file.originalname);
    fs.renameSync(file.path, filePath);

    // ✅ Save to database
    const [result] = await db.execute(
      "INSERT INTO audios (language, audioType, filePath, transcription, remarks) VALUES (?, ?, ?, ?, ?)",
      [language, audioType, filePath.replace("uploads", ""), transcription, remarks]
    );

    res.status(201).json({ id: result.insertId, message: "Audio uploaded successfully" });
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};


// Get All Audios by Language
export const getAllAudios = async (req, res) => {
  const { language } = req.query;

  if (!language) {
    console.error("🚨 Missing language parameter in request.");
    return res.status(400).json({ message: "Language parameter is required." });
  }

  try {
    console.log(`🔍 Fetching audios for language: ${language}`);

    const [audios] = await db.execute("SELECT * FROM audios WHERE language = ?", [language]);

    if (!audios || audios.length === 0) {
      console.warn(`⚠ No audios found for language: ${language}`);
      return res.json([]); // ✅ Return an empty array instead of an error
    }

    console.log("✅ Audios fetched successfully:", audios);
    res.json(audios);
  } catch (err) {
    console.error("❌ Database error while fetching audios:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};


// Delete Audio
export const deleteAudio = async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the audio record
    const [audioRecords] = await db.execute("SELECT * FROM audios WHERE id = ?", [id]);

    if (audioRecords.length === 0) {
      return res.status(404).json({ message: "Audio not found" });
    }

    const audio = audioRecords[0];

    // Delete the file from the filesystem
    const filePath = path.join("uploads", audio.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the record from the database
    await db.execute("DELETE FROM audios WHERE id = ?", [id]);

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};
