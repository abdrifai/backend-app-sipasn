import prisma from "../../config/database.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Helper untuk membersihkan NIP dari tanda petik atau spasi
 */
export const cleanNip = (nip) => {
  if (!nip) return "";
  return String(nip).replace(/[^0-9]/g, "").trim();
};

/**
 * Ambil seluruh data referensi master untuk mapping nama/label
 */
export const getReferenceMaps = async () => {
  const [agamaList, kawinList, kedudukanList, tktPendList, unorList, pendList, cpnsList] = await Promise.all([
    prisma.ref_agama.findMany({ select: { id: true, agama: true } }),
    prisma.ref_kawin.findMany({ select: { id: true, kawin: true } }),
    prisma.ref_kedudukanpns.findMany({ select: { id: true, kedudukanpns: true } }),
    prisma.ref_tktpend.findMany({ select: { id: true, tktpend: true } }),
    prisma.ref_unitorganisasi.findMany({
      where: { is_deleted: false },
      select: { id: true, nmUnor: true, level: true, kode: true }
    }),
    prisma.ref_pend.findMany({ select: { id: true, pend: true } }),
    prisma.ta_cpnspns.findMany({ select: { pegawai_id: true, spns_id: true } })
  ]);

  const agamaMap = new Map(agamaList.map(a => [String(a.id), a.agama]));
  const kawinMap = new Map(kawinList.map(k => [String(k.id), k.kawin]));
  const kedudukanMap = new Map(kedudukanList.map(k => [String(k.id), k.kedudukanpns]));
  const tktPendMap = new Map(tktPendList.map(t => [String(t.id), t.tktpend]));
  const unorMap = new Map(unorList.map(u => [u.id, (u.nmUnor || '').trim()]));
  const pendMap = new Map(pendList.map(p => [p.id, p.pend]));

  const pnsPegawaiSet = new Set();
  const cpnsPegawaiSet = new Set();
  for (const c of cpnsList) {
    if (String(c.spns_id) === '2') {
      pnsPegawaiSet.add(c.pegawai_id);
    } else if (String(c.spns_id) === '1') {
      cpnsPegawaiSet.add(c.pegawai_id);
    }
  }

  return { agamaMap, kawinMap, kedudukanMap, tktPendMap, unorMap, pendMap, pnsPegawaiSet, cpnsPegawaiSet };
};

/**
 * Ambil seluruh pegawai lokal aktif beserta relasinya dengan select eksplisit
 */
export const findAllLocalPegawai = async () => {
  return prisma.ta_pegawai.findMany({
    where: {
      kedudukanPns_id: { in: [1, 7, 8, 10] },
    },
    select: {
      id: true,
      nipBaru: true,
      nipLama: true,
      nik: true,
      kedudukanPns_id: true,
      spns_id: true,
      ta_orang: {
        select: {
          id: true,
          nama: true,
          t4Lhr: true,
          tglLhr: true,
          jkl_id: true,
          agama_id: true,
          kawin_id: true,
          alamat: true,
          no_hp: true,
          email: true,
          npwp: true,
        }
      },
      rwt_gol: {
        select: {
          id: true,
          gol_id: true,
          tmtSk: true,
          ref_gol: {
            select: {
              gol: true,
              pangkat: true,
            }
          }
        }
      },
      rwt_jabatan: {
        select: {
          id: true,
          tmtSk: true,
          nmJab_id: true,
          unorInduk_id: true,
          unor_id: true,
          subUnor_id: true,
          subUnorSub_id: true,
          ref_jabatan: {
            select: {
              id: true,
              nama_jabatan: true,
              eselon_id: true,
              jns_jab_id: true,
            }
          },
          ref_unitorganisasi: {
            select: {
              id: true,
              nmUnor: true,
            }
          }
        }
      },
      rwt_pend: {
        select: {
          id: true,
          tktPend_id: true,
          pend_id: true,
          thnLulus: true,
          jurusan: true,
          nmSekolah: true,
          gd: true,
          gb: true,
        }
      }
    }
  });
};

