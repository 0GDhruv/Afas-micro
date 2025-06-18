import {
    createUser,
    getAllUsers,
    deleteUser,
    getPermissions,
    getPagesByUser, // ✅ Import this function
    setPermissions,
    removePermission,
    findUserByEmail,
    comparePasswords,
    getPermissionsByUserId
} from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// --- User Controllers ---

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Please provide all required fields." });
        }
        await createUser({ name, email, password, role });
        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "An account with this email already exists." });
        }
        res.status(500).json({ message: "Error creating user", error: err.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await findUserByEmail(email);
        if (user && (await comparePasswords(password, user.password))) {
            res.json({
                message: "Login successful",
                token: generateToken(user.id, user.role),
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error during login", error: error.message });
    }
};

export const listUsers = async (req, res) => {
    try {
        const [users] = await getAllUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Error fetching users", error: err.message });
    }
};

export const removeUser = async (req, res) => {
    try {
        await deleteUser(req.params.id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting user", error: err.message });
    }
};


// --- Permission Controllers ---

/**
 * ✅ NEW controller to get the pages for the currently authenticated user.
 * It uses the user ID from the JWT token provided by the `protect` middleware.
 */
export const getMyPermissions = async (req, res) => {
    try {
        // req.user.id is available because the `protect` middleware ran first
        const pages = await getPagesByUser(req.user.id);
        res.json({ pages });
    } catch (err) {
        res.status(500).json({ message: "Error fetching user permissions", error: err.message });
    }
};

export const listAllPermissions = async (req, res) => {
    try {
        const [perms] = await getPermissions();
        res.json(perms);
    } catch (err) {
        res.status(500).json({ message: "Error loading all permissions", error: err.message });
    }
};

export const listPermissionsForUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const [perms] = await getPermissionsByUserId(userId);
        res.json(perms);
    } catch (err) {
        res.status(500).json({ message: "Error loading user permissions", error: err.message });
    }
};

export const addPermission = async (req, res) => {
    try {
        const { user_id, pages } = req.body;
        if (!user_id || !Array.isArray(pages) || pages.length === 0) {
            return res.status(400).json({ message: "Request must include a user_id and a non-empty array of pages." });
        }
        await setPermissions(user_id, pages);
        res.status(201).json({ message: "Permissions added successfully" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "One or more of these permissions are already assigned to the user." });
        }
        res.status(500).json({ message: "Error adding permissions", error: err.message });
    }
};

export const deletePermission = async (req, res) => {
    try {
        await removePermission(req.params.id);
        res.status(200).json({ message: "Permission removed successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error removing permission", error: err.message });
    }
};
