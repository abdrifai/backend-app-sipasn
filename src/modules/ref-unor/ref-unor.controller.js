import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as service from "./ref-unor.service.js";

import * as treeService from "./ref-unor.tree.service.js";
import * as migrationService from "./ref-unor.migration.service.js";

// --- MIGRATION CONTROLS ---

export const getMigrationStats = asyncHandler(async (req, res) => {
  const data = await migrationService.getMigrationComparison();
  sendSuccess(res, 200, "Statistik migrasi unit organisasi berhasil diambil", data);
});

export const runMigration = asyncHandler(async (req, res) => {
  const result = await migrationService.executeUnorMigration();
  sendSuccess(res, 200, result.message, result.data);
});

// --- TREE VIEW ---

export const getTree = asyncHandler(async (req, res) => {
  const data = await treeService.getUnorTree(req.query);
  sendSuccess(res, 200, "Data tree unit organisasi berhasil diambil", data);
});

// --- JENIS UNOR ---

export const getAllJnsUnor = asyncHandler(async (req, res) => {
  const result = await service.getAllJnsUnor(req.query);
  if (result && result.meta) {
    sendSuccess(res, 200, "Data jenis unit organisasi berhasil diambil", result.data, result.meta);
  } else {
    sendSuccess(res, 200, "Data jenis unit organisasi berhasil diambil", result);
  }
});

export const getJnsUnorById = asyncHandler(async (req, res) => {
  const data = await service.getJnsUnorById(req.params.id);
  sendSuccess(res, 200, "Detail jenis unit organisasi berhasil diambil", data);
});

export const createJnsUnor = asyncHandler(async (req, res) => {
  const data = await service.createJnsUnor(req.body);
  sendSuccess(res, 201, "Jenis unit organisasi berhasil ditambahkan", data);
});

export const updateJnsUnor = asyncHandler(async (req, res) => {
  const data = await service.updateJnsUnor(req.params.id, req.body);
  sendSuccess(res, 200, "Jenis unit organisasi berhasil diperbarui", data);
});

export const deleteJnsUnor = asyncHandler(async (req, res) => {
  const data = await service.deleteJnsUnor(req.params.id);
  sendSuccess(res, 200, "Jenis unit organisasi berhasil dihapus", data);
});

// --- ESELON ---

export const getAllEselon = asyncHandler(async (req, res) => {
  const data = await service.getAllEselon();
  sendSuccess(res, 200, "Data referensi eselon berhasil diambil", data);
});

// --- UNOR INDUK ---

export const getAllUnorInduk = asyncHandler(async (req, res) => {
  const result = await service.getAllUnorInduk(req.query);
  sendSuccess(res, 200, "Data unit organisasi induk berhasil diambil", result.data, result.meta);
});

export const getUnorIndukById = asyncHandler(async (req, res) => {
  const data = await service.getUnorIndukById(req.params.id);
  sendSuccess(res, 200, "Data unit organisasi induk berhasil diambil", data);
});

export const createUnorInduk = asyncHandler(async (req, res) => {
  const data = await service.createUnorInduk(req.body);
  sendSuccess(res, 201, "Unit organisasi induk berhasil dibuat", data);
});

export const updateUnorInduk = asyncHandler(async (req, res) => {
  const data = await service.updateUnorInduk(req.params.id, req.body);
  sendSuccess(res, 200, "Unit organisasi induk berhasil diperbarui", data);
});

export const deleteUnorInduk = asyncHandler(async (req, res) => {
  await service.deleteUnorInduk(req.params.id);
  sendSuccess(res, 200, "Unit organisasi induk berhasil dihapus");
});

// --- UNOR ---

export const getAllUnor = asyncHandler(async (req, res) => {
  const result = await service.getAllUnor(req.query);
  sendSuccess(res, 200, "Data unit organisasi berhasil diambil", result.data, result.meta);
});

export const getUnorById = asyncHandler(async (req, res) => {
  const data = await service.getUnorById(req.params.id);
  sendSuccess(res, 200, "Data unit organisasi berhasil diambil", data);
});

export const createUnor = asyncHandler(async (req, res) => {
  const data = await service.createUnor(req.body);
  sendSuccess(res, 201, "Unit organisasi berhasil dibuat", data);
});

export const updateUnor = asyncHandler(async (req, res) => {
  const data = await service.updateUnor(req.params.id, req.body);
  sendSuccess(res, 200, "Unit organisasi berhasil diperbarui", data);
});

export const deleteUnor = asyncHandler(async (req, res) => {
  await service.deleteUnor(req.params.id);
  sendSuccess(res, 200, "Unit organisasi berhasil dihapus");
});

// --- SUB UNOR ---

export const getAllSubUnor = asyncHandler(async (req, res) => {
  const result = await service.getAllSubUnor(req.query);
  sendSuccess(res, 200, "Data sub unit organisasi berhasil diambil", result.data, result.meta);
});

export const getSubUnorById = asyncHandler(async (req, res) => {
  const data = await service.getSubUnorById(req.params.id);
  sendSuccess(res, 200, "Data sub unit organisasi berhasil diambil", data);
});

export const createSubUnor = asyncHandler(async (req, res) => {
  const data = await service.createSubUnor(req.body);
  sendSuccess(res, 201, "Sub unit organisasi berhasil dibuat", data);
});

export const updateSubUnor = asyncHandler(async (req, res) => {
  const data = await service.updateSubUnor(req.params.id, req.body);
  sendSuccess(res, 200, "Sub unit organisasi berhasil diperbarui", data);
});

export const deleteSubUnor = asyncHandler(async (req, res) => {
  await service.deleteSubUnor(req.params.id);
  sendSuccess(res, 200, "Sub unit organisasi berhasil dihapus");
});

// --- SUB UNOR SUB ---

export const getAllSubUnorSub = asyncHandler(async (req, res) => {
  const result = await service.getAllSubUnorSub(req.query);
  sendSuccess(res, 200, "Data sub unit organisasi sub berhasil diambil", result.data, result.meta);
});

export const getSubUnorSubById = asyncHandler(async (req, res) => {
  const data = await service.getSubUnorSubById(req.params.id);
  sendSuccess(res, 200, "Data sub unit organisasi sub berhasil diambil", data);
});

export const createSubUnorSub = asyncHandler(async (req, res) => {
  const data = await service.createSubUnorSub(req.body);
  sendSuccess(res, 201, "Sub unit organisasi sub berhasil dibuat", data);
});

export const updateSubUnorSub = asyncHandler(async (req, res) => {
  const data = await service.updateSubUnorSub(req.params.id, req.body);
  sendSuccess(res, 200, "Sub unit organisasi sub berhasil diperbarui", data);
});

export const deleteSubUnorSub = asyncHandler(async (req, res) => {
  await service.deleteSubUnorSub(req.params.id);
  sendSuccess(res, 200, "Sub unit organisasi sub berhasil dihapus");
});
