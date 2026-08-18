import express from "express";
import * as controller from "./ref-jns-hukuman.controller.js";
import * as validation from "./ref-jns-hukuman.validation.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = express.Router();

router.get("/", controller.getAll);
router.get("/tkt-lookup", controller.getTktHukumanLookup);
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
