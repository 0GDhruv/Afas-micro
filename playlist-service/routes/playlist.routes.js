import express from "express";
import { getActiveAnnouncements, addToPlaylist } from "../controllers/playlist.controller.js"; // ✅ Import function

const router = express.Router();

// ✅ Add this missing route
router.post("/", addToPlaylist); // Allows inserting new announcements into the playlist

// ✅ Existing route to fetch active announcements
router.get("/active", getActiveAnnouncements);

export default router;
