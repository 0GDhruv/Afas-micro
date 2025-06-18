import afasDb from "../config/db.config.js";
import { fetchAudioFile } from "../config/upload-service.config.js";

// ✅ Fetch announcement sequence from Script Manager
export const getAnnouncementSequence = async (announcementType) => {
    try {
        const [rows] = await afasDb.execute(
            "SELECT sequence FROM scripts WHERE announcement_type = ? LIMIT 1",
            [announcementType]
        );
        return rows.length > 0 ? JSON.parse(rows[0].sequence) : null;
    } catch (error) {
        console.error(`❌ Error fetching announcement sequence:`, error.message);
        return null;
    }
};

// ✅ Fetch flight details from Playlist
export const getFlightDetails = async (flightNumber) => {
    try {
        const [rows] = await afasDb.execute(
            "SELECT * FROM playlist WHERE flight_number = ? LIMIT 1",
            [flightNumber]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error(`❌ Error fetching flight details:`, error.message);
        return null;
    }
};

// ✅ Fetch corresponding audio files
export const getAudioFiles = async (sequence, flightDetails) => {
    let audioClips = [];
    
    for (const item of sequence) {
        let audioClip = null;

        if (item.startsWith("*") && item.endsWith("*")) {
            // ✅ Dynamic Audio Values
            let variable = item.replace(/\*/g, ""); // Remove `*` from *IATAAIR*
            let value = flightDetails[variable];

            if (!value) {
                console.warn(`⚠ Missing value for variable: ${variable}`);
                continue;
            }

            // ✅ Special Case: Flight Number (Break into individual digits)
            if (variable === "IATAFLIGHTNO") {
                for (let char of value) {
                    let category = char.match(/\d/) ? "numbers" : "airline";
                    let filename = `${char}.wav`;
                    let clip = await fetchAudioFile(category, filename);
                    if (clip) audioClips.push(clip);
                }
                continue;
            }

            // ✅ Fetch Corresponding Audio
            let category = getCategory(variable);
            audioClip = await fetchAudioFile(category, `${value}.wav`);
        } else {
            // ✅ Static Audio File
            audioClip = await fetchAudioFile("std", `${item}.wav`);
        }

        if (audioClip) audioClips.push(audioClip);
    }

    return audioClips;
};

// ✅ Determine Audio File Category
const getCategory = (variable) => {
    const categoryMap = {
        "IATAAIR": "airline",
        "IATAFLIGHTNO": "numbers",
        "DESTCITY": "cities",
        "GATENO": "gate",
        "ROWS": "rows",
        "ZONENO": "zones",
        "ZONELETTER": "zones",
    };
    return categoryMap[variable] || "std";
};
