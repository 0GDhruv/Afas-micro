// scheduler-service/controllers/schedular.controller.js
import axios from "axios";
import db from "../config/db.config.js"; // Assuming you have a db.config.js for schedules table
import player from "play-sound";
import path from "path";
import fs from "fs-extra"; // Using fs-extra for existsSync
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const audioPlayer = player({}); // Initialize player

const AUDIO_PROCESSING_SERVICE_URL = process.env.AUDIO_PROCESSING_SERVICE_URL || "http://localhost:4008";
const SETTINGS_SERVICE_URL = process.env.SETTINGS_SERVICE_URL || "http://localhost:4010";


// Helper function to play audio
const playAudio = (filePath) => {
  console.log(`Attempting to play audio: ${filePath}`);
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      console.error(`🔴 Audio file not found for playback: ${filePath}`);
      return reject(new Error(`Audio file not found: ${filePath}`));
    }
    audioPlayer.play(filePath, (err) => {
      if (err) {
        console.error("🔴 Error playing audio:", filePath, err.message || err);
        // Don't reject here, as we want the scheduler to continue. Log the error.
        // Consider a mechanism to flag problematic audio files.
        resolve(); // Resolve even if playback fails to not halt the queue.
      } else {
        console.log(`🔊 Finished playing audio: ${filePath}`);
        resolve();
      }
    });
  });
};

