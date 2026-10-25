// src/controllers/analysisController.js
import { evaluateOffer } from "../services/signals.js";
import { getMxRecords, getDomainAge } from "../services/domainIntel.js";
import Analysis from "../models/Analysis.js";
import { z } from "zod";

// Validation schema for the incoming offer text (and optional sender info)
const offerSchema = z.object({
  text: z.string().min(1),
  // optional metadata – not required for core engine but kept for future extensions
  senderEmail: z.string().email().optional(),
});

/**
 * POST /api/analyze
 * Protected – requires a valid JWT cookie.
 * Returns risk score, level, evidence, and extracted entities.
 */
export const analyzeOffer = async (req, res, next) => {
  try {
    const parsed = offerSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = new Error("Invalid request payload");
      err.statusCode = 400;
      err.details = parsed.error.format();
      return next(err);
    }
    const { text, senderEmail } = parsed.data;

    // Core deterministic evaluation
    const { score, riskLevel, evidence, entities } = evaluateOffer(text);

    // Optional domain intel – we only run if a URL or email domain is present
    let domainInfo = {};
    if (entities.urls?.length) {
      const url = new URL(entities.urls[0]);
      const hostname = url.hostname;
      const [mx, age] = await Promise.all([
        getMxRecords(hostname),
        getDomainAge(hostname),
      ]);
      domainInfo = { hostname, mx, age };
    } else if (senderEmail) {
      const domain = senderEmail.split("@")[1];
      const [mx, age] = await Promise.all([
        getMxRecords(domain),
        getDomainAge(domain),
      ]);
      domainInfo = { hostname: domain, mx, age };
    }

    // Persist analysis (so user can view history later)
    const analysisDoc = new Analysis({
      user: req.user.id,
      rawText: text,
      entities,
      score,
      riskLevel,
      evidence,
    });
    await analysisDoc.save();

    res.status(200).json({
      score,
      riskLevel,
      evidence,
      entities,
      domainInfo,
      analysisId: analysisDoc._id,
    });
  } catch (err) {
    next(err);
  }
};
