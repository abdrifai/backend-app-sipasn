import * as refPendidikanRepository from "./ref-pendidikan.repository.js";
import AppError from "../../utils/AppError.js";
import { randomUUID } from "node:crypto";

/**
 * Ambil semua data pendidikan
 */
export const getAllPendidikan = async (params) => {
  return refPendidikanRepository.findAll(params);
};

/**
 * Cari pendidikan berdasarkan ID
 */
export const getPendidikanById = async (id) => {
  const data = await refPendidikanRepository.findById(id);
  if (!data) throw new AppError("Data pendidikan tidak ditemukan", 404);
  return data;
};

/**
 * Tambah pendidikan baru
 */
export const createPendidikan = async (data) => {
  const payload = {
    id: randomUUID(),
    ...data,
  };
  return refPendidikanRepository.create(payload);
};

/**
 * Update data pendidikan
 */
export const updatePendidikan = async (id, data) => {
  await getPendidikanById(id); // pastikan data ada
  return refPendidikanRepository.update(id, data);
};

/**
 * Hapus data pendidikan (soft delete)
 */
export const deletePendidikan = async (id) => {
  await getPendidikanById(id); // pastikan data ada
  return refPendidikanRepository.softDelete(id);
};

/**
 * Ambil semua tingkat pendidikan (untuk dropdown)
 */
export const getAllTingkatPendidikan = async () => {
  return refPendidikanRepository.findAllTingkat();
};
