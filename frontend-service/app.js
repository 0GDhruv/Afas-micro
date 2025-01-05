import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const __dirname = path.resolve();


const validateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from the header

  if (!token) {
    console.warn('Token not found');
    return res.redirect('/'); // Redirect to login if token is missing
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret'); // Verify token
    req.user = decoded; // Attach decoded token payload to the request object
    next(); // Proceed to the next middleware/route handler
  } catch (err) {
    console.error('Invalid token:', err.message);
    return res.redirect('/'); // Redirect to login if token is invalid
  }
};

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes to serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', validateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'users.html'));
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Frontend service running on port ${PORT}`);
});
