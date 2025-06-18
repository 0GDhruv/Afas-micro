import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Infosoft@123",
  database: process.env.DB_NAME || "afas",
  namedPlaceholders: true,
  rowsAsArray: false,
  typeCast: function (field, next) {
    if (field.type === "JSON") {
      return field.string("utf8"); // ✅ Recommended encoding
    }
    return next();
  },
});


export default db;
