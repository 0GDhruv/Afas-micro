import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/user.route.js';
import db from './config/db.config.js';
// import cors from 'cors';

dotenv.config();
const app = express();
app.use(express.json());


// Enable CORS
// app.use(
//     cors({
//       origin: '*',
//       methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     })
//   );

// Connect DB
db.authenticate()
  .then(() => {
    console.log('User-service DB connected...');
    // Optionally: db.sync({ alter: true }) or run migrations
  })
  .catch(err => console.error('DB connection error:', err));

// Routes
app.use('/users', userRoutes);

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`User-service running on port ${PORT}`);
});
