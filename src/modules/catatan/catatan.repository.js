import prisma from "../../config/database.js";

/**
 * Ambil daftar catatan dengan pencarian, filter, dan pagination
 */
export const findAll = async ({ search = "", kategori = "", is_pinned, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const where = {
    is_deleted: false,
    ...(search && {
      OR: [
        { judul: { contains: search } },
        { konten: { contains: search } },
        { kategori: { contains: search } },
        { penulis: { contains: search } },
      ],
    }),
    ...(kategori && { kategori }),
    ...(is_pinned !== undefined && { is_pinned }),
  };

  const [data, total] = await Promise.all([
    prisma.ta_catatan.findMany({
      where,
      select: {
        id: true,
        judul: true,
        konten: true,
        kategori: true,
        penulis: true,
        is_pinned: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: [
        { is_pinned: "desc" },
        { updated_at: "desc" },
        { created_at: "desc" },
      ],
      skip,
      take: limit,
    }),
    prisma.ta_catatan.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

/**
 * Cari catatan berdasarkan ID
 */
export const findById = async (id) => {
  return prisma.ta_catatan.findFirst({
    where: { id, is_deleted: false },
    select: {
      id: true,
      judul: true,
      konten: true,
      kategori: true,
      penulis: true,
      is_pinned: true,
      created_at: true,
      updated_at: true,
    },
  });
};

/**
 * Buat catatan baru
 */
export const create = async (data) => {
  return prisma.ta_catatan.create({
    data,
    select: {
      id: true,
      judul: true,
      konten: true,
      kategori: true,
      penulis: true,
      is_pinned: true,
      created_at: true,
      updated_at: true,
    },
  });
};

/**
 * Update catatan
 */
export const update = async (id, data) => {
  return prisma.ta_catatan.update({
    where: { id },
    data,
    select: {
      id: true,
      judul: true,
      konten: true,
      kategori: true,
      penulis: true,
      is_pinned: true,
      created_at: true,
      updated_at: true,
    },
  });
};

/**
 * Soft delete catatan
 */
export const softDelete = async (id) => {
  return prisma.ta_catatan.update({
    where: { id },
    data: { is_deleted: true },
    select: { id: true },
  });
};

/**
 * Ambil daftar kategori catatan yang ada
 */
export const findCategories = async () => {
  const result = await prisma.ta_catatan.findMany({
    where: { is_deleted: false, kategori: { not: null } },
    select: { kategori: true },
    distinct: ["kategori"],
    orderBy: { kategori: "asc" },
  });
  return result.map((r) => r.kategori).filter(Boolean);
};
