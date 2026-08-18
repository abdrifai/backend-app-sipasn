import { Router } from "express";
import * as controller from "./ref-jabatan.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import * as validation from "./ref-jabatan.validation.js";

const router = Router();

// Semua route di modul ini memerlukan autentikasi
router.use(authenticate);

// --- JABATAN FUNGSIONAL ---
router.get("/fungsional", controller.getAllJabFungsional);
router.get("/fungsional/:id", controller.getJabFungsionalById);
router.post("/fungsional", validate(validation.createJabFungsionalSchema), controller.createJabFungsional);
router.patch("/fungsional/:id", validate(validation.updateJabFungsionalSchema), controller.updateJabFungsional);
router.delete("/fungsional/:id", controller.deleteJabFungsional);

// --- JABATAN PELAKSANA ---
router.get("/pelaksana", controller.getAllJabPelaksana);
router.get("/pelaksana/:id", controller.getJabPelaksanaById);
router.post("/pelaksana", validate(validation.createJabPelaksanaSchema), controller.createJabPelaksana);
router.patch("/pelaksana/:id", validate(validation.updateJabPelaksanaSchema), controller.updateJabPelaksana);
router.delete("/pelaksana/:id", controller.deleteJabPelaksana);

// --- JENJANG JABATAN ---
router.get("/jenjang", controller.getAllJenjangJab);
router.get("/jenjang/:id", controller.getJenjangJabById);
router.post("/jenjang", validate(validation.createJenjangJabSchema), controller.createJenjangJab);
router.patch("/jenjang/:id", validate(validation.updateJenjangJabSchema), controller.updateJenjangJab);
router.delete("/jenjang/:id", controller.deleteJenjangJab);

// --- JENIS JABATAN ---
router.get("/jenis", controller.getAllJnsJab);
router.get("/jenis/:id", controller.getJnsJabById);
router.post("/jenis", validate(validation.createJnsJabSchema), controller.createJnsJab);
router.patch("/jenis/:id", validate(validation.updateJnsJabSchema), controller.updateJnsJab);
router.delete("/jenis/:id", controller.deleteJnsJab);

// --- NAMA JABATAN LAMA ---
router.get("/lama", controller.getAllNmJabLama);
router.get("/lama/:id", controller.getNmJabLamaById);
router.post("/lama", validate(validation.createNmJabLamaSchema), controller.createNmJabLama);
router.patch("/lama/:id", validate(validation.updateNmJabLamaSchema), controller.updateNmJabLama);
router.delete("/lama/:id", controller.deleteNmJabLama);

// --- JABATAN (Main) ---
router.get("/stats", controller.getStats);
router.get("/", controller.getAllJab);
router.get("/:id", controller.getJabById);
router.post("/", validate(validation.createJabSchema), controller.createJab);
router.patch("/:id", validate(validation.updateJabSchema), controller.updateJab);
router.delete("/:id", controller.deleteJab);

export default router;
