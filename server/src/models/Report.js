// src/models/Report.js
import mongoose from "mongoose";
import { createHash } from "crypto";

// Helper: generate deterministic hash from normalized string (lowercase, trim)
export const generateReportHash = (text) => {
  const normalized = text.trim().toLowerCase();
  return createHash("sha256").update(normalized).digest("hex");
};

const reportSchema = new mongoose.Schema({
  hash: { type: String, required: true, unique: true },
  count: { type: Number, default: 1 },
  reporters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

export default mongoose.model("Report", reportSchema);
