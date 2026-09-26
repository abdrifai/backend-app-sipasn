import { Router } from "express";
import * as peremajaanController from "./peremajaan-data-induk.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createPeremajaanDataIndukSchema } from "./peremajaan-data-induk.validation.js";
import { uploadDokumenSK } from "../../middlewares/upload.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/jenis-options", peremajaanController.getJenisOptions);
router.get("/stats", peremajaanController.getStats);
router.get("/", peremajaanController.getAllPeremajaan);
router.post(
  "/",
  uploadDokumenSK.single("file_sk"),
  validate(createPeremajaanDataIndukSchema),
  peremajaanController.createPeremajaan
);
router.delete("/:id", peremajaanController.deletePeremajaan);

export default router;