export const executeSchedules = async () => {
  console.log(`⏰ Scheduler execution cycle started at ${new Date().toISOString()}`);
  try {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }); // e.g., "Monday"

    // 1. 🔊 Play special messages from 'schedules' table
    try {
        const [schedules] = await db.execute(
            "SELECT * FROM schedules WHERE start_date <= CURDATE() AND end_date >= CURDATE()"
        );

        for (const schedule of schedules) {
            let timings = [];
            try {
                timings = JSON.parse(schedule.timing); // Expecting JSON array of "HH:mm"
            } catch (e) {
                console.warn(`Could not parse timings for schedule ID ${schedule.id}: ${schedule.timing}`);
                continue;
            }
            
            let frequencyDays = [];
            try {
                frequencyDays = JSON.parse(schedule.frequency); // Expecting JSON array of day names
            } catch (e) {
                console.warn(`Could not parse frequency for schedule ID ${schedule.id}: ${schedule.frequency}`);
                continue;
            }

            if (timings.includes(currentTime) && frequencyDays.includes(currentDay)) {
                // Assuming schedule.audioFilePath is like '/english/specialmessage/greeting.wav'
                // This path is relative to the upload-service's 'uploads' directory.
                // For playback, we need the full URL or a locally accessible path if files are mirrored.
                // Let's assume upload-service serves these directly.
                const audioUrlFromUploadService = `http://localhost:4003/uploads${schedule.audioFilePath}`;
                console.log(`📢 Playing special message: ${schedule.name} from ${audioUrlFromUploadService}`);
                // If playAudio expects local paths, this needs adjustment or file fetching.
                // For now, assuming playAudio can handle URLs or you adjust it.
                // If playAudio only takes local paths, you'd need to download it first.
                // This example will likely fail if playAudio is only for local files.
                // A better way for special messages might be to also copy them to a local accessible path
                // or have the scheduler fetch them.
                // For now, let's assume a local path convention for special messages too for simplicity of `playAudio`
                const specialMessageAudioPath = path.join(__dirname, "../../upload-service/uploads", schedule.language, "specialmessage", schedule.audioId || schedule.audioFilePath.split('/').pop());
                // This path construction is fragile. It's better if upload-service provides a direct way or scheduler fetches.
                // await playAudio(specialMessageAudioPath); // This needs careful path setup
                 console.warn(`Playback of special message '${schedule.name}' via direct path needs robust file access strategy.`);
            }
        }
    } catch (dbErr) {
        console.error("❌ Error fetching special schedules from DB:", dbErr.message);
    }


    // 2. 🧠 Get global settings
    let globalSettings = { frequency: 1, audio_lag_minutes: 2 }; // Defaults
    try {
        const { data: settings } = await axios.get(`${SETTINGS_SERVICE_URL}/settings`);
        globalSettings = {
            frequency: settings.frequency || 1,
            audio_lag_minutes: settings.audio_lag_minutes || 2, // Expecting minutes
        };
    } catch (settingsErr) {
        console.error("❌ Failed to fetch global settings, using defaults:", settingsErr.message);
    }
    const global_frequency = globalSettings.frequency;
    const global_audio_lag_minutes = globalSettings.audio_lag_minutes;


    // 3. 🎙 Fetch pending flight announcements from Audio Processing Service
    let announcements = [];
    try {
        const response = await axios.get(`${AUDIO_PROCESSING_SERVICE_URL}/audio/active`);
        announcements = response.data;
    } catch (fetchErr) {
        console.error("❌ Failed to fetch active announcements:", fetchErr.message);
        // Don't return yet, might have special messages to play.
    }

    if (!announcements || announcements.length === 0) {
      console.log("📭 No active flight announcements in the current queue.");
    } else {
      console.log(`📋 Found ${announcements.length} flight announcement(s) in the queue.`);
    }

    // 4. 🔁 Sequential playback of flights
    for (const announcement of announcements) {
      const { flight_number, audio_path, language } = announcement;
      if (!flight_number || !audio_path || !language) {
          console.warn("⚠️ Skipping an announcement due to missing data (flight_number, audio_path, or language):", announcement);
          continue;
      }

      console.log(`🎧 Preparing to play Flight ${flight_number} → Language: ${language}`);

      // Fetch flight-specific settings
      let flightSpecificFrequency = global_frequency;
      let flightSpecificAudioLagMinutes = global_audio_lag_minutes;

      try {
        const flightSettingsRes = await axios.get(`${SETTINGS_SERVICE_URL}/settings/flight/${flight_number}`);
        if (flightSettingsRes.status === 200 && flightSettingsRes.data) {
          const fs = flightSettingsRes.data;
          // Use flight-specific value if it's explicitly set (not null or undefined)
          if (fs.frequency !== null && fs.frequency !== undefined) {
            flightSpecificFrequency = fs.frequency;
          }
          if (fs.audio_lag_minutes !== null && fs.audio_lag_minutes !== undefined) {
            flightSpecificAudioLagMinutes = fs.audio_lag_minutes;
          }
          console.log(`   Flight-specific settings for ${flight_number}: Frequency=${flightSpecificFrequency}, Lag=${flightSpecificAudioLagMinutes} min(s)`);
        }
      } catch (flightSettingsError) {
        if (flightSettingsError.response && flightSettingsError.response.status === 404) {
          console.log(`   No flight-specific settings for ${flight_number}. Using global: Freq=${global_frequency}, Lag=${global_audio_lag_minutes} min(s).`);
        } else {
          console.error(`   Error fetching flight-specific settings for ${flight_number}:`, flightSettingsError.message);
          // Continue with global settings in case of error
        }
      }
      
      const currentPlaybackFrequency = flightSpecificFrequency;
      const currentAudioLagMilliseconds = flightSpecificAudioLagMinutes * 60 * 1000; // Convert minutes to MS

      // Construct full path to the audio file located in audio-processing-service's output directory
      const fullAudioPath = path.resolve(__dirname, `../../audio-processing-service/output_audio/${audio_path}`);
      
      if (!fs.existsSync(fullAudioPath)) {
        console.warn(`⚠️ Audio file not found: ${fullAudioPath} for flight ${flight_number}. Skipping.`);
        // TODO: Optionally, you could try to re-trigger generation here if it's critical
        // await axios.get(`${AUDIO_PROCESSING_SERVICE_URL}/audio/generate/${flight_number}?language=${language}`);
        continue;
      }

      for (let i = 0; i < currentPlaybackFrequency; i++) {
        console.log(`   [${language.toUpperCase()}] Playing Flight ${flight_number} (Repeat ${i + 1}/${currentPlaybackFrequency}) from ${fullAudioPath}`);
        try {
            await playAudio(fullAudioPath);
        } catch (playbackError) {
            console.error(`   Playback failed for ${fullAudioPath}, but continuing scheduler. Error: ${playbackError.message}`);
            // Decide if a failed playback should prevent marking as announced or retries
            break; // Break from repeats if one playback fails
        }
        
        if (i < currentPlaybackFrequency - 1) {
          console.log(`   Waiting ${flightSpecificAudioLagMinutes} minute(s) before next repeat...`);
          await new Promise((r) => setTimeout(r, currentAudioLagMilliseconds));
        }
      }

      // Mark this specific language announcement as processed/played and request deletion
      try {
          await axios.post(`${AUDIO_PROCESSING_SERVICE_URL}/audio/mark-announced`, { 
              flight_number: flight_number,
              language: language,
              audio_path_to_delete: audio_path // Send the relative path for deletion
          });
          console.log(`✅ Requested 'mark-announced' for ${flight_number} (${language}), audio: ${audio_path}.`);
      } catch (markErr) {
          console.error(`❌ Failed to request 'mark-announced' for ${flight_number} (${language}):`, markErr.response?.data || markErr.message);
      }
      
      // Lag *before the next different flight announcement* in the queue
      if (announcements.indexOf(announcement) < announcements.length - 1) { // If not the last announcement in queue
          console.log(`   Lagging ${flightSpecificAudioLagMinutes} minute(s) before processing next flight in queue...`);
          await new Promise((r) => setTimeout(r, currentAudioLagMilliseconds));
      }
    }
    console.log("✅ All announcements in current scheduler queue processed for this cycle.");

  } catch (err) {
    console.error("❌ Fatal error in scheduler execution cycle:", err?.response?.data || err?.message || err);
  } finally {
    console.log(`⏰ Scheduler execution cycle ended at ${new Date().toISOString()}\n---`);
  }
};

