import prisma from "../../config/database.js";

/**
 * Filter for active records (soft delete)
 */
const activeFilter = { is_deleted: false };

export const findAll = async (params) => {
  const { page = 1, limit = 10, search = "" } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...activeFilter,
    OR: [
      { jnsMutasi: { contains: search } },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.ref_jnsmutasi.findMany({
      where,
      skip,
      take: limit,
      orderBy: { kode: "asc" },
    }),
    prisma.ref_jnsmutasi.count({ where }),
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

export const findById = async (id) => {
  return prisma.ref_jnsmutasi.findFirst({
    where: { id, ...activeFilter },
  });
};

export const create = async (data) => {
  return prisma.ref_jnsmutasi.create({ data });
};

export const update = async (id, data) => {
  return prisma.ref_jnsmutasi.update({
    where: { id },
    data,
  });
};

export const softDelete = async (id) => {
  return prisma.ref_jnsmutasi.update({
    where: { id },
    data: { is_deleted: true },
  });
};
