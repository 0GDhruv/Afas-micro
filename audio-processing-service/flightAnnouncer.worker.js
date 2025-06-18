// audio-processing-service/flightAnnouncer.worker.js
import afasDb from "./config/db.config.js";
import { getAnnouncementSequence, getAudioFiles } from "./services/audioFetch.service.js";
import { mergeAudioFiles } from "./services/audioMerge.service.js";
import axios from "axios";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, "..", "output_audio/");
const SETTINGS_SERVICE_URL = process.env.SETTINGS_SERVICE_URL || "http://localhost:4010";
const LOGS_SERVICE_URL = process.env.LOGS_SERVICE_URL || "http://localhost:4025/api/logs";
const SERVICE_NAME = "AudioProcessingWorker";

async function sendToLogsService(logData) {
  try {
    await axios.post(LOGS_SERVICE_URL, {
      service_name: SERVICE_NAME,
      ...logData,
    });
  } catch (error) {
    console.error(`${SERVICE_NAME} - Error sending log:`, error.message);
  }
}

const getEffectiveSettings = async (flightNumber) => {
    let globalSettings = { language_order: ["english"], advance_minutes: 15 };
    try {
        const { data } = await axios.get(`${SETTINGS_SERVICE_URL}/settings`);
        globalSettings = { ...globalSettings, ...data };
    } catch (e) {
        sendToLogsService({ flight_number: flightNumber, log_type: "WARNING", message: "Could not fetch global settings, using defaults.", details: { error: e.message } });
    }
    try {
        const { data: flightSpecific } = await axios.get(`${SETTINGS_SERVICE_URL}/settings/flight/${flightNumber}`);
        if (flightSpecific && flightSpecific.language_order && flightSpecific.language_order.length > 0) {
            sendToLogsService({ flight_number: flightNumber, log_type: "INFO", message: "Using flight-specific language order.", details: { order: flightSpecific.language_order } });
            return { ...globalSettings, ...flightSpecific };
        }
    } catch (e) { /* Use global if 404 or error */ }
    return globalSettings;
};

