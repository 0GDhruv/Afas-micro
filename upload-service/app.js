// upload-service/app.js
import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import uploadRoutes from "./routes/upload.routes.js";

dotenv.config();
const app = express();
const __dirname = path.resolve();

// ✅ Enable CORS for all origins (or restrict to frontend later)
app.use(cors());

// Serve static assets
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/upload", uploadRoutes);

// Serve available languages
app.get("/languages", (req, res) => {
  const uploadDir = path.join(__dirname, "uploads");
  try {
    if (!fs.existsSync(uploadDir)) return res.json([]);
    const languages = fs.readdirSync(uploadDir).filter(item =>
      fs.statSync(path.join(uploadDir, item)).isDirectory()
    );
    res.json(languages);
  } catch (err) {
    console.error("❌ Error fetching languages:", err.message);
    res.status(500).json({ message: "Error fetching languages", error: err.message });
  }
});

// List audio files by language and type
app.get("/audio-files", (req, res) => {
  const { language, type } = req.query;
  if (!language || !type) return res.status(400).json({ message: "Missing parameters" });

  const audioDir = path.join(__dirname, "uploads", language, type);
  if (!fs.existsSync(audioDir)) return res.json([]);

  try {
    const files = fs.readdirSync(audioDir).filter(file =>
      fs.statSync(path.join(audioDir, file)).isFile()
    );
    res.json(files);
  } catch (err) {
    console.error("❌ Error fetching audio files:", err.message);
    res.status(500).json({ message: "Error fetching audio files", error: err.message });
  }
});

// Dynamic audio file serving
app.get("/audio-file", (req, res) => {
  const { category, filename, language } = req.query;
  if (!category || !filename || !language) return res.status(400).json({ message: "Missing query params" });

  const filePath = path.join(__dirname, "uploads", language, category, filename);
  if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

  res.sendFile(filePath);
});

// Expose audio folders
app.use("/audio/english", express.static(path.join(__dirname, "uploads", "english")));

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => console.log(`✅ Upload Service running on http://localhost:${PORT}`));
