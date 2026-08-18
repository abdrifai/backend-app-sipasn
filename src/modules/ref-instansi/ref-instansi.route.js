import { Router } from "express";
import * as controller from "./ref-instansi.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", controller.getAll);

export default router;
