import prisma from "../../config/database.js";

const activeFilter = { is_deleted: false };

export const findAll = async (params) => {
  const { page = 1, limit = 10, search = "" } = params;
  const p = parseInt(page);
  const l = parseInt(limit);
  const skip = (p - 1) * l;

  const where = {
    ...activeFilter,
    instansi: { contains: search },
  };

  const [data, total] = await Promise.all([
    prisma.ref_instansi.findMany({
      where,
      skip,
      take: l,
      orderBy: { kode: "asc" },
      select: {
        id: true,
        kode: true,
        instansi: true,
      },
    }),
    prisma.ref_instansi.count({ where }),
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
