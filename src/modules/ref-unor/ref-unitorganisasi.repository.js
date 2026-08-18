import prisma from "../../config/database.js";

/**
 * Ambil daftar anak (children) unit organisasi berdasarkan parent_id
 */
export const findChildren = async (parentId, instansiId = null) => {
  const where = {
    is_deleted: false,
    isAktif: 1,
    ...(parentId ? { parent_id: parentId } : { parent_id: null }),
    ...(instansiId && !parentId ? { instansi_id: instansiId } : {}),
  };

  return prisma.ref_unitorganisasi.findMany({
    where,
    select: {
      id: true,
      parent_id: true,
      instansi_id: true,
      kode: true,
      nmUnor: true,
      level: true,
      jab_id: true,
      jnsUnor_id: true,
      eselon_id: true,
      is_pimpinan: true,
      isAktif: true,
      _count: {
        select: {
          children: {
            where: { is_deleted: false, isAktif: 1 },
          },
        },
      },
    },
    orderBy: { kode: "asc" },
  });
};

/**
 * Hitung statistik tabel ref_unitorganisasi
 */
export const getStats = async () => {
  const [total, induk, unor, sub, subSub, pimpinan] = await Promise.all([
    prisma.ref_unitorganisasi.count({ where: { is_deleted: false } }),
    prisma.ref_unitorganisasi.count({ where: { level: "induk", is_deleted: false } }),
    prisma.ref_unitorganisasi.count({ where: { level: "unor", is_deleted: false } }),
    prisma.ref_unitorganisasi.count({ where: { level: "sub", is_deleted: false } }),
    prisma.ref_unitorganisasi.count({ where: { level: "sub-sub", is_deleted: false } }),
    prisma.ref_unitorganisasi.count({ where: { is_pimpinan: true, is_deleted: false } }),
  ]);

  return {
    total,
    induk,
    unor,
    sub,
    subSub,
    pimpinan,
  };
};

/**
 * Bulk insert atau upsert unit organisasi dalam transaksi
 */
export const bulkCreate = async (records, tx = prisma) => {
  if (!records || records.length === 0) return { count: 0 };
  return tx.ref_unitorganisasi.createMany({
    data: records,
    skipDuplicates: true,
  });
};

/**
 * Bersihkan seluruh data ref_unitorganisasi (untuk re-migrasi bersih)
 */
export const truncate = async (tx = prisma) => {
  return tx.ref_unitorganisasi.deleteMany({});
};
