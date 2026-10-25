// src/routes/analysis.js
import express from "express";
import { analyzeOffer } from "../controllers/analysisController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Protected route – user must be authenticated
router.post("/analyze", protect, analyzeOffer);

export default router;
