import axios from "axios";
import db from "../config/db.config.js";
import player from "play-sound";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";

// Create __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const audioPlayer = player();

// Function to play audio
const playAudio = (filePath) => {
  audioPlayer.play(filePath, (err) => {
    if (err) console.error("Error playing audio:", err.message);
    else console.log("Playing audio:", filePath);
  });
};

// Execute schedules
export const executeSchedules = async () => {
  try {
    const [schedules] = await db.execute("SELECT * FROM schedules");

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // Current time in HH:mm format
    const currentDay = now.toLocaleString("en-US", { weekday: "short" }); // Current day (e.g., Mon, Tue)

    schedules.forEach((schedule) => {
      const timings = Array.isArray(schedule.timing) ? schedule.timing : JSON.parse(schedule.timing);

      let frequency;
      try {
        frequency = JSON.parse(schedule.frequency); // Parse if JSON
      } catch (e) {
        frequency = schedule.frequency; // Use as-is if not JSON
      }

      if (
        timings.includes(currentTime) &&
        (frequency === "all" || frequency.includes(currentDay))
      ) {
        console.log(`Executing schedule: ${schedule.name || "Unnamed Schedule"} at ${currentTime}`);

        const audioFilePath = path.join(
          __dirname,
          "../../upload-service/uploads",
          schedule.language,
          "specialmessage",
          schedule.audioId
        );
        console.log(`Playing audio: ${audioFilePath}`);
        playAudio(audioFilePath); // Play the audio file
      }
    });
  } catch (err) {
    console.error("Error executing schedules:", err.message);
  }
};




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
  const { name, language, audioId, timings, startDate, endDate, frequency } = req.body;

  console.log("Received data for schedule creation:", { name, language, audioId, timings, startDate, endDate, frequency });

  try {
    await db.execute(
      "INSERT INTO schedules (name, language, audioId, timing, start_date, end_date, frequency) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, language, audioId, JSON.stringify(timings), startDate, endDate, frequency.join(",")]
    );
    res.status(201).send("Schedule created successfully.");
  } catch (err) {
    console.error("Error saving schedule:", err.message);
    res.status(500).json({ message: "Database error", error: err.message });
  }
};


// Fetch all schedules
export const getSchedules = async (req, res) => {
  try {
    const [schedules] = await db.execute("SELECT * FROM schedules");

    // Ensure the response is clean
    const cleanedSchedules = JSON.stringify(schedules).replace(/^\uFEFF/, ""); // Remove BOM if present

    res.setHeader("Content-Type", "application/json");
    res.send(cleanedSchedules);
  } catch (err) {
    console.error("Error fetching schedules:", err.message);
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
