import express from "express";
import * as controller from "./ref-kedudukan-pns.controller.js";
import * as validation from "./ref-kedudukan-pns.validation.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post(
  "/",
  validate(validation.createSchema),
  controller.create,
);
router.patch(
  "/:id",
  validate(validation.updateSchema),
  controller.update,
);
router.delete("/:id", controller.deleteById);

export default router;
