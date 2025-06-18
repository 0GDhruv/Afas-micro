import {
  getAllZones,
  getAnnouncementTypes,
  addZoneMapping,
  deleteZoneMapping,
  getDistinctZones
} from "../models/zone.model.js";
import db from "../config/db.config.js";

export const getZones = async (req, res) => {
  const [rows] = await getAllZones();
  res.json(rows);
};

export const getTypes = async (req, res) => {
  const [rows] = await getAnnouncementTypes();
  res.json(rows);
};

export const getZonesList = async (req, res) => {
  const [rows] = await getDistinctZones();
  res.json(rows);
};

export const addMapping = async (req, res) => {
  const { zone, announcement_type } = req.body;
  const [types] = await getAnnouncementTypes();
  const type = types.find(t => t.type === announcement_type);
  if (!type) return res.status(400).json({ message: "Invalid type" });
  await addZoneMapping(type.id, zone);
  res.status(201).json({ message: "Mapping added" });
};

export const deleteMapping = async (req, res) => {
  const { id } = req.params;
  await deleteZoneMapping(id);
  res.status(204).send();
};
