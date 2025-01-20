import express from "express";
import {
  getAnnouncementTypes,
  getAudioFiles,
  addScript,
  getScripts,
} from "../controllers/scriptmanager.controller.js";

const router = express.Router();

router.get("/announcement-types", getAnnouncementTypes);
router.get("/audio-files", getAudioFiles);
router.post("/scripts", addScript);
router.get("/scripts", getScripts);

export default router;
