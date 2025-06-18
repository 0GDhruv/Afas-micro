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

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Enable CORS for All Routes
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ API Routes
app.use("/announcementtype", announcementTypeRoutes);
app.use("/scriptmanager", scriptManagerRoutes);

// ✅ Serve `announcementtype.html` when visiting `/announcementtype`
app.get("/announcementtype", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "announcementtype.html"));
});

// ✅ Serve `scriptmanager.html` when visiting `/scriptmanager`
app.get("/scriptmanager", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "scriptmanager.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Script Manager Service running on http://localhost:${PORT}`);
});
