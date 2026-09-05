import rateLimit from "express-rate-limit";

// Rate limit umum — bypass di development, 1000 req di production
export const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,
  skip: () => process.env.NODE_ENV === "development",
  message: {
    success: false,
    statusCode: 429,
    message: "Terlalu banyak request, silakan coba lagi nanti.",
    errors: null,
  },
});

// Rate limit auth — bypass di development, 10 req di production
export const authRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  skip: () => process.env.NODE_ENV === "development",
  message: {
    success: false,
    statusCode: 429,
    message: "Terlalu banyak percobaan login, silakan coba lagi nanti.",
    errors: null,
  },
});
