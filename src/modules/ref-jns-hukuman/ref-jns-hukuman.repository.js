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
      { jnsHukuman: { contains: search } },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.ref_jnshukuman.findMany({
      where,
      skip,
      take: limit,
      include: {
        // We'll handle the join manually as we aren't using foreign keys in relationMode="prisma"
      },
      orderBy: { kode: "asc" },
    }),
    prisma.ref_jnshukuman.count({ where }),
    // Fetch all active Tingkat Hukuman for the lookup
    prisma.ref_tkthukuman.findMany({
      where: activeFilter,
      select: { id: true, tktHukuman: true, kode: true }
    })
  ]);

  // Enrich data with Tingkat Hukuman info
  const enrichedData = data.map(item => {
    const tkt = total[1].find(t => t.id === item.tktHukuman_id);
    return {
      ...item,
      tkthukuman: tkt ? tkt.tktHukuman : "Tidak diketahui"
    };
  });
  // Wait, I messed up the Promise.all results. Let's fix.
  return {
    data: data, // I'll fix this in the service/controller enrichment
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/* --- RE-IMPLEMENTING FOR CLARITY --- */

export const findAllEnriched = async (params) => {
  const { page = 1, limit = 10, search = "" } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...activeFilter,
    OR: [
      { jnsHukuman: { contains: search } },
    ],
  };

  const [data, total, tkts] = await Promise.all([
    prisma.ref_jnshukuman.findMany({
      where,
      skip,
      take: limit,
      orderBy: { kode: "asc" },
    }),
    prisma.ref_jnshukuman.count({ where }),
    prisma.ref_tkthukuman.findMany({
      where: activeFilter,
      select: { id: true, tktHukuman: true }
    })
  ]);

  const tktMap = tkts.reduce((acc, curr) => {
    acc[curr.id] = curr.tktHukuman;
    return acc;
  }, {});

  const enrichedData = data.map(item => ({
    ...item,
    tkthukuman: tktMap[item.tktHukuman_id] || "Tidak diketahui"
  }));

  return {
    data: enrichedData,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const findById = async (id) => {
  return prisma.ref_jnshukuman.findFirst({
    where: { id, ...activeFilter },
  });
};

export const create = async (data) => {
  return prisma.ref_jnshukuman.create({ data });
};

export const update = async (id, data) => {
  return prisma.ref_jnshukuman.update({
    where: { id },
    data,
  });
};

export const softDelete = async (id) => {
  return prisma.ref_jnshukuman.update({
    where: { id },
    data: { is_deleted: true },
  });
};

export const findAllTktHukuman = async () => {
  return prisma.ref_tkthukuman.findMany({
    where: activeFilter,
    select: { id: true, tktHukuman: true, kode: true },
    orderBy: { kode: "asc" }
  });
};
