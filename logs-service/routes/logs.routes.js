// logs-service/routes/logs.routes.js
import express from "express";
import { createLogEntry, getLogEntries } from "../controllers/logs.controller.js";

const router = express.Router();

/**
 * @route   POST /api/logs
 * @desc    Create a new log entry.
 * Expects JSON body: { service_name, log_type, message, flight_number?, language?, details? }
 * @access  Private (should be called by other internal services)
 */
router.post("/", createLogEntry);

/**
 * @route   GET /api/logs
 * @desc    Get log entries with filtering and pagination.
 * Query params: ?log_type=&service_name=&flight_number=&startDate=&endDate=&page=&limit=
 * @access  Private (should be accessed by frontend-service with appropriate auth if needed)
 */
router.get("/", getLogEntries);

export default router;
