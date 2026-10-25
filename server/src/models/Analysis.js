// src/models/Analysis.js
import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rawText: { type: String, required: true },
  // extracted entities stored as JSON for flexibility
  entities: { type: mongoose.Schema.Types.Mixed, default: {} },
  score: { type: Number, min: 0, max: 100 },
  riskLevel: { type: String, enum: ["Low", "Medium", "High"] },
  evidence: [{
    id: String,
    severity: Number,
    weight: Number,
    matchedText: String,
    explanation: String,
  }],
}, { timestamps: true });

export default mongoose.model("Analysis", analysisSchema);
