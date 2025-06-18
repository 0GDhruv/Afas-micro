import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fidsRoutes from "./routes/fids.routes.js";
import { pollFIDSData } from "./controllers/fids.controller.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4007;

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.use("/fids", fidsRoutes);

// Start polling every 10 seconds
setInterval(pollFIDSData, 10000);

// Start server
app.listen(PORT, () => {
  console.log(`✅ FIDS Integration Service running on http://localhost:${PORT}`);
});
