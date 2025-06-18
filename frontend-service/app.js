// frontend-service/app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.FRONTEND_SERVICE_PORT || 4015;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (JS, CSS, images) from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Redirect root to dashboard
app.get("/", (req, res) => res.redirect("/dashboard"));

// Serve clean routes without .html for all pages
const pages = [
  "dashboard",
  "upload",
  "scheduler",
  "announcement-type",
  "sequence",
  "zones",
  "settings",        // Global Settings
  "flight-settings", // Individual Flight Settings
  // "audio-type", // Removed as likely redundant with upload categories
  "users",
  "permissions",
  // "zone-selector", // Removed if not a primary page
  "tts-utility",      // New TTS Utility page
  "logs"
];

pages.forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    const filePath = path.join(__dirname, "public", "html", `${page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`Error sending file ${filePath} for /${page}:`, err.status, err.message);
            if (!res.headersSent) {
                 res.status(err.status || 404).send(`Page not found or error serving: ${page}.html`);
            }
        }
    });
  });
});

// A more generic catch-all for 404s if a specific page route isn't matched
app.use((req, res, next) => {
    if (!res.headersSent) {
        res.status(404).sendFile(path.join(__dirname, "public", "html", "404.html"), (err) => {
            // If 404.html doesn't exist, send plain text
            if (err) {
                res.status(404).send("404: Page Not Found");
            }
        });
    }
});

app.listen(PORT, () => {
  console.log(`✅ Frontend Service running at http://localhost:${PORT}`);
});
