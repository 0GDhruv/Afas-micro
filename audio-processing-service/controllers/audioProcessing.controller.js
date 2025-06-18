import { getAnnouncementSequence, getFlightDetails, getAudioFiles } from "../services/audioFetch.service.js";
import { mergeAudioFiles } from "../services/audioMerge.service.js";

// ✅ Process and Generate Announcement
export const processAnnouncement = async (req, res) => {
    const { flight_number } = req.params;

    const flightDetails = await getFlightDetails(flight_number);
    if (!flightDetails) return res.status(404).json({ message: "Flight not found in playlist." });

    const sequence = await getAnnouncementSequence(flightDetails.announcement_type);
    if (!sequence) return res.status(404).json({ message: "No sequence found." });

    const audioFiles = await getAudioFiles(sequence, flightDetails);
    const finalAudio = await mergeAudioFiles(audioFiles);

    res.json({ message: "Announcement ready", audio_path: finalAudio });
};
