import afasDb from "../config/db.config.js";
import { fetchAudioFile } from "../config/upload-service.config.js";

// ✅ Fetch sequence from scripts
export const getAnnouncementSequence = async (announcementType) => {
  try {
    const [rows] = await afasDb.execute(
      "SELECT sequence FROM scripts WHERE announcement_type = ? LIMIT 1",
      [announcementType]
    );

    if (rows.length === 0) return null;

    return typeof rows[0].sequence === "string"
      ? JSON.parse(rows[0].sequence)
      : rows[0].sequence;
  } catch (error) {
    console.error("❌ Error fetching sequence:", error.message);
    return null;
  }
};

// ✅ Fetch flight row
export const getFlightDetails = async (flightNumber) => {
  try {
    const [rows] = await afasDb.execute(
      "SELECT * FROM active_playlist WHERE flight_number = ? LIMIT 1",
      [flightNumber]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("❌ Error fetching flight details:", error.message);
    return null;
  }
};

// ✅ Build the audio clips from placeholders and static entries
export const getAudioFiles = async (sequence, flightDetails, language = "english") => {
  const audioClips = [];

  for (const item of sequence) {
    let audioClip = null;

    if (item.startsWith("*") && item.endsWith("*")) {
      const variable = item.replace(/\*/g, "");
      const value = getMappedValue(variable, flightDetails);

      if (!value) {
        console.warn(`⚠ Missing value for variable: ${variable}`);
        continue;
      }

      if (variable === "IATAFLIGHTNO") {
        for (let digit of value) {
          const clip = await fetchAudioFile("numbers", `${digit}.wav`, language);
          if (clip) audioClips.push(clip);
        }
        continue;
      }

      if (["ETD", "STD"].includes(variable)) {
        const [hh, mm] = value.split(":");
        const timeClips = [
          await fetchAudioFile("numbers", `${hh}.wav`, language),
          await fetchAudioFile("std", "hours.wav", language),
          await fetchAudioFile("numbers", `${mm}.wav`, language),
          await fetchAudioFile("std", "minutes.wav", language),
        ];
        audioClips.push(...timeClips.filter(Boolean));
        continue;
      }

      const category = getCategory(variable);
      const formatted = formatValue(value);
      audioClip = await fetchAudioFile(category, `${formatted}.wav`, language);
    } else {
      // Static STD4, STD10, etc.
      audioClip = await fetchAudioFile("std", item + ".wav", language);
    }

    if (audioClip) audioClips.push(audioClip);
  }

  return audioClips;
};

// ✅ Category logic
const getCategory = (variable) => {
  const categoryMap = {
    IATAAIR: "airline",
    DESTCITY: "cities",
    GATENO: "gate",
    ROWS: "rows",
    ZONENO: "zones",
    ZONELETTER: "zones",
    ETD: "numbers",
    STD: "numbers",
  };
  return categoryMap[variable] || "std";
};

// ✅ Format e.g. "Air India" → "air_india"
const formatValue = (value) =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/gi, "");

// ✅ Dynamic variable to actual value mapping
const getMappedValue = (variable, flightDetails) => {
  const map = {
    IATAAIR: flightDetails.airline_name,
    DESTCITY: flightDetails.city_name,
    IATAFLIGHTNO: flightDetails.flight_number,
    ETD: flightDetails.etd || flightDetails.std,
    STD: flightDetails.std || flightDetails.etd,
    GATENO: flightDetails.gate_number,
  };
  return map[variable] || flightDetails[variable];
};
