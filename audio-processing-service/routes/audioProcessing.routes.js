import express from "express";
import { processAnnouncement, markFlightAsAnnounced, getActiveAnnouncements } from "../controllers/audioProcessing.controller.js";

const router = express.Router();

router.get("/generate/:flight_number", processAnnouncement);
router.post("/mark-announced", markFlightAsAnnounced);
router.get("/active", getActiveAnnouncements);

export default router;
