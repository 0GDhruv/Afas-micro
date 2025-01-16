import express from "express";
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

// Start the server
const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`Upload Service running on port ${PORT}`);
});