/**
 * Ambil seluruh data import SIASN BKN yang aktif (is_deleted: false)
 */
export const findAllImportPns = async () => {
  return prisma.ta_import_pns.findMany({
    where: {
      is_deleted: false,
    },
    select: {
      id: true,
      batch_id: true,
      file_name: true,
      pns_id: true,
      nip_baru: true,
      nip_lama: true,
      nama: true,
      gelar_depan: true,
      gelar_belakang: true,
      tempat_lahir: true,
      tanggal_lahir: true,
      jenis_kelamin: true,
      agama_id: true,
      agama_nama: true,
      jenis_kawin_id: true,
      jenis_kawin_nama: true,
      nik: true,
      nomor_hp: true,
      email: true,
      alamat: true,
      npwp_nomor: true,
      bpjs: true,
      kedudukan_pns_id: true,
      kedudukan_pns_nama: true,
      status_cpns_pns: true,
      tmt_cpns: true,
      tmt_pns: true,
      gol_awal_nama: true,
      gol_akhir_id: true,
      gol_akhir_nama: true,
      tmt_golongan: true,
      mk_tahun: true,
      mk_bulan: true,
      jenis_jabatan_id: true,
      jenis_jabatan_nama: true,
      jabatan_id: true,
      jabatan_nama: true,
      tmt_jabatan: true,
      tingkat_pendidikan_nama: true,
      pendidikan_nama: true,
      tahun_lulus: true,
      unor_id: true,
      unor_nama: true,
      instansi_induk_nama: true,
      satuan_kerja_induk_nama: true,
      eselon_nama: true,
      created_at: true,
      updated_at: true,
    }
  });
};

/**
 * Cari satu data pegawai lokal berdasarkan NIP
 */
export const findLocalPegawaiByNip = async (nip) => {
  const clean = cleanNip(nip);
  return prisma.ta_pegawai.findFirst({
    where: {
      nipBaru: clean,
    },
    select: {
      id: true,
      nipBaru: true,
      nipLama: true,
      nik: true,
      kedudukanPns_id: true,
      spns_id: true,
      ta_orang: {
        select: {
          id: true,
          nama: true,
          t4Lhr: true,
          tglLhr: true,
          jkl_id: true,
          agama_id: true,
          kawin_id: true,
          alamat: true,
          no_hp: true,
          email: true,
          npwp: true,
        }
      },
      rwt_gol: {
        select: {
          id: true,
          gol_id: true,
          tmtSk: true,
          ref_gol: {
            select: {
              gol: true,
              pangkat: true,
            }
          }
        }
      },
      rwt_jabatan: {
        select: {
          id: true,
          sk: true,
          tglSk: true,
          tmtSk: true,
          nmJab_id: true,
          unorInduk_id: true,
          unor_id: true,
          subUnor_id: true,
          subUnorSub_id: true,
          pengesahan: true,
          ref_jabatan: {
            select: {
              id: true,
              nama_jabatan: true,
              eselon_id: true,
              jns_jab_id: true,
            }
          },
          ref_unitorganisasi: {
            select: {
              id: true,
              nmUnor: true,
            }
          }
        }
      },
      rwt_pend: {
        select: {
          id: true,
          tktPend_id: true,
          pend_id: true,
          thnLulus: true,
          jurusan: true,
          nmSekolah: true,
          gd: true,
          gb: true,
          noIjazah: true,
          tglIjazah: true,
        }
      }
    }
  });
};

/**
 * Cari satu data SIASN berdasarkan NIP
 */
