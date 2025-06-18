import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import zoneRoutes from "./routes/zone.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4013;

app.use(cors({
  origin: "http://localhost:4015", // frontend-service
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
app.use("/api/zones", zoneRoutes);

// ❌ No static HTML serving here

app.listen(PORT, () => {
  console.log(`✅ Zone Service running on http://localhost:${PORT}`);
});
