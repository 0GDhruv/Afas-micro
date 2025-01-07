import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const __dirname = path.resolve();

// Simple token validation for protected routes
const validateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('Token not found');
    return res.redirect('/'); // redirect to login page
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'secret');
    next();
  } catch (err) {
    console.error('Invalid token:', err.message);
    return res.redirect('/'); // redirect to login if invalid
  }
};

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes to serve HTML pages
app.get('/', (req, res) => {
  // go to login page by default
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// If you want /users protected, add validateToken:
app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Frontend service running on port ${PORT}`);
});
