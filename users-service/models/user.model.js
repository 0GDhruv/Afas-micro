import db from "../config/db.config.js";

export const createUser = async ({ name, email, password, role }) => {
  return db.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, password, role]);
};

export const getAllUsers = async () => {
  return db.execute("SELECT id, name, email, role FROM users WHERE role != 'admin'");
};

export const deleteUser = async (id) => {
  return db.execute("DELETE FROM users WHERE id = ?", [id]);
};

export const getPermissions = async () => {
  return db.execute(`
    SELECT p.id, u.name, u.email, p.page FROM permissions p
    JOIN users u ON p.user_id = u.id
    WHERE u.role != 'admin'
  `);
};

export const setPermission = async (user_id, page) => {
  return db.execute("INSERT INTO permissions (user_id, page) VALUES (?, ?)", [user_id, page]);
};

export const removePermission = async (id) => {
  return db.execute("DELETE FROM permissions WHERE id = ?", [id]);
};

export const getPagesByUser = async (user_id) => {
  const [rows] = await db.execute("SELECT page FROM permissions WHERE user_id = ?", [user_id]);
  return rows.map(r => r.page);
};
