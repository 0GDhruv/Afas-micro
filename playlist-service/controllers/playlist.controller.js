import db from "../config/db.config.js";

// Fetch active announcements for the next 1 hour
export const getActiveAnnouncements = async (req, res) => {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:mm format
      const nextTime = new Date(now.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5); // HH:mm format
      const currentDay = now.toLocaleString("en-US", { weekday: "short" }); // Mon, Tue, etc.
  
      console.log("DEBUG: Current time:", currentTime);
      console.log("DEBUG: Next hour:", nextTime);
  
      // Fetch schedules from the database
      const [announcements] = await db.execute(
        `SELECT name, audioId, timing, start_date, end_date, frequency 
         FROM schedules 
         WHERE 
           start_date <= CURDATE() 
           AND end_date >= CURDATE()`
      );
  
      console.log("DEBUG: Fetched schedules from DB:", announcements);
  
      // Process and filter schedules
      const activeAnnouncements = announcements.filter((announcement) => {
        try {
          // Handle timing
          const timings = Array.isArray(announcement.timing)
            ? announcement.timing // Already an array
            : JSON.parse(announcement.timing); // Parse if JSON
  
          // Handle frequency
          const frequency = (() => {
            try {
              return JSON.parse(announcement.frequency); // Parse if JSON
            } catch {
              return announcement.frequency; // Use as-is if not JSON
            }
          })();
  
          console.log("DEBUG: Timings:", timings);
          console.log("DEBUG: Frequency:", frequency);
  
          // Check if the current time is within the next hour
          const isInTimeRange = timings.some((time) => time >= currentTime && time <= nextTime);
          const isValidDay = frequency === "all" || frequency.includes(currentDay);
  
          console.log("DEBUG: isInTimeRange:", isInTimeRange, "isValidDay:", isValidDay);
          return isInTimeRange && isValidDay;
        } catch (err) {
          console.error(`DEBUG: Error processing schedule '${announcement.name}':`, err.message);
          return false; // Skip invalid schedules
        }
      });
  
      console.log("DEBUG: Active announcements:", activeAnnouncements);
  
      // Format the response
      const response = activeAnnouncements.map((announcement, index) => ({
        id: index + 1,
        name: announcement.name,
        time: Array.isArray(announcement.timing)
          ? announcement.timing.find((time) => time >= currentTime && time <= nextTime)
          : JSON.parse(announcement.timing).find((time) => time >= currentTime && time <= nextTime),
        sequence: 1, // Placeholder for future logic
      }));
  
      console.log("DEBUG: Response to frontend:", response);
      res.json(response);
    } catch (err) {
      console.error("DEBUG: Error fetching active announcements:", err.message);
      res.status(500).json({ message: "Database error", error: err.message });
    }
  };
  
  export const addToPlaylist = async (req, res) => {
    const { flight_number, gate_number, announcement_type, sequence, status, timestamp } = req.body;
  
    if (!flight_number || !announcement_type || !sequence || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }
  
    try {
      // ✅ Convert ISO Timestamp to MySQL format (YYYY-MM-DD HH:MM:SS)
      const mysqlTimestamp = new Date(timestamp).toISOString().slice(0, 19).replace("T", " ");
  
      await db.execute(
        `INSERT INTO playlist (flight_number, gate_number, announcement_type, sequence, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         gate_number = VALUES(gate_number), 
         announcement_type = VALUES(announcement_type), 
         sequence = VALUES(sequence), 
         status = VALUES(status), 
         created_at = VALUES(created_at)`,
        [flight_number, gate_number || null, announcement_type, JSON.stringify(sequence), status, mysqlTimestamp]
      );
  
      res.status(201).json({ message: "Announcement added to playlist successfully." });
    } catch (error) {
      console.error("❌ Error adding to playlist:", error.message);
      res.status(500).json({ message: "Database error", error: error.message });
    }
  };
  
