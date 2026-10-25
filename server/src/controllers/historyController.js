// src/controllers/historyController.js
import Analysis from "../models/Analysis.js";
import Report from "../models/Report.js";
import { z } from "zod";

// GET /api/history?limit=10&page=1
export const getUserHistory = async (req, res, next) => {
  try {
    const querySchema = z.object({
      limit: z.coerce.number().int().min(1).max(100).optional().default(10),
      page: z.coerce.number().int().min(1).optional().default(1),
    });
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      const err = new Error("Invalid query parameters");
      err.statusCode = 400;
      err.details = parsed.error.format();
      return next(err);
    }
    const { limit, page } = parsed.data;
    const skip = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      Analysis.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Analysis.countDocuments({ user: req.user.id }),
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

// GET /api/history/reports – list reports filed by the user
export const getUserReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reporters: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ reports });
  } catch (err) {
    next(err);
  }
};
