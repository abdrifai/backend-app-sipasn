import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import { createUserSchema, updateUserSchema } from "./user.validation.js";
import * as userController from "./user.controller.js";

const router = Router();

// Semua route user memerlukan autentikasi
router.use(authenticate);

// GET /api/users — list users (pagination + search)
router.get("/", userController.getUsers);

// GET /api/users/roles — daftar roles (untuk dropdown)
router.get("/roles", userController.getRoles);

// GET /api/users/:id — detail user
router.get("/:id", userController.getUser);

// POST /api/users — buat user baru (admin only)
router.post("/", authorize("admin", "super admin"), validate(createUserSchema), userController.createUser);

// PUT /api/users/:id — update user (admin only)
router.put("/:id", authorize("admin", "super admin"), validate(updateUserSchema), userController.updateUser);

// DELETE /api/users/:id — soft delete (admin only)
router.delete("/:id", authorize("admin", "super admin"), userController.deleteUser);

export default router;
