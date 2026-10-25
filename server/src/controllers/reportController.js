// src/controllers/reportController.js
import Report, { generateReportHash } from "../models/Report.js";
import { z } from "zod";

// Validation schema for a report submission
const reportSchema = z.object({
  text: z.string().min(1, "Report text cannot be empty"),
});

/**
 * POST /api/reports
 * Protected – requires a valid JWT cookie.
 * Accepts a raw scam text (e.g., message copy) and stores a deterministic hash.
 * If the same content is submitted again, the count is incremented and the reporter is added.
 */
export const submitReport = async (req, res, next) => {
  try {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = new Error("Invalid report payload");
      err.statusCode = 400;
      err.details = parsed.error.format();
      return next(err);
    }

    const { text } = parsed.data;
    const hash = generateReportHash(text);

    // Upsert report – if exists, increment count and add reporter if not already present
    const update = {
      $inc: { count: 1 },
      $addToSet: { reporters: req.user.id },
    };
    const options = { new: true, upsert: true, setDefaultsOnInsert: true };
    const report = await Report.findOneAndUpdate({ hash }, update, options);

    // Ensure the hash field is set on insert (upsert case)
    if (report.isNew) {
      report.hash = hash;
      await report.save();
    }

    res.status(201).json({
      message: "Report recorded",
      report: {
        id: report._id,
        hash: report.hash,
        count: report.count,
      },
    });
  } catch (err) {
    next(err);
  }
};
