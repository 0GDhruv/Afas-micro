// import express from "express";
// import { getActiveAnnouncements, addToPlaylist } from "../controllers/playlist.controller.js";

// const router = express.Router();

// router.post("/", addToPlaylist);
// router.get("/active", getActiveAnnouncements);

// export default router;


import express from "express";
import { getActiveAnnouncements } from "../controllers/playlist.controller.js";

const router = express.Router();

// ✅ Fetch Active Announcements
router.get("/active", getActiveAnnouncements);

export default router;
