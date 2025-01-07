import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import db from './config/db.config.js';
import authRoutes from './routes/auth.route.js';

dotenv.config();

const app = express();
app.use(express.json());

// Enable CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Test DB connection, then sync models
db.authenticate()
  .then(() => {
    console.log('Auth-service DB connected...');
    // For development only: creates/updates tables if they don't exist
    db.sync().then(() => console.log('Auth-service: All models synced.'));
  })
  .catch((err) => console.error('Error connecting to DB:', err));

// Routes
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Auth-service running on port ${PORT}`);
});
