import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * This script creates the initial admin user in the database if one doesn't already exist.
 * It's designed to be run once during the initial setup of the application.
 */
const seedAdminUser = async () => {
  let connection;
  try {
    // --- Database Connection ---
    console.log("Connecting to the database...");
    connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD, // Assumes DB_PASS is correct in your .env
        database: process.env.DB_NAME,
    });
    console.log("✅ Database connected successfully.");

    // --- Check for Existing Admin ---
    console.log("Checking for existing admin user...");
    const [existingAdmins] = await connection.execute(
        "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    if (existingAdmins.length > 0) {
        console.log("✅ An admin user already exists. No action needed.");
        return;
    }

    // --- Create New Admin User ---
    console.log("No admin user found. Creating a new one...");
    
    const adminEmail = "admin@idds.in";
    const plainPassword = "admin@123"; // A temporary, secure password

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Insert into database
    await connection.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        ["Admin", adminEmail, hashedPassword, "admin"]
    );

    console.log("\n🎉 Admin user created successfully! 🎉");
    console.log("========================================");
    console.log("You can now log in with these credentials:");
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${plainPassword}`);
    console.log("========================================");
    console.log("\nRECOMMENDATION: Please log in and change this password immediately.");

  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\nDatabase connection closed.");
    }
  }
};

// Run the seeder function
seedAdminUser();
