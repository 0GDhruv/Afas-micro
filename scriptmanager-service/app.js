import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import announcementTypeRoutes from "./routes/announcementtype.routes.js";
import scriptManagerRoutes from "./routes/scriptmanager.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4006;

// Support for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Enable CORS (required to serve APIs to frontend-service)
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));

// Middleware
app.use(express.json());

// API Routes only — no frontend serving now
app.use("/announcementtype", announcementTypeRoutes);
app.use("/scriptmanager", scriptManagerRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Script Manager Service running on http://localhost:${PORT}`);
});
