import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", userRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/html/users.html"));
});

const PORT = process.env.PORT || 4016;
app.listen(PORT, () => {
  console.log(`✅ Users Service running at http://localhost:${PORT}`);
});
