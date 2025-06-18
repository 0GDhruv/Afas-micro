// tts-service/routes/tts.routes.js
import express from "express";
import { synthesizeText } from "../controllers/tts.controller.js";

const router = express.Router();

/**
 * @route   POST /api/tts/synthesize
 * @desc    Convert text to speech
 * @access  Public (or add auth middleware if needed)
 */
router.post("/synthesize", synthesizeText);

export default router;
