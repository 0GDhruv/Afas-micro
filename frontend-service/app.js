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

// ✅ Redirect root to the new login page
app.get("/", (req, res) => res.redirect("/login"));

// Serve clean routes without .html for all pages
const pages = [
  "login", // ✅ Added login page
  "dashboard",
  "upload",
  "scheduler",
  "announcement-type",
  "sequence",
  "zones",
  "settings",
  "flight-settings",
  "users",
  "permissions",
  "tts-utility",
  "logs"
];

pages.forEach((page) => {
  app.get(`/${page}`, (req, res) => {
    const filePath = path.join(__dirname, "public", "html", `${page}.html`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`Error sending file ${filePath} for /${page}:`, err.status, err.message);
            if (!res.headersSent) {
                 res.status(err.status || 404).sendFile(path.join(__dirname, "public", "html", "404.html"));
            }
        }
    });
  });
});

// A more generic catch-all for 404s
app.use((req, res, next) => {
    if (!res.headersSent) {
        res.status(404).sendFile(path.join(__dirname, "public", "html", "404.html"), (err) => {
            if (err) {
                res.status(404).send("404: Page Not Found");
            }
        });
    }
});

app.listen(PORT, () => {
  console.log(`✅ Frontend Service running at http://localhost:${PORT}`);
});
