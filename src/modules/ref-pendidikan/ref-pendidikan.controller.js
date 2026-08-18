import * as refPendidikanService from "./ref-pendidikan.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";

/**
 * Controller untuk Manajemen Referensi Pendidikan
 */

export const getAll = asyncHandler(async (req, res) => {
  const result = await refPendidikanService.getAllPendidikan(req.query);
  sendSuccess(res, 200, "Data pendidikan berhasil diambil", result.data, result.meta);
});

export const getById = asyncHandler(async (req, res) => {
  const data = await refPendidikanService.getPendidikanById(req.params.id);
  sendSuccess(res, 200, "Detail pendidikan berhasil diambil", data);
});

export const create = asyncHandler(async (req, res) => {
  const data = await refPendidikanService.createPendidikan(req.body);
  sendSuccess(res, 201, "Data pendidikan berhasil ditambahkan", data);
});

export const update = asyncHandler(async (req, res) => {
  const data = await refPendidikanService.updatePendidikan(req.params.id, req.body);
  sendSuccess(res, 200, "Data pendidikan berhasil diperbarui", data);
});

export const remove = asyncHandler(async (req, res) => {
  await refPendidikanService.deletePendidikan(req.params.id);
  sendSuccess(res, 200, "Data pendidikan berhasil dihapus");
});

export const getTingkat = asyncHandler(async (req, res) => {
  const data = await refPendidikanService.getAllTingkatPendidikan();
  sendSuccess(res, 200, "Data tingkat pendidikan berhasil diambil", data);
});
