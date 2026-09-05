import { Router } from "express";
import multer from "multer";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { queryImportPnsSchema } from "./import-pns.validation.js";
import * as importPnsController from "./import-pns.controller.js";
import AppError from "../../utils/AppError.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv") || file.mimetype === "application/vnd.ms-excel") {
      cb(null, true);
    } else {
      cb(new AppError("Hanya file berekstensi .csv yang diizinkan", 400), false);
    }
  },
});

const router = Router();

// Semua route import-pns memerlukan autentikasi
router.use(authenticate);

// GET /api/import-pns/template — Download CSV Template
router.get("/template", importPnsController.downloadTemplate);

// GET /api/import-pns/summary — Ringkasan data import
router.get("/summary", importPnsController.getSummary);

// GET /api/import-pns/rekap-jabatan — Rekapitulasi per jabatan
router.get("/rekap-jabatan", importPnsController.getRekapJabatan);

// GET /api/import-pns/rekap-jenis-jabatan — Rekapitulasi per jenis jabatan
router.get("/rekap-jenis-jabatan", importPnsController.getRekapJenisJabatan);

// POST /api/import-pns/upload — Upload file CSV
router.post("/upload", upload.single("file"), importPnsController.uploadCsv);



// GET /api/import-pns — List data import (Pagination & Search)
router.get("/", validateQuery(queryImportPnsSchema), importPnsController.getList);

// GET /api/import-pns/:id — Detail 1 data import
router.get("/:id", importPnsController.getDetail);

// DELETE /api/import-pns/batch/:batchId — Hapus 1 batch
router.delete("/batch/:batchId", importPnsController.deleteBatch);

// DELETE /api/import-pns/:id — Hapus 1 baris record
router.delete("/:id", importPnsController.deleteSingle);

export default router;
