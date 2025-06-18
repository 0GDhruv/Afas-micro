import express from "express";
import { pollFIDSData } from "../controllers/fids.controller.js";

const router = express.Router();

// ✅ Manually trigger FIDS polling (for debugging)
router.get("/poll", async (req, res) => {
  await pollFIDSData();
  res.json({ message: "FIDS polling triggered manually." });
});

export default router;
