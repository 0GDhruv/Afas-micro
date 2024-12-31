import express from 'express';
import path from 'path';

const app = express();
const __dirname = path.resolve();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes to serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
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
