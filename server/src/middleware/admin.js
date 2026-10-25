// src/middleware/admin.js
import createError from "http-errors";

// Middleware to ensure the authenticated user is an admin
export default function requireAdmin(req, res, next) {
  // req.user is set by protect middleware
  if (req.user && req.user.role === "admin") {
    return next();
  }
  // Not authorized
  const err = createError(403, "Admin access required");
  return next(err);
}