// --- REST APIs for Scheduler (CRUD for special messages) ---
// (Keep your existing getLanguages, getAudioFiles, createSchedule, getSchedules, deleteSchedule)

export const getLanguages = async (req, res) => {
  try {
    // Assuming languages are managed by upload-service or script-manager
    const { data } = await axios.get("http://localhost:4003/languages"); // From Upload Service
    res.json(data);
  } catch (err) {
    console.error("Error fetching languages for scheduler API:", err.message);
    res.status(500).json({ message: "Error fetching languages from dependent service", error: err.message });
  }
};

export const getAudioFiles = async (req, res) => {
  try {
    const { language } = req.query;
    if (!language) {
        return res.status(400).json({ message: "Language parameter is required."});
    }
    // Fetch 'specialmessage' type audios from upload-service
    const { data } = await axios.get(`http://localhost:4003/upload?language=${encodeURIComponent(language)}&audioType=specialmessage`);
    // The response from /upload is an array of audio objects {id, filePath, transcription, remarks, language, audioType}
    // We need to format it for the frontend dropdown, perhaps just sending filePath and transcription.
    const formattedFiles = data.map(audio => ({
        filePath: audio.filePath, // e.g., /english/specialmessage/greeting.wav
        fileName: audio.filePath.split(/[\\/]/).pop(), // e.g., greeting.wav
        transcription: audio.transcription
    }));
    res.json(formattedFiles);
  } catch (err) {
    console.error("Error fetching audio files for scheduler API:", err.message);
    res.status(500).json({ message: "Error fetching audio files from upload service", error: err.message });
  }
};

export const createSchedule = async (req, res) => {
  const { name, language, audioFilePath, timings, start_date, end_date, frequency } = req.body;
  // Validate input
  if (!name || !language || !audioFilePath || !timings || !start_date || !end_date || !frequency) {
      return res.status(400).json({message: "Missing required fields for schedule."});
  }
  try {
    // Note: audioId in your table might correspond to the filename or a DB ID from 'audios' table.
    // Here, we are using audioFilePath from the request. Adjust DB schema if needed.
    // The 'schedules' table should store 'audioFilePath' (e.g., /english/specialmessage/file.wav)
    // and 'language' to reconstruct path if needed, or 'audioId' if it's a foreign key.
    // For simplicity, assuming 'audioFilePath' is stored.
    await db.execute(
      "INSERT INTO schedules (name, language, audioFilePath, timing, start_date, end_date, frequency) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, language, audioFilePath, timings, start_date, end_date, frequency] // timings and frequency are already JSON strings from frontend
    );
    res.status(201).json({ message: "Schedule created successfully."});
  } catch (err) {
    console.error("Error creating schedule in DB:", err.message);
    res.status(500).json({ message: "Database error while creating schedule", error: err.message });
  }
};

export const getSchedules = async (req, res) => {
  try {
    const [schedules] = await db.execute("SELECT * FROM schedules ORDER BY start_date DESC, name ASC");
    res.json(schedules);
  } catch (err) {
    console.error("Error fetching schedules from DB:", err.message);
    res.status(500).json({ message: "Database error while fetching schedules", error: err.message });
  }
};

export const deleteSchedule = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute("DELETE FROM schedules WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
        return res.status(404).json({message: "Schedule not found."});
    }
    res.status(200).json({message: "Schedule deleted successfully."}); // Changed from 204 to send a message
  } catch (err) {
    console.error("Error deleting schedule from DB:", err.message);
    res.status(500).json({ message: "Database error while deleting schedule", error: err.message });
  }
};

// This endpoint is called by flightAnnouncer.worker to queue a flight announcement
export const announceFlight = async (req, res) => {
  // This endpoint's role is primarily to acknowledge the request.
  // The actual playback logic is in executeSchedules which polls /audio/active.
  // If you want immediate playback triggered by this POST, the logic would need to change.
  // For now, this endpoint doesn't directly trigger playback but could log the request.
  const { flight_number, audio_path, language } = req.body;
  if (!flight_number || !audio_path || !language) {
    return res.status(400).json({ message: "Missing flight_number, audio_path, or language for announcement." });
  }
  console.log(`📢 Received request to announce: Flight ${flight_number}, Lang ${language}, Path ${audio_path}. Will be picked up by scheduler cycle.`);
  // No direct playback here, executeSchedules handles it.
  res.status(202).json({ message: "Announcement request received and queued for scheduler." });
};
