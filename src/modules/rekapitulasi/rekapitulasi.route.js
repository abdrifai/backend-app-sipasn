import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import {
  queryRekapitulasiSchema,
  createSnapshotSchema,
} from "./rekapitulasi.validation.js";
import * as rekapController from "./rekapitulasi.controller.js";

const router = Router();

// Proteksi rute dengan autentikasi JWT
router.use(authMiddleware);

// Rute Export Excel
router.get("/export/excel", validateQuery(queryRekapitulasiSchema), rekapController.exportExcel);

// Rute Gabungan Seluruh Rekapitulasi (1 API Call)
router.get("/all", validateQuery(queryRekapitulasiSchema), rekapController.getAll);

// Rute Per Tabel
router.get("/gender", validateQuery(queryRekapitulasiSchema), rekapController.getGender);
router.get("/golongan-gender", validateQuery(queryRekapitulasiSchema), rekapController.getGolonganGender);
router.get("/pendidikan-gender", validateQuery(queryRekapitulasiSchema), rekapController.getPendidikanGender);
router.get("/jabatan-struktural", validateQuery(queryRekapitulasiSchema), rekapController.getJabatanStruktural);
router.get("/struktural-gender", validateQuery(queryRekapitulasiSchema), rekapController.getStrukturalGender);
router.get("/struktural-pendidikan", validateQuery(queryRekapitulasiSchema), rekapController.getStrukturalPendidikan);
router.get("/jabatan-gender", validateQuery(queryRekapitulasiSchema), rekapController.getJabatanGender);
router.get("/jabatan-fungsional", validateQuery(queryRekapitulasiSchema), rekapController.getJabatanFungsional);

// Simpan Snapshot Bulanan
router.post("/snapshot", validate(createSnapshotSchema), rekapController.createSnapshot);

export default router;
