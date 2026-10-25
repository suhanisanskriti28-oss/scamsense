// src/routes/user.js
import express from "express";
import protect from "../middleware/auth.js";
import { getMe } from "../controllers/userController.js";

const router = express.Router();

router.get("/", protect, getMe);

export default router;
