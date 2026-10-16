import { Router } from "express";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { uploadDokumenSK } from "../../middlewares/upload.middleware.js";
import {
  getMatchingListSchema,
  exportMatchingSchema,
  syncGolonganSchema,
  getSyncQueueSchema,
  uploadSkGolonganSchema,
  checkEducationSyncSchema,
  searchPendidikanSchema,
  syncPendidikanSchema,
  getSyncPendidikanQueueSchema,
  uploadIjazahPendidikanSchema,
} from "./data-matching.validation.js";
import * as controller from "./data-matching.controller.js";

const router = Router();

// Semua endpoint data matching memerlukan autentikasi
router.use(authenticate);

// === Endpoints Sinkronisasi Golongan & Antrean Upload SK ===
// POST /api/data-matching/sync/golongan — Eksekusi sinkronisasi selisih golongan SIASN -> Lokal
router.post("/sync/golongan", validate(syncGolonganSchema), controller.syncGolongan);

// GET /api/data-matching/sync/golongan/queue — Daftar antrean upload SK golongan
router.get("/sync/golongan/queue", validateQuery(getSyncQueueSchema), controller.getSyncGolonganQueue);

// POST /api/data-matching/sync/golongan/:id/upload-sk — Unggah berkas fisik SK Golongan
router.post(
  "/sync/golongan/:id/upload-sk",
  uploadDokumenSK.single("file"),
  validate(uploadSkGolonganSchema),
  controller.uploadSkGolongan
);

// DELETE /api/data-matching/sync/golongan/:id — Hapus item antrean upload SK
router.delete("/sync/golongan/:id", controller.deleteSyncGolongan);

// === Endpoints Sinkronisasi Pendidikan & Antrean Upload Ijazah ===
// GET /api/data-matching/sync/pendidikan/check — Pre-check status referensi pendidikan
router.get("/sync/pendidikan/check", validateQuery(checkEducationSyncSchema), controller.checkEducationSync);

// GET /api/data-matching/sync/pendidikan/search-ref — Pencarian referensi master ref_pend
router.get("/sync/pendidikan/search-ref", validateQuery(searchPendidikanSchema), controller.searchPendidikan);

// POST /api/data-matching/sync/pendidikan — Eksekusi sinkronisasi pendidikan SIASN -> Lokal
router.post("/sync/pendidikan", validate(syncPendidikanSchema), controller.syncPendidikan);

// GET /api/data-matching/sync/pendidikan/queue — Daftar antrean upload Ijazah pendidikan
router.get("/sync/pendidikan/queue", validateQuery(getSyncPendidikanQueueSchema), controller.getSyncPendidikanQueue);

// POST /api/data-matching/sync/pendidikan/:id/upload-ijazah — Unggah berkas fisik Ijazah
router.post(
  "/sync/pendidikan/:id/upload-ijazah",
  uploadDokumenSK.single("file"),
  validate(uploadIjazahPendidikanSchema),
  controller.uploadIjazahPendidikan
);

// DELETE /api/data-matching/sync/pendidikan/:id — Hapus item antrean upload Ijazah
router.delete("/sync/pendidikan/:id", controller.deleteSyncPendidikan);


// === Endpoints Data Matching Lokal vs SIASN ===
// GET /api/data-matching/lokal-siasn/stats — Ringkasan statistik data matching
router.get("/lokal-siasn/stats", controller.getMatchingStats);

// GET /api/data-matching/lokal-siasn/export — Export Excel hasil komparasi
router.get("/lokal-siasn/export", validateQuery(exportMatchingSchema), controller.exportMatchingExcel);

// GET /api/data-matching/lokal-siasn/detail/:nip — Detail komparasi 1 pegawai
router.get("/lokal-siasn/detail/:nip", controller.getMatchingDetail);

// GET /api/data-matching/lokal-siasn — List komparasi data matching (berpaginasi)
router.get("/lokal-siasn", validateQuery(getMatchingListSchema), controller.getMatchingList);

export default router;
