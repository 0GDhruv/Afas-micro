// script-manager-service/controllers/scriptmanager.controller.js
import db from "../config/db.config.js";
import axios from "axios";

const LOGS_SERVICE_URL = process.env.LOGS_SERVICE_URL || "http://localhost:4025/api/logs";
const SERVICE_NAME = "ScriptManagerService_Scripts";

async function sendToLogsService(logData) {
  try {
    await axios.post(LOGS_SERVICE_URL, { service_name: SERVICE_NAME, ...logData });
  } catch (error) { console.error(`${SERVICE_NAME} - Error sending log:`, error.message); }
}

export const getTranscriptions = async (req, res) => {
  const { sequence, language } = req.query;
  if (!sequence || !language) {
    return res.status(400).json({ message: "Sequence and Language parameters are required." });
  }
  const sequenceArray = String(sequence).split(",").map(s => s.trim()).filter(s => s);
  const transcriptions = [];
  try {
    for (const audioFileOrPlaceholder of sequenceArray) {
      if (audioFileOrPlaceholder.startsWith("*") && audioFileOrPlaceholder.endsWith("*")) {
        transcriptions.push(audioFileOrPlaceholder);
      } else {
        const [result] = await db.execute(
          `SELECT transcription FROM audios 
           WHERE language = ? AND (filePath LIKE ? OR filePath LIKE ?)`,
          [language, `%/${audioFileOrPlaceholder}`, `%/${audioFileOrPlaceholder}.wav`]
        );
        if (result.length > 0 && result[0].transcription) {
          transcriptions.push(result[0].transcription);
        } else {
          transcriptions.push(`[${audioFileOrPlaceholder}-N/A]`);
        }
      }
    }
    res.json({ transcriptions });
  } catch (err) {
    sendToLogsService({ log_type: "ERROR", message: "Error fetching transcriptions.", details: { sequence, language, error: err.message } });
    console.error("Error in getTranscriptions:", err);
    res.status(500).json({ message: "Error fetching transcriptions", error: err.message });
  }
};

export const addScript = async (req, res) => {
  const { language, announcementType, sequence, transcription, area } = req.body;
  if (!language || !announcementType || !sequence || !area) {
    return res.status(400).json({ message: "All fields (language, announcementType, sequence, area) are required." });
  }
  try {
    const sequenceArray = String(sequence).split(",").map(s => s.trim()).filter(s => s);
    const sequenceJSON = JSON.stringify(sequenceArray);
    const [result] = await db.execute( // Get result to access insertId
      "INSERT INTO scripts (language, announcement_type, sequence, transcription, area) VALUES (?, ?, ?, ?, ?)",
      [language, announcementType, sequenceJSON, transcription || null, area]
    );
    sendToLogsService({ log_type: "SCRIPT_ADDED", message: `Added script for type: ${announcementType} (ID: ${result.insertId}).`, details: {area, language, announcementType} });
    res.status(201).json({ message: "Script added successfully.", id: result.insertId });
  } catch (err) {
    sendToLogsService({ log_type: "ERROR", message: `Error adding script for type: ${announcementType}.`, details: { ...req.body, error: err.message } });
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

export const updateScript = async (req, res) => {
  const { id } = req.params;
  const { announcementType, language, sequence, transcription, area } = req.body;
  if (!id || !language || !announcementType || !sequence || !area) {
    return res.status(400).json({ message: "All fields are required for update." });
  }
  try {
    const sequenceArray = String(sequence).split(",").map(s => s.trim()).filter(s => s);
    const sequenceJSON = JSON.stringify(sequenceArray);
    const [result] = await db.execute(
      "UPDATE scripts SET announcement_type = ?, language = ?, sequence = ?, transcription = ?, area = ? WHERE id = ?",
      [announcementType, language, sequenceJSON, transcription || null, area, id]
    );
    if (result.affectedRows > 0) {
        sendToLogsService({ log_type: "SCRIPT_UPDATED", message: `Updated script ID: ${id}.`, details: {announcementType, area, language} });
        res.status(200).json({ message: "Script updated successfully." });
    } else {
        sendToLogsService({ log_type: "WARNING", message: `Attempted to update non-existent script ID: ${id}.` });
        res.status(404).json({ message: "Script not found for update." });
    }
  } catch (err) {
    sendToLogsService({ log_type: "ERROR", message: `Error updating script ID: ${id}.`, details: { ...req.body, error: err.message } });
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

export const getScriptById = async (req, res) => {
  const { id } = req.params;
  try {
    const [script] = await db.execute("SELECT * FROM scripts WHERE id = ?", [id]);
    if (script.length === 0) {
      return res.status(404).json({ message: "Script not found" });
    }
    res.json(script[0]);
  } catch (err) {
    sendToLogsService({ log_type: "ERROR", message: `Error fetching script ID: ${id}.`, details: { error: err.message } });
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

export const getScripts = async (req, res) => {
  const { language, area } = req.query;
  if (!language || !area) {
    return res.status(400).json({ message: "Language and Area are required." });
  }
  try {
    const [scripts] = await db.execute(
      "SELECT id, language, announcement_type, sequence, transcription, area FROM scripts WHERE language = ? AND area = ?",
      [language, area]
    );
    res.json(scripts);
  } catch (err) {
    sendToLogsService({ log_type: "ERROR", message: `Error fetching scripts for ${language}/${area}.`, details: { error: err.message } });
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

export const deleteScript = async (req, res) => {
  const { id } = req.params;
  try {
    // Optional: Fetch script details before deleting for logging purposes
    const [scriptDetails] = await db.execute("SELECT announcement_type, language, area FROM scripts WHERE id = ?", [id]);
    
    const [result] = await db.execute("DELETE FROM scripts WHERE id = ?", [id]);
    if (result.affectedRows > 0) {
        const details = scriptDetails.length > 0 ? scriptDetails[0] : { id };
        sendToLogsService({ log_type: "SCRIPT_DELETED", message: `Deleted script ID: ${id}.`, details });
        res.status(200).json({ message: "Script deleted successfully." });
    } else {
        sendToLogsService({ log_type: "WARNING", message: `Attempted to delete non-existent script ID: ${id}.` });
        res.status(404).json({ message: "Script not found for deletion." });
    }
  } catch (err) {
    sendToLogsService({ log_type: "ERROR", message: `Error deleting script ID: ${id}.`, details: { error: err.message } });
    res.status(500).json({ message: "Database error", error: err.message });
  }
};
