import express from "express";

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "scamsense-api",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
