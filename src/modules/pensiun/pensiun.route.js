import { Router } from "express";
import * as pensiunController from "./pensiun.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createPensiunSchema } from "./pensiun.validation.js";
import { uploadDokumenSK } from "../../middlewares/upload.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/kedudukan-options", pensiunController.getKedudukanOptions);
router.get("/proyeksi", pensiunController.getProyeksiPensiun);
router.get("/proyeksi/export", pensiunController.exportProyeksiPensiun);
router.get("/", pensiunController.getAllPensiun);
router.post(
  "/",
  uploadDokumenSK.single("file_sk"),
  validate(createPensiunSchema),
  pensiunController.createPensiun
);
router.delete("/:id", pensiunController.deletePensiun);

export default router;
