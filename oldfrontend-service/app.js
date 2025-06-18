import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import exphbs from "express-handlebars";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Register handlebars with layout + helpers
const hbs = exphbs.create({
  extname: ".hbs",
  defaultLayout: "main",
  layoutsDir: path.join(__dirname, "views/layouts"),
  helpers: {
    ifActive: function (page) {
      return (this.title || "").toLowerCase().includes(page) ? "active" : "";
    },
    inc: (value) => parseInt(value) + 1,
    subtract: (a, b) => Math.max(a - b, 0),
    add: (a, b, c = 0) => parseInt(a || 0) + parseInt(b || 0) + parseInt(c || 0),
    times: function (n, block) {
      let accum = '';
      for (let i = 0; i < n; ++i) {
        accum += block.fn(i);
      }
      return accum;
    }
  }
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// ✅ Serve static files (CSS/JS/Assets)
app.use(express.static(path.join(__dirname, "public")));

// ✅ Redirect root to dashboard
app.get("/", (req, res) => res.redirect("/dashboard"));

// ✅ Render Dashboard with data from playlist-service
app.get("/dashboard", async (req, res) => {
  try {
    const { data: announcements } = await axios.get("http://localhost:4005/playlist/active");
    res.render("dashboard", {
      announcements,
      pageScript: "dashboard.js",
      title: "Dashboard | AFAS"
    });
  } catch (err) {
    console.error("❌ Error loading dashboard:", err.message);
    res.render("dashboard", {
      announcements: [],
      pageScript: "dashboard.js",
      title: "Dashboard | AFAS"
    });
  }
});

// ✅ Generic renderer for other frontend pages
const renderPage = (view, script) => (req, res) =>
  res.render(view, { pageScript: script, title: `${view} | AFAS` });

app.get("/upload", renderPage("upload", "upload.js"));
app.get("/scheduler", renderPage("scheduler", "scheduler.js"));
app.get("/announcement-type", renderPage("announcementtype", "announcementtype.js"));
app.get("/sequence", renderPage("sequence", "sequence.js"));
app.get("/zones", renderPage("zones", "zones.js"));
app.get("/settings", renderPage("settings", "settings.js"));
app.get("/audio-type", renderPage("audioType", "audioType.js"));

const PORT = process.env.PORT || 4015;
app.listen(PORT, () => {
  console.log(`✅ Frontend running at http://localhost:${PORT}`);
});
