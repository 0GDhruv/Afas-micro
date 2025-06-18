import express from "express";
import { processAnnouncement } from "../controllers/audioProcessing.controller.js";

const router = express.Router();

// ✅ Process and Generate Announcement for a Flight
router.get("/generate/:flight_number", processAnnouncement);

export default router;
