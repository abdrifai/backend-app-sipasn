import * as catatanRepository from "./catatan.repository.js";
import AppError from "../../utils/AppError.js";

/**
 * Ambil semua catatan dengan parameter filter & pagination
 */
export const getAllCatatan = async (query = {}) => {
  const { search = "", kategori = "", is_pinned, page = 1, limit = 20 } = query;

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const parsedPinned = is_pinned === "true" ? true : is_pinned === "false" ? false : undefined;

  const result = await catatanRepository.findAll({
    search: search.trim(),
    kategori: kategori.trim(),
    is_pinned: parsedPinned,
    page: parsedPage,
    limit: parsedLimit,
  });

  const categories = await catatanRepository.findCategories();

  return {
    ...result,
    categories,
  };
};

/**
 * Ambil detail catatan berdasarkan ID
 */
export const getCatatanById = async (id) => {
  const catatan = await catatanRepository.findById(id);
  if (!catatan) {
    throw new AppError("Catatan tidak ditemukan", 404);
  }
  return catatan;
};

/**
 * Tambah catatan baru
 */
export const createCatatan = async (payload) => {
  const data = {
    judul: payload.judul.trim(),
    konten: payload.konten.trim(),
    kategori: payload.kategori ? payload.kategori.trim() : "Umum",
    penulis: payload.penulis ? payload.penulis.trim() : "Administrator",
    is_pinned: payload.is_pinned ?? false,
  };

  return catatanRepository.create(data);
};

/**
 * Update catatan
 */
export const updateCatatan = async (id, payload) => {
  const existing = await catatanRepository.findById(id);
  if (!existing) {
    throw new AppError("Catatan tidak ditemukan", 404);
  }

  const updateData = {
    ...(payload.judul !== undefined && { judul: payload.judul.trim() }),
    ...(payload.konten !== undefined && { konten: payload.konten.trim() }),
    ...(payload.kategori !== undefined && { kategori: payload.kategori ? payload.kategori.trim() : null }),
    ...(payload.penulis !== undefined && { penulis: payload.penulis ? payload.penulis.trim() : null }),
    ...(payload.is_pinned !== undefined && { is_pinned: payload.is_pinned }),
  };

  return catatanRepository.update(id, updateData);
};

/**
 * Hapus catatan (soft delete)
 */
export const deleteCatatan = async (id) => {
  const existing = await catatanRepository.findById(id);
  if (!existing) {
    throw new AppError("Catatan tidak ditemukan", 404);
  }

  await catatanRepository.softDelete(id);
  return { id };
};

/**
 * Toggle pin catatan
 */
export const togglePinCatatan = async (id) => {
  const existing = await catatanRepository.findById(id);
  if (!existing) {
    throw new AppError("Catatan tidak ditemukan", 404);
  }

  return catatanRepository.update(id, { is_pinned: !existing.is_pinned });
};
