import express from "express";
import * as refPendidikanController from "./ref-pendidikan.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createPendidikanSchema, updatePendidikanSchema } from "./ref-pendidikan.validation.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { globalRateLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = express.Router();

// Semua route di bawah ini memerlukan atuentikasi
router.use(authenticate);
router.use(globalRateLimiter);

router.get("/", refPendidikanController.getAll);
router.get("/tingkat", refPendidikanController.getTingkat);
router.get("/:id", refPendidikanController.getById);

router.post("/", validate(createPendidikanSchema), refPendidikanController.create);
router.put("/:id", validate(updatePendidikanSchema), refPendidikanController.update);
router.delete("/:id", refPendidikanController.remove);

export default router;
