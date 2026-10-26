import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import healthRouter from "./routes/health.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.js";
import reportRouter from "./routes/report.js";
import analysisRouter from "./routes/analysis.js";
import historyRouter from "./routes/history.js";
import adminRouter from "./routes/admin.js";
import userRouter from "./routes/user.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

const app = express();

// Security & logging middleware
app.use(cookieParser());
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
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
app.use("/api/auth", authRouter);
app.use("/api/analysis", analysisRouter);
app.use("/api/reports", reportRouter);
app.use("/api/history", historyRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api", healthRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
