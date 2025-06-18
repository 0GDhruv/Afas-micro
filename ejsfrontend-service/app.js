import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";
import ejsLayouts from "express-ejs-layouts";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup view engine and layouts
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(ejsLayouts);

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => res.redirect("/dashboard"));

app.get("/dashboard", async (req, res) => {
  try {
    const { data: announcements } = await axios.get("http://localhost:4005/playlist/active");
    res.render("pages/dashboard", {
      layout: "partials/layout",
      title: "Dashboard | AFAS",
      script: "dashboard.js",
      announcements
    });
  } catch (err) {
    console.error("❌ Error loading dashboard:", err.message);
    res.render("pages/dashboard", {
      layout: "partials/layout",
      title: "Dashboard | AFAS",
      script: "dashboard.js",
      announcements: []
    });
  }
});

// Other pages
const pages = ["upload", "scheduler", "announcement-type", "sequence", "zones", "settings", "audio-type"];
pages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.render(`pages/${page}`, {
      layout: "partials/layout",
      title: `${page} | AFAS`,
      script: `${page}.js`
    });
  });
});

const PORT = process.env.PORT || 4015;
app.listen(PORT, () => console.log(`✅ Frontend running at http://localhost:${PORT}`));
