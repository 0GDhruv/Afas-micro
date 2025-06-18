// tts-service/app.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import ttsRoutes from "./routes/tts.routes.js";
import { cleanupOldFiles } from "./controllers/tts.controller.js"; // Import for initial cleanup call

dotenv.config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 4020;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" })); // Configure CORS
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Serve static audio files from the 'uploads' directory
const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));
console.log(`Serving static files from: ${uploadsDir}`);


// Serve static files for the TTS test frontend
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));
console.log(`Serving static frontend files from: ${publicDir}`);


// API Routes
app.use("/api/tts", ttsRoutes);

// Simple route for the TTS test page
app.get("/tts-test", (req, res) => {
  res.sendFile(path.join(publicDir, "html", "tts-test.html"));
});

// Root route
app.get("/", (req, res) => {
  res.status(200).json({ message: "TTS Service is running. Visit /tts-test for a simple UI." });
});

// Initial cleanup of old files on startup
cleanupOldFiles().catch(err => console.error("Initial cleanup failed:", err));


app.listen(PORT, () => {
  console.log(`🗣️ TTS Service running on http://localhost:${PORT}`);
  console.log(`🧪 Test TTS frontend available at http://localhost:${PORT}/tts-test`);
});
