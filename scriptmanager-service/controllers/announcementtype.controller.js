// script-manager-service/controllers/announcementtype.controller.js
import db from "../config/db.config.js";
import axios from "axios";

const LOGS_SERVICE_URL = process.env.LOGS_SERVICE_URL || "http://localhost:4025/api/logs";
const SERVICE_NAME = "ScriptManagerService_AnnouncementType";

async function sendToLogsService(logData) {
  try {
    await axios.post(LOGS_SERVICE_URL, { service_name: SERVICE_NAME, ...logData });
  } catch (error) { console.error(`${SERVICE_NAME} - Error sending log:`, error.message); }
}

export const getLanguages = async (req, res) => {
  try {
    const response = await axios.get("http://localhost:4003/languages"); // From Upload Service
    res.json(response.data);
  } catch (err) {
    sendToLogsService({ log_type: "ERROR", message: "Error fetching languages from Upload Service.", details: { error: err.message } });
    res.status(500).json({ message: "Error fetching languages", error: err.message });
  }
};

export const getAnnouncementTypes = async (req, res) => {
  const { language, area } = req.query;
  if (!language || !area) {
    return res.status(400).json({ message: "Language and Area are required." });
  }
  try {
    const [types] = await db.execute(
      "SELECT type FROM announcement_types WHERE language = ? AND area = ?",
      [language, area]
    );
    res.json(types.map(row => row.type));
  } catch (err) {
    sendToLogsService({ log_type: "ERROR", message: `Error fetching announcement types for ${language}/${area}.`, details: { error: err.message } });
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

export const addAnnouncementType = async (req, res) => {
  const { language, type, area } = req.body;
  if (!language || !type || !area) {
    return res.status(400).json({ message: "Language, Type, and Area are required." });
  }
  try {
    await db.execute(
      "INSERT INTO announcement_types (language, type, area) VALUES (?, ?, ?)",
      [language, type, area]
    );
    sendToLogsService({ log_type: "ANNOUNCEMENT_TYPE_ADDED", message: `Added type: ${type} for ${language}/${area}.`, details: req.body });
    res.status(201).json({ message: "Announcement type added successfully." });
  } catch (err) {
    sendToLogsService({ log_type: "ERROR", message: `Error adding announcement type: ${type}.`, details: { ...req.body, error: err.message } });
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

export const deleteAnnouncementType = async (req, res) => {
  const { type: typeName } = req.params; // Renamed for clarity
  const { language, area } = req.query; // Area should also be part of the key for deletion
  if (!language || !typeName || !area) {
    return res.status(400).json({ message: "Language, Type name, and Area are required for deletion." });
  }
  try {
    const [result] = await db.execute(
      "DELETE FROM announcement_types WHERE language = ? AND type = ? AND area = ?",
      [language, typeName, area]
    );
    if (result.affectedRows > 0) {
        sendToLogsService({ log_type: "ANNOUNCEMENT_TYPE_DELETED", message: `Deleted type: ${typeName} for ${language}/${area}.` });
        res.status(200).json({ message: "Announcement type deleted successfully." }); // Send 200 with message
    } else {
        sendToLogsService({ log_type: "WARNING", message: `Attempted to delete non-existent type: ${typeName} for ${language}/${area}.` });
        res.status(404).json({ message: "Announcement type not found for the given language and area." });
    }
  } catch (err) {
    sendToLogsService({ log_type: "ERROR", message: `Error deleting announcement type: ${typeName}.`, details: { language, area, error: err.message } });
    res.status(500).json({ message: "Database error", error: err.message });
  }
};
