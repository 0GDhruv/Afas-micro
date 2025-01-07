import bcrypt from 'bcrypt';
import { QueryTypes } from 'sequelize';
import db from './config/db.config.js';

async function createTables() {
  try {
    await db.authenticate();
    console.log('Connected to the database.');

    // Create tables (omitted for brevity)...
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Hard-code an admin username & password to demonstrate
    const adminUsername = 'admin';
    const adminPlainPassword = 'admin';
    const hashedPassword = await bcrypt.hash(adminPlainPassword, 10);

    // Use named parameters in the query:
    await db.query(
      `
        INSERT IGNORE INTO users (username, password)
        VALUES (:username, :password)
      `,
      {
        // Provide values via "replacements"
        replacements: {
          username: adminUsername,
          password: hashedPassword,
        },
        type: QueryTypes.INSERT, // optional but good practice
      }
    );

    console.log('Admin user created (if not existing).');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
