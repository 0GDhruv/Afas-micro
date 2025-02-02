import express from "express";
import path from "path";
import dotenv from "dotenv";
import schedulerRoutes from "./routes/schedular.routes.js";
import { executeSchedules } from "./controllers/schedular.controller.js";


// Load environment variables
dotenv.config();

const app = express();
const __dirname = path.resolve();

// Middleware to parse JSON
app.use(express.json());

// Run the schedule executor every minute
setInterval(() => {
  console.log("Checking for schedules...");
  executeSchedules();
}, 60000); // 60 seconds


// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// API routes for scheduler
app.use("/scheduler", schedulerRoutes);

// Serve the Scheduler HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "scheduler.html"));
});



// Start the server
const PORT = process.env.PORT || 4004;
app.listen(PORT, () => {
  console.log(`Scheduler Service running on http://localhost:${PORT}`);
});