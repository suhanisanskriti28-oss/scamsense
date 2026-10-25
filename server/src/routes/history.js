// src/routes/history.js
import express from "express";
import { getUserHistory, getUserReports } from "../controllers/historyController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// List analyses performed by the authenticated user
router.get("/", protect, getUserHistory);

// List reports filed by the authenticated user
router.get("/reports", protect, getUserReports);

export default router;
