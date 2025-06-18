import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import schedulerRoutes from "./routes/schedular.routes.js";
import { executeSchedules } from "./controllers/schedular.controller.js";

dotenv.config();
const app = express();
const __dirname = path.resolve();

app.use(cors()); // 🔥 Enable CORS
app.use(express.json());
app.use("/scheduler", schedulerRoutes);

setInterval(() => {
  console.log("Checking for schedules...");
  executeSchedules();
}, 60000); // Every 60s

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => {
  console.log(`✅ Scheduler Service running on http://localhost:${PORT}`);
});