export const findImportPnsByNip = async (nip) => {
  const clean = cleanNip(nip);
  return prisma.ta_import_pns.findFirst({
    where: {
      is_deleted: false,
      OR: [
        { nip_baru: clean },
        { nip_baru: `'${clean}` }
      ]
    },
    select: {
      id: true,
      batch_id: true,
      file_name: true,
      pns_id: true,
      nip_baru: true,
      nip_lama: true,
      nama: true,
      gelar_depan: true,
      gelar_belakang: true,
      tempat_lahir: true,
      tanggal_lahir: true,
      jenis_kelamin: true,
      agama_id: true,
      agama_nama: true,
      jenis_kawin_id: true,
      jenis_kawin_nama: true,
      nik: true,
      nomor_hp: true,
      email: true,
      alamat: true,
      npwp_nomor: true,
      bpjs: true,
      kedudukan_pns_id: true,
      kedudukan_pns_nama: true,
      status_cpns_pns: true,
      nomor_sk_cpns: true,
      tanggal_sk_cpns: true,
      tmt_cpns: true,
      nomor_sk_pns: true,
      tanggal_sk_pns: true,
      tmt_pns: true,
      gol_awal_nama: true,
      gol_akhir_id: true,
      gol_akhir_nama: true,
      tmt_golongan: true,
      mk_tahun: true,
      mk_bulan: true,
      jenis_jabatan_id: true,
      jenis_jabatan_nama: true,
      jabatan_id: true,
      jabatan_nama: true,
      tmt_jabatan: true,
      tingkat_pendidikan_nama: true,
      pendidikan_nama: true,
      tahun_lulus: true,
      unor_id: true,
      unor_nama: true,
      instansi_induk_nama: true,
      satuan_kerja_induk_nama: true,
      eselon_nama: true,
      created_at: true,
      updated_at: true,
    }
  });
};

/**
 * Cari pegawai lokal berdasarkan daftar NIP untuk sinkronisasi golongan
 */
