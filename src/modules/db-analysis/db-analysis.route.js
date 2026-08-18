import express from "express";
import * as dbController from "./db-analysis.controller.js";

const router = express.Router();

// Public endpoint untuk analisis (bisa di-protect nantinya)
router.get("/", dbController.getAnalysis);

export default router;
