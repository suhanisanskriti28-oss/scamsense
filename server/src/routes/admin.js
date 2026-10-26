// src/routes/admin.js
import express from "express";
import { protect } from "../middleware/auth.js";
import requireAdmin from "../middleware/admin.js";
import {
  getAllReports,
  deleteReport,
  getAllAnalyses,
  deleteAnalysis,
} from "../controllers/adminController.js";

const router = express.Router();

// All admin endpoints require authentication + admin role
router.use(protect, requireAdmin);

// Reports management
router.get("/reports", getAllReports);
router.delete("/reports/:id", deleteReport);

// Analyses management
router.get("/analyses", getAllAnalyses);
router.delete("/analyses/:id", deleteAnalysis);

export default router;
