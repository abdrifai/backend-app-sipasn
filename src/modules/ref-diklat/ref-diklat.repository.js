import prisma from "../../config/database.js";

/**
 * Filter for active records (soft delete)
 */
const activeFilter = { is_deleted: false };

// --- JENIS DIKLAT ---

export const findAllJenis = async (params) => {
  const { page = 1, limit = 10, search = "" } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...activeFilter,
    OR: [
      { jnsDiklat: { contains: search } },
      { kode: { contains: search } },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.ref_jnsdiklat.findMany({
      where,
      skip,
      take: limit,
      orderBy: { kode: "asc" },
    }),
    prisma.ref_jnsdiklat.count({ where }),
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

export const findJenisById = async (id) => {
  return prisma.ref_jnsdiklat.findFirst({
    where: { id, ...activeFilter },
  });
};

export const createJenis = async (data) => {
  return prisma.ref_jnsdiklat.create({ data });
};

export const updateJenis = async (id, data) => {
  return prisma.ref_jnsdiklat.update({
    where: { id },
    data,
  });
};

export const softDeleteJenis = async (id) => {
  return prisma.ref_jnsdiklat.update({
    where: { id },
    data: { is_deleted: true },
  });
};

// --- JENJANG DIKLAT ---

export const findAllJenjang = async (params) => {
  const { page = 1, limit = 10, search = "", jnsDiklatId = "" } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...activeFilter,
    ...(jnsDiklatId && { jnsDiklat_id: jnsDiklatId }),
    OR: [
      { jenjangDiklat: { contains: search } },
      { kode: { contains: search } },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.ref_jenjangdiklat.findMany({
      where,
      skip,
      take: limit,
      orderBy: { kode: "asc" },
    }),
    prisma.ref_jenjangdiklat.count({ where }),
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

export const findJenjangById = async (id) => {
  return prisma.ref_jenjangdiklat.findFirst({
    where: { id, ...activeFilter },
  });
};

export const createJenjang = async (data) => {
  return prisma.ref_jenjangdiklat.create({ data });
};

export const updateJenjang = async (id, data) => {
  return prisma.ref_jenjangdiklat.update({
    where: { id },
    data,
  });
};

export const softDeleteJenjang = async (id) => {
  return prisma.ref_jenjangdiklat.update({
    where: { id },
    data: { is_deleted: true },
  });
};
