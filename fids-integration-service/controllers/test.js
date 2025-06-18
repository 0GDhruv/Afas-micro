import { getAnnouncementSequence } from "../services/announcement.service.js";

(async () => {
    const type = "Scheduled";
    const area = "Departure";
    const sequence = await getAnnouncementSequence(type, area);
    console.log("✅ Result:", sequence);
})();
