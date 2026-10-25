import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import healthRouter from "./routes/health.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();

// Security & logging middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(mongoSanitize());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Routes
app.use(apiLimiter);
app.use("/api", healthRouter);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
