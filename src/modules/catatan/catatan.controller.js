import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as catatanService from "./catatan.service.js";

/**
 * GET /api/catatan
 */
export const getAll = asyncHandler(async (req, res) => {
  const result = await catatanService.getAllCatatan(req.query);
  sendSuccess(res, 200, "Daftar catatan berhasil diambil", result.data, result.meta, { categories: result.categories });
});

/**
 * GET /api/catatan/:id
 */
export const getById = asyncHandler(async (req, res) => {
  const result = await catatanService.getCatatanById(req.params.id);
  sendSuccess(res, 200, "Detail catatan berhasil diambil", result);
});

/**
 * POST /api/catatan
 */
export const create = asyncHandler(async (req, res) => {
  const result = await catatanService.createCatatan(req.body);
  sendSuccess(res, 201, "Catatan berhasil dibuat", result);
});

/**
 * PUT /api/catatan/:id
 */
export const update = asyncHandler(async (req, res) => {
  const result = await catatanService.updateCatatan(req.params.id, req.body);
  sendSuccess(res, 200, "Catatan berhasil diperbarui", result);
});

/**
 * DELETE /api/catatan/:id
 */
export const remove = asyncHandler(async (req, res) => {
  const result = await catatanService.deleteCatatan(req.params.id);
  sendSuccess(res, 200, "Catatan berhasil dihapus", result);
});

/**
 * PATCH /api/catatan/:id/pin
 */
export const togglePin = asyncHandler(async (req, res) => {
  const result = await catatanService.togglePinCatatan(req.params.id);
  sendSuccess(res, 200, result.is_pinned ? "Catatan berhasil disematkan" : "Sematkan catatan dilepas", result);
});
