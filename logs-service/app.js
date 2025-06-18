// logs-service/app.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import logRoutes from "./routes/logs.routes.js";
import db from "./config/db.config.js"; // Import to test connection or for other direct DB ops if needed

dotenv.config(); // Load .env variables
const app = express();
const PORT = process.env.PORT || 4025;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" })); // Configure CORS appropriately for your environment
app.use(express.json()); // To parse JSON request bodies

// API Routes
app.use("/api/logs", logRoutes); // Base path for all log-related routes

// Root endpoint for health check or service info
app.get("/", (req, res) => {
  res.status(200).json({ 
      service: "AFAS Logging Service",
      status: "Operational",
      timestamp: new Date().toISOString()
    });
});
        
// Global error handler (basic example)
app.use((err, req, res, next) => {
    console.error("Unhandled Error in Logs Service:", err.stack);
    if (!res.headersSent) { // Avoid sending response if headers are already sent
        res.status(500).json({ message: "An unexpected server error occurred in Logs Service." });
    }
});

const startServer = async () => {
  try {
    // Test DB connection on startup (optional but good practice)
    const connection = await db.getConnection();
    console.log("Successfully connected to the database for Logs Service.");
    connection.release(); // Release the connection back to the pool

    app.listen(PORT, () => {
      console.log(`📝 Logs Service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start Logs Service or connect to database:", error);
    process.exit(1); // Exit if DB connection fails, as the service is not usable
  }
};

startServer();
