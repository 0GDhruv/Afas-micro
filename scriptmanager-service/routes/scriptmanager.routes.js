import express from "express";
import { getTranscriptions, addScript, getScripts, deleteScript } from "../controllers/scriptmanager.controller.js";

const router = express.Router();

router.get("/transcriptions", getTranscriptions); // ✅ Fetch transcriptions for a sequence
router.post("/scripts", addScript);
router.get("/scripts", getScripts);
router.delete("/scripts/:id", deleteScript);

export default router;
