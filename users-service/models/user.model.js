import db from "../config/db.config.js";
import bcrypt from "bcryptjs";

export const createUser = async ({ name, email, password, role }) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return db.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, hashedPassword, role]);
};

export const findUserByEmail = async (email) => {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0] || null;
};

export const comparePasswords = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

export const getAllUsers = async () => {
  // ✅ FIXED: Removed "WHERE role != 'admin'" to ensure all users are fetched.
  return db.execute("SELECT id, name, email, role FROM users");
};

export const deleteUser = async (id) => {
  return db.execute("DELETE FROM users WHERE id = ?", [id]);
};

export const getPermissions = async () => {
  // ✅ FIXED: Removed "WHERE u.role != 'admin'" to show permissions for all users.
  return db.execute(`
    SELECT p.id, u.name, u.email, p.page 
    FROM permissions p
    JOIN users u ON p.user_id = u.id
  `);
};

export const getPermissionsByUserId = async (user_id) => {
  return db.execute(`
    SELECT p.id, u.name, u.email, p.page 
    FROM permissions p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
  `, [user_id]);
};

export const setPermissions = async (user_id, pages) => {
  const valuesToInsert = pages.map(page => [user_id, page]);
  return db.query("INSERT IGNORE INTO permissions (user_id, page) VALUES ?", [valuesToInsert]);
};


export const removePermission = async (id) => {
  return db.execute("DELETE FROM permissions WHERE id = ?", [id]);
};

export const getPagesByUser = async (user_id) => {
  const [rows] = await db.execute("SELECT page FROM permissions WHERE user_id = ?", [user_id]);
  return rows.map(r => r.page);
};
