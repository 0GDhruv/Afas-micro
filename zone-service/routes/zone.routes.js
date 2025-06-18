import express from "express";
import {
  getZones,
  getTypes,
  addMapping,
  deleteMapping,
  getZonesList
} from "../controllers/zone.controller.js";

const router = express.Router();

router.get("/mappings", getZones);
router.get("/types", getTypes);
router.get("/zones", getZonesList);
router.post("/mappings", addMapping);
router.delete("/mappings/:id", deleteMapping);

export default router;
