import fidsDb from "../config/fids_db.config.js"; // FIDS Database
import afasDb from "../config/afas_db.config.js"; // AFAS Database
import { getAnnouncementSequence } from "../services/announcement.service.js";

// ✅ Polling function for checking FIDS updates
export const pollFIDSData = async () => {
  try {
    console.log("🔄 Polling FIDS database for flight updates...");

    // ✅ Fetch all flight statuses dynamically from AFT table
    const [rows] = await fidsDb.execute(
      `SELECT DISTINCT t1.*, t2.CityName, t3.AirlineName 
       FROM aft AS t1
       JOIN citymaster AS t2 ON t1.CityIATACode = t2.IATACityCode
       JOIN airlinemaster AS t3 ON t1.IATAAirlineCode = t3.IATAAirlineCode
       WHERE t1.Status IN (SELECT status FROM fids_status)`
    );

    if (rows.length === 0) {
      console.log("✅ No new announcements needed.");
      return;
    }

    for (const flight of rows) {
      console.log(`✈ Processing Flight: ${flight.FlightCode}, Status: ${flight.Status}, Gate: ${flight.GateBelt}`);

      // ✅ Determine announcement type based on flight status
      const announcementType = mapFlightStatusToAnnouncement(flight.Status, flight.ArrDepFlag);
      if (!announcementType) {
        console.log(`⚠ No announcement mapping found for status: ${flight.Status}`);
        continue;
      }

      // ✅ Fetch predefined announcement sequence from Script Manager
      const sequence = await getAnnouncementSequence(announcementType);
      if (!sequence) {
        console.log(`⚠ No sequence found for announcement type: ${announcementType}`);
        continue;
      }

      // ✅ Convert FlightDate to MySQL DATE format
      const flightDate = new Date(flight.FlightDate * 1000).toISOString().split("T")[0];

      // ✅ Check if flight already exists in playlist
      const [existing] = await afasDb.execute(
        `SELECT id, status, flight_date, row_update_date FROM playlist 
         WHERE flight_code = ? AND arr_dep_flag = ? LIMIT 1`,
        [flight.FlightCode, flight.ArrDepFlag]
      );

      const newStatus = mapPlaylistStatus(flight.Status); // ✅ Map status correctly
      const playlistEntry = {
        flight_code: flight.FlightCode,
        flight_number: flight.FlightNumber,
        gate_number: flight.GateBelt || null,
        announcement_type: announcementType,
        sequence,
        status: newStatus,
        created_at: new Date().toISOString(),
        city_name: flight.CityName,
        airline_name: flight.AirlineName,
        language: null,
        flight_date: flightDate,
        row_update_date: flight.RowUpdateDate, // ✅ Store last update time
        arr_dep_flag: flight.ArrDepFlag,
        std: flight.STASTD || null,
        etd: flight.ETAETD || null
      };

      if (existing.length > 0) {
        // ✅ Flight exists → Only update if RowUpdateDate has changed
        if (existing[0].row_update_date < flight.RowUpdateDate) {
          console.log(`🔄 Updating playlist entry for Flight ${flight.FlightCode} with status: ${newStatus}`);
          await afasDb.execute(
            `UPDATE playlist SET 
              gate_number = ?, 
              announcement_type = ?, 
              sequence = ?, 
              status = ?, 
              created_at = CURRENT_TIMESTAMP, 
              city_name = ?, 
              airline_name = ?, 
              language = ?,
              flight_date = ?,
              row_update_date = ?,
              arr_dep_flag = ?,
              std = ?,
              etd = ?
            WHERE flight_code = ? AND arr_dep_flag = ?`,
            [
              playlistEntry.gate_number,
              playlistEntry.announcement_type,
              JSON.stringify(playlistEntry.sequence),
              playlistEntry.status,
              playlistEntry.city_name,
              playlistEntry.airline_name,
              playlistEntry.language,
              playlistEntry.flight_date,
              playlistEntry.row_update_date,
              playlistEntry.arr_dep_flag,
              playlistEntry.std,
              playlistEntry.etd,
              playlistEntry.flight_code,
              playlistEntry.arr_dep_flag
            ]
          );
        }
      } else {
        // ✅ Flight does not exist → Insert new entry
        console.log(`📢 Adding new announcement for Flight ${flight.FlightCode} with status: ${newStatus}`);
        await afasDb.execute(
          `INSERT INTO playlist (flight_code, flight_number, gate_number, announcement_type, sequence, status, created_at, city_name, airline_name, language, flight_date, row_update_date, arr_dep_flag, std, etd) 
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            playlistEntry.flight_code,
            playlistEntry.flight_number,
            playlistEntry.gate_number,
            playlistEntry.announcement_type,
            JSON.stringify(playlistEntry.sequence),
            playlistEntry.status,
            playlistEntry.city_name,
            playlistEntry.airline_name,
            playlistEntry.language,
            playlistEntry.flight_date,
            playlistEntry.row_update_date,
            playlistEntry.arr_dep_flag,
            playlistEntry.std,
            playlistEntry.etd
          ]
        );
      }
    }
  } catch (error) {
    console.error("❌ Error polling FIDS data:", error.message);
  }
};


// ✅ Map flight statuses to predefined announcement types
const mapFlightStatusToAnnouncement = (status, arrDepFlag) => {
  const statusMap = {
    "Scheduled": { "1": "arrival scheduled", "2": "departure scheduled" },
    "Arrived": { "1": "arrival arrived", "2": null },
    "Departed": { "1": null, "2": "departure departed" },
    "Diverted": { "1": "arrival diverted", "2": "departure diverted" },
    "Boarding": { "2": "departure boarding all passengers" },
    "Check IN": { "2": "departure check-in" },
    "Final Boarding": { "2": "departure boarding final call" },
    "Cancelled": { "1": "arrival cancelled", "2": "departure cancelled" },
    "Rescheduled": { "1": "arrival rescheduled", "2": "departure rescheduled" },
    "Gate Closed": { "2": "departure gate closed" },
    "On Time": { "1": "arrival on time", "2": "departure on time" },
    "Delayed": { "1": "arrival delayed", "2": "departure delayed" }
  };

  return statusMap[status]?.[arrDepFlag] || null;
};

// ✅ Map playlist status correctly
const mapPlaylistStatus = (fidsStatus) => {
  const statusMap = {
      "Scheduled": "Scheduled",
      "Arrived": "Arrived",
      "Departed": "Completed",
      "Diverted": "Diverted",
      "Boarding": "Boarding",
      "Check IN": "In Progress",
      "Final Boarding": "In Progress",
      "Cancelled": "Cancelled",
      "Rescheduled": "Scheduled",
      "Gate Closed": "Closed",
      "On Time": "Scheduled",
      "Postponed": "Postponed",
      "Preponed": "Scheduled",
      "Indefinite": "Delayed",
      "Additional": "Scheduled",
      "Expected": "Scheduled",
      "Delayed": "Delayed",
      "Security": "Security"
  };

  const cleanStatus = fidsStatus.trim(); // Remove any trailing spaces
  if (!statusMap[cleanStatus]) {
      console.error(`⚠ Invalid status received: ${cleanStatus}`);
      return "Scheduled"; // Default value to prevent errors
  }
  
  return statusMap[cleanStatus];
};



