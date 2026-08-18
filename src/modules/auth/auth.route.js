import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { uploadProfilePhoto } from "../../middlewares/upload.middleware.js";
import { loginSchema, updateProfileSchema } from "./auth.validation.js";
import * as authController from "./auth.controller.js";

const router = Router();

// Rate limiter khusus auth (Rule 07)
const authRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || 10,
  message: {
    success: false,
    statusCode: 429,
    message: "Terlalu banyak percobaan login, silakan coba lagi nanti.",
    errors: null,
  },
});

// POST /api/auth/login
router.post("/login", authRateLimiter, validate(loginSchema), authController.login);

// POST /api/auth/logout
router.post("/logout", authenticate, authController.logout);

// GET /api/auth/me
router.get("/me", authenticate, authController.me);

// PUT /api/auth/profile
router.put("/profile", authenticate, uploadProfilePhoto.single("photo"), validate(updateProfileSchema), authController.updateProfile);

export default router;