const checkAndAnnounceFlights = async () => {
  const cycleTime = new Date().toISOString();
  console.log(`WORKER: 🔍 Cycle Start ${cycleTime}`);
  sendToLogsService({ log_type: "WORKER_CYCLE_START", message: "Flight announcer worker cycle started." });
  try {
    const [pendingFlights] = await afasDb.execute(`
      SELECT * FROM active_playlist 
      WHERE (announcement_status = 'Pending' OR announcement_status IS NULL) 
        AND announcement_type IS NOT NULL AND flight_date >= CURDATE()
    `);

    if (pendingFlights.length === 0) {
      console.log("WORKER: ✅ No pending flights for generation.");
      return;
    }
    sendToLogsService({ log_type: "INFO", message: `Found ${pendingFlights.length} flight(s) in 'Pending' state.` });

    for (const flight of pendingFlights) {
      const logContext = { flight_number: flight.flight_number, flight_db_id: flight.id };
      const effectiveSettings = await getEffectiveSettings(flight.flight_number);
      const advanceMinutes = parseInt(effectiveSettings.advance_minutes || 15);
      const languageOrder = effectiveSettings.language_order && effectiveSettings.language_order.length > 0 ? effectiveSettings.language_order : ["english"];

      const now = new Date();
      const flightTimeStr = flight.std || flight.etd;
      if (!flightTimeStr) {
        sendToLogsService({ ...logContext, log_type: "WARNING", message: "Skipping due to missing STD/ETD." });
        continue;
      }
      const [hh, mm] = flightTimeStr.split(":");
      const flightScheduledTime = new Date(flight.flight_date);
      flightScheduledTime.setHours(parseInt(hh), parseInt(mm), 0, 0);
      const announcementWindowStart = new Date(flightScheduledTime.getTime() - advanceMinutes * 60000);

      if (now < announcementWindowStart) {
        console.log(`WORKER: ⏩ Flight ${flight.flight_number} not yet in advance window.`);
        continue;
      }
      
      sendToLogsService({ ...logContext, log_type: "PROCESSING_FLIGHT", message: `Processing flight for announcement.`, details: { scheduled: flightScheduledTime, advanceWin: advanceMinutes } });
      
      // Simplified: Process first language in order not yet marked 'ReadyForScheduler' or 'Completed' for this flight.
      // This requires a more complex state or a separate queue table for full robustness.
      // For this iteration, we'll assume we process one language and set it to ReadyForScheduler.
      // The `current_announcement_language` and `current_audio_path` will be used by `/audio/active`.

      let languageProcessedThisCycle = false;
      for (const lang of languageOrder) {
        // Ideally, check if this language has already been processed/queued for this flight
        // e.g., by looking at a specific status or a related queue table.
        // For now, if the flight is 'Pending', we try to generate for the first language in its order.
        
        const timeSuffix = flightTimeStr.replace(/:/g, "-");
        const outputFileName = `${flight.flight_number}_${lang}_${timeSuffix}.wav`;
        const outputPath = path.join(OUTPUT_DIR, outputFileName);
        let audioDuration = null;
        let audioGenerated = false;

        if (await fs.pathExists(outputPath)) {
          console.log(`WORKER: Audio for ${flight.flight_number} (${lang}) exists: ${outputFileName}.`);
          sendToLogsService({ ...logContext, language: lang, log_type: "AUDIO_EXISTS", message: "Audio file already exists.", details: { file: outputFileName } });
          // Try to get duration if not already set
          if (!flight.audio_duration) { // Assuming flight object has audio_duration from current DB state
             // This part is tricky without calling ffprobe again.
             // Best if duration is stored upon first generation.
          } else {
              audioDuration = flight.audio_duration;
          }
          audioGenerated = true; // File exists
        } else {
          sendToLogsService({ ...logContext, language: lang, log_type: "AUDIO_GENERATION_START", message: "Generating audio file." });
          const sequence = await getAnnouncementSequence(flight.announcement_type);
          if (!sequence) {
            sendToLogsService({ ...logContext, language: lang, log_type: "ERROR", message: `No sequence for type '${flight.announcement_type}'.` });
            continue; 
          }
          const clips = await getAudioFiles(sequence, flight, lang);
          if (!clips || clips.length === 0) {
            sendToLogsService({ ...logContext, language: lang, log_type: "ERROR", message: "No audio clips found." });
            continue; 
          }
          const mergeResult = await mergeAudioFiles(clips, outputFileName);
          if (!mergeResult || !mergeResult.filename) {
            sendToLogsService({ ...logContext, language: lang, log_type: "ERROR", message: "Failed to merge audio." });
            continue; 
          }
          audioDuration = mergeResult.duration;
          audioGenerated = true;
          sendToLogsService({ ...logContext, language: lang, log_type: "AUDIO_GENERATED", message: "Audio generated successfully.", details: { file: mergeResult.filename, duration: audioDuration } });
        }

        if (audioGenerated) {
            try {
                // Set this specific language version as ready for the scheduler
                await afasDb.execute(
                  `UPDATE active_playlist 
                   SET announcement_status = 'ReadyForScheduler', 
                       current_announcement_language = ?, 
                       current_audio_path = ?,
                       audio_duration = ? 
                   WHERE id = ? AND (announcement_status = 'Pending' OR announcement_status IS NULL OR current_announcement_language != ? OR announcement_status != 'Completed')`,
                  [lang, outputFileName, audioDuration, flight.id, lang]
                );
                sendToLogsService({ ...logContext, language: lang, log_type: "FLIGHT_READY_FOR_SCHEDULER", message: `Set to 'ReadyForScheduler'.`, details: { file: outputFileName, duration: audioDuration } });
                languageProcessedThisCycle = true;
                break; // Process only one language per flight per worker cycle
            } catch (dbErr) {
                sendToLogsService({ ...logContext, language: lang, log_type: "ERROR", message: `DB Error updating to ReadyForScheduler.`, details: { error: dbErr.message } });
            }
        }
      } // End language loop

      if (!languageProcessedThisCycle) {
          // If loop completed without processing any language (e.g., all had errors or conditions not met)
          sendToLogsService({ ...logContext, log_type: "INFO", message: "No new language version processed for scheduler in this cycle for this flight." });
      }

    } // End flight loop
  } catch (err) {
    console.error("WORKER: ❌ Top-level error:", err?.message || err, err?.stack);
    sendToLogsService({ log_type: "ERROR", message: `Worker cycle failed: ${err?.message || 'Unknown error'}` });
  } finally {
    console.log(`WORKER: ✅ Cycle End ${cycleTime}`);
    sendToLogsService({ log_type: "WORKER_CYCLE_END", message: "Flight announcer worker cycle finished." });
  }
};

const workerInterval = parseInt(process.env.WORKER_INTERVAL_SECONDS || 30) * 1000;
setInterval(checkAndAnnounceFlights, workerInterval);
console.log(`🚀 Flight Announcer Worker Started. Interval: ${workerInterval/1000} seconds.`);
checkAndAnnounceFlights(); // Initial run
