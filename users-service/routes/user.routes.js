import express from "express";
import {
  registerUser,
  loginUser,
  listUsers,
  removeUser,
  listAllPermissions,
  listPermissionsForUser,
  addPermission,
  deletePermission,
  getMyPermissions // ✅ Import the new controller
} from "../controllers/user.controller.js";
import { protect, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// --- Authentication & User Management Routes ---
router.post("/users/login", loginUser);
router.post("/users", protect, isAdmin, registerUser);
router.get("/users", protect, listUsers);
router.delete("/users/:id", protect, isAdmin, removeUser);


// --- Permission Management Routes ---
router.get("/permissions", protect, isAdmin, listAllPermissions);
router.get("/permissions/user/:userId", protect, isAdmin, listPermissionsForUser);
router.post("/permissions", protect, isAdmin, addPermission);
router.delete("/permissions/:id", protect, isAdmin, deletePermission);


// ✅ NEW route to get the logged-in user's own permissions.
// This is protected, so only an authenticated user can access it.
router.get("/users/me/permissions", protect, getMyPermissions);


export default router;
