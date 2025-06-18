import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const afasDb = mysql.createPool({
    host: process.env.AFS_DB_HOST || "localhost",  // ✅ AFAS Database
    user: process.env.AFS_DB_USER || "afas_user",
    password: process.env.AFS_DB_PASS || "Infosoft@123",
    database: process.env.AFS_DB_NAME || "afas",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default afasDb;
