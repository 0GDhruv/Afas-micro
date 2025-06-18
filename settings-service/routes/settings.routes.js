// settings-service/routes/settings.routes.js
import express from "express";
import {
  getConfig,          // For global settings
  updateConfig,       // For global settings
  getFlightConfig,    // For flight-specific settings
  updateFlightConfig  // For flight-specific settings
} from "../controllers/settings.controller.js";

const router = express.Router();

// --- Routes for Global Application Settings ---
// GET /settings - Retrieve global settings
router.get("/", getConfig);
// POST /settings - Save or update global settings
router.post("/", updateConfig);


// --- Routes for Flight-Specific Settings ---
// GET /settings/flight/:flight_number - Retrieve settings for a specific flight
router.get("/flight/:flight_number", getFlightConfig);
// POST /settings/flight/:flight_number - Save or update settings for a specific flight
router.post("/flight/:flight_number", updateFlightConfig);

export default router;
