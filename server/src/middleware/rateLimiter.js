import rateLimit from 'express-rate-limit';

// General API rate limiter (applies to most endpoints)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    status: 429,
  },
});

// Stricter limiter for authentication and analysis routes
export const authAnalyzeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded for auth/analysis, please wait.',
    status: 429,
  },
});