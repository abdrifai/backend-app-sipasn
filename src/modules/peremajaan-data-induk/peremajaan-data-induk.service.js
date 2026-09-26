import { v4 as uuidv4 } from "uuid";
import prisma from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import * as peremajaanRepo from "./peremajaan-data-induk.repository.js";

const parseOptionalDate = (val) => {
  if (!val || val === "" || val === "null" || val === "undefined") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Ambil daftar opsi jenis perubahan data induk (khusus non-kedudukan)
 */
export const getJenisOptions = async () => {
  const options = await peremajaanRepo.findJenisPerubahanOptions();
  return options.map((opt) => ({
    id: Number(opt.id),
    jns_perubahan: opt.jns_perubahan,
  }));
};

/**
 * Ambil ringkasan statistik per jenis perubahan data induk
 */
export const getStats = async () => {
  const [groups, allJenis] = await Promise.all([
    peremajaanRepo.countStatsByJenis(),
    peremajaanRepo.findJenisPerubahanOptions(),
  ]);

  const statsMap = new Map();
  groups.forEach((g) => {
    statsMap.set(Number(g.jns_perubahan_id), g._count);
  });

  let totalAll = 0;
  const breakdown = allJenis.map((j) => {
    const idNum = Number(j.id);
    const count = statsMap.get(idNum) || 0;
    totalAll += count;
    return {
      id: idNum,
      label: j.jns_perubahan,
      count,
    };
  });

  return {
    total: totalAll,
    breakdown,
  };
};

/**
 * Ambil daftar riwayat perubahan data induk dengan filter & pagination
 */
export const getAllPeremajaan = async (params = {}) => {
  const { page = 1, limit = 10, search = "", jns_perubahan_id } = params;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const trimmedSearch = search ? search.trim() : "";

  let matchedPegawaiIds = [];
  if (trimmedSearch) {
    const matchingPegawai = await prisma.ta_pegawai.findMany({
      where: {
        OR: [
          { nipBaru: { contains: trimmedSearch } },
          { ta_orang: { is: { nama: { contains: trimmedSearch } } } },
        ],
      },
      select: { id: true },
      take: 100,
    });
    matchedPegawaiIds = matchingPegawai.map((p) => p.id);
  }

  const where = {
    is_deleted: false,
    ...(jns_perubahan_id
      ? { jns_perubahan_id: parseInt(jns_perubahan_id, 10) }
      : { jns_perubahan_id: { not: 1 } }), // Default: semua non-kedudukan
    ...(trimmedSearch
      ? {
          OR: [
            { sk: { contains: trimmedSearch } },
            { ket: { contains: trimmedSearch } },
            ...(matchedPegawaiIds.length > 0 ? [{ pegawai_id: { in: matchedPegawaiIds } }] : []),
          ],
        }
      : {}),
  };

  const [rawList, total] = await Promise.all([
    peremajaanRepo.findPeremajaanList({ where, skip, take: limitNum }),
    peremajaanRepo.countPeremajaan(where),
  ]);

  // Fetch related Pegawai details and Jenis Perubahan
  const pegawaiIds = [...new Set(rawList.map((item) => item.pegawai_id))];
  const jenisIds = [...new Set(rawList.map((item) => item.jns_perubahan_id).filter(Boolean))];

  const [pegawaiList, jenisList] = await Promise.all([
    pegawaiIds.length > 0
      ? prisma.ta_pegawai.findMany({
          where: { id: { in: pegawaiIds } },
          select: {
            id: true,
            nipBaru: true,
            orang_id: true,
            rwtPend_id: true,
            ta_orang: {
              select: {
                nama: true,
                foto: true,
              },
            },
            rwt_pend: {
              select: {
                gd: true,
                gb: true,
              },
            },
            rwt_jabatan: {
              select: {
                ref_jabatan: {
                  select: {
                    nama_jabatan: true,
                    ref_jnsjab: {
                      select: {
                        jnsjab: true,
                      },
                    },
                  },
                },
                ref_unitorganisasi: {
                  select: {
                    nmUnor: true,
                  },
                },
              },
            },
          },
        })
      : [],
    jenisIds.length > 0
      ? prisma.ref_perubahan_data_induk.findMany({
          where: { id: { in: jenisIds } },
          select: { id: true, jns_perubahan: true },
        })
      : [],
  ]);

  const pegawaiMap = new Map(pegawaiList.map((p) => [p.id, p]));
  const jenisMap = new Map(jenisList.map((j) => [Number(j.id), j.jns_perubahan]));

  const data = rawList.map((item) => {
    const pegawai = pegawaiMap.get(item.pegawai_id);
    return {
      id: item.id,
      pegawai_id: item.pegawai_id,
      jns_perubahan_id: item.jns_perubahan_id,
      nama_jenis_perubahan: jenisMap.get(Number(item.jns_perubahan_id)) || "Perubahan Data Induk",
      sk: item.sk,
      tglSk: item.tglSk,
      tmtSk: item.tmtSk,
      pengesahan: item.pengesahan,
      ket: item.ket,
      file_sk: item.file_sk,
      created_at: item.created_at,
      pegawai: pegawai
        ? {
            id: pegawai.id,
            nipBaru: pegawai.nipBaru,
            nama: pegawai.ta_orang?.nama || "-",
            glrDpn: pegawai.rwt_pend?.gd || "",
            glrBlk: pegawai.rwt_pend?.gb || "",
            foto: pegawai.ta_orang?.foto || null,
            jabatan:
              pegawai.rwt_jabatan?.ref_jabatan?.nama_jabatan ||
              pegawai.rwt_jabatan?.ref_jabatan?.ref_jnsjab?.jnsjab ||
              "-",
            unor: pegawai.rwt_jabatan?.ref_unitorganisasi?.nmUnor || "-",
          }
        : null,
    };
  });

  return {
    data,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

/**
 * Buat penetapan riwayat perubahan data induk baru
 */
export const createPeremajaan = async (data, file) => {
  const {
    pegawai_id,
    jns_perubahan_id,
    sk,
    tglSk,
    tmtSk,
    pengesahan,
    ket,
    sync_pegawai,
    nama_baru,
    nip_baru,
    tgl_lahir_baru,
    glr_dpn_baru,
    glr_blk_baru,
  } = data;

  const pegawai = await prisma.ta_pegawai.findUnique({
    where: { id: pegawai_id },
    select: { id: true, nipBaru: true, orang_id: true, rwtPend_id: true },
  });

  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const jnsIdInt = parseInt(jns_perubahan_id, 10);
  const filePath = file ? file.path.replace(/\\/g, "/") : null;
  const newId = uuidv4();
  const shouldSync = sync_pegawai === true || sync_pegawai === "true";

  const result = await prisma.$transaction(async (tx) => {
    // 1. Simpan riwayat di rwt_perubahan_data_induk
    const record = await peremajaanRepo.createRecord(
      {
        id: newId,
        pegawai_id,
        jns_perubahan_id: jnsIdInt,
        kedudukanpns_id: 1, // Tetap PNS AKTIF
        sk: sk || "-",
        tglSk: parseOptionalDate(tglSk) || new Date(),
        tmtSk: parseOptionalDate(tmtSk) || new Date(),
        pengesahan: pengesahan || "KEPALA BADAN KEPEGAWAIAN NEGARA",
        file_sk: filePath,
        ket: ket || "Peremajaan Data Induk Pegawai",
        is_deleted: false,
      },
      tx
    );

    // 2. Jika opsi sinkronisasi dipilih, perbarui data pokok pegawai di ta_orang / ta_pegawai / rwt_pend
    if (shouldSync) {
      if (jnsIdInt === 2 && nama_baru && pegawai.orang_id) {
        // Perubahan Nama
        await tx.ta_orang.update({
          where: { id: pegawai.orang_id },
          data: { nama: nama_baru },
        });
      } else if (jnsIdInt === 3 && nip_baru) {
        // Perubahan NIP
        await tx.ta_pegawai.update({
          where: { id: pegawai_id },
          data: { nipBaru: nip_baru },
        });
      } else if (jnsIdInt === 4 && tgl_lahir_baru && pegawai.orang_id) {
        // Perubahan Tanggal Lahir
        const parsedTgl = parseOptionalDate(tgl_lahir_baru);
        if (parsedTgl) {
          await tx.ta_orang.update({
            where: { id: pegawai.orang_id },
            data: { tglLhr: parsedTgl },
          });
        }
      } else if (jnsIdInt === 5) {
        // Pencantuman Gelar: diupdate ke rwt_pend (gd, gb) jika pegawai memiliki relasi rwtPend_id
        if (pegawai.rwtPend_id) {
          const updateGelar = {};
          if (glr_dpn_baru !== undefined) updateGelar.gd = glr_dpn_baru || "";
          if (glr_blk_baru !== undefined) updateGelar.gb = glr_blk_baru || "";
          if (Object.keys(updateGelar).length > 0) {
            await tx.rwt_pend.update({
              where: { id: pegawai.rwtPend_id },
              data: updateGelar,
            });
          }
        }
      }
    }

    return record;
  });

  return result;
};

/**
 * Hapus / batalkan riwayat perubahan data induk
 */
export const deletePeremajaan = async (id) => {
  const existing = await peremajaanRepo.findById(id);
  if (!existing) {
    throw new AppError("Data perubahan data induk tidak ditemukan", 404);
  }

  return peremajaanRepo.softDeleteRecord(id);
};
