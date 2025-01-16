import express from "express";
import multer from "multer";
import { uploadAudio, getAllAudios, deleteAudio } from "../controllers/upload.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/temp" });

router.post("/", upload.single("audio"), uploadAudio);
router.get("/", getAllAudios);
router.delete("/:id", deleteAudio);

export default router;
