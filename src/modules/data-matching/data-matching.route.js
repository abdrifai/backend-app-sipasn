import { Router } from "express";
import { validateQuery } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  getMatchingListSchema,
  exportMatchingSchema,
} from "./data-matching.validation.js";
import * as controller from "./data-matching.controller.js";

const router = Router();

// Semua endpoint data matching memerlukan autentikasi
router.use(authenticate);

// GET /api/data-matching/lokal-siasn/stats — Ringkasan statistik data matching
router.get("/lokal-siasn/stats", controller.getMatchingStats);

// GET /api/data-matching/lokal-siasn/export — Export Excel hasil komparasi
router.get("/lokal-siasn/export", validateQuery(exportMatchingSchema), controller.exportMatchingExcel);

// GET /api/data-matching/lokal-siasn/detail/:nip — Detail komparasi 1 pegawai
router.get("/lokal-siasn/detail/:nip", controller.getMatchingDetail);

// GET /api/data-matching/lokal-siasn — List komparasi data matching (berpaginasi)
router.get("/lokal-siasn", validateQuery(getMatchingListSchema), controller.getMatchingList);

export default router;
