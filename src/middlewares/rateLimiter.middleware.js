import rateLimit from "express-rate-limit";

// Rate limit umum — 100 req / 15 menit per IP
export const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    statusCode: 429,
    message: "Terlalu banyak request, silakan coba lagi nanti.",
    errors: null,
  },
});

// Rate limit auth — 10 req / 15 menit per IP
export const authRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  message: {
    success: false,
    statusCode: 429,
    message: "Terlalu banyak percobaan login, silakan coba lagi nanti.",
    errors: null,
  },
});
