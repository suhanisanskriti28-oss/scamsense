// src/controllers/userController.js
import { z } from "zod";

// Simple endpoint to return current authenticated user info
export const getMe = async (req, res, next) => {
  try {
    // req.user is added by protect middleware
    const schema = z.object({
      id: z.string(),
      email: z.string().email(),
      role: z.enum(["user", "admin"]),
    });
    const parsed = schema.safeParse({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    });
    if (!parsed.success) {
      const err = new Error("User data validation failed");
      err.statusCode = 500;
      return next(err);
    }
    res.status(200).json(parsed.data);
  } catch (err) {
    next(err);
  }
};
