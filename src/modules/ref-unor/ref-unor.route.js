import { Router } from "express";
import * as controller from "./ref-unor.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import * as validation from "./ref-unor.validation.js";

const router = Router();

// Middleware to verify JWT token for all routes
router.use(authenticate);

// --- MIGRATION CONTROLS ---
router.get("/migration-stats", controller.getMigrationStats);
router.post("/migrate", controller.runMigration);

// --- TREE VIEW ---
router.get("/tree", controller.getTree);

// --- JENIS UNOR ---
router.get("/jnsunor", controller.getAllJnsUnor);
router.get("/jnsunor/:id", controller.getJnsUnorById);
router.post("/jnsunor", validate(validation.createJnsUnorSchema), controller.createJnsUnor);
router.patch("/jnsunor/:id", validate(validation.updateJnsUnorSchema), controller.updateJnsUnor);
router.delete("/jnsunor/:id", controller.deleteJnsUnor);

// --- ESELON ---
router.get("/eselon", controller.getAllEselon);

// --- UNOR INDUK ---
router.get("/induk", controller.getAllUnorInduk);
router.get("/induk/:id", controller.getUnorIndukById);
router.post("/induk", validate(validation.createUnorIndukSchema), controller.createUnorInduk);
router.patch("/induk/:id", validate(validation.updateUnorIndukSchema), controller.updateUnorInduk);
router.delete("/induk/:id", controller.deleteUnorInduk);

// --- SUB UNOR ---
router.get("/sub", controller.getAllSubUnor);
router.get("/sub/:id", controller.getSubUnorById);
router.post("/sub", validate(validation.createSubUnorSchema), controller.createSubUnor);
router.patch("/sub/:id", validate(validation.updateSubUnorSchema), controller.updateSubUnor);
router.delete("/sub/:id", controller.deleteSubUnor);

// --- SUB UNOR SUB ---
router.get("/sub-sub", controller.getAllSubUnorSub);
router.get("/sub-sub/:id", controller.getSubUnorSubById);
router.post("/sub-sub", validate(validation.createSubUnorSubSchema), controller.createSubUnorSub);
router.patch("/sub-sub/:id", validate(validation.updateSubUnorSubSchema), controller.updateSubUnorSub);
router.delete("/sub-sub/:id", controller.deleteSubUnorSub);

// --- MOVE / TRANSFER UNOR ---
router.get("/target-parents", controller.getTargetParents);
router.post("/move", validate(validation.moveUnorSchema), controller.moveUnor);
router.post("/reorder", validate(validation.reorderUnorSchema), controller.reorderUnor);

// --- UNOR ---
router.get("/", controller.getAllUnor);
router.get("/:id", controller.getUnorById);
router.post("/", validate(validation.createUnorSchema), controller.createUnor);
router.patch("/:id", validate(validation.updateUnorSchema), controller.updateUnor);
router.delete("/:id", controller.deleteUnor);

export default router;

