import prisma from "../../config/database.js";

/**
 * Ambil semua data pendidikan dengan pagination & search
 */
export const findAll = async (params) => {
  const { page = 1, limit = 10, search = "" } = params;
  const skip = (page - 1) * limit;

  const where = {
    is_deleted: false,
    OR: [
      { pend: { contains: search } },
      { kode: { contains: search } },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.ref_pend.findMany({
      where,
      skip,
      take: limit,
      include: {
        ref_tktpend: {
          select: { id: true, tktpend: true },
        },
      },
      orderBy: { pend: "asc" },
    }),
    prisma.ref_pend.count({ where }),
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
 * Cari pendidikan berdasarkan ID
 */
export const findById = async (id) => {
  return prisma.ref_pend.findFirst({
    where: { id, is_deleted: false },
    include: {
      ref_tktpend: {
        select: { id: true, tktpend: true },
      },
    },
  });
};

/**
 * Tambah data pendidikan baru
 */
export const create = async (data) => {
  return prisma.ref_pend.create({
    data,
    include: {
      ref_tktpend: {
        select: { id: true, tktpend: true },
      },
    },
  });
};

/**
 * Update data pendidikan
 */
export const update = async (id, data) => {
  return prisma.ref_pend.update({
    where: { id },
    data,
    include: {
      ref_tktpend: {
        select: { id: true, tktpend: true },
      },
    },
  });
};

/**
 * Soft delete data pendidikan
 */
export const softDelete = async (id) => {
  return prisma.ref_pend.update({
    where: { id },
    data: { is_deleted: true },
  });
};

/**
 * Ambil semua data tingkat pendidikan
 */
export const findAllTingkat = async () => {
  return prisma.ref_tktpend.findMany({
    select: { id: true, tktpend: true },
    orderBy: { id: "asc" },
  });
};
