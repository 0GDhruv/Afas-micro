import express from "express";
import { getActiveAnnouncements } from "../controllers/playlist.controller.js";

const router = express.Router();

// Route to fetch active announcements
router.get("/active", getActiveAnnouncements);

export default router;
