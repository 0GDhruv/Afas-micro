/******************************************
 * user-service/controllers/user.controller.js
 ******************************************/
import bcrypt from 'bcrypt';
import { Op } from 'sequelize'; // <-- Use Sequelize operators this way
import User from '../models/user.model.js';

/**
 * CREATE a new user
 */
export const createUser = async (req, res) => {
  try {
    const { username, password, access } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in DB
    const user = await User.create({ username, password: hashedPassword, access: JSON.stringify(access) });
    return res.status(201).json(User);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ 
      message: 'Error creating user', 
      error: error.message 
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users.map((user) => ({ ...user.toJSON(), access: JSON.parse(user.access) })));
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};

/**
 * GET ALL users with optional search & pagination
 */
// export const getAllUsers = async (req, res) => {
//   try {
//     // Parse query params
//     const { search = '', page = 1, limit = 10 } = req.query;
//     const pageNum = parseInt(page, 10) || 1;
//     const limitNum = parseInt(limit, 10) || 10;
//     const offset = (pageNum - 1) * limitNum;

//     // Fetch from DB using a LIKE operator
//     const { rows, count } = await User.findAndCountAll({
//       where: {
//         username: {
//           [Op.like]: `%${search}%`, // using Op.like properly
//         },
//       },
//       order: [['id', 'DESC']],
//       offset,
//       limit: limitNum,
//     });

//     // If you have an `access` column that stores JSON, you might parse it here:
//     const users = rows.map((user) => {
//       // If `access` is stored as a string or JSON, convert to an array
//       // If your column is actually TEXT or JSON in MySQL, do something like:
//       // const userAccess = user.access ? JSON.parse(user.access) : [];
//       // Then return that in the response
//       return {
//         id: user.id,
//         username: user.username,
//         // access: userAccess
//       };
//     });

//     return res.status(200).json({
//       users,
//       total: count,
//       page: pageNum,
//       limit: limitNum,
//     });
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     return res.status(500).json({
//       message: 'Error fetching users',
//       error: error.message,
//     });
//   }
// };

// export const getAllUsers = async (req, res) => {
//   try {
//     // Parse query params
//     const { search = '', page = 1, limit = 10 } = req.query;
//     const pageNum = parseInt(page, 10) || 1;
//     const limitNum = parseInt(limit, 10) || 10;
//     const offset = (pageNum - 1) * limitNum;

//     // Fetch users from DB with search and pagination
//     const { rows, count } = await User.findAndCountAll({
//       where: {
//         username: {
//           [Op.like]: `%${search}%`,
//         },
//       },
//       order: [['id', 'DESC']],
//       offset,
//       limit: limitNum,
//     });

//     // Include `access` in the response
//     const users = rows.map((user) => {
//       const userAccess = user.access ? JSON.parse(user.access) : [];
//       return {
//         id: user.id,
//         username: user.username,
//         access: userAccess,
//       };
//     });

//     return res.status(200).json({
//       users,
//       total: count,
//       page: pageNum,
//       limit: limitNum,
//     });
//   } catch (error) {
//     console.error('Error fetching users:', error);
//     return res.status(500).json({
//       message: 'Error fetching users',
//       error: error.message,
//     });
//   }
// };


/**
 * GET available pages for user access
 * (If you’re using a system where you assign pages or features to a user.)
 */
// export const getAvailablePages = async (req, res) => {
//   try {
//     // This could come from the DB, but here’s a hard-coded example:
//     const pages = [
//       'Dashboard',
//       'Audio Type',
//       'Upload Audio',
//       'Announcement Type',
//       'Sequence',
//       'Scheduler',
//       'Zones',
//       'Zone Selector',
//       'Users',
//       'Permissions',
//     ];

//     return res.status(200).json(pages);
//   } catch (error) {
//     console.error('Error fetching available pages:', error);
//     return res.status(500).json({
//       message: 'Error fetching pages',
//       error: error.message,
//     });
//   }
// };
