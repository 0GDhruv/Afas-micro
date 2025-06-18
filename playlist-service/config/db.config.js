import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Infosoft@123",
  database: process.env.DB_NAME || "afas",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default db;
