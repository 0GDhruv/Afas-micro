import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import playlistRoutes from "./routes/playlist.routes.js";

// Setup for ESM and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4005;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/playlist", playlistRoutes);

// Serve Dashboard HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Playlist Service running on http://localhost:${PORT}`);
});
