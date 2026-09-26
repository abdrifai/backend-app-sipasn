import prisma from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { v4 as uuidv4 } from "uuid";
import ExcelJS from 'exceljs';
import * as pensiunRepository from "./pensiun.repository.js";

const parseOptionalDate = (val) => {
  if (!val || val === "" || val === "null" || val === "undefined") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const parseOptionalInt = (val) => {
  if (val === undefined || val === null || val === "" || val === "null" || val === "undefined") return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
};

export const getKedudukanPensiunOptions = async () => {
  return prisma.ref_kedudukanpns.findMany({
    where: {
      is_deleted: false,
      id: { notIn: [1, 7, 8] }, // Semua status Non-Aktif / Pemberhentian / Pensiun / Pindah Keluar
    },
    select: {
      id: true,
      kedudukanpns: true,
    },
    orderBy: { id: "asc" },
  });
};

export const getAllPensiun = async (params = {}) => {
  const { page = 1, limit = 10, search = "", kedudukanpns_id } = params;
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
    ...(kedudukanpns_id
      ? { kedudukanpns_id: parseInt(kedudukanpns_id, 10) }
      : { kedudukanpns_id: { notIn: [1, 7, 8] } }), // Default: Semua status kedudukan non-aktif / pemberhentian
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

  const [rawPensiunList, total] = await Promise.all([
    prisma.rwt_perubahan_data_induk.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { tmtSk: "desc" },
    }),
    prisma.rwt_perubahan_data_induk.count({ where }),
  ]);

  // Fetch related Pegawai and KedudukanPNS details
  const pegawaiIds = [...new Set(rawPensiunList.map((item) => item.pegawai_id))];
  const kedudukanIds = [...new Set(rawPensiunList.map((item) => item.kedudukanpns_id).filter(Boolean))];

  const [pegawaiList, kedudukanList] = await Promise.all([
    pegawaiIds.length > 0
      ? prisma.ta_pegawai.findMany({
          where: { id: { in: pegawaiIds } },
          select: {
            id: true,
            nipBaru: true,
            ta_orang: {
              select: {
                nama: true,
                foto: true,
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
    kedudukanIds.length > 0
      ? prisma.ref_kedudukanpns.findMany({
          where: { id: { in: kedudukanIds } },
          select: { id: true, kedudukanpns: true },
        })
      : [],
  ]);

  const pegawaiMap = new Map(pegawaiList.map((p) => [p.id, p]));
  const kedudukanMap = new Map(kedudukanList.map((k) => [Number(k.id), k.kedudukanpns]));

  const data = rawPensiunList.map((item) => {
    const pegawai = pegawaiMap.get(item.pegawai_id);
    return {
      id: item.id,
      pegawai_id: item.pegawai_id,
      kedudukanpns_id: item.kedudukanpns_id,
      no_sk: item.sk,
      tgl_sk: item.tglSk,
      tmt_pensiun: item.tmtSk,
      pengesahan: item.pengesahan,
      file_sk: item.file_sk,
      ket: item.ket,
      created_at: item.created_at,
      pegawai: pegawai
        ? {
            id: pegawai.id,
            nipBaru: pegawai.nipBaru,
            nama: pegawai.ta_orang?.nama || "-",
            foto: pegawai.ta_orang?.foto || null,
            jabatan:
              pegawai.rwt_jabatan?.ref_jabatan?.nama_jabatan ||
              pegawai.rwt_jabatan?.ref_jabatan?.ref_jnsjab?.jnsjab ||
              "-",
            unor: pegawai.rwt_jabatan?.ref_unitorganisasi?.nmUnor || "-",
          }
        : null,
      nama_kedudukan: kedudukanMap.get(Number(item.kedudukanpns_id)) || "PEMBERHENTIAN",
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

export const createPensiun = async (data, file) => {
  const { pegawai_id, kedudukanpns_id, no_sk, tgl_sk, tmt_pensiun, pengesahan, ket } = data;

  const pegawai = await prisma.ta_pegawai.findUnique({
    where: { id: pegawai_id },
    select: { id: true, nipBaru: true },
  });

  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const kedudukanIdInt = parseInt(kedudukanpns_id, 10);
  const filePath = file ? file.path.replace(/\\/g, "/") : null;
  const pensiunId = uuidv4();

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create rwt_perubahan_data_induk record
    const pensiun = await tx.rwt_perubahan_data_induk.create({
      data: {
        id: pensiunId,
        pegawai_id,
        jns_perubahan_id: 1, // Perubahan Kedudukan PNS
        kedudukanpns_id: kedudukanIdInt,
        sk: no_sk || "-",
        tglSk: parseOptionalDate(tgl_sk) || new Date(),
        tmtSk: parseOptionalDate(tmt_pensiun) || new Date(),
        pengesahan: pengesahan || "BUPATI TOJO UNA-UNA",
        file_sk: filePath,
        ket: ket || "Penetapan Pemberhentian Pegawai",
        is_deleted: false,
      },
    });

    // 2. Update status kedudukan pegawai di ta_pegawai
    await tx.ta_pegawai.update({
      where: { id: pegawai_id },
      data: {
        kedudukanPns_id: kedudukanIdInt,
      },
    });

    return pensiun;
  });

  return result;
};

export const deletePensiun = async (id) => {
  const existing = await prisma.rwt_perubahan_data_induk.findFirst({
    where: { id, is_deleted: false },
  });

  if (!existing) {
    throw new AppError("Data pensiun tidak ditemukan", 404);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Soft delete rwt_perubahan_data_induk
    await tx.rwt_perubahan_data_induk.update({
      where: { id },
      data: { is_deleted: true },
    });

    // 2. Check remaining pensiun records for this pegawai
    const remainingCount = await tx.rwt_perubahan_data_induk.count({
      where: {
        pegawai_id: existing.pegawai_id,
        is_deleted: false,
        kedudukanpns_id: { in: [2, 3, 4] },
      },
    });

    // 3. If no active pensiun record left, revert pegawai kedudukan back to 1 (PNS AKTIF PEMDA)
    if (remainingCount === 0) {
      await tx.ta_pegawai.update({
        where: { id: existing.pegawai_id },
        data: { kedudukanPns_id: 1 },
      });
    }

    return { message: "Data pensiun berhasil dihapus" };
  });
};

/**
 * Ambil data laporan proyeksi estimasi pensiun pegawai
 */
export const getEstimasiPensiunReport = async (query = {}) => {
  const {
    tahun = new Date().getFullYear().toString(),
    bulan = "",
    rentang = "",
    unorInduk_id = "",
    jns_jab_id = "",
    search = "",
    page = 1,
    limit = 15,
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 15);
  const skip = (pageNum - 1) * limitNum;

  const result = await pensiunRepository.findEstimasiPensiun({
    tahun,
    bulan,
    rentang,
    unorInduk_id,
    jns_jab_id,
    search: search ? search.trim() : "",
    skip,
    take: limitNum,
  });

  return {
    data: result.data,
    stats: result.stats,
    meta: result.meta,
  };
};

/**
 * Generate Excel buffer untuk laporan estimasi pensiun
 */
export const generateEstimasiPensiunExcel = async (query = {}) => {
  const result = await pensiunRepository.findEstimasiPensiun({
    ...query,
    skip: 0,
    take: 100000,
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Estimasi Pensiun');

  // Judul Laporan
  worksheet.mergeCells('A1:J1');
  worksheet.getCell('A1').value = 'LAPORAN ESTIMASI PENSIUN PEGAWAI NEGERI SIPIL';
  worksheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FF1E293B' } };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:J2');
  worksheet.getCell('A2').value = `PEMERINTAH KABUPATEN TOJO UNA-UNA - PROYEKSI TAHUN ${query.tahun || 'SEMUA TAHUN'}`;
  worksheet.getCell('A2').font = { size: 10, bold: true, color: { argb: 'FF64748B' } };
  worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

  // Setup Kolom Header
  worksheet.getRow(4).values = [
    'NO', 'NIP', 'NAMA LENGKAP', 'TGL LAHIR',
    'USIA SAAT INI', 'BUP', 'TMT ESTIMASI PENSIUN',
    'SISA WAKTU', 'JABATAN & KATEGORI', 'UNIT KERJA',
  ];

  worksheet.columns = [
    { key: 'no', width: 6 },
    { key: 'nip', width: 22 },
    { key: 'nama', width: 35 },
    { key: 'tgl_lahir', width: 14 },
    { key: 'usia', width: 18 },
    { key: 'bup', width: 8 },
    { key: 'tmt_pensiun', width: 22 },
    { key: 'sisa_waktu', width: 20 },
    { key: 'jabatan', width: 45 },
    { key: 'unit_kerja', width: 45 },
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add Data
  result.all_filtered.forEach((item, i) => {
    const row = worksheet.addRow({
      no: i + 1,
      nip: item.nip,
      nama: item.nama,
      tgl_lahir: item.tgl_lahir,
      usia: item.usia_sekarang,
      bup: item.bup,
      tmt_pensiun: item.tmt_pensiun,
      sisa_waktu: item.sisa_waktu,
      jabatan: `${item.jabatan} (${item.kategori})`,
      unit_kerja: item.unit_kerja,
    });

    if (i % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      };
    }
  });

  // Border & Alignment untuk data
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 4) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

/**
 * Ambil data rekapitulasi tahunan pegawai non-aktif dan perubahan data induk
 */
export const getRekapTahunanReport = async () => {
  const yearlyStats = await prisma.$queryRaw`
    SELECT 
      CAST(tahun AS CHAR) AS tahun,
      CAST(SUM(CASE WHEN kedudukanpns_id = 2 THEN 1 ELSE 0 END) AS UNSIGNED) AS pensiun_bup,
      CAST(SUM(CASE WHEN kedudukanpns_id IN (3, 4) THEN 1 ELSE 0 END) AS UNSIGNED) AS pensiun_janda_duda_dini,
      CAST(SUM(CASE WHEN kedudukanpns_id IN (6, 10) THEN 1 ELSE 0 END) AS UNSIGNED) AS pindah_keluar,
      CAST(SUM(CASE WHEN kedudukanpns_id IN (5, 9, 11) THEN 1 ELSE 0 END) AS UNSIGNED) AS pemberhentian_hukuman,
      CAST(SUM(CASE WHEN jns_perubahan_id IN (2, 3, 4, 5) THEN 1 ELSE 0 END) AS UNSIGNED) AS perubahan_identitas_gelar,
      CAST(COUNT(*) AS UNSIGNED) AS total_kejadian
    FROM (
      SELECT 
        YEAR(tmtSk) AS tahun,
        kedudukanpns_id,
        jns_perubahan_id
      FROM rwt_perubahan_data_induk
      WHERE tmtSk IS NOT NULL AND is_deleted = false
    ) AS sub
    GROUP BY tahun
    ORDER BY tahun DESC
  `;

  const totalSummary = {
    total_pensiun_bup: 0,
    total_pensiun_janda_duda_dini: 0,
    total_pindah_keluar: 0,
    total_pemberhentian_hukuman: 0,
    total_perubahan_identitas_gelar: 0,
    grand_total: 0,
  };

  const formattedStats = yearlyStats.map((row) => {
    const item = {
      tahun: row.tahun || "Tidak Diketahui",
      pensiun_bup: Number(row.pensiun_bup || 0),
      pensiun_janda_duda_dini: Number(row.pensiun_janda_duda_dini || 0),
      pindah_keluar: Number(row.pindah_keluar || 0),
      pemberhentian_hukuman: Number(row.pemberhentian_hukuman || 0),
      perubahan_identitas_gelar: Number(row.perubahan_identitas_gelar || 0),
      total_kejadian: Number(row.total_kejadian || 0),
    };
    totalSummary.total_pensiun_bup += item.pensiun_bup;
    totalSummary.total_pensiun_janda_duda_dini += item.pensiun_janda_duda_dini;
    totalSummary.total_pindah_keluar += item.pindah_keluar;
    totalSummary.total_pemberhentian_hukuman += item.pemberhentian_hukuman;
    totalSummary.total_perubahan_identitas_gelar += item.perubahan_identitas_gelar;
    totalSummary.grand_total += item.total_kejadian;
    return item;
  });

  return {
    data: formattedStats,
    summary: totalSummary,
  };
};

/**
 * Generate Excel buffer untuk rekapitulasi tahunan
 */
export const generateRekapTahunanExcel = async () => {
  const result = await getRekapTahunanReport();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rekapitulasi Tahunan');

  worksheet.mergeCells('A1:G1');
  worksheet.getCell('A1').value = 'REKAPITULASI TAHUNAN PEGAWAI NON-AKTIF & PERUBAHAN DATA INDUK';
  worksheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FF1E293B' } };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:G2');
  worksheet.getCell('A2').value = 'PEMERINTAH KABUPATEN TOJO UNA-UNA - BKD / BKPSDM';
  worksheet.getCell('A2').font = { size: 10, bold: true, color: { argb: 'FF64748B' } };
  worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.getRow(4).values = [
    'TAHUN',
    'PENSIUN BUP',
    'PENSIUN JANDA/DUDA/DINI',
    'PINDAH KELUAR',
    'PEMBERHENTIAN / DISIPLIN',
    'PERUBAHAN IDENTITAS & GELAR',
    'TOTAL PERISTIWA'
  ];

  worksheet.columns = [
    { key: 'tahun', width: 14 },
    { key: 'pensiun_bup', width: 18 },
    { key: 'pensiun_janda_duda_dini', width: 26 },
    { key: 'pindah_keluar', width: 18 },
    { key: 'pemberhentian_hukuman', width: 26 },
    { key: 'perubahan_identitas_gelar', width: 30 },
    { key: 'total_kejadian', width: 18 },
  ];

  const headerRow = worksheet.getRow(4);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F766E' }, // Teal
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  result.data.forEach((item, i) => {
    const row = worksheet.addRow({
      tahun: item.tahun,
      pensiun_bup: item.pensiun_bup,
      pensiun_janda_duda_dini: item.pensiun_janda_duda_dini,
      pindah_keluar: item.pindah_keluar,
      pemberhentian_hukuman: item.pemberhentian_hukuman,
      perubahan_identitas_gelar: item.perubahan_identitas_gelar,
      total_kejadian: item.total_kejadian,
    });

    if (i % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      };
    }
  });

  // Tambahkan baris TOTAL
  const summaryRow = worksheet.addRow({
    tahun: 'TOTAL',
    pensiun_bup: result.summary.total_pensiun_bup,
    pensiun_janda_duda_dini: result.summary.total_pensiun_janda_duda_dini,
    pindah_keluar: result.summary.total_pindah_keluar,
    pemberhentian_hukuman: result.summary.total_pemberhentian_hukuman,
    perubahan_identitas_gelar: result.summary.total_perubahan_identitas_gelar,
    total_kejadian: result.summary.grand_total,
  });
  summaryRow.font = { bold: true };
  summaryRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE2E8F0' },
  };

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 4) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
        if (cell.col > 1) {
          cell.alignment = { horizontal: 'right' };
        } else {
          cell.alignment = { horizontal: 'center' };
        }
      });
    }
  });

  return workbook.xlsx.writeBuffer();
};
