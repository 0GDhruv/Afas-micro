import {
    createUser,
    getAllUsers,
    deleteUser,
    getPermissions,
    setPermission,
    removePermission
  } from "../models/user.model.js";
  
  export const registerUser = async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      await createUser({ name, email, password, role });
      res.json({ message: "User created successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error creating user", error: err.message });
    }
  };
  
  export const listUsers = async (req, res) => {
    try {
      const [users] = await getAllUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: "Error fetching users" });
    }
  };
  
  export const removeUser = async (req, res) => {
    try {
      await deleteUser(req.params.id);
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Error deleting user" });
    }
  };
  
  export const listPermissions = async (req, res) => {
    try {
      const [perms] = await getPermissions();
      res.json(perms);
    } catch (err) {
      res.status(500).json({ message: "Error loading permissions" });
    }
  };
  
  export const addPermission = async (req, res) => {
    try {
      const { user_id, page } = req.body;
      await setPermission(user_id, page);
      res.status(201).json({ message: "Permission added" });
    } catch (err) {
      res.status(500).json({ message: "Error adding permission" });
    }
  };
  
  export const deletePermission = async (req, res) => {
    try {
      await removePermission(req.params.id);
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ message: "Error removing permission" });
    }
  };
  