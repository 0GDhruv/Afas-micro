// logs-service/controllers/logs.controller.js
import db from "../config/db.config.js";

// ... createLogEntry remains the same ...
export const createLogEntry = async (req, res) => {
  const {
    service_name,
    log_type,
    message,
    flight_number = null,
    language = null,
    details = null, 
  } = req.body;

  if (!service_name || !log_type || !message) {
    return res.status(400).json({
      message: "Missing required fields: service_name, log_type, and message are required.",
    });
  }

  try {
    const detailsJson = details ? JSON.stringify(details) : null;

    const [result] = await db.execute(
      "INSERT INTO afas_logs (service_name, log_type, flight_number, language, message, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [service_name, log_type, flight_number, language, message, detailsJson]
    );
    res.status(201).json({ id: result.insertId, message: "Log entry created successfully." });
  } catch (error) {
    console.error("Error creating log entry:", error.message, error.stack);
    res.status(500).json({ message: "Failed to create log entry due to a server error." });
  }
};


export const getLogEntries = async (req, res) => {
  const {
    log_type,
    service_name,
    flight_number,
    startDate, 
    endDate,   
    page = 1,  
    limit = 20, 
  } = req.query;

  let baseQuery = "FROM afas_logs";
  const conditions = [];
  const paramsForWhere = []; 

  if (log_type) { conditions.push("log_type = ?"); paramsForWhere.push(log_type); }
  if (service_name) { conditions.push("service_name = ?"); paramsForWhere.push(service_name); }
  if (flight_number && flight_number.trim() !== "") {
    conditions.push("flight_number LIKE ?"); paramsForWhere.push(`%${flight_number.trim()}%`);
  }
  if (startDate) { conditions.push("DATE(timestamp) >= ?"); paramsForWhere.push(startDate); }
  if (endDate) { conditions.push("DATE(timestamp) <= ?"); paramsForWhere.push(endDate); }

  let whereClause = "";
  if (conditions.length > 0) {
    whereClause = " WHERE " + conditions.join(" AND ");
  }

  const countQuery = "SELECT COUNT(*) as total " + baseQuery + whereClause;
  
  let dataQuery = "SELECT id, DATE_FORMAT(timestamp, '%Y-%m-%d %H:%i:%s') as formatted_timestamp, timestamp as original_timestamp, service_name, log_type, flight_number, language, message, details " +
                  baseQuery + whereClause + " ORDER BY timestamp DESC";

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const offset = (pageNum - 1) * limitNum;
  
  const paginatedDataQuery = dataQuery + " LIMIT ? OFFSET ?";
  const paramsForDataQuery = [...paramsForWhere, limitNum, offset];

  console.log("DEBUG: Count Query:", countQuery);
  console.log("DEBUG: Count Params:", JSON.stringify(paramsForWhere));
  console.log("DEBUG: Paginated Data Query:", paginatedDataQuery);
  console.log("DEBUG: Paginated Data Params:", JSON.stringify(paramsForDataQuery));


  try {
    const [countResult] = await db.execute(countQuery, paramsForWhere);
    const totalLogs = countResult[0].total;

    const [logs] = await db.execute(paginatedDataQuery, paramsForDataQuery); // This is line 101 from your error
    
    const parsedLogs = logs.map(log => {
        // Use formatted_timestamp, but keep original_timestamp if needed for other operations
        const displayTimestamp = log.formatted_timestamp || new Date(log.original_timestamp).toLocaleString();
        let parsedDetails = log.details;
        if (log.details && typeof log.details === 'string') {
            try {
                parsedDetails = JSON.parse(log.details);
            } catch (e) {
                console.warn(`Could not parse JSON details for log ID ${log.id}:`, log.details);
                parsedDetails = { raw_details: log.details }; 
            }
        }
        return { ...log, timestamp: displayTimestamp, details: parsedDetails };
    });

    res.status(200).json({
      logs: parsedLogs,
      currentPage: pageNum,
      totalPages: Math.ceil(totalLogs / limitNum),
      totalLogs,
    });
  } catch (error) {
    console.error("Error retrieving log entries:", error.message, error.stack);
    res.status(500).json({ message: "Failed to retrieve log entries due to a server error.", errorDetails: error.message });
  }
};
