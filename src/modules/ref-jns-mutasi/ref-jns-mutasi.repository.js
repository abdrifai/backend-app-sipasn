import prisma from "../../config/database.js";

/**
 * Filter for active records (soft delete)
 */
const activeFilter = { is_deleted: false };

export const findAll = async (params) => {
  const { page = 1, limit = 10, search = "", is_aktif } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...activeFilter,
    ...(is_aktif !== undefined && is_aktif !== "" && is_aktif !== null
      ? { is_aktif: parseInt(is_aktif, 10) }
      : {}),
    ...(search
      ? {
          OR: [
            { jnsMutasi: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.ref_jnsmutasi.findMany({
      where,
      skip,
      take: limit,
      orderBy: { kode: "asc" },
      select: {
        id: true,
        kode: true,
        jnsMutasi: true,
        is_aktif: true,
        created_at: true,
        updated_at: true,
      },
    }),
    prisma.ref_jnsmutasi.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const findById = async (id) => {
  return prisma.ref_jnsmutasi.findFirst({
    where: { id, ...activeFilter },
    select: {
      id: true,
      kode: true,
      jnsMutasi: true,
      is_aktif: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const create = async (data) => {
  return prisma.ref_jnsmutasi.create({
    data,
    select: {
      id: true,
      kode: true,
      jnsMutasi: true,
      is_aktif: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const update = async (id, data) => {
  return prisma.ref_jnsmutasi.update({
    where: { id },
    data,
    select: {
      id: true,
      kode: true,
      jnsMutasi: true,
      is_aktif: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const softDelete = async (id) => {
  return prisma.ref_jnsmutasi.update({
    where: { id },
    data: { is_deleted: true },
    select: { id: true },
  });
};
