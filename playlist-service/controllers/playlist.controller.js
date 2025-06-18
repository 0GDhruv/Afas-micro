import db from "../config/db.config.js";

// ✅ Function to Get Indian Standard Time (IST)
const getISTTime = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};

// ✅ Function to Move Flights & Scheduled Messages to `active_playlist`
export const trackFlightUpdates = async () => {
    try {
        console.log("🔄 Tracking flight and scheduled messages updates...");

        // ✅ Get current IST time
        const now = getISTTime();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        const currentTime = now.toTimeString().slice(0, 5); // HH:mm IST format
        const nextTime = oneHourLater.toTimeString().slice(0, 5);
        const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD

        console.log(`DEBUG: Checking for announcements between ${currentTime} and ${nextTime} on ${currentDate}`);

        // ✅ Fetch upcoming flights from `playlist`
        const [upcomingFlights] = await db.execute(
            `SELECT id, flight_number, gate_number, announcement_type, status, 
                    TIME_FORMAT(std, '%H:%i') AS std, 
                    TIME_FORMAT(etd, '%H:%i') AS etd, 
                    city_name, airline_name, arr_dep_flag, flight_date 
             FROM playlist 
             WHERE flight_date = ? 
             AND ((TIME_FORMAT(std, '%H:%i') BETWEEN ? AND ?) 
             OR (TIME_FORMAT(etd, '%H:%i') BETWEEN ? AND ?))
             ORDER BY std ASC, etd ASC`,
            [currentDate, currentTime, nextTime, currentTime, nextTime]
        );

        console.log("DEBUG: Flights to be added to active playlist:", upcomingFlights);

        // ✅ Insert/Update Flights in `active_playlist`
        for (const flight of upcomingFlights) {
            const [existing] = await db.execute(
                `SELECT id FROM active_playlist WHERE flight_number = ? AND flight_date = ?`,
                [flight.flight_number, flight.flight_date]
            );

            if (existing.length > 0) {
                console.log(`🔄 Updating flight in active_playlist: ${flight.flight_number}`);
                await db.execute(
                    `UPDATE active_playlist SET 
                        gate_number = ?, announcement_type = ?, status = ?, std = ?, etd = ?, 
                        flight_date = ?, city_name = ?, airline_name = ?, arr_dep_flag = ?, 
                        created_at = NOW()
                    WHERE flight_number = ? AND flight_date = ?`,
                    [
                        flight.gate_number || null, flight.announcement_type, flight.status,
                        flight.std, flight.etd, flight.flight_date, flight.city_name, flight.airline_name,
                        flight.arr_dep_flag, flight.flight_number, flight.flight_date
                    ]
                );
            } else {
                console.log(`📢 Inserting flight into active_playlist: ${flight.flight_number}`);
                await db.execute(
                    `INSERT INTO active_playlist (flight_number, gate_number, announcement_type, status, std, etd, 
                                                  flight_date, city_name, airline_name, arr_dep_flag, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        flight.flight_number, flight.gate_number || null, flight.announcement_type, flight.status,
                        flight.std, flight.etd, flight.flight_date, flight.city_name, flight.airline_name,
                        flight.arr_dep_flag
                    ]
                );
            }
        }

        console.log("✅ Active playlist updated successfully.");
    } catch (err) {
        console.error("❌ Error tracking flight updates:", err.message);
    }
};


// ✅ Run Flight Update Tracker Every 30 Seconds
setInterval(trackFlightUpdates, 30000);

// ✅ Fetch Active Announcements from `active_playlist`
export const getActiveAnnouncements = async (req, res) => {
    try {
        // ✅ Get current IST time
        const now = getISTTime();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        const currentTime = now.toTimeString().slice(0, 5);
        const nextTime = oneHourLater.toTimeString().slice(0, 5);
        const currentDate = now.toISOString().split("T")[0];

        console.log("DEBUG: Fetching active announcements...");

        // ✅ Fetch active flights & scheduled messages from `active_playlist`
        const [announcements] = await db.execute(
            `SELECT id, flight_number, gate_number, announcement_type, status, std, etd, 
                    city_name, airline_name, arr_dep_flag, flight_date 
             FROM active_playlist 
             WHERE flight_date = ? 
             AND ((std BETWEEN ? AND ?) OR (etd BETWEEN ? AND ?))
             ORDER BY std ASC, etd ASC`,
            [currentDate, currentTime, nextTime, currentTime, nextTime]
        );

        console.log("DEBUG: Active Announcements:", announcements);

        // ✅ Format Active Announcements for Response
        const formattedAnnouncements = announcements.map((announcement) => ({
            id: `F-${announcement.id}`,
            announcement_name: `${announcement.announcement_type} (${announcement.arr_dep_flag == 1 ? "Arrival" : "Departure"})`,
            status: announcement.status,
            flight_code: announcement.flight_number,
            airline_name: announcement.airline_name,
            city_name: announcement.city_name,
            gate_number: announcement.gate_number || "--",
            time: announcement.std || announcement.etd,
            sequence: 1,
        }));

        res.json(formattedAnnouncements);
    } catch (err) {
        console.error("❌ Error fetching active announcements:", err.message);
        res.status(500).json({ message: "Database error", error: err.message });
    }
};
