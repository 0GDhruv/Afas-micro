// audio-processing-service/controllers/audioProcessing.controller.js
import { getAnnouncementSequence, getFlightDetails, getAudioFiles } from "../services/audioFetch.service.js";
import { mergeAudioFiles } from "../services/audioMerge.service.js";
import afasDb from "../config/db.config.js";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios"; // Added axios

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve(__dirname, "..", "output_audio/");
fs.ensureDirSync(OUTPUT_DIR);
const TEMP_OUTPUT_DIR = path.join(OUTPUT_DIR, "tmp");
fs.ensureDirSync(TEMP_OUTPUT_DIR);

const LOGS_SERVICE_URL = process.env.LOGS_SERVICE_URL || "http://localhost:4025/api/logs";
const SERVICE_NAME = "AudioProcessingService";

async function sendToLogsService(logData) {
  try {
    await axios.post(LOGS_SERVICE_URL, {
      service_name: SERVICE_NAME,
      ...logData,
    });
  } catch (error) {
    console.error(`${SERVICE_NAME} - Error sending log to logs service:`, error.message);
  }
}

const cleanOldFilesCron = () => {
  const now = Date.now();
  const maxAge = 3 * 60 * 60 * 1000; 
  fs.readdir(OUTPUT_DIR, (err, files) => {
    if (err) {
      console.error("Error reading output_audio directory for cleanup:", err);
      sendToLogsService({ log_type: "ERROR", message: "Error reading output_audio for cleanup.", details: { error: err.message } });
      return;
    }
    files.forEach(file => {
      if (file === 'tmp') return;
      const fullPath = path.join(OUTPUT_DIR, file);
      fs.stat(fullPath, (statErr, stats) => {
        if (statErr) return;
        if (stats.isFile() && (now - stats.mtimeMs > maxAge)) {
          fs.unlink(fullPath, unlinkErr => {
            if (unlinkErr) {
              console.error(`Error deleting old file ${fullPath}:`, unlinkErr);
              sendToLogsService({ log_type: "ERROR", message: `Cron: Error deleting old audio file ${file}`, details: { error: unlinkErr.message } });
            } else {
              console.log("🧹 Cron Deleted Old Audio:", file);
              sendToLogsService({ log_type: "AUDIO_FILE_CLEANUP", message: `Cron: Deleted old audio file ${file}` });
            }
          });
        }
      });
    });
  });
};
setInterval(cleanOldFilesCron, 60 * 60 * 1000);
console.log("Scheduled cron job for cleaning old audio files every hour.");

export const processAnnouncement = async (req, res) => {
    const { flight_number } = req.params;
    const requestedLanguage = req.query.language || "english";
    const logContext = { flight_number, language: requestedLanguage };

    try {
        const details = await getFlightDetails(flight_number);
        if (!details) {
            sendToLogsService({ ...logContext, log_type: "ERROR", message: `Flight not found in active playlist during audio generation.` });
            return res.status(404).json({ message: `Flight ${flight_number} not found in active playlist.` });
        }
        if (!details.announcement_type) {
            sendToLogsService({ ...logContext, log_type: "ERROR", message: `Flight does not have an announcement type assigned.` });
             return res.status(400).json({ message: `Flight ${flight_number} does not have an announcement type assigned.` });
        }

        const sequence = await getAnnouncementSequence(details.announcement_type);
        if (!sequence) {
            sendToLogsService({ ...logContext, log_type: "ERROR", message: `No announcement sequence found for type: ${details.announcement_type}.` });
            return res.status(404).json({ message: `No announcement sequence found for type: ${details.announcement_type}.` });
        }

        const audioClips = await getAudioFiles(sequence, details, requestedLanguage);
        if (!audioClips || audioClips.length === 0) {
            sendToLogsService({ ...logContext, log_type: "ERROR", message: `Could not gather audio clips.`});
            return res.status(400).json({ message: `Could not gather audio clips for flight ${flight_number} in ${requestedLanguage}.` });
        }

        const timeSuffix = (details.std || details.etd || "00-00-00").replace(/:/g, "-");
        const outputFileName = `${flight_number}_${requestedLanguage}_${timeSuffix}.wav`;

        const mergeResult = await mergeAudioFiles(audioClips, outputFileName);
        if (!mergeResult || !mergeResult.filename) {
            sendToLogsService({ ...logContext, log_type: "ERROR", message: "Audio merge process failed." });
            return res.status(500).json({ message: "Failed to process and merge audio files." });
        }
        
        const audioDuration = mergeResult.duration;
        const actualFilename = mergeResult.filename;

        if (details.id && audioDuration) {
            try {
                await afasDb.execute("UPDATE active_playlist SET audio_duration = ? WHERE id = ?", [audioDuration, details.id]);
                sendToLogsService({ ...logContext, log_type: "DB_UPDATE", message: `Updated audio_duration to ${audioDuration} for flight ID ${details.id}.`, details: { file: actualFilename } });
            } catch (dbErr) {
                sendToLogsService({ ...logContext, log_type: "ERROR", message: `Failed to update audio_duration for flight ID ${details.id}.`, details: { error: dbErr.message, file: actualFilename } });
            }
        }
        sendToLogsService({ ...logContext, log_type: "AUDIO_GENERATED", message: `Announcement audio generated successfully.`, details: { file: actualFilename, duration: audioDuration } });
        res.status(200).json({ 
            message: "Announcement audio generated successfully.", 
            audio_path: actualFilename, 
            duration: audioDuration || 'N/A' 
        });
    } catch (err) {
        console.error(`❌ Error in processAnnouncement for ${flight_number}:`, err.message, err.stack);
        sendToLogsService({ ...logContext, log_type: "ERROR", message: `General error in processAnnouncement: ${err.message}` });
        res.status(500).json({ message: "Failed to process announcement", error: err.message });
    }
};

