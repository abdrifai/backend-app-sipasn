import express from "express";
import * as controller from "./ref-peraturan.controller.js";
import * as validation from "./ref-peraturan.validation.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { uploadDokumenPeraturan } from "../../middlewares/upload.middleware.js";

const router = express.Router();

// Autentikasi untuk seluruh endpoint referensi peraturan
router.use(authenticate);

router.get("/", controller.getAll);
router.get("/filter-options", controller.getFilterOptions);
router.get("/lookup", controller.searchLookup);
router.get("/hierarchy-tree", controller.getHierarchyTree);
router.get("/:id", controller.getById);

router.post(
  "/",
  uploadDokumenPeraturan.single("file_peraturan"),
  validate(validation.createPeraturanSchema),
  controller.create
);

router.put(
  "/:id",
  uploadDokumenPeraturan.single("file_peraturan"),
  validate(validation.updatePeraturanSchema),
  controller.update
);

router.patch(
  "/:id",
  uploadDokumenPeraturan.single("file_peraturan"),
  validate(validation.updatePeraturanSchema),
  controller.update
);

router.delete("/:id", controller.deleteById);

export default router;
