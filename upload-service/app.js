import express from "express";
import fs from "fs";
import path from "path";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();
const __dirname = path.resolve();

// Serve static files (CSS, JS, HTML) from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Serve the "uploads" directory for uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes for upload
app.use("/upload", uploadRoutes);

// Serve the main upload.html page at the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "upload.html"));
});
app.get("/languages", (req, res) => {
  const uploadDir = path.join(__dirname, "uploads");

  try {
    if (!fs.existsSync(uploadDir)) {
      console.warn("⚠ Uploads directory does not exist.");
      return res.json([]); // ✅ Return empty array
    }

    const languages = fs.readdirSync(uploadDir).filter((item) =>
      fs.statSync(path.join(uploadDir, item)).isDirectory()
    );

    console.log("✅ Available languages:", languages);
    res.json(languages);
  } catch (err) {
    console.error("❌ Error fetching languages:", err.message);
    res.status(500).json({ message: "Error fetching languages", error: err.message });
  }
});


app.get("/audio-files", (req, res) => {
  const { language, type } = req.query; // Get language and type from query params
  if (!language || !type) {
    console.error("🚨 Missing required parameters: language or type");
    return res.status(400).json({ message: "Language and type are required." });
  }

  const audioDir = path.join(__dirname, "uploads", language, type);
  console.log(`🔍 Checking directory: ${audioDir}`);

  try {
    if (!fs.existsSync(audioDir)) {
      console.warn(`⚠ Directory does not exist: ${audioDir}`);
      return res.json([]); // ✅ Return an empty array if folder doesn't exist
    }

    const files = fs.readdirSync(audioDir).filter((file) =>
      fs.statSync(path.join(audioDir, file)).isFile()
    );

    console.log("✅ Audio files found:", files);
    res.json(files);
  } catch (err) {
    console.error("❌ Error fetching audio files:", err.message);
    res.status(500).json({ message: "Error fetching audio files", error: err.message });
  }
});


// Start the server
const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`Upload Service running on port ${PORT}`);
});
