import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as service from "./ref-jabatan.service.js";

// --- JABATAN (Main) ---

export const getAllJab = asyncHandler(async (req, res) => {
  const result = await service.getAllJab(req.query);
  sendSuccess(res, 200, "Data jabatan berhasil diambil", result.data, result.meta);
});

export const getJabById = asyncHandler(async (req, res) => {
  const data = await service.getJabById(req.params.id);
  sendSuccess(res, 200, "Data jabatan berhasil diambil", data);
});

export const createJab = asyncHandler(async (req, res) => {
  const data = await service.createJab(req.body);
  sendSuccess(res, 201, "Data jabatan berhasil ditambahkan", data);
});

export const updateJab = asyncHandler(async (req, res) => {
  const data = await service.updateJab(req.params.id, req.body);
  sendSuccess(res, 200, "Data jabatan berhasil diperbarui", data);
});

export const deleteJab = asyncHandler(async (req, res) => {
  await service.deleteJab(req.params.id);
  sendSuccess(res, 200, "Data jabatan berhasil dihapus");
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await service.getStats();
  sendSuccess(res, 200, "Statistik master jabatan berhasil diambil", stats);
});

// --- JABATAN FUNGSIONAL ---

export const getAllJabFungsional = asyncHandler(async (req, res) => {
  const result = await service.getAllJabFungsional(req.query);
  sendSuccess(res, 200, "Data jabatan fungsional berhasil diambil", result.data, result.meta);
});

export const getJabFungsionalById = asyncHandler(async (req, res) => {
  const data = await service.getJabFungsionalById(req.params.id);
  sendSuccess(res, 200, "Data jabatan fungsional berhasil diambil", data);
});

export const createJabFungsional = asyncHandler(async (req, res) => {
  const data = await service.createJabFungsional(req.body);
  sendSuccess(res, 201, "Data jabatan fungsional berhasil ditambahkan", data);
});

export const updateJabFungsional = asyncHandler(async (req, res) => {
  const data = await service.updateJabFungsional(req.params.id, req.body);
  sendSuccess(res, 200, "Data jabatan fungsional berhasil diperbarui", data);
});

export const deleteJabFungsional = asyncHandler(async (req, res) => {
  await service.deleteJabFungsional(req.params.id);
  sendSuccess(res, 200, "Data jabatan fungsional berhasil dihapus");
});

// --- JABATAN PELAKSANA ---

export const getAllJabPelaksana = asyncHandler(async (req, res) => {
  const result = await service.getAllJabPelaksana(req.query);
  sendSuccess(res, 200, "Data jabatan pelaksana berhasil diambil", result.data, result.meta);
});

export const getJabPelaksanaById = asyncHandler(async (req, res) => {
  const data = await service.getJabPelaksanaById(req.params.id);
  sendSuccess(res, 200, "Data jabatan pelaksana berhasil diambil", data);
});

export const createJabPelaksana = asyncHandler(async (req, res) => {
  const data = await service.createJabPelaksana(req.body);
  sendSuccess(res, 201, "Data jabatan pelaksana berhasil ditambahkan", data);
});

export const updateJabPelaksana = asyncHandler(async (req, res) => {
  const data = await service.updateJabPelaksana(req.params.id, req.body);
  sendSuccess(res, 200, "Data jabatan pelaksana berhasil diperbarui", data);
});

export const deleteJabPelaksana = asyncHandler(async (req, res) => {
  await service.deleteJabPelaksana(req.params.id);
  sendSuccess(res, 200, "Data jabatan pelaksana berhasil dihapus");
});

// --- JENJANG JABATAN ---

export const getAllJenjangJab = asyncHandler(async (req, res) => {
  const result = await service.getAllJenjangJab(req.query);
  sendSuccess(res, 200, "Data jenjang jabatan berhasil diambil", result.data, result.meta);
});

export const getJenjangJabById = asyncHandler(async (req, res) => {
  const data = await service.getJenjangJabById(req.params.id);
  sendSuccess(res, 200, "Data jenjang jabatan berhasil diambil", data);
});

export const createJenjangJab = asyncHandler(async (req, res) => {
  const data = await service.createJenjangJab(req.body);
  sendSuccess(res, 201, "Data jenjang jabatan berhasil ditambahkan", data);
});

export const updateJenjangJab = asyncHandler(async (req, res) => {
  const data = await service.updateJenjangJab(req.params.id, req.body);
  sendSuccess(res, 200, "Data jenjang jabatan berhasil diperbarui", data);
});

export const deleteJenjangJab = asyncHandler(async (req, res) => {
  await service.deleteJenjangJab(req.params.id);
  sendSuccess(res, 200, "Data jenjang jabatan berhasil dihapus");
});

// --- JENIS JABATAN ---

export const getAllJnsJab = asyncHandler(async (req, res) => {
  const result = await service.getAllJnsJab(req.query);
  sendSuccess(res, 200, "Data jenis jabatan berhasil diambil", result.data, result.meta);
});

export const getJnsJabById = asyncHandler(async (req, res) => {
  const data = await service.getJnsJabById(req.params.id);
  sendSuccess(res, 200, "Data jenis jabatan berhasil diambil", data);
});

export const createJnsJab = asyncHandler(async (req, res) => {
  const data = await service.createJnsJab(req.body);
  sendSuccess(res, 201, "Data jenis jabatan berhasil ditambahkan", data);
});

export const updateJnsJab = asyncHandler(async (req, res) => {
  const data = await service.updateJnsJab(req.params.id, req.body);
  sendSuccess(res, 200, "Data jenis jabatan berhasil diperbarui", data);
});

export const deleteJnsJab = asyncHandler(async (req, res) => {
  await service.deleteJnsJab(req.params.id);
  sendSuccess(res, 200, "Data jenis jabatan berhasil dihapus");
});

// --- NAMA JABATAN LAMA ---

export const getAllNmJabLama = asyncHandler(async (req, res) => {
  const result = await service.getAllNmJabLama(req.query);
  sendSuccess(res, 200, "Data nama jabatan lama berhasil diambil", result.data, result.meta);
});

export const getNmJabLamaById = asyncHandler(async (req, res) => {
  const data = await service.getNmJabLamaById(req.params.id);
  sendSuccess(res, 200, "Data nama jabatan lama berhasil diambil", data);
});

export const createNmJabLama = asyncHandler(async (req, res) => {
  const data = await service.createNmJabLama(req.body);
  sendSuccess(res, 201, "Data nama jabatan lama berhasil ditambahkan", data);
});

export const updateNmJabLama = asyncHandler(async (req, res) => {
  const data = await service.updateNmJabLama(req.params.id, req.body);
  sendSuccess(res, 200, "Data nama jabatan lama berhasil diperbarui", data);
});

export const deleteNmJabLama = asyncHandler(async (req, res) => {
  await service.deleteNmJabLama(req.params.id);
  sendSuccess(res, 200, "Data nama jabatan lama berhasil dihapus");
});
