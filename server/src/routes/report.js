// src/routes/report.js
import express from "express";
import { submitReport } from "../controllers/reportController.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// All report endpoints require authentication
router.post("/", protect, submitReport);

export default router;
