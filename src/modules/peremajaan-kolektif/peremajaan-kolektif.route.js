import { Router } from "express";
import * as peremajaanController from "./peremajaan-kolektif.controller.js";
import { validate, validateQuery } from "../../middlewares/validate.middleware.js";
import {
  createSkKolektifSchema,
  updateSkKolektifSchema,
  addPegawaiKolektifSchema,
  getPegawaiByUnorSchema,
  addPegawaiBatchSchema,
  createMutasiUnorSchema,
} from "./peremajaan-kolektif.validation.js";
import { uploadDokumenSK } from "../../middlewares/upload.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

// Referensi & Autocomplete
router.get("/options", peremajaanController.getReferensiOptions);
router.get("/search-pegawai", peremajaanController.searchPegawaiOptions);
router.get("/search-jabatan", peremajaanController.searchJabatanOptions);
router.get("/search-unor", peremajaanController.searchUnorOptions);
router.get(
  "/pegawai-by-unor",
  validateQuery(getPegawaiByUnorSchema),
  peremajaanController.getPegawaiByUnor
);

// Mutasi Masal Unit Organisasi (Langsung Tanpa SK Resmi)
router.get("/mutasi-unor", peremajaanController.getAllMutasiUnor);
router.get("/mutasi-unor/:id", peremajaanController.getMutasiUnorById);
router.post(
  "/mutasi-unor",
  validate(createMutasiUnorSchema),
  peremajaanController.createMutasiUnor
);
router.post("/mutasi-unor/:id/restore", peremajaanController.restoreMutasiUnor);

// SK Kolektif CRUD & Process
router.get("/", peremajaanController.getAllSkKolektif);
router.post(
  "/",
  uploadDokumenSK.single("file_sk"),
  validate(createSkKolektifSchema),
  peremajaanController.createSkKolektif
);
router.get("/:id", peremajaanController.getSkKolektifById);
router.put(
  "/:id",
  uploadDokumenSK.single("file_sk"),
  validate(updateSkKolektifSchema),
  peremajaanController.updateSkKolektif
);
router.delete("/:id", peremajaanController.deleteSkKolektif);

// Pegawai Item Management (dalam SK)
router.post(
  "/:id/pegawai",
  validate(addPegawaiKolektifSchema),
  peremajaanController.addPegawaiToSkKolektif
);
router.post(
  "/:id/pegawai-batch",
  validate(addPegawaiBatchSchema),
  peremajaanController.addPegawaiBatchToSkKolektif
);
router.delete("/:id/pegawai/:pegawaiItemId", peremajaanController.removePegawaiFromSkKolektif);

// Eksekusi Massal SK Kolektif
router.post("/:id/process", peremajaanController.processSkKolektif);

export default router;

