import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const fidsDb = mysql.createPool({
    host: process.env.FIDS_DB_HOST || "192.168.10.145",// ✅ FIDS Server (Ubuntu)
    user: process.env.FIDS_DB_USER || "afas_user",
    password: process.env.FIDS_DB_PASS || "Infosoft@123",
    database: process.env.FIDS_DB_NAME || "fids",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default fidsDb;
