import express from "express";
import {
  registerUser,
  listUsers,
  removeUser,
  listPermissions,
  addPermission,
  deletePermission
} from "../controllers/user.controller.js";

const router = express.Router();

router.post("/users", registerUser);
router.get("/users", listUsers);
router.delete("/users/:id", removeUser);

router.get("/permissions", listPermissions);
router.post("/permissions", addPermission);
router.delete("/permissions/:id", deletePermission);

export default router;
