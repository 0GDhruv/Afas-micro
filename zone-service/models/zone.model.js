import db from "../config/db.config.js";

export const getAllZones = () =>
  db.execute(`
    SELECT az.id, at.type AS announcement_type, az.zone_name AS zone
    FROM announcement_zones az
    JOIN announcement_types at ON az.announcement_type_id = at.id
  `);

export const getAnnouncementTypes = () =>
  db.execute(`SELECT id, type FROM announcement_types`);

export const getDistinctZones = () =>
  db.execute(`SELECT DISTINCT zone_name AS zone FROM announcement_zones`);

export const addZoneMapping = (announcement_type_id, zone_name) =>
  db.execute("INSERT INTO announcement_zones (announcement_type_id, zone_name) VALUES (?, ?)", [announcement_type_id, zone_name]);

export const deleteZoneMapping = (id) =>
  db.execute("DELETE FROM announcement_zones WHERE id = ?", [id]);
