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
            select: {
              id: true,
              nama_jabatan: true,
              kategori: true,
              ref_jnsjab: {
                select: { id: true, jnsjab: true },
              },
            },
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

/**
 * Mengambil daftar pegawai aktif pada unit organisasi tertentu (dan keturunannya)
 */
export const findPegawaiByUnor = async ({
  unorIds = [],
  search = "",
  skKolektifId = null,
}) => {
  const where = {
    kedudukanPns_id: { in: [1, 7, 8, 10] }, // PNS Aktif
    rwt_jabatan: {
      OR: [
        { unorInduk_id: { in: unorIds } },
        { unor_id: { in: unorIds } },
        { subUnor_id: { in: unorIds } },
        { subUnorSub_id: { in: unorIds } },
      ],
    },
    ...(search
      ? {
          OR: [
            { nipBaru: { contains: search } },
            { ta_orang: { nama: { contains: search } } },
          ],
        }
      : {}),
  };

  const [pegawaiList, existingInSk] = await Promise.all([
    prisma.ta_pegawai.findMany({
      where,
      select: {
        id: true,
        nipBaru: true,
        ta_orang: {
          select: {
            nama: true,
            nik: true,
            foto: true,
          },
        },
        rwt_pend: {
          select: { gd: true, gb: true },
        },
        rwt_gol: {
          select: {
            ref_gol: {
              select: { gol: true, pangkat: true },
            },
          },
        },
        rwt_jabatan: {
          select: {
            nmJab_id: true,
            unorInduk_id: true,
            unor_id: true,
            subUnor_id: true,
            subUnorSub_id: true,
            ref_unitorganisasi: {
              select: { id: true, nmUnor: true },
            },
            ref_jabatan: {
              select: {
                id: true,
                nama_jabatan: true,
                kategori: true,
                jns_jab_id: true,
                eselon_id: true,
                ref_jnsjab: { select: { id: true, jnsjab: true } },
                ref_jenjangjab: { select: { id: true, jenjangjab: true } },
                ref_eselon: { select: { id: true, eselon: true } },
              },
            },
          },
        },
      },
      orderBy: { nipBaru: "asc" },
    }),
    skKolektifId
      ? prisma.ta_sk_kolektif_pegawai.findMany({
          where: {
            sk_kolektif_id: skKolektifId,
            is_deleted: false,
          },
          select: { pegawai_id: true },
        })
      : Promise.resolve([]),
  ]);

  const existingMap = new Set(existingInSk.map((e) => e.pegawai_id));

  return pegawaiList.map((p) => {
    return {
      id: p.id,
      nip: p.nipBaru,
      nama_raw: p.ta_orang?.nama || "-",
      gd: p.rwt_pend?.gd,
      gb: p.rwt_pend?.gb,
      nik: p.ta_orang?.nik,
      foto: p.ta_orang?.foto,
      golongan: p.rwt_gol?.ref_gol?.gol || "-",
      pangkat: p.rwt_gol?.ref_gol?.pangkat || "-",
      nm_jab_id: p.rwt_jabatan?.nmJab_id || null,
      jabatan: p.rwt_jabatan?.ref_jabatan?.nama_jabatan || "-",
      kategori_jabatan: p.rwt_jabatan?.ref_jabatan?.kategori || "STRUKTURAL",
      jns_jab_id: p.rwt_jabatan?.ref_jabatan?.jns_jab_id || null,
      eselon_id: p.rwt_jabatan?.ref_jabatan?.eselon_id || null,
      eselon: p.rwt_jabatan?.ref_jabatan?.ref_eselon?.eselon || "-",
      unit_kerja: p.rwt_jabatan?.ref_unitorganisasi?.nmUnor || "-",
      unor_id: p.rwt_jabatan?.unorInduk_id || p.rwt_jabatan?.unor_id || null,
      is_already_in_sk: existingMap.has(p.id),
    };
  });
};

/**
 * Tambah batch pegawai ke SK Kolektif dalam satu transaksi
 */
