import express from "express";
import {
  getAnnouncementTypes,
  addAnnouncementType,
  getAllAnnouncementTypes,
  deleteAnnouncementType,
} from "../controllers/announcementtype.controller.js";

const router = express.Router();

router.get("/", getAllAnnouncementTypes);
router.get("/by-language", getAnnouncementTypes);
router.post("/", addAnnouncementType);
router.delete("/:id", deleteAnnouncementType);

export default router;
