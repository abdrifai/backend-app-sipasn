import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { uploadProfilePhoto } from "../../middlewares/upload.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimiter.middleware.js";
import { loginSchema, updateProfileSchema } from "./auth.validation.js";
import * as authController from "./auth.controller.js";

const router = Router();

// POST /api/auth/login
router.post("/login", authRateLimiter, validate(loginSchema), authController.login);

// POST /api/auth/logout
router.post("/logout", authenticate, authController.logout);

// GET /api/auth/me
router.get("/me", authenticate, authController.me);

// PUT /api/auth/profile
router.put("/profile", authenticate, uploadProfilePhoto.single("photo"), validate(updateProfileSchema), authController.updateProfile);

export default router;