export const findPegawaiForSyncGolongan = async (nips) => {
  if (!nips || nips.length === 0) return [];
  return prisma.ta_pegawai.findMany({
    where: {
      nipBaru: { in: nips },
    },
    select: {
      id: true,
      nipBaru: true,
      rwtGol_id: true,
      ta_orang: {
        select: {
          nama: true,
        },
      },
      rwt_gol: {
        select: {
          id: true,
          gol_id: true,
          tmtSk: true,
          ref_gol: {
            select: {
              gol: true,
              pangkat: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Cari data import SIASN berdasarkan daftar NIP untuk sinkronisasi golongan
 */
export const findImportPnsForSyncGolongan = async (nips) => {
  if (!nips || nips.length === 0) return [];
  return prisma.ta_import_pns.findMany({
    where: {
      is_deleted: false,
      OR: nips.map((n) => ({ nip_baru: { contains: n } })),
    },
    select: {
      id: true,
      nip_baru: true,
      nama: true,
      gol_akhir_id: true,
      gol_akhir_nama: true,
      tmt_golongan: true,
      mk_tahun: true,
      mk_bulan: true,
      nomor_sk_pns: true,
      tanggal_sk_pns: true,
    },
  });
};

/**
 * Cek apakah riwayat golongan dengan gol_id dan tmtSk yang sama sudah ada
 */
export const findExistingRiwayatGolongan = async (pegawaiId, golId, tmtSk) => {
  return prisma.rwt_gol.findFirst({
    where: {
      pegawai_id: pegawaiId,
      gol_id: golId,
      tmtSk,
    },
    select: {
      id: true,
      gol_id: true,
      tmtSk: true,
    },
  });
};

/**
 * Cek apakah record sync golongan sudah ada di antrean
 */
export const findExistingSyncGolongan = async (pegawaiId, kdGolBaru) => {
  return prisma.ta_sync_golongan.findFirst({
    where: {
      pegawai_id: pegawaiId,
      kd_gol_baru: kdGolBaru,
      is_deleted: false,
    },
    select: {
      id: true,
      status_sk: true,
      rwt_gol_id: true,
    },
  });
};

/**
 * Eksekusi atomik sinkronisasi satu record golongan:
 * 1. Buat rwt_gol baru
 * 2. Update ta_pegawai.rwtGol_id
 * 3. Buat ta_sync_golongan baru
 */
export const executeSyncGolonganItem = async ({ pegawaiId, rwtGolData, syncGolData }) => {
  return prisma.$transaction(async (tx) => {
    // 1. Buat riwayat golongan baru
    const newRwtGol = await tx.rwt_gol.create({
      data: rwtGolData,
      select: {
        id: true,
        pegawai_id: true,
        gol_id: true,
        tmtSk: true,
      },
    });

    // 2. Update pointer golongan aktif di ta_pegawai
    await tx.ta_pegawai.update({
      where: { id: pegawaiId },
      data: {
        rwtGol_id: newRwtGol.id,
      },
    });

    // 3. Simpan ke antrean sinkronisasi ta_sync_golongan
    const newSync = await tx.ta_sync_golongan.create({
      data: {
        ...syncGolData,
        rwt_gol_id: newRwtGol.id,
      },
      select: {
        id: true,
        pegawai_id: true,
        rwt_gol_id: true,
        nip: true,
        nama: true,
        gol_lama: true,
        gol_baru: true,
        kd_gol_baru: true,
        tmt_golongan: true,
        status_sk: true,
        batch_id: true,
        created_at: true,
      },
    });

    return { newRwtGol, newSync };
  });
};

/**
 * Ambil daftar antrean upload SK hasil sinkronisasi golongan (berpaginasi)
 */
export const findSyncGolonganQueue = async ({ page = 1, limit = 15, search = "", status_sk = "all" }) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 15);
  const skip = (pageNum - 1) * limitNum;

  const where = {
    is_deleted: false,
    ...(status_sk && status_sk !== "all" ? { status_sk } : {}),
    ...(search
      ? {
          OR: [
            { nip: { contains: search } },
            { nama: { contains: search } },
            { gol_baru: { contains: search } },
            { gol_lama: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.ta_sync_golongan.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        pegawai_id: true,
        rwt_gol_id: true,
        nip: true,
        nama: true,
        gol_lama: true,
        gol_baru: true,
        kd_gol_baru: true,
        tmt_golongan: true,
        status_sk: true,
        batch_id: true,
        created_at: true,
        updated_at: true,
      },
    }),
    prisma.ta_sync_golongan.count({ where }),
  ]);

  return { items, total, page: pageNum, limit: limitNum };
};

/**
 * Hitung statistik antrean sinkronisasi golongan (total, pending, uploaded)
 */
export const getSyncGolonganStats = async () => {
  const [total, pending, uploaded] = await Promise.all([
    prisma.ta_sync_golongan.count({ where: { is_deleted: false } }),
    prisma.ta_sync_golongan.count({ where: { is_deleted: false, status_sk: "PENDING" } }),
    prisma.ta_sync_golongan.count({ where: { is_deleted: false, status_sk: "UPLOADED" } }),
  ]);

  return { total, pending, uploaded };
};

/**
 * Cari 1 record antrean sinkronisasi berdasarkan ID
 */
export const findSyncGolonganById = async (id) => {
  return prisma.ta_sync_golongan.findFirst({
    where: { id, is_deleted: false },
    select: {
      id: true,
      pegawai_id: true,
      rwt_gol_id: true,
      nip: true,
      nama: true,
      gol_lama: true,
      gol_baru: true,
      kd_gol_baru: true,
      tmt_golongan: true,
      status_sk: true,
      batch_id: true,
      is_deleted: true,
      created_at: true,
    },
  });
};

/**
 * Ambil rincian arsip dan nomor SK untuk daftar rwt_gol_id
 */
export const findArsipAndSkForRwtGolIds = async (rwtGolIds) => {
  if (!rwtGolIds || rwtGolIds.length === 0) return { arsipList: [], rwtGolList: [] };

  const [arsipList, rwtGolList] = await Promise.all([
    prisma.ta_arsip.findMany({
      where: {
        from: { in: rwtGolIds },
        jnsarsip_id: 2,
      },
      select: {
        from: true,
        arsip: true,
      },
    }),
    prisma.rwt_gol.findMany({
      where: {
        id: { in: rwtGolIds },
      },
      select: {
        id: true,
        sk: true,
        tglSk: true,
      },
    }),
  ]);

  return { arsipList, rwtGolList };
};

/**
 * Simpan dokumen SK fisik ke ta_arsip dan perbarui rwt_gol serta ta_sync_golongan
 */
export const saveUploadSkGolongan = async ({ syncId, rwtGolId, pegawaiId, filePath, sk, tglSk }) => {
  return prisma.$transaction(async (tx) => {
    // 1. Simpan/update arsip digital di ta_arsip
    const existingArsip = await tx.ta_arsip.findFirst({
      where: { from: rwtGolId, jnsarsip_id: 2 },
      select: { id: true },
    });

    if (existingArsip) {
      await tx.ta_arsip.update({
        where: { id: existingArsip.id },
        data: { arsip: filePath },
      });
    } else {
      await tx.ta_arsip.create({
        data: {
          id: uuidv4(),
          pegawai_id: pegawaiId,
          from: rwtGolId,
          jnsarsip_id: 2, // SK Pangkat / Golongan
          arsip: filePath,
        },
      });
    }

    // 2. Perbarui nomor SK dan tanggal SK di rwt_gol jika diberikan
    await tx.rwt_gol.update({
      where: { id: rwtGolId },
      data: {
        ...(sk ? { sk } : {}),
        ...(tglSk ? { tglSk } : {}),
      },
    });

    // 3. Update status antrean menjadi UPLOADED
    const updatedSync = await tx.ta_sync_golongan.update({
      where: { id: syncId },
      data: {
        status_sk: "UPLOADED",
      },
      select: {
        id: true,
        status_sk: true,
        rwt_gol_id: true,
        nip: true,
        updated_at: true,
      },
    });

    return updatedSync;
  });
};

/**
 * Hapus (soft delete) entri antrean sinkronisasi
 */
export const softDeleteSyncGolongan = async (id) => {
  return prisma.ta_sync_golongan.update({
    where: { id },
    data: { is_deleted: true },
    select: { id: true, is_deleted: true },
  });
};

/**
 * Ambil semua data referensi golongan
 */
export const findAllRefGol = async () => {
  return prisma.ref_gol.findMany({
    select: {
      kdGol: true,
      gol: true,
      pangkat: true,
    },
  });
};

/**
 * Hubungkan riwayat golongan yang sudah ada ke antrean upload SK
 */
export const linkExistingRiwayatToSyncQueue = async ({ pegawaiId, rwtGolId, syncGolData }) => {
  return prisma.$transaction(async (tx) => {
    await tx.ta_pegawai.update({
      where: { id: pegawaiId },
      data: { rwtGol_id: rwtGolId },
    });

    const newSync = await tx.ta_sync_golongan.create({
      data: {
        ...syncGolData,
        rwt_gol_id: rwtGolId,
      },
      select: {
        id: true,
        pegawai_id: true,
        rwt_gol_id: true,
        nip: true,
        nama: true,
        gol_lama: true,
        gol_baru: true,
        kd_gol_baru: true,
        tmt_golongan: true,
        status_sk: true,
        batch_id: true,
        created_at: true,
      },
    });

    return newSync;
  });
};

// =========================================================================
// SINKRONISASI PENDIDIKAN & ANTREAN UPLOAD IJAZAH
// =========================================================================

/**
 * Cari satu data referensi pendidikan berdasarkan ID
 */
export const findRefPendById = async (id) => {
  return prisma.ref_pend.findFirst({
    where: { id, is_deleted: false },
    select: {
      id: true,
      tktpend_id: true,
      pend: true,
      kode: true,
      ref_tktpend: {
        select: {
          id: true,
          tktpend: true,
        },
      },
    },
  });
};

/**
 * Cari referensi pendidikan berdasarkan kode BKN atau nama eksak/parsial
 */
export const findRefPendByKodeOrName = async ({ kode, name }) => {
  const conditions = [];
  if (kode) {
    conditions.push({ kode: String(kode).trim() });
  }
  if (name) {
    conditions.push({ pend: String(name).trim() });
  }

  if (conditions.length === 0) return null;

  return prisma.ref_pend.findFirst({
    where: {
      is_deleted: false,
      OR: conditions,
    },
    select: {
      id: true,
      tktpend_id: true,
      pend: true,
      kode: true,
      ref_tktpend: {
        select: {
          id: true,
          tktpend: true,
        },
      },
    },
  });
};

/**
 * Cari daftar referensi pendidikan untuk pencarian/dropdown autocomplete
 */
export const searchRefPendList = async ({ search = "", limit = 25 }) => {
  const where = {
    is_deleted: false,
    ...(search
      ? {
          OR: [
            { pend: { contains: search } },
            { kode: { contains: search } },
          ],
        }
      : {}),
  };

  const list = await prisma.ref_pend.findMany({
    where,
    take: limit,
    select: {
      id: true,
      tktpend_id: true,
      pend: true,
      kode: true,
      ref_tktpend: {
        select: {
          id: true,
          tktpend: true,
        },
      },
    },
    orderBy: { pend: "asc" },
  });

  return list.map((item) => ({
    ...item,
    tktpend_id: item.tktpend_id ? item.tktpend_id.toString() : null,
  }));
};

/**
 * Ambil semua master tingkat pendidikan (ref_tktpend)
 */
export const findAllRefTktPend = async () => {
  const list = await prisma.ref_tktpend.findMany({
    select: {
      id: true,
      tktpend: true,
    },
    orderBy: { id: "asc" },
  });

  return list.map((item) => ({
    id: item.id.toString(),
    tktpend: item.tktpend,
  }));
};

/**
 * Cek apakah antrean sinkronisasi pendidikan sudah ada
 */
export const findExistingSyncPendidikan = async (pegawaiId, pendId) => {
  return prisma.ta_sync_pendidikan.findFirst({
    where: {
      pegawai_id: pegawaiId,
      pend_id: pendId,
      is_deleted: false,
    },
    select: {
      id: true,
      status_ijazah: true,
      rwt_pend_id: true,
    },
  });
};

/**
 * Cek apakah riwayat pendidikan dengan pend_id yang sama sudah ada di rwt_pend
 */
export const findExistingRiwayatPendidikan = async (pegawaiId, pendId) => {
  return prisma.rwt_pend.findFirst({
    where: {
      pegawai_id: pegawaiId,
      pend_id: pendId,
    },
    select: {
      id: true,
      pend_id: true,
      tktPend_id: true,
      thnLulus: true,
      jurusan: true,
    },
  });
};

/**
 * Eksekusi atomik sinkronisasi pendidikan:
 * 1. Buat master ref_pend baru (jika newRefData diberikan)
 * 2. Buat rwt_pend baru
 * 3. Update ta_pegawai.rwtPend_id
 * 4. Buat ta_sync_pendidikan
 */
export const executeSyncPendidikanItem = async ({
  pegawaiId,
  newRefData = null,
  rwtPendData,
  syncPendData,
}) => {
  return prisma.$transaction(async (tx) => {
    let finalPendId = rwtPendData.pend_id;
    let finalTktPendId = rwtPendData.tktPend_id;

    // 1. Buat master referensi baru jika belum ada
    if (newRefData) {
      const createdRef = await tx.ref_pend.create({
        data: {
          id: newRefData.id || uuidv4(),
          tktpend_id: BigInt(newRefData.tktpend_id),
          pend: newRefData.pend,
          kode: newRefData.kode || null,
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        select: {
          id: true,
          tktpend_id: true,
          pend: true,
          kode: true,
        },
      });

      finalPendId = createdRef.id;
      finalTktPendId = Number(createdRef.tktpend_id);
    }

    // 2. Buat riwayat pendidikan baru
    const newRwtPend = await tx.rwt_pend.create({
      data: {
        ...rwtPendData,
        pend_id: finalPendId,
        tktPend_id: finalTktPendId,
      },
      select: {
        id: true,
        pegawai_id: true,
        pend_id: true,
        tktPend_id: true,
        thnLulus: true,
        jurusan: true,
      },
    });

    // 3. Update pointer pendidikan aktif di ta_pegawai
    await tx.ta_pegawai.update({
      where: { id: pegawaiId },
      data: {
        rwtPend_id: newRwtPend.id,
      },
    });

    // 4. Simpan ke antrean sinkronisasi ta_sync_pendidikan
    const newSync = await tx.ta_sync_pendidikan.create({
      data: {
        ...syncPendData,
        rwt_pend_id: newRwtPend.id,
        pend_id: finalPendId,
      },
      select: {
        id: true,
        pegawai_id: true,
        rwt_pend_id: true,
        pend_id: true,
        nip: true,
        nama: true,
        pend_lama: true,
        pend_baru: true,
        tkt_pend_baru: true,
        thn_lulus: true,
        status_ijazah: true,
        batch_id: true,
        created_at: true,
      },
    });

    return {
      newRwtPend,
      newSync,
    };
  });
};

/**
 * Hubungkan riwayat pendidikan yang sudah ada ke antrean upload Ijazah
 */
export const linkExistingRiwayatPendidikanToSyncQueue = async ({
  pegawaiId,
  rwtPendId,
  syncPendData,
}) => {
  return prisma.$transaction(async (tx) => {
    await tx.ta_pegawai.update({
      where: { id: pegawaiId },
      data: { rwtPend_id: rwtPendId },
    });

    const newSync = await tx.ta_sync_pendidikan.create({
      data: {
        ...syncPendData,
        rwt_pend_id: rwtPendId,
      },
      select: {
        id: true,
        pegawai_id: true,
        rwt_pend_id: true,
        pend_id: true,
        nip: true,
        nama: true,
        pend_lama: true,
        pend_baru: true,
        tkt_pend_baru: true,
        thn_lulus: true,
        status_ijazah: true,
        batch_id: true,
        created_at: true,
      },
    });

    return newSync;
  });
};

/**
 * Ambil daftar antrean upload Ijazah pendidikan (paginated)
 */
export const findSyncPendidikanQueue = async ({ page = 1, limit = 15, search = "", status_ijazah = "" }) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, parseInt(limit, 10) || 15);
  const skip = (p - 1) * l;

  const where = {
    is_deleted: false,
    ...(status_ijazah ? { status_ijazah } : {}),
    ...(search
      ? {
          OR: [
            { nip: { contains: search } },
            { nama: { contains: search } },
            { pend_baru: { contains: search } },
            { pend_lama: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.ta_sync_pendidikan.findMany({
      where,
      skip,
      take: l,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        pegawai_id: true,
        rwt_pend_id: true,
        pend_id: true,
        nip: true,
        nama: true,
        pend_lama: true,
        pend_baru: true,
        tkt_pend_baru: true,
        thn_lulus: true,
        status_ijazah: true,
        batch_id: true,
        created_at: true,
        updated_at: true,
      },
    }),
    prisma.ta_sync_pendidikan.count({ where }),
  ]);

  return { items, total };
};

/**
 * Dapatkan statistik antrean upload Ijazah pendidikan
 */
export const getSyncPendidikanStats = async () => {
  const [total, pending, uploaded] = await Promise.all([
    prisma.ta_sync_pendidikan.count({ where: { is_deleted: false } }),
    prisma.ta_sync_pendidikan.count({ where: { is_deleted: false, status_ijazah: "PENDING" } }),
    prisma.ta_sync_pendidikan.count({ where: { is_deleted: false, status_ijazah: "UPLOADED" } }),
  ]);

  return { total, pending, uploaded };
};

/**
 * Cari berkas fisik ijazah dari ta_arsip (jnsarsip_id = 3) dan rwt_pend untuk daftar rwtPendId
 */
export const findArsipAndDetailsForRwtPendIds = async (rwtPendIds) => {
  if (!rwtPendIds || rwtPendIds.length === 0) {
    return { arsipList: [], rwtPendList: [] };
  }

  const [arsipList, rwtPendList] = await Promise.all([
    prisma.ta_arsip.findMany({
      where: {
        from: { in: rwtPendIds },
        jnsarsip_id: 3, // Ijazah
      },
      select: {
        id: true,
        from: true,
        arsip: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.rwt_pend.findMany({
      where: {
        id: { in: rwtPendIds },
      },
      select: {
        id: true,
        noIjazah: true,
        tglIjazah: true,
        nmSekolah: true,
        thnLulus: true,
      },
    }),
  ]);

  return { arsipList, rwtPendList };
};

/**
 * Cari satu record antrean sinkronisasi pendidikan berdasarkan ID
 */
export const findSyncPendidikanById = async (id) => {
  return prisma.ta_sync_pendidikan.findFirst({
    where: { id, is_deleted: false },
    select: {
      id: true,
      pegawai_id: true,
      rwt_pend_id: true,
      pend_id: true,
      nip: true,
      nama: true,
      pend_lama: true,
      pend_baru: true,
      tkt_pend_baru: true,
      thn_lulus: true,
      status_ijazah: true,
      batch_id: true,
      created_at: true,
      updated_at: true,
    },
  });
};

/**
 * Simpan berkas fisik upload Ijazah, perbarui nomor/tanggal ijazah di rwt_pend, dan set status UPLOADED
 */
export const saveUploadIjazahPendidikan = async ({
  syncId,
  rwtPendId,
  pegawaiId,
  filePath,
  noIjazah,
  tglIjazah,
  nmSekolah,
}) => {
  return prisma.$transaction(async (tx) => {
    // 1. Cek apakah entri ta_arsip sudah ada untuk rwtPendId
    const existingArsip = await tx.ta_arsip.findFirst({
      where: {
        from: rwtPendId,
        jnsarsip_id: 3,
      },
      select: { id: true },
    });

    if (existingArsip) {
      await tx.ta_arsip.update({
        where: { id: existingArsip.id },
        data: { arsip: filePath },
      });
    } else {
      await tx.ta_arsip.create({
        data: {
          id: uuidv4(),
          pegawai_id: pegawaiId,
          from: rwtPendId,
          jnsarsip_id: 3, // Ijazah
          arsip: filePath,
        },
      });
    }

    // 2. Perbarui detail ijazah di rwt_pend jika diberikan
    await tx.rwt_pend.update({
      where: { id: rwtPendId },
      data: {
        ...(noIjazah ? { noIjazah } : {}),
        ...(tglIjazah ? { tglIjazah } : {}),
        ...(nmSekolah ? { nmSekolah } : {}),
      },
    });

    // 3. Update status antrean menjadi UPLOADED
    const updatedSync = await tx.ta_sync_pendidikan.update({
      where: { id: syncId },
      data: {
        status_ijazah: "UPLOADED",
      },
      select: {
        id: true,
        status_ijazah: true,
        rwt_pend_id: true,
        nip: true,
        updated_at: true,
      },
    });

    return updatedSync;
  });
};

/**
 * Soft delete item antrean sinkronisasi pendidikan
 */
export const softDeleteSyncPendidikan = async (id) => {
  return prisma.ta_sync_pendidikan.update({
    where: { id },
    data: { is_deleted: true },
    select: { id: true, is_deleted: true },
  });
};



