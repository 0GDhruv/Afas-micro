import axios from "axios";
import db from "../config/db.config.js";

// Fetch all available languages from Upload-Service
export const getLanguages = async (req, res) => {
  try {
    const response = await axios.get("http://localhost:4003/languages");
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching languages from Upload-Service:", err.message);
    res.status(500).json({ message: "Error fetching languages", error: err.message });
  }
};

// Fetch audio files for the selected language and type
export const getAudioFiles = async (req, res) => {
  const { language } = req.query;

  try {
    const response = await axios.get("http://localhost:4003/audio-files", {
      params: { language, type: "specialmessage" },
    });
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching audio files from Upload-Service:", err.message);
    res.status(500).json({ message: "Error fetching audio files", error: err.message });
  }
};

// Create a new schedule
export const createSchedule = async (req, res) => {
  const { language, audioId, timings, startDate, endDate, frequency } = req.body;

  try {
    await db.execute(
      "INSERT INTO schedules (language, audioId, timing, start_date, end_date, frequency) VALUES (?, ?, ?, ?, ?, ?)",
      [language, audioId, JSON.stringify(timings), startDate, endDate, frequency]
    );
    res.status(201).send("Schedule created successfully.");
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// Fetch all schedules
export const getSchedules = async (req, res) => {
  try {
    const [schedules] = await db.execute("SELECT * FROM schedules");
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};

// Delete a schedule
export const deleteSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    await db.execute("DELETE FROM schedules WHERE id = ?", [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: "Database error", error: err.message });
  }
};
