import express from "express";
import multer from "multer";
import { uploadAudio, getAllAudios, deleteAudio } from "../controllers/upload.controller.js";

const router = express.Router();

// ✅ Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/temp/"); // Temporary storage before renaming
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname); // Keep original filename
    },
  });
const upload = multer({ dest: "uploads/temp" });

router.post("/", upload.single("audio"), uploadAudio);
router.get("/", getAllAudios); // ✅ Ensure this gets `?language=` correctly
router.delete("/:id", deleteAudio);

export default router;
