import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/users', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3001/api/users'); // Adjust URL to your API endpoint
    const { users } = response.data;

    res.render('users', { users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.render('users', { users: [], error: 'Failed to load users' });
  }
});

export default router;
