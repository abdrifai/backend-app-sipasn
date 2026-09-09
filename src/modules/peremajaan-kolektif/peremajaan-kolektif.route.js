import { Router } from "express";
import * as peremajaanController from "./peremajaan-kolektif.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createSkKolektifSchema,
  updateSkKolektifSchema,
  addPegawaiKolektifSchema,
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

// Pegawai Item Management
router.post(
  "/:id/pegawai",
  validate(addPegawaiKolektifSchema),
  peremajaanController.addPegawaiToSkKolektif
);
router.delete("/:id/pegawai/:pegawaiItemId", peremajaanController.removePegawaiFromSkKolektif);

// Eksekusi Massal
router.post("/:id/process", peremajaanController.processSkKolektif);

export default router;
