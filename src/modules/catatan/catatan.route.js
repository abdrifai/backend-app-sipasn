import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createCatatanSchema, updateCatatanSchema } from "./catatan.validation.js";
import * as catatanController from "./catatan.controller.js";

const router = Router();

// Semua rute catatan dilindungi autentikasi
router.use(authMiddleware);

router.get("/", catatanController.getAll);
router.get("/:id", catatanController.getById);
router.post("/", validate(createCatatanSchema), catatanController.create);
router.put("/:id", validate(updateCatatanSchema), catatanController.update);
router.delete("/:id", catatanController.remove);
router.patch("/:id/pin", catatanController.togglePin);

export default router;
