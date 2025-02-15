import express from "express";
import { 
  getLanguages, 
  getAnnouncementTypes, 
  addAnnouncementType, 
  deleteAnnouncementType 
} from "../controllers/announcementtype.controller.js";

const router = express.Router();

// ✅ Fetch languages from Upload Service
router.get("/languages", getLanguages);

// ✅ Fetch announcement types for a selected language
router.get("/", getAnnouncementTypes);

// ✅ Add new announcement type
router.post("/", addAnnouncementType);

// ✅ Delete announcement type (now requires language as a query param)
router.delete("/:type", deleteAnnouncementType);

export default router;
