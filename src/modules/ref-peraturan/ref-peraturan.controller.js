import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as service from "./ref-peraturan.service.js";

export const getAll = asyncHandler(async (req, res) => {
  const result = await service.getAllPeraturan(req.query);
  return sendSuccess(res, 200, "Data arsip peraturan berhasil diambil", result.data, result.meta);
});

export const getById = asyncHandler(async (req, res) => {
  const data = await service.getPeraturanById(req.params.id);
  return sendSuccess(res, 200, "Detail arsip peraturan berhasil diambil", data);
});

export const getFilterOptions = asyncHandler(async (req, res) => {
  const options = await service.getFilterOptions();
  return sendSuccess(res, 200, "Opsi filter peraturan berhasil diambil", options);
});

export const searchLookup = asyncHandler(async (req, res) => {
  const { search, exclude_id } = req.query;
  const result = await service.searchLookup(search, exclude_id);
  return sendSuccess(res, 200, "Hasil pencarian referensi peraturan", result);
});

export const getHierarchyTree = asyncHandler(async (req, res) => {
  const { kategori } = req.query;
  const result = await service.getHierarchyTree(kategori);
  return sendSuccess(res, 200, "Data pohon hierarki peraturan berhasil diambil", result);
});

export const create = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await service.createPeraturan(req.body, req.file, userId);
  return sendSuccess(res, 201, "Arsip peraturan berhasil ditambahkan", result);
});

export const update = asyncHandler(async (req, res) => {
  const result = await service.updatePeraturan(req.params.id, req.body, req.file);
  return sendSuccess(res, 200, "Arsip peraturan berhasil diperbarui", result);
});

export const deleteById = asyncHandler(async (req, res) => {
  const result = await service.deletePeraturan(req.params.id);
  return sendSuccess(res, 200, "Arsip peraturan berhasil dihapus", result);
});
