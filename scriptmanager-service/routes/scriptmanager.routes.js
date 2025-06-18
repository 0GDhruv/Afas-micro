import express from "express";
import { 
  getTranscriptions, 
  addScript, 
  getScripts, 
  deleteScript, 
  updateScript, 
  getScriptById // ✅ Add this function
} from "../controllers/scriptmanager.controller.js";

const router = express.Router();

router.get("/transcriptions", getTranscriptions);
router.post("/scripts", addScript);
router.get("/scripts", getScripts);
router.get("/scripts/:id", getScriptById); // ✅ Add route to fetch script by ID
router.put("/scripts/:id", updateScript);
router.delete("/scripts/:id", deleteScript);

export default router;
