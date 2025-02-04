import express from "express";
import {
  getTranscription,
  addScript,
  getScripts,
  deleteScript,
} from "../controllers/scriptmanager.controller.js";

const router = express.Router();

router.get("/transcription", getTranscription); // Endpoint to fetch transcription for an audio
router.post("/scripts", addScript); // Endpoint to add a script
router.get("/scripts", getScripts); // Endpoint to fetch scripts
router.delete("/scripts/:id", deleteScript); // Endpoint to delete a script

export default router;