export const addPegawaiBatch = async (records = []) => {
  return prisma.$transaction(async (tx) => {
    const createdItems = [];
    for (const data of records) {
      const item = await tx.ta_sk_kolektif_pegawai.create({
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
      createdItems.push(item);
    }
    return createdItems;
  });
};

/**
 * Mengambil daftar riwayat mutasi masal unit organisasi (tanpa SK)
 */
export const findAllMutasiUnor = async ({ page = 1, limit = 10, search = "", status = "" }) => {
  const skip = (page - 1) * limit;

  const where = {
    is_deleted: false,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { keterangan: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.ta_mutasi_unor.findMany({
      where,
      select: {
        id: true,
        tgl_mutasi: true,
        asal_unor_id: true,
        tujuan_unor_id: true,
        keterangan: true,
        status: true,
        created_by: true,
        restored_at: true,
        restored_by: true,
        created_at: true,
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
    prisma.ta_mutasi_unor.count({ where }),
  ]);

  return {
    data: data.map((item) => ({
      ...item,
      created_by: item.created_by ? item.created_by.toString() : null,
      restored_by: item.restored_by ? item.restored_by.toString() : null,
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
 * Mengambil satu riwayat mutasi unit organisasi beserta rincian pegawai
 */
export const findMutasiUnorById = async (id) => {
  const mutasi = await prisma.ta_mutasi_unor.findFirst({
    where: { id, is_deleted: false },
    select: {
      id: true,
      tgl_mutasi: true,
      asal_unor_id: true,
      tujuan_unor_id: true,
      keterangan: true,
      status: true,
      created_by: true,
      restored_at: true,
      restored_by: true,
      created_at: true,
      updated_at: true,
      pegawai_list: {
        where: { is_deleted: false },
        select: {
          id: true,
          mutasi_unor_id: true,
          pegawai_id: true,
          nip: true,
          nama: true,
          rwt_jab_id: true,
          old_unorInduk_id: true,
          old_unor_id: true,
          old_subUnor_id: true,
          old_subUnorSub_id: true,
          old_instansi_id: true,
          old_jnsUnor_id: true,
          old_nm_jab_id: true,
          new_unorInduk_id: true,
          new_unor_id: true,
          new_subUnor_id: true,
          new_subUnorSub_id: true,
          new_instansi_id: true,
          new_jnsUnor_id: true,
          new_nm_jab_id: true,
          old_jabatan: {
            select: { id: true, nama_jabatan: true, kategori: true },
          },
          new_jabatan: {
            select: { id: true, nama_jabatan: true, kategori: true },
          },
          created_at: true,
        },
        orderBy: { nip: "asc" },
      },
    },
  });

  if (!mutasi) return null;
  return {
    ...mutasi,
    created_by: mutasi.created_by ? mutasi.created_by.toString() : null,
    restored_by: mutasi.restored_by ? mutasi.restored_by.toString() : null,
  };
};

/**
 * Eksekusi Mutasi Unor Masal secara Atomic Transaction
 */
export const createMutasiUnorTransaction = async ({ mutasiData, pegawaiRecords, rwtJabUpdates }) => {
  return prisma.$transaction(async (tx) => {
    // 1. Simpan header mutasi unor
    const header = await tx.ta_mutasi_unor.create({
      data: mutasiData,
      select: {
        id: true,
        tgl_mutasi: true,
        asal_unor_id: true,
        tujuan_unor_id: true,
        keterangan: true,
        status: true,
        created_at: true,
      },
    });

    // 2. Simpan rincian pegawai & snapshot
    for (const record of pegawaiRecords) {
      await tx.ta_mutasi_unor_pegawai.create({
        data: record,
        select: { id: true },
      });
    }

    // 3. Update rwt_jabatan aktif pegawai (HANYA field unit organisasi)
    for (const update of rwtJabUpdates) {
      await tx.rwt_jabatan.update({
        where: { id: update.rwt_jab_id },
        data: update.newUnorData,
        select: { id: true },
      });
    }

    return header;
  });
};

/**
 * Kembalikan (Restore) Mutasi Unor Masal ke Unit Asal
 */
export const restoreMutasiUnorTransaction = async ({ mutasiId, restoreHeaderData, rwtJabRestores }) => {
  return prisma.$transaction(async (tx) => {
    // 1. Kembalikan rwt_jabatan masing-masing pegawai ke snapshot old unor
    for (const restore of rwtJabRestores) {
      await tx.rwt_jabatan.update({
        where: { id: restore.rwt_jab_id },
        data: restore.oldUnorData,
        select: { id: true },
      });
    }

    // 2. Update status header mutasi menjadi RESTORED
    const updatedHeader = await tx.ta_mutasi_unor.update({
      where: { id: mutasiId },
      data: restoreHeaderData,
      select: {
        id: true,
        status: true,
        restored_at: true,
        restored_by: true,
      },
    });

    return updatedHeader;
  });
};


