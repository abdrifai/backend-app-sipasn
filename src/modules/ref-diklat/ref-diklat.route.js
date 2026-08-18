import express from "express";
import * as controller from "./ref-diklat.controller.js";
import * as validation from "./ref-diklat.validation.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = express.Router();

// --- JENIS DIKLAT ---

router.get("/jenis", controller.getAllJenis);
router.get("/jenis/:id", controller.getJenisById);
router.post(
  "/jenis",
  validate(validation.createJenisSchema),
  controller.createJenis,
);
router.patch(
  "/jenis/:id",
  validate(validation.updateJenisSchema),
  controller.updateJenis,
);
router.delete("/jenis/:id", controller.deleteJenis);

// --- JENJANG DIKLAT ---

router.get("/jenjang", controller.getAllJenjang);
router.get("/jenjang/:id", controller.getJenjangById);
router.post(
  "/jenjang",
  validate(validation.createJenjangSchema),
  controller.createJenjang,
);
router.patch(
  "/jenjang/:id",
  validate(validation.updateJenjangSchema),
  controller.updateJenjang,
);
router.delete("/jenjang/:id", controller.deleteJenjang);

export default router;
