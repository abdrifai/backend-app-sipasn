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
      id: { in: [2, 3, 4, 5, 9, 11] }, // Pensiun Masa Waktu, Janda/Duda, Pensiun Dini, Disiplin, Pemberhentian
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

  const where = {
    is_deleted: false,
    ...(kedudukanpns_id ? { kedudukanpns_id: parseInt(kedudukanpns_id, 10) } : {}),
    ...(trimmedSearch
      ? {
          OR: [
            { no_sk: { contains: trimmedSearch } },
            { ket: { contains: trimmedSearch } },
          ],
        }
      : {}),
  };

  const [rawPensiunList, total] = await Promise.all([
    prisma.rwt_pensiun.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { created_at: "desc" },
    }),
    prisma.rwt_pensiun.count({ where }),
  ]);

  // Fetch related Pegawai and KedudukanPNS details
  const pegawaiIds = [...new Set(rawPensiunList.map((item) => item.pegawai_id))];
  const kedudukanIds = [...new Set(rawPensiunList.map((item) => item.kedudukanpns_id))];

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
                  },
                },
                ref_jnsjab: {
                  select: {
                    jnsjab: true,
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
      ...item,
      pegawai: pegawai
        ? {
            id: pegawai.id,
            nipBaru: pegawai.nipBaru,
            nama: pegawai.ta_orang?.nama || "-",
            foto: pegawai.ta_orang?.foto || null,
            jabatan: pegawai.rwt_jabatan?.ref_jabatan?.nama_jabatan || pegawai.rwt_jabatan?.ref_jnsjab?.jnsjab || "-",
            unor: pegawai.rwt_jabatan?.ref_unitorganisasi?.nmUnor || "-",
          }
        : null,
      nama_kedudukan: kedudukanMap.get(Number(item.kedudukanpns_id)) || "PENSIUN",
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
  const { pegawai_id, kedudukanpns_id, no_sk, tgl_sk, tmt_pensiun, ket } = data;

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
    // 1. Create rwt_pensiun record
    const pensiun = await tx.rwt_pensiun.create({
      data: {
        id: pensiunId,
        pegawai_id,
        kedudukanpns_id: kedudukanIdInt,
        no_sk: no_sk || null,
        tgl_sk: parseOptionalDate(tgl_sk),
        tmt_pensiun: parseOptionalDate(tmt_pensiun),
        file_sk: filePath,
        ket: ket || null,
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
  const existing = await prisma.rwt_pensiun.findFirst({
    where: { id, is_deleted: false },
  });

  if (!existing) {
    throw new AppError("Data pensiun tidak ditemukan", 404);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Soft delete rwt_pensiun
    await tx.rwt_pensiun.update({
      where: { id },
      data: { is_deleted: true },
    });

    // 2. Check remaining pensiun records for this pegawai
    const remainingCount = await tx.rwt_pensiun.count({
      where: { pegawai_id: existing.pegawai_id, is_deleted: false },
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
