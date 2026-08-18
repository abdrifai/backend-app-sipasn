import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as service from "./ref-diklat.service.js";

// --- JENIS DIKLAT ---

export const getAllJenis = asyncHandler(async (req, res) => {
  const result = await service.getAllJenis(req.query);
  sendSuccess(res, 200, "Daftar jenis diklat berhasil diambil", result.data, result.meta);
});

export const getJenisById = asyncHandler(async (req, res) => {
  const jenis = await service.getJenisById(req.params.id);
  sendSuccess(res, 200, "Data jenis diklat berhasil diambil", jenis);
});

export const createJenis = asyncHandler(async (req, res) => {
  const jenis = await service.createJenis(req.body);
  sendSuccess(res, 201, "Jenis diklat berhasil ditambahkan", jenis);
});

export const updateJenis = asyncHandler(async (req, res) => {
  const jenis = await service.updateJenis(req.params.id, req.body);
  sendSuccess(res, 200, "Jenis diklat berhasil diperbarui", jenis);
});

export const deleteJenis = asyncHandler(async (req, res) => {
  await service.deleteJenis(req.params.id);
  sendSuccess(res, 200, "Jenis diklat berhasil dihapus");
});

// --- JENJANG DIKLAT ---

export const getAllJenjang = asyncHandler(async (req, res) => {
  const result = await service.getAllJenjang(req.query);
  sendSuccess(res, 200, "Daftar jenjang diklat berhasil diambil", result.data, result.meta);
});

export const getJenjangById = asyncHandler(async (req, res) => {
  const jenjang = await service.getJenjangById(req.params.id);
  sendSuccess(res, 200, "Data jenjang diklat berhasil diambil", jenjang);
});

export const createJenjang = asyncHandler(async (req, res) => {
  const jenjang = await service.createJenjang(req.body);
  sendSuccess(res, 201, "Jenjang diklat berhasil ditambahkan", jenjang);
});

export const updateJenjang = asyncHandler(async (req, res) => {
  const jenjang = await service.updateJenjang(req.params.id, req.body);
  sendSuccess(res, 200, "Jenjang diklat berhasil diperbarui", jenjang);
});

export const deleteJenjang = asyncHandler(async (req, res) => {
  await service.deleteJenjang(req.params.id);
  sendSuccess(res, 200, "Jenjang diklat berhasil dihapus");
});
