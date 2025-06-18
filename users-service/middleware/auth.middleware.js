import jwt from "jsonwebtoken";
import { findUserByEmail } from "../models/user.model.js";

/**
 * Middleware to protect routes by verifying JWT.
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token (don't attach the password)
      // This step is useful if you need the user object in subsequent requests.
      // For simple role checks, the role from the token might suffice.
      req.user = decoded; // The decoded token includes user id, role etc.

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

/**
 * Middleware to check if the user is an admin.
 */
export const isAdmin = (req, res, next) => {
    // The `protect` middleware should have run before this, attaching the user to the request.
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Not authorized as an admin" });
    }
};
