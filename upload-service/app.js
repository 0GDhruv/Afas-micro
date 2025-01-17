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
      return res.json([]); // Return an empty array if the directory doesn't exist
    }

    const languages = fs.readdirSync(uploadDir).filter((item) =>
      fs.statSync(path.join(uploadDir, item)).isDirectory()
    );

    res.json(languages);
  } catch (err) {
    console.error("Error fetching languages:", err.message);
    res.status(500).json({ message: "Error fetching languages", error: err.message });
  }
});

app.get("/audio-files", (req, res) => {
  const { language, type } = req.query; // Get language and type from query params
  const audioDir = path.join(__dirname, "uploads", language, type);

  try {
    console.log("Looking for audio files in:", audioDir); // Debug log

    // Check if the directory exists
    if (!fs.existsSync(audioDir)) {
      console.log("Directory does not exist:", audioDir);
      return res.json([]); // Return empty array if folder doesn't exist
    }

    // Get all files in the directory
    const files = fs.readdirSync(audioDir).filter((file) =>
      fs.statSync(path.join(audioDir, file)).isFile()
    );

    console.log("Audio files found:", files); // Debug log
    res.json(files); // Return the list of audio files
  } catch (err) {
    console.error("Error fetching audio files:", err.message);
    res.status(500).json({ message: "Error fetching audio files", error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`Upload Service running on port ${PORT}`);
});
