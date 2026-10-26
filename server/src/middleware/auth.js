// src/middleware/auth.js
import jwt from "jsonwebtoken";

/**
 * Middleware to verify JWT sent in httpOnly cookie `token`.
 * On success attaches the public identity claims needed by protected routes.
 */
export const protect = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    const err = new Error("Authentication token missing");
    err.statusCode = 401;
    return next(err);
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (e) {
    const err = new Error("Invalid authentication token");
    err.statusCode = 401;
    next(err);
  }
};
