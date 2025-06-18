import express from "express";
import { getLanguages, getAudioFiles, createSchedule, getSchedules, deleteSchedule,announceFlight} from "../controllers/schedular.controller.js";

const router = express.Router();

router.get("/languages", getLanguages); // Get available languages
router.get("/audio-files", getAudioFiles); // Get audio files for a language
router.post("/", createSchedule); // Create a new schedule
router.get("/", getSchedules); // Get all schedules
router.delete("/:id", deleteSchedule); // Delete a schedule
router.post("/announce", announceFlight);

export default router;