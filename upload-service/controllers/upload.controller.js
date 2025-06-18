// upload-service/controllers/upload.controller.js
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import db from "../config/db.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_UPLOADS_DIR = path.resolve(__dirname, "..", "uploads");

const normalizePathForDB = (filePath) => {
    return filePath.replace(/\\/g, "/");
};

export const uploadAudio = async (req, res) => {
  console.log("Received /upload request. Body:", req.body, "File present:", !!req.file);

  try {
    if (!req.file) {
      console.error("Upload error: No file was uploaded with the request.");
      return res.status(400).json({ message: "No file uploaded. Please select an audio file." });
    }

    const { audioType, transcription, remarks, language } = req.body;
    const uploadedFile = req.file;

    // Critical validation for language and audioType
    if (!language || typeof language !== 'string' || language.trim() === "") {
      console.error("Upload error: 'language' is missing or invalid in request body.", req.body);
      await fs.unlink(uploadedFile.path); // Clean up temp file
      return res.status(400).json({ message: "Language parameter is required and must be valid." });
    }
    if (!audioType || typeof audioType !== 'string' || audioType.trim() === "") {
      console.error("Upload error: 'audioType' is missing or invalid in request body.", req.body);
      await fs.unlink(uploadedFile.path); // Clean up temp file
      return res.status(400).json({ message: "Audio Type parameter is required and must be valid." });
    }

    console.log(`Processing upload for Language: ${language}, Type: ${audioType}`);

    const relativeDir = path.join(language, audioType.replace(/\s/g, "").toLowerCase());
    const finalUploadDir = path.join(BASE_UPLOADS_DIR, relativeDir);
    
    await fs.ensureDir(finalUploadDir);

    const finalFileName = uploadedFile.originalname;
    const finalFilePathSystem = path.join(finalUploadDir, finalFileName);
    const relativeFilePathForDB = normalizePathForDB(path.join("/", relativeDir, finalFileName));

    console.log("Temporary file path from multer:", uploadedFile.path);
    console.log("Final destination path:", finalFilePathSystem);

    await fs.move(uploadedFile.path, finalFilePathSystem, { overwrite: true });
    console.log(`File moved successfully to: ${finalFilePathSystem}`);

    const [result] = await db.execute(
      "INSERT INTO audios (language, audioType, filePath, transcription, remarks) VALUES (?, ?, ?, ?, ?)",
      [language, audioType, relativeFilePathForDB, transcription || null, remarks || null] // Handle null for optional fields
    );

    res.status(201).json({ 
        id: result.insertId, 
        message: "Audio uploaded successfully.",
        filePath: relativeFilePathForDB 
    });

  } catch (err) {
    console.error("❌ Upload error in controller:", err.message, err.stack);
    if (req.file && req.file.path) {
        try {
            if (await fs.pathExists(req.file.path)) { // Check if temp file still exists
                await fs.unlink(req.file.path);
                console.log("Cleaned up temporary file due to upload error:", req.file.path);
            }
        } catch (cleanupErr) {
            console.error("Error cleaning up temporary file during upload error:", cleanupErr);
        }
    }
    res.status(500).json({ message: "Server error during audio upload. Check server logs for details.", error: err.message });
  }
};

// Get All Audios, with optional filtering by language and audioType
export const getAllAudios = async (req, res) => {
  const { language, audioType } = req.query;

  if (!language) {
    console.warn("🚨 Language parameter missing in getAllAudios request.");
    return res.status(400).json({ message: "Language parameter is required to fetch audios." });
  }

  try {
    let sqlQuery = "SELECT id, language, audioType, filePath, transcription, remarks FROM audios WHERE language = ?";
    const queryParams = [language];

    if (audioType) {
      sqlQuery += " AND audioType = ?";
      queryParams.push(audioType);
      console.log(`🔍 Fetching audios for language: ${language}, type: ${audioType}`);
    } else {
      console.log(`🔍 Fetching all audios for language: ${language}`);
    }

    const [audios] = await db.execute(sqlQuery, queryParams);

    if (!audios || audios.length === 0) {
      console.log(`⚠ No audios found for language: ${language}` + (audioType ? ` and type: ${audioType}` : ""));
      return res.json([]);
    }

    const normalizedAudios = audios.map(audio => ({
        ...audio,
        filePath: normalizePathForDB(audio.filePath)
    }));

    console.log(`✅ ${normalizedAudios.length} audios fetched for lang: ${language}` + (audioType ? `, type: ${audioType}` : ""));
    res.json(normalizedAudios);

  } catch (err) {
    console.error("❌ Database error while fetching audios:", err.message, err.stack);
    res.status(500).json({ message: "Database error while fetching audios.", error: err.message });
  }
};

// Delete Audio
export const deleteAudio = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({message: "Valid Audio ID is required for deletion."});
  }

  try {
    const [audioRecords] = await db.execute("SELECT filePath FROM audios WHERE id = ?", [id]);

    if (audioRecords.length === 0) {
      return res.status(404).json({ message: "Audio not found in database." });
    }
    const audio = audioRecords[0];

    const relativeFilePath = audio.filePath.startsWith('/') ? audio.filePath.substring(1) : audio.filePath;
    const absoluteFilePath = path.join(BASE_UPLOADS_DIR, normalizePathForDB(relativeFilePath));

    const [deleteResult] = await db.execute("DELETE FROM audios WHERE id = ?", [id]);

    if (deleteResult.affectedRows > 0) {
        console.log(`Successfully deleted audio record ID ${id} from database.`);
        if (audio.filePath && await fs.pathExists(absoluteFilePath)) {
            try {
                await fs.unlink(absoluteFilePath);
                console.log(`Successfully deleted audio file: ${absoluteFilePath}`);
            } catch (fileErr) {
                console.error(`Error deleting file ${absoluteFilePath}, but DB record was deleted:`, fileErr.message);
            }
        } else {
            console.warn(`File not found for deleted DB record ID ${id} at: ${absoluteFilePath}`);
        }
        res.status(200).json({ message: "Audio deleted successfully." }); 
    } else {
        return res.status(404).json({ message: "Audio not found for deletion." });
    }
  } catch (err) {
    console.error(`❌ Error deleting audio ID ${id}:`, err.message, err.stack);
    res.status(500).json({ message: "Server error during audio deletion.", error: err.message });
  }
};
