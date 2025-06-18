import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import audioRoutes from "./routes/audioProcessing.routes.js";

// Load environment variables
dotenv.config();

// Setup Express App
const app = express();
const PORT = process.env.PORT || 4008;

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "output_audio"))); // ✅ Serve merged audio files

// API Routes
app.use("/audio", audioRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Audio Processing Service running on http://localhost:${PORT}`);
});
