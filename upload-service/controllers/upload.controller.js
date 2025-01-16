import fs from "fs";
import path from "path";
import db from "../config/db.config.js";

// Upload and Save Audio Data
export const uploadAudio = async (req, res) => {
  const { audioType, transcription, remarks, language } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Determine upload directory
  const uploadDir = path.join("uploads", language, audioType.replace(/\s/g, "").toLowerCase());
  fs.mkdirSync(uploadDir, { recursive: true });

  // Move file to directory
  const filePath = path.join(uploadDir, file.originalname);
  fs.renameSync(file.path, filePath);

  try {
    // Save audio details to database
    const [result] = await db.execute(
      "INSERT INTO audios (language, audioType, filePath, transcription, remarks) VALUES (?, ?, ?, ?, ?)",
      [language, audioType, filePath.replace("uploads", ""), transcription, remarks]
    );

    res.status(201).json({ id: result.insertId, message: "Audio uploaded successfully" });
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// Get All Audios by Language
export const getAllAudios = async (req, res) => {
  const { language } = req.query;

  try {
    const [audios] = await db.execute("SELECT * FROM audios WHERE language = ?", [language]);
    res.json(audios);
  } catch (err) {
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
