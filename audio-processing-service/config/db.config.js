import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const afasDb = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "afas_user",
    password: process.env.DB_PASSWORD || "Infosoft@123",
    database: process.env.DB_NAME || "afas",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export default afasDb;
