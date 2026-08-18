import * as refJabRepo from "./ref-jab.repository.js";
import * as refJenjangJabRepo from "./ref-jenjang-jab.repository.js";
import * as refJnsJabRepo from "./ref-jns-jab.repository.js";
import AppError from "../../utils/AppError.js";

// --- JABATAN (Main / Unified Master Jabatan) ---

export const getAllJab = async (params = {}) => {
  return refJabRepo.findAll(params);
};

export const getJabById = async (id) => {
  const data = await refJabRepo.findById(id);
  if (!data) throw new AppError("Data jabatan tidak ditemukan atau telah dihapus", 404);
  return data;
};

export const createJab = async (data) => {
  return refJabRepo.create(data);
};

export const updateJab = async (id, data) => {
  const existing = await refJabRepo.findById(id);
  if (!existing) throw new AppError("Data jabatan tidak ditemukan", 404);
  return refJabRepo.update(id, data);
};

export const deleteJab = async (id) => {
  const existing = await refJabRepo.findById(id);
  if (!existing) throw new AppError("Data jabatan tidak ditemukan", 404);
  return refJabRepo.softDelete(id);
};

export const getStats = async () => {
  return refJabRepo.getStats();
};

// --- JABATAN FUNGSIONAL ---

export const getAllJabFungsional = async (params = {}) => {
  return refJabRepo.findAll({ ...params, kategori: "FUNGSIONAL" });
};

export const getJabFungsionalById = async (id) => {
  return getJabById(id);
};

export const createJabFungsional = async (data) => {
  return refJabRepo.create({ ...data, kategori: "FUNGSIONAL" });
};

export const updateJabFungsional = async (id, data) => {
  return updateJab(id, { ...data, kategori: "FUNGSIONAL" });
};

export const deleteJabFungsional = async (id) => {
  return deleteJab(id);
};

// --- JABATAN PELAKSANA ---

export const getAllJabPelaksana = async (params = {}) => {
  return refJabRepo.findAll({ ...params, kategori: "PELAKSANA" });
};

export const getJabPelaksanaById = async (id) => {
  return getJabById(id);
};

export const createJabPelaksana = async (data) => {
  return refJabRepo.create({ ...data, kategori: "PELAKSANA" });
};

export const updateJabPelaksana = async (id, data) => {
  return updateJab(id, { ...data, kategori: "PELAKSANA" });
};

export const deleteJabPelaksana = async (id) => {
  return deleteJab(id);
};

// --- JENJANG JABATAN ---

export const getAllJenjangJab = async (params) => {
  return refJenjangJabRepo.findAll(params);
};

export const getJenjangJabById = async (id) => {
  const data = await refJenjangJabRepo.findById(id);
  if (!data) throw new AppError("Data jenjang jabatan tidak ditemukan", 404);
  return data;
};

export const createJenjangJab = async (data) => {
  return refJenjangJabRepo.create(data);
};

export const updateJenjangJab = async (id, data) => {
  const existing = await refJenjangJabRepo.findById(id);
  if (!existing) throw new AppError("Data jenjang jabatan tidak ditemukan", 404);
  return refJenjangJabRepo.update(id, data);
};

export const deleteJenjangJab = async (id) => {
  const existing = await refJenjangJabRepo.findById(id);
  if (!existing) throw new AppError("Data jenjang jabatan tidak ditemukan", 404);
  return refJenjangJabRepo.softDelete(id);
};

// --- JENIS JABATAN ---

export const getAllJnsJab = async (params) => {
  return refJnsJabRepo.findAll(params);
};

export const getJnsJabById = async (id) => {
  const data = await refJnsJabRepo.findById(id);
  if (!data) throw new AppError("Data jenis jabatan tidak ditemukan", 404);
  return data;
};

export const createJnsJab = async (data) => {
  return refJnsJabRepo.create(data);
};

export const updateJnsJab = async (id, data) => {
  const existing = await refJnsJabRepo.findById(id);
  if (!existing) throw new AppError("Data jenis jabatan tidak ditemukan", 404);
  return refJnsJabRepo.update(id, data);
};

export const deleteJnsJab = async (id) => {
  const existing = await refJnsJabRepo.findById(id);
  if (!existing) throw new AppError("Data jenis jabatan tidak ditemukan", 404);
  return refJnsJabRepo.softDelete(id);
};

// --- NAMA JABATAN LAMA (DEPRECATED -> Handled by ref_jabatan) ---

export const getAllNmJabLama = async (params = {}) => {
  return refJabRepo.findAll(params);
};

export const getNmJabLamaById = async (id) => {
  return getJabById(id);
};

export const createNmJabLama = async (data) => {
  return refJabRepo.create(data);
};

export const updateNmJabLama = async (id, data) => {
  return updateJab(id, data);
};

export const deleteNmJabLama = async (id) => {
  return deleteJab(id);
};
