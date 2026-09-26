import prisma from "../../config/database.js";

/**
 * Ambil daftar opsi jenis perubahan data induk (khusus non-kedudukan / id != 1)
 */
export const findJenisPerubahanOptions = async () => {
  return prisma.ref_perubahan_data_induk.findMany({
    where: {
      id: { not: 1 }, // Kecualikan Perubahan Kedudukan PNS
    },
    select: {
      id: true,
      jns_perubahan: true,
    },
    orderBy: { id: "asc" },
  });
};

/**
 * Hitung statistik riwayat per jenis perubahan data induk non-kedudukan
 */
export const countStatsByJenis = async () => {
  const groups = await prisma.rwt_perubahan_data_induk.groupBy({
    by: ["jns_perubahan_id"],
    where: {
      is_deleted: false,
      jns_perubahan_id: { not: 1 },
    },
    _count: true,
  });

  return groups;
};

/**
 * Cari data riwayat perubahan data induk dengan filter & pagination
 */
export const findPeremajaanList = async ({ where, skip, take }) => {
  return prisma.rwt_perubahan_data_induk.findMany({
    where,
    skip,
    take,
    select: {
      id: true,
      pegawai_id: true,
      jns_perubahan_id: true,
      kedudukanpns_id: true,
      sk: true,
      tglSk: true,
      tmtSk: true,
      pengesahan: true,
      ket: true,
      file_sk: true,
      created_at: true,
    },
    orderBy: [{ tmtSk: "desc" }, { created_at: "desc" }],
  });
};

/**
 * Hitung total riwayat perubahan data induk
 */
export const countPeremajaan = async (where) => {
  return prisma.rwt_perubahan_data_induk.count({ where });
};

/**
 * Buat record riwayat baru
 */
export const createRecord = async (data, tx = prisma) => {
  return tx.rwt_perubahan_data_induk.create({
    data,
    select: {
      id: true,
      pegawai_id: true,
      jns_perubahan_id: true,
      sk: true,
      tglSk: true,
      tmtSk: true,
      pengesahan: true,
      ket: true,
      file_sk: true,
    },
  });
};

/**
 * Cari satu record berdasarkan ID
 */
export const findById = async (id) => {
  return prisma.rwt_perubahan_data_induk.findFirst({
    where: { id, is_deleted: false },
    select: {
      id: true,
      pegawai_id: true,
      jns_perubahan_id: true,
      file_sk: true,
    },
  });
};

/**
 * Soft delete record
 */
export const softDeleteRecord = async (id) => {
  return prisma.rwt_perubahan_data_induk.update({
    where: { id },
    data: { is_deleted: true },
    select: { id: true },
  });
};
