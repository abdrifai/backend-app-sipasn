import prisma from "../../config/database.js";

/**
 * Mengambil daftar SK Kolektif dengan pagination dan pencarian
 */
export const findAllSkKolektif = async ({ page = 1, limit = 10, search = "", status = "" }) => {
  const skip = (page - 1) * limit;

  const where = {
    is_deleted: false,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { no_sk: { contains: search } },
            { pengesahan: { contains: search } },
            { keterangan: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.ta_sk_kolektif.findMany({
      where,
      select: {
        id: true,
        no_sk: true,
        tgl_sk: true,
        tmt_sk: true,
        jns_mutasi_id: true,
        pengesahan: true,
        keterangan: true,
        arsip_path: true,
        status: true,
        processed_at: true,
        processed_by: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            pegawai_list: {
              where: { is_deleted: false },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
    }),
    prisma.ta_sk_kolektif.count({ where }),
  ]);

  return {
    data: data.map((item) => ({
      ...item,
      total_pegawai: item._count?.pegawai_list || 0,
    })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Mencari satu SK Kolektif berdasarkan ID beserta rincian pegawai
 */
export const findSkKolektifById = async (id) => {
  return prisma.ta_sk_kolektif.findFirst({
    where: { id, is_deleted: false },
    select: {
      id: true,
      no_sk: true,
      tgl_sk: true,
      tmt_sk: true,
      jns_mutasi_id: true,
      pengesahan: true,
      keterangan: true,
      arsip_path: true,
      status: true,
      processed_at: true,
      processed_by: true,
      created_at: true,
      updated_at: true,
      pegawai_list: {
        where: { is_deleted: false },
        select: {
          id: true,
          sk_kolektif_id: true,
          pegawai_id: true,
          nip: true,
          nama: true,
          jns_jab_id: true,
          unor_id: true,
          nm_jab_id: true,
          eselon_id: true,
          rwt_jab_id: true,
          status: true,
          keterangan: true,
          created_at: true,
        },
        orderBy: { created_at: "asc" },
      },
    },
  });
};

/**
 * Buat header SK Kolektif baru
 */
export const createSkKolektif = async (data) => {
  return prisma.ta_sk_kolektif.create({
    data,
    select: {
      id: true,
      no_sk: true,
      tgl_sk: true,
      tmt_sk: true,
      jns_mutasi_id: true,
      pengesahan: true,
      keterangan: true,
      arsip_path: true,
      status: true,
      created_at: true,
    },
  });
};

/**
 * Update header SK Kolektif
 */
export const updateSkKolektif = async (id, data) => {
  return prisma.ta_sk_kolektif.update({
    where: { id },
    data,
    select: {
      id: true,
      no_sk: true,
      tgl_sk: true,
      tmt_sk: true,
      jns_mutasi_id: true,
      pengesahan: true,
      keterangan: true,
      arsip_path: true,
      status: true,
      updated_at: true,
    },
  });
};

/**
 * Soft delete SK Kolektif
 */
export const softDeleteSkKolektif = async (id) => {
  return prisma.$transaction(async (tx) => {
    await tx.ta_sk_kolektif_pegawai.updateMany({
      where: { sk_kolektif_id: id },
      data: { is_deleted: true },
    });

    return tx.ta_sk_kolektif.update({
      where: { id },
      data: { is_deleted: true },
      select: { id: true, is_deleted: true },
    });
  });
};

/**
 * Tambah pegawai ke SK Kolektif
 */
export const addPegawaiToSkKolektif = async (data) => {
  return prisma.ta_sk_kolektif_pegawai.create({
    data,
    select: {
      id: true,
      sk_kolektif_id: true,
      pegawai_id: true,
      nip: true,
      nama: true,
      jns_jab_id: true,
      unor_id: true,
      nm_jab_id: true,
      eselon_id: true,
      status: true,
      keterangan: true,
      created_at: true,
    },
  });
};

/**
 * Cek apakah pegawai sudah ada di SK Kolektif ini
 */
export const findPegawaiInSkKolektif = async (skKolektifId, pegawaiId) => {
  return prisma.ta_sk_kolektif_pegawai.findFirst({
    where: {
      sk_kolektif_id: skKolektifId,
      pegawai_id: pegawaiId,
      is_deleted: false,
    },
    select: { id: true, pegawai_id: true, nip: true },
  });
};

/**
 * Cari data item pegawai dalam SK Kolektif
 */
export const findSkKolektifPegawaiById = async (id) => {
  return prisma.ta_sk_kolektif_pegawai.findFirst({
    where: { id, is_deleted: false },
    select: {
      id: true,
      sk_kolektif_id: true,
      pegawai_id: true,
      nip: true,
      nama: true,
      jns_jab_id: true,
      unor_id: true,
      nm_jab_id: true,
      eselon_id: true,
      rwt_jab_id: true,
      status: true,
    },
  });
};

/**
 * Soft delete pegawai dari SK Kolektif
 */
export const softDeletePegawaiFromSkKolektif = async (id) => {
  return prisma.ta_sk_kolektif_pegawai.update({
    where: { id },
    data: { is_deleted: true },
    select: { id: true, is_deleted: true },
  });
};

/**
 * Cari data pegawai untuk autocomplete
 */
export const searchPegawai = async (keyword, limit = 15) => {
  const where = {
    kedudukanPns_id: { in: [1, 7, 8, 10] },
    ...(keyword
      ? {
          OR: [
            { nipBaru: { contains: keyword } },
            { ta_orang: { nama: { contains: keyword } } },
          ],
        }
      : {}),
  };

  return prisma.ta_pegawai.findMany({
    where,
    select: {
      id: true,
      nipBaru: true,
      ta_orang: {
        select: {
          nama: true,
          nik: true,
        },
      },
      rwt_jabatan: {
        select: {
          nmJab_id: true,
          unorInduk_id: true,
          ref_unitorganisasi: {
            select: { id: true, nmUnor: true },
          },
          ref_jabatan: {
            select: { id: true, nama_jabatan: true, kategori: true },
          },
          ref_jnsjab: {
            select: { id: true, jnsjab: true },
          },
        },
      },
    },
    take: limit,
    orderBy: { nipBaru: "asc" },
  });
};

/**
 * Cari master referensi untuk kebutuhan form peremajaan kolektif
 */
export const getReferensiOptions = async () => {
  const [jnsMutasi, jnsJab, eselon] = await Promise.all([
    prisma.ref_jnsmutasi.findMany({
      where: { is_deleted: false },
      select: { id: true, jnsMutasi: true, kode: true },
      orderBy: { kode: "asc" },
    }),
    prisma.ref_jnsjab.findMany({
      where: { is_deleted: false, is_aktif: 1 },
      select: { id: true, jnsjab: true, kode: true },
      orderBy: { kode: "asc" },
    }),
    prisma.ref_eselon.findMany({
      where: { is_deleted: false },
      select: { id: true, eselon: true, eselon_kode: true },
      orderBy: { eselon_kode: "asc" },
    }),
  ]);

  return { jnsMutasi, jnsJab, eselon };
};

/**
 * Cari daftar jabatan untuk autocomplete/dropdown berdasarkan jenis/kategori
 */
export const searchJabatan = async (keyword = "", kategori = "") => {
  const where = {
    is_deleted: false,
    is_aktif: 1,
    ...(kategori ? { kategori } : {}),
    ...(keyword ? { nama_jabatan: { contains: keyword } } : {}),
  };

  return prisma.ref_jabatan.findMany({
    where,
    select: {
      id: true,
      nama_jabatan: true,
      kategori: true,
      jns_jab_id: true,
      eselon_id: true,
      bup: true,
    },
    take: 50,
    orderBy: { nama_jabatan: "asc" },
  });
};

/**
 * Cari daftar unit kerja (UNOR) untuk dropdown/pencarian
 */
export const searchUnor = async (keyword = "") => {
  const where = {
    is_deleted: false,
    isAktif: 1,
    ...(keyword ? { nmUnor: { contains: keyword } } : {}),
  };

  return prisma.ref_unitorganisasi.findMany({
    where,
    select: {
      id: true,
      nmUnor: true,
      level: true,
      kode: true,
      parent_id: true,
      jab_id: true,
    },
    take: 100,
    orderBy: { nmUnor: "asc" },
  });
};
