// fids-integration-service/controllers/fids.controller.js
import fidsDb from "../config/fids_db.config.js";
import afasDb from "../config/afas_db.config.js";
import { getAnnouncementSequence } from "../services/announcement.service.js"; // Assuming this service calls script-manager
import axios from "axios";

const LOGS_SERVICE_URL = process.env.LOGS_SERVICE_URL || "http://localhost:4025/api/logs";
const SERVICE_NAME = "FIDSIntegrationService";

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

export const pollFIDSData = async () => {
  console.log(`🔄 ${SERVICE_NAME}: Polling FIDS database for flight updates...`);
  sendToLogsService({ log_type: "FIDS_POLL_START", message: "Polling FIDS database." });
  try {
    const [rows] = await fidsDb.execute(
      `SELECT DISTINCT t1.*, t2.CityName, t3.AirlineName 
       FROM aft AS t1
       JOIN citymaster AS t2 ON t1.CityIATACode = t2.IATACityCode
       JOIN airlinemaster AS t3 ON t1.IATAAirlineCode = t3.IATAAirlineCode`
    );

    if (rows.length === 0) {
      console.log(`✅ ${SERVICE_NAME}: No new flight data from FIDS.`);
      // sendToLogsService({ log_type: "FIDS_POLL_INFO", message: "No new flight data from FIDS." });
      return;
    }
    sendToLogsService({ log_type: "FIDS_POLL_DATA_RECEIVED", message: `Received ${rows.length} flight entries from FIDS.` });

    const [announcementTypes] = await afasDb.execute(`SELECT type, area FROM announcement_types`);
    const announcementMap = {};
    announcementTypes.forEach(({ type, area }) => { announcementMap[type] = area; });

    for (const flight of rows) {
      const logContext = { flight_number: flight.FlightCode, details: { fids_status: flight.Status, arr_dep: flight.ArrDepFlag } };
      const area = flight.ArrDepFlag === 1 ? "Arrival" : "Departure";
      const announcementType = mapFlightStatusToAnnouncement(flight.Status, flight.ArrDepFlag, announcementMap);

      if (!announcementType) {
        sendToLogsService({ ...logContext, log_type: "WARNING", message: `No announcement mapping for FIDS status: ${flight.Status}` });
        continue;
      }
      const sequence = await getAnnouncementSequence(announcementType, area); // This calls script-manager
      if (!sequence) {
        sendToLogsService({ ...logContext, log_type: "WARNING", message: `No script sequence found for type: ${announcementType} in area: ${area}` });
        continue;
      }

      const flightDateIST = new Date((flight.FlightDate + 19800) * 1000);
      const flightDate = flightDateIST.toISOString().split("T")[0];

      const [existing] = await afasDb.execute(
        `SELECT id, status, flight_date, row_update_date FROM playlist 
         WHERE flight_code = ? AND arr_dep_flag = ? LIMIT 1`,
        [flight.FlightCode, flight.ArrDepFlag]
      );

      const newStatus = mapPlaylistStatus(flight.Status);
      const playlistEntry = {
        flight_code: flight.FlightCode, flight_number: flight.FlightNumber,
        gate_number: flight.GateBelt || null, announcement_type: announcementType,
        sequence, status: newStatus, city_name: flight.CityName, airline_name: flight.AirlineName,
        flight_date: flightDate, row_update_date: flight.RowUpdateDate, arr_dep_flag: flight.ArrDepFlag,
        std: flight.STASTD || null, etd: flight.ETAETD || null
      };

      if (existing.length > 0) {
        if (existing[0].row_update_date < flight.RowUpdateDate) {
          await afasDb.execute(
            `UPDATE playlist SET gate_number = ?, announcement_type = ?, sequence = ?, status = ?, 
             city_name = ?, airline_name = ?, flight_date = ?, row_update_date = ?, 
             std = ?, etd = ? WHERE flight_code = ? AND arr_dep_flag = ?`,
            [playlistEntry.gate_number, playlistEntry.announcement_type, JSON.stringify(playlistEntry.sequence),
             playlistEntry.status, playlistEntry.city_name, playlistEntry.airline_name, playlistEntry.flight_date,
             playlistEntry.row_update_date, playlistEntry.std, playlistEntry.etd, playlistEntry.flight_code, playlistEntry.arr_dep_flag]
          );
          sendToLogsService({ ...logContext, log_type: "FLIGHT_DATA_UPDATED", message: `Updated flight in AFAS playlist. New status: ${newStatus}`, details: { new_fids_row_update_date: flight.RowUpdateDate } });
        } else {
            // console.log(`Flight ${flight.FlightCode} already up-to-date in AFAS playlist.`);
        }
      } else {
        await afasDb.execute(
          `INSERT INTO playlist (flight_code, flight_number, gate_number, announcement_type, sequence, status, city_name, airline_name, flight_date, row_update_date, arr_dep_flag, std, etd, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [playlistEntry.flight_code, playlistEntry.flight_number, playlistEntry.gate_number, playlistEntry.announcement_type,
           JSON.stringify(playlistEntry.sequence), playlistEntry.status, playlistEntry.city_name, playlistEntry.airline_name,
           playlistEntry.flight_date, playlistEntry.row_update_date, playlistEntry.arr_dep_flag, playlistEntry.std, playlistEntry.etd]
        );
        sendToLogsService({ ...logContext, log_type: "FLIGHT_DATA_ADDED", message: `Added new flight to AFAS playlist. Status: ${newStatus}`, details: { fids_row_update_date: flight.RowUpdateDate } });
      }
    }
    sendToLogsService({ log_type: "FIDS_POLL_SUCCESS", message: "FIDS data polling and processing complete." });
  } catch (error) {
    console.error(`❌ ${SERVICE_NAME} Error polling FIDS data:`, error.message, error.stack);
    sendToLogsService({ log_type: "ERROR", message: `Error polling FIDS data: ${error.message}` });
  }
};

// Helper functions (mapFlightStatusToAnnouncement, mapPlaylistStatus) remain the same
const mapFlightStatusToAnnouncement = (status, arrDepFlag, announcementMap) => {
  let area = arrDepFlag === 1 ? "Arrival" : "Departure";
  const lowerStatus = status.trim().toLowerCase();
  if (lowerStatus === "arrived") area = "Arrival";
  const statusMap = {
    "scheduled": { "Arrival": "Scheduled", "Departure": "Scheduled" }, "arrived": { "Arrival": "Arrived" },
    "departed": { "Departure": "Departed" }, "diverted": { "Arrival": "Diverted", "Departure": "Diverted" },
    "boarding": { "Departure": "Boarding" }, "check in": { "Departure": "Check IN" },
    "final boarding": { "Departure": "Final Boarding Call" }, "cancelled": { "Arrival": "Cancelled", "Departure": "Cancelled" },
    "rescheduled": { "Arrival": "Rescheduled", "Departure": "Rescheduled" }, "gate closed": { "Departure": "Gate Closed" },
    "on time": { "Arrival": "On Time", "Departure": "On Time" }, "delayed": { "Arrival": "Delayed", "Departure": "Delayed" }
  };
  const mappedType = statusMap[lowerStatus]?.[area];
  if (!mappedType || !announcementMap[mappedType]) return null;
  return mappedType;
};

const mapPlaylistStatus = (fidsStatus) => {
  const statusMap = {
    "Scheduled": "Scheduled", "Arrived": "Arrived", "Departed": "Completed", "Diverted": "Diverted",
    "Boarding": "Boarding", "Check IN": "In Progress", "Final Boarding": "In Progress", "Cancelled": "Cancelled",
    "Rescheduled": "Scheduled", "Gate Closed": "Closed", "On Time": "Scheduled", "Postponed": "Postponed",
    "Preponed": "Scheduled", "Indefinite": "Delayed", "Additional": "Scheduled", "Expected": "Scheduled",
    "Delayed": "Delayed", "Security": "Security"
  };
  return statusMap[fidsStatus.trim()] || "Scheduled";
};
