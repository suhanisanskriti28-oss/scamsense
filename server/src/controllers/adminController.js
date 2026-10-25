// src/controllers/adminController.js
import Analysis from "../models/Analysis.js";
import Report from "../models/Report.js";
import { z } from "zod";
import createError from "http-errors";

// Helper: pagination parsing
const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  page: z.coerce.number().int().min(1).optional().default(1),
});

/**
 * GET /api/admin/reports
 * Returns a paginated list of ALL reports (admin only)
 */
export const getAllReports = async (req, res, next) => {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      const err = new Error("Invalid pagination parameters");
      err.statusCode = 400;
      err.details = parsed.error.format();
      return next(err);
    }
    const { limit, page } = parsed.data;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("reporters", "email role")
        .lean(),
      Report.countDocuments(),
    ]);

    res.status(200).json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      reports,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/reports/:id
 * Permanently delete a report (admin only)
 */
export const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Report.findByIdAndDelete(id);
    if (!deleted) {
      return next(createError(404, "Report not found"));
    }
    res.status(200).json({ message: "Report deleted" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/analyses
 * Paginated list of all analyses submitted by any user
 */
export const getAllAnalyses = async (req, res, next) => {
  try {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success) {
      const err = new Error("Invalid pagination parameters");
      err.statusCode = 400;
      err.details = parsed.error.format();
      return next(err);
    }
    const { limit, page } = parsed.data;
    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      Analysis.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "email role")
        .lean(),
      Analysis.countDocuments(),
    ]);

    res.status(200).json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      analyses,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/analyses/:id
 * Remove a specific analysis (admin only)
 */
export const deleteAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Analysis.findByIdAndDelete(id);
    if (!deleted) {
      return next(createError(404, "Analysis not found"));
    }
    res.status(200).json({ message: "Analysis deleted" });
  } catch (err) {
    next(err);
  }
};
