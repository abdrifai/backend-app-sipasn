import prisma from "../../config/database.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Ambil semua data jenis jabatan dengan pagination & search
 */
export const findAll = async (params = {}) => {
  const { search = "", is_aktif } = params;
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.max(1, parseInt(params.limit, 10) || 10);
  const skip = (page - 1) * limit;

  const where = {
    is_deleted: false,
    ...(search ? { jnsjab: { contains: search } } : {}),
    ...(is_aktif !== undefined && is_aktif !== "" && is_aktif !== null
      ? { is_aktif: parseInt(is_aktif, 10) }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.ref_jnsjab.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        kode: true,
        jnsjab: true,
        kode_sapk: true,
        is_aktif: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { kode: "asc" },
    }),
    prisma.ref_jnsjab.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Cari jenis jabatan berdasarkan ID
 */
export const findById = async (id) => {
  return prisma.ref_jnsjab.findFirst({
    where: { id, is_deleted: false },
    select: {
      id: true,
      kode: true,
      jnsjab: true,
      kode_sapk: true,
      is_aktif: true,
      created_at: true,
      updated_at: true,
    },
  });
};

/**
 * Tambah data jenis jabatan baru
 */
export const create = async (data) => {
  const id = data.id || uuidv4();
  const kode_sapk = data.kode_sapk !== undefined && data.kode_sapk !== null && data.kode_sapk !== ""
    ? parseInt(data.kode_sapk, 10)
    : null;
  const is_aktif = data.is_aktif !== undefined && data.is_aktif !== null && data.is_aktif !== ""
    ? parseInt(data.is_aktif, 10)
    : 1;

  return prisma.ref_jnsjab.create({
    data: {
      id,
      kode: String(data.kode),
      jnsjab: data.jnsjab.trim(),
      kode_sapk,
      is_aktif,
      is_deleted: false,
    },
    select: { id: true, kode: true, jnsjab: true, kode_sapk: true, is_aktif: true },
  });
};

/**
 * Update data jenis jabatan
 */
export const update = async (id, data) => {
  const updateData = {};
  if (data.kode !== undefined) updateData.kode = String(data.kode);
  if (data.jnsjab !== undefined) updateData.jnsjab = data.jnsjab.trim();
  if (data.kode_sapk !== undefined) {
    updateData.kode_sapk = data.kode_sapk !== null && data.kode_sapk !== ""
      ? parseInt(data.kode_sapk, 10)
      : null;
  }
  if (data.is_aktif !== undefined && data.is_aktif !== null && data.is_aktif !== "") {
    updateData.is_aktif = parseInt(data.is_aktif, 10);
  }

  return prisma.ref_jnsjab.update({
    where: { id },
    data: updateData,
    select: { id: true, kode: true, jnsjab: true, kode_sapk: true, is_aktif: true },
  });
};

/**
 * Soft delete data jenis jabatan
 */
export const softDelete = async (id) => {
  return prisma.ref_jnsjab.update({
    where: { id },
    data: { is_deleted: true },
    select: { id: true },
  });
};
