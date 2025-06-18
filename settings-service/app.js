// settings-service/app.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
// import path from "path"; // Only if serving static files from here, which is not typical for a settings microservice
// import { fileURLToPath } from "url"; // Only if using __dirname for static files

import settingsRoutes from "./routes/settings.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.SETTINGS_SERVICE_PORT || 4010; // Use a specific env var for port

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({ origin: "*" })); // Configure CORS appropriately for your environment
app.use(express.json()); // To parse JSON request bodies
// app.use(express.static(path.join(__dirname, "public"))); // Unlikely needed for a settings API service

// API Routes
app.use("/settings", settingsRoutes); // Base path for all settings related routes

// Basic root route for health check or info
app.get("/", (req, res) => {
  res.send("Settings Service is running.");
});

app.listen(PORT, () => {
  console.log(`⚙️ Settings Service running on http://localhost:${PORT}`);
});
