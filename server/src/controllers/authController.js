// src/controllers/authController.js
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { z } from "zod";
import crypto from "crypto";

// Validation schemas
const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

/**
 * Generate JWT token (httpOnly cookie)
 */
const generateToken = (user) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return token;
};

const serializeUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role,
});

const sessionCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: isProduction ? "none" : "strict",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

export const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = new Error("Invalid registration data");
      err.statusCode = 400;
      err.details = parsed.error.format();
      return next(err);
    }
    const { email, password } = parsed.data;
    // Prevent duplicate registrations
    const existing = await User.findOne({ email });
    if (existing) {
      const err = new Error("User already exists");
      err.statusCode = 409;
      return next(err);
    }
    const user = new User({ email, password });
    try {
      await user.save();
    } catch (err) {
      if (err.code === 11000) {
        const duplicate = new Error("User already exists");
        duplicate.statusCode = 409;
        return next(duplicate);
      }
      throw err;
    }
    const token = generateToken(user);
    res
      .cookie("token", token, sessionCookieOptions())
      .status(201)
      .json({ message: "User registered", user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = new Error("Invalid login data");
      err.statusCode = 400;
      err.details = parsed.error.format();
      return next(err);
    }
    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      return next(err);
    }
    const match = await user.comparePassword(password);
    if (!match) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      return next(err);
    }
    const token = generateToken(user);
    res
      .cookie("token", token, sessionCookieOptions())
      .status(200)
      .json({ message: "Logged in", user: serializeUser(user) });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logged out" });
};
