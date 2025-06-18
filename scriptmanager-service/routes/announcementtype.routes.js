import express from "express";
import { 
  getLanguages, 
  getAnnouncementTypes, 
  addAnnouncementType, 
  deleteAnnouncementType 
} from "../controllers/announcementtype.controller.js";

const router = express.Router();

// ✅ Serve the Announcement Type Page
router.get("/", (req, res) => {
  res.sendFile("public/announcementtype.html", { root: process.cwd() });
});

// ✅ Fetch languages from Upload Service (Now at `/languages`)
router.get("/languages", getLanguages);

// ✅ Fetch announcement types for a selected language
router.get("/types", getAnnouncementTypes);

// ✅ Add new announcement type
router.post("/types", addAnnouncementType);

// ✅ Delete announcement type (now requires language as a query param)
router.delete("/types/:type", deleteAnnouncementType);

export default router;
