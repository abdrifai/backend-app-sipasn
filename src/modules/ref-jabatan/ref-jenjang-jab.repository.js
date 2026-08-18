import prisma from "../../config/database.js";

/**
 * Ambil semua data jenjang jabatan dengan pagination & search
 */
export const findAll = async (params = {}) => {
  const { search = "", jnsjab_id = "" } = params;
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.max(1, parseInt(params.limit, 10) || 10);
  const skip = (page - 1) * limit;

  let jnsFilter = {};
  if (jnsjab_id) {
    if (typeof jnsjab_id === "string" && jnsjab_id.includes(",")) {
      const ids = jnsjab_id.split(",").map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
      if (ids.length > 0) jnsFilter = { jnsjab_id: { in: ids } };
    } else {
      const num = parseInt(jnsjab_id, 10);
      if (num === 10 || num === 1) {
        jnsFilter = { jnsjab_id: { in: [10, 1] } };
      } else if (num === 16 || num === 12 || num === 2) {
        jnsFilter = { jnsjab_id: { in: [16, 12, 2] } };
      } else if (num === 14 || num === 3) {
        jnsFilter = { jnsjab_id: { in: [14, 3] } };
      } else if (num === 17) {
        jnsFilter = { jnsjab_id: { in: [17, 1] } };
      } else if (!isNaN(num)) {
        jnsFilter = { jnsjab_id: num };
      }
    }
  }

  const where = {
    is_deleted: false,
    AND: [
      search ? { jenjangjab: { contains: search } } : {},
      jnsFilter,
    ],
  };

  const [data, total] = await Promise.all([
    prisma.ref_jenjangjab.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        jenjangjab: true,
        jnsjab_id: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.ref_jenjangjab.count({ where }),
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
 * Helper untuk memetakan input ref_jnsjab (UUID / Kode / ID) ke jnsjab_id jenjang
 */
async function resolveJnsJabId(input) {
  if (!input) return 1;

  // Jika input adalah string UUID atau string kode
  if (typeof input === "string") {
    // 1. Cek apakah ada record di ref_jnsjab berdasarkan ID (UUID)
    const recordById = await prisma.ref_jnsjab.findFirst({
      where: { id: input, is_deleted: false },
      select: { kode: true, jnsjab: true, kode_sapk: true }
    });

    if (recordById && recordById.kode) {
      const parsedKode = parseInt(recordById.kode, 10);
      if (!isNaN(parsedKode)) return parsedKode;
    }

    // 2. Cek apakah ada record di ref_jnsjab berdasarkan kode
    const recordByKode = await prisma.ref_jnsjab.findFirst({
      where: { kode: input, is_deleted: false },
      select: { kode: true, jnsjab: true, kode_sapk: true }
    });

    if (recordByKode && recordByKode.kode) {
      const parsedKode = parseInt(recordByKode.kode, 10);
      if (!isNaN(parsedKode)) return parsedKode;
    }
  }

  // Jika input adalah angka langsung
  const num = parseInt(input, 10);
  if (!isNaN(num)) return num;

  return 1;
}

/**
 * Cari jenjang jabatan berdasarkan ID
 */
export const findById = async (id) => {
  return prisma.ref_jenjangjab.findFirst({
    where: { id: BigInt(id), is_deleted: false },
  });
};

/**
 * Tambah data jenjang jabatan baru
 */
export const create = async (data) => {
  const jnsjab_id = await resolveJnsJabId(data.jnsjab_id);

  return prisma.ref_jenjangjab.create({
    data: {
      ...data,
      jnsjab_id,
    },
    select: { id: true, jenjangjab: true, jnsjab_id: true },
  });
};

/**
 * Update data jenjang jabatan
 */
export const update = async (id, data) => {
  const updateData = { ...data };
  if (updateData.jnsjab_id !== undefined) {
    updateData.jnsjab_id = await resolveJnsJabId(updateData.jnsjab_id);
  }

  return prisma.ref_jenjangjab.update({
    where: { id: BigInt(id) },
    data: updateData,
    select: { id: true, jenjangjab: true, jnsjab_id: true },
  });
};

/**
 * Soft delete data jenjang jabatan
 */
export const softDelete = async (id) => {
  return prisma.ref_jenjangjab.update({
    where: { id: BigInt(id) },
    data: { is_deleted: true },
    select: { id: true },
  });
};
