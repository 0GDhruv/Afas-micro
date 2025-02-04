import express from "express";
import {
  getAnnouncementTypes,
  addAnnouncementType,
  deleteAnnouncementType,
} from "../controllers/announcementtype.controller.js";

const router = express.Router();

router.get("/", getAnnouncementTypes);
router.post("/", addAnnouncementType);
router.delete("/:id", deleteAnnouncementType);

export default router;
