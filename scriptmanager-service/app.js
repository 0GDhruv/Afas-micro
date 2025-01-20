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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from "public"

// Routes
app.use("/announcementtype", announcementTypeRoutes);
app.use("/scriptmanager", scriptManagerRoutes);

// Serve the default HTML page for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "scriptmanager.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Script Manager Service running on http://localhost:${PORT}`);
});