export const markFlightAsAnnounced = async (req, res) => {
  const { flight_number, language, audio_path_to_delete } = req.body;
  const logContext = { flight_number, language, audio_path: audio_path_to_delete };

  if (!flight_number) {
    sendToLogsService({ log_type: "ERROR", message: "markFlightAsAnnounced called with missing flight_number." });
    return res.status(400).json({ message: "Missing flight_number to mark as announced." });
  }
  if (!language || !audio_path_to_delete) {
      sendToLogsService({ ...logContext, log_type: "WARNING", message: "markFlightAsAnnounced called with missing language or audio_path. Cannot delete specific audio file." });
  }

  try {
    // This function is now primarily for logging and file deletion.
    // The actual DB status update to 'Completed' for the entire flight should be handled by flightAnnouncer.worker
    // after all its language announcements are confirmed played.
    sendToLogsService({ ...logContext, log_type: "ANNOUNCEMENT_PLAYBACK_CONFIRMED", message: `Playback confirmed by scheduler.` });

    if (audio_path_to_delete && typeof audio_path_to_delete === 'string') {
      const fullAudioPath = path.join(OUTPUT_DIR, path.basename(audio_path_to_delete));
      try {
        if (await fs.pathExists(fullAudioPath)) {
          await fs.unlink(fullAudioPath);
          sendToLogsService({ ...logContext, log_type: "AUDIO_FILE_DELETED", message: `Deleted announced audio file: ${audio_path_to_delete}` });
        } else {
          sendToLogsService({ ...logContext, log_type: "WARNING", message: `Audio file not found for deletion: ${audio_path_to_delete}` });
        }
      } catch (fileErr) {
        sendToLogsService({ ...logContext, log_type: "ERROR", message: `Error deleting audio file ${audio_path_to_delete}`, details: { error: fileErr.message } });
      }
    }
    res.status(200).json({ message: `Announcement for flight ${flight_number} (${language}) processed for completion.` });
  } catch (err) {
    console.error(`❌ Error in markFlightAsAnnounced for ${flight_number}:`, err.message, err.stack);
    sendToLogsService({ ...logContext, log_type: "ERROR", message: `Error in markFlightAsAnnounced: ${err.message}` });
    res.status(500).json({ message: "Error processing announcement completion", error: err.message });
  }
};

export const getActiveAnnouncements = async (req, res) => {
  try {
    const [rows] = await afasDb.execute(
      `SELECT 
         ap.id, ap.flight_number, ap.std, ap.etd, ap.announcement_count, ap.announcement_status,
         ap.current_announcement_language as language, 
         ap.current_audio_path as audio_path 
       FROM active_playlist ap
       WHERE ap.announcement_status = 'ReadyForScheduler'`
    );
    if (rows.length > 0) {
        sendToLogsService({ log_type: "SCHEDULER_POLL", message: `Scheduler polled ${rows.length} active announcements.` });
    }
    res.json(rows.map(row => ({
        flight_number: row.flight_number,
        audio_path: row.audio_path, 
        language: row.language,
        announcement_count: row.announcement_count || 0,
      }))
    );
  } catch (err) {
    console.error("❌ Error fetching active announcements for scheduler:", err.message, err.stack);
    sendToLogsService({ log_type: "ERROR", message: `Failed to get active announcements for scheduler: ${err.message}` });
    res.status(500).json({ message: "Failed to get active announcements", error: err.message });
  }
};
