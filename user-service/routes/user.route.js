import express from 'express';
import {
  createUser,
  getAllUsers,
  // getAvailablePages
} from '../controllers/user.controller.js';

const router = express.Router();

// POST /users -> create a user
router.post('/', createUser);

// GET /users -> fetch all users
router.get('/', getAllUsers);

// GET /users/pages -> fetch available pages
// router.get('/pages', getAvailablePages);

export default router;
