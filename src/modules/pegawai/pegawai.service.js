import { randomUUID } from "node:crypto";
import fs from "fs";
import path from "path";
import ExcelJS from 'exceljs';
import prisma from "../../config/database.js";
import * as pegawaiRepository from "./pegawai.repository.js";
import { resolveJabatanForUnor } from "../ref-unor/ref-unor.jabatan-resolver.js";
import AppError from "../../utils/AppError.js";
import logger from "../../config/logger.js";

/**
 * Generate Excel buffer for DUK report
 */
export const generateDUKExcel = async (unorInduk_id) => {
  if (!unorInduk_id) throw new AppError("Unit Kerja harus dipilih", 400);

  // Ambil semua data tanpa paginasi (limit besar)
  const { results } = await pegawaiRepository.findDUK({ 
    unorInduk_id,
    skip: 0,
    take: 10000 
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Laporan DUK');

  // Judul Laporan
  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = 'DAFTAR URUT KEPANGKATAN (DUK) PEGAWAI';
  worksheet.getCell('A1').font = { size: 14, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  // Setup Column
  worksheet.getRow(3).values = ['NO', 'NIP', 'NAMA', 'GOL/PANGKAT', 'JABATAN', 'UNIT KERJA'];
  worksheet.columns = [
    { key: 'no', width: 6 },
    { key: 'nip', width: 22 },
    { key: 'nama', width: 35 },
    { key: 'pangkat_gol', width: 25 },
    { key: 'jabatan', width: 45 },
    { key: 'unit_kerja', width: 50 },
  ];

  // Styling Header
  const headerRow = worksheet.getRow(3);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add Data
  const rows = [];
  for (let i = 0; i < results.length; i++) {
    const p = results[i];
    const jabatan = await resolveJabatanNama(p.rwt_jabatan);
    rows.push({
      no: i + 1,
      nip: p.nipBaru,
      nama: p.ta_orang?.nama || "-",
      pangkat_gol: p.rwt_gol?.ref_gol ? `${p.rwt_gol.ref_gol.pangkat} (${p.rwt_gol.ref_gol.gol})` : "-",
      jabatan,
      unit_kerja: p.rwt_jabatan?.ref_unitorganisasi?.nmUnor || "-",
    });
  }

  worksheet.addRows(rows);

  // Border & Alignment untuk data
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 3) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }
  });

  // Simpan ke buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
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
    kategori = "",
    search = "",
    page = 1,
    limit = 15,
  } = query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 15);
  const skip = (pageNum - 1) * limitNum;

  const result = await pegawaiRepository.findEstimasiPensiun({
    tahun,
    bulan,
    rentang,
    unorInduk_id,
    kategori,
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
  const result = await pegawaiRepository.findEstimasiPensiun({
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
    'NO',
    'NIP',
    'NAMA LENGKAP',
    'TGL LAHIR',
    'USIA SAAT INI',
    'BUP',
    'TMT ESTIMASI PENSIUN',
    'SISA WAKTU',
    'JABATAN & KATEGORI',
    'UNIT KERJA',
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
 * Ambil daftar pegawai dengan pagination dan filter
 */
export const getPegawai = async (params) => {
  const result = await pegawaiRepository.findAll(params);

  // Format data untuk response
  const formattedData = await Promise.all(
    result.data.map(async (p) => {
      const rwtJab = p.rwt_jabatan;
      const gd = p.rwt_pend?.gd;
      const gb = p.rwt_pend?.gb;
      const namaFormatted = formatNamaGelar(p.ta_orang?.nama, gd, gb);
      const jabatan = await resolveJabatanNama(rwtJab);

      return {
        id: p.id,
        nipBaru: p.nipBaru,
        nipLama: p.nipLama || "-",
        nama: p.ta_orang?.nama || "-",
        nama_formatted: namaFormatted,
        gelar_depan: gd || null,
        gelar_belakang: gb || null,
        nik: p.ta_orang?.nik || "-",
        foto: p.ta_orang?.foto || null,
        golongan: p.rwt_gol?.ref_gol?.gol || "-",
        pangkat: p.rwt_gol?.ref_gol?.pangkat || "-",
        jabatan: jabatan,
        unit_kerja: rwtJab?.ref_unitorganisasi?.nmUnor || "-",
      };
    })
  );

  return {
    data: formattedData,
    meta: result.meta,
  };
};

/**
 * Ambil semua pegawai dengan format yang rapi
 */
export const getAllPegawai = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const search = query.search || "";

  const result = await pegawaiRepository.findAll({ page, limit, search });

  // Format data untuk frontend secara paralel
  const formattedData = await Promise.all(
    result.data.map(async (p) => {
      let jabatan = "Staf";
      const rwtJab = p.rwt_jabatan;

      if (rwtJab) {
        jabatan = rwtJab.ref_jabatan?.nama_jabatan || "Staf";
      }

      const gd = p.rwt_pend?.gd;
      const gb = p.rwt_pend?.gb;
      const namaFormatted = formatNamaGelar(p.ta_orang?.nama, gd, gb);

      return {
        id: p.id,
        nip: p.nipBaru,
        nama: namaFormatted,
        nama_asli: p.ta_orang?.nama || "Tidak Diketahui",
        nama_formatted: namaFormatted,
        gelar_depan: gd || null,
        gelar_belakang: gb || null,
        nik: p.ta_orang?.nik || "-",
        foto: p.ta_orang?.foto || null,
        golongan: p.rwt_gol?.ref_gol?.gol || "-",
        pangkat: p.rwt_gol?.ref_gol?.pangkat || "-",
        jabatan: jabatan,
        unit_kerja: rwtJab?.ref_unitorganisasi?.nmUnor || "-",
      };
    })
  );

  return {
    data: formattedData,
    meta: result.meta,
  };
};

export const formatNamaGelar = (nama, gd, gb) => {
  if (!nama) return "-";
  let result = nama.trim();
  const cleanGd = gd && gd !== "-" ? gd.trim() : "";
  const cleanGb = gb && gb !== "-" ? gb.trim() : "";

  if (cleanGd && !result.toLowerCase().startsWith(cleanGd.toLowerCase())) {
    result = `${cleanGd} ${result}`;
  }
  if (cleanGb && !result.toLowerCase().endsWith(cleanGb.toLowerCase())) {
    result = `${result}, ${cleanGb}`;
  }
  return result;
};

const formatDateIndo = (dateStr) => {
  if (!dateStr) return "-";
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const getPegawaiDetail = async (id) => {
  const p = await pegawaiRepository.findById(id);
  if (!p) return null;

  // Ambil data referensi & seluruh riwayat secara paralel
  const [
    riwayatData,
    allJkl,
    allAgama,
    allKawin,
    allTktPend,
    allJnsDiklat,
    allJenjangDiklat,
    allJnsKp,
    allGol,
  ] = await Promise.all([
    pegawaiRepository.findRiwayatByPegawaiId(p.id, p.nipBaru),
    pegawaiRepository.findAllJkl(),
    pegawaiRepository.findAllAgama(),
    pegawaiRepository.findAllKawin(),
    pegawaiRepository.findAllTktPend(),
    pegawaiRepository.findAllJnsDiklat(),
    pegawaiRepository.findAllJenjangDiklat(),
    pegawaiRepository.findAllJnsKp(),
    pegawaiRepository.findAllGol(),
  ]);

  let jabatan = "Staf";
  const rwtJab = p.rwt_jabatan;

  if (rwtJab) {
    jabatan = rwtJab.ref_jabatan?.nama_jabatan || "Staf";
  }

  // Format gelar & nama lengkap
  const gd = p.rwt_pend?.gd || riwayatData.riwayatPendidikan?.[0]?.gd;
  const gb = p.rwt_pend?.gb || riwayatData.riwayatPendidikan?.[0]?.gb;
  const namaFormatted = formatNamaGelar(p.ta_orang?.nama, gd, gb);

  // Format birth info & gender
  const orang = p.ta_orang;
  if (orang) {
    orang.nama_formatted = namaFormatted;
    orang.gelar_depan = gd || null;
    orang.gelar_belakang = gb || null;

    const jkl = allJkl.find(j => String(j.id) === String(orang.jkl_id));
    orang.jkl_nama = jkl?.jkl || '-';

    const agama = allAgama.find(a => String(a.id) === String(orang.agama_id));
    orang.agama_nama = agama?.agama || '-';

    const kawin = allKawin.find(k => String(k.id) === String(orang.kawin_id));
    orang.kawin_nama = kawin?.kawin || '-';

    if (orang.tglLhr) {
      orang.tglLhr_formatted = formatDateIndo(orang.tglLhr);
    }
  }

  // Masa Kerja Logic
  let mk_golongan = "- Tahun, - Bulan";
  let mk_saat_ini = "- Tahun, - Bulan";

  const rwtGol = p.rwt_gol;
  if (rwtGol && rwtGol.maskerThn !== null && rwtGol.maskerBln !== null) {
    const thnBase = parseInt(rwtGol.maskerThn) || 0;
    const blnBase = parseInt(rwtGol.maskerBln) || 0;
    mk_golongan = `${thnBase} Tahun, ${blnBase} Bulan`;

    if (rwtGol.tmtSk) {
      const tmt = new Date(rwtGol.tmtSk);
      const now = new Date();
      
      let diffMonths = (now.getFullYear() - tmt.getFullYear()) * 12 + (now.getMonth() - tmt.getMonth());
      if (now.getDate() < tmt.getDate()) {
        diffMonths--;
      }

      const totalMonths = (thnBase * 12 + blnBase) + Math.max(0, diffMonths);
      const resThn = Math.floor(totalMonths / 12);
      const resBln = totalMonths % 12;
      mk_saat_ini = `${resThn} Tahun, ${resBln} Bulan`;
    }
  }

  // Helper pemformat URL dokumen fisik/arsip
  const formatDokumenUrl = (arsipPath) => {
    if (!arsipPath) return null;
    const cleaned = String(arsipPath).replace(/\\/g, "/").trim();
    if (!cleaned) return null;
    if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) return cleaned;
    if (cleaned.startsWith("/storage/")) return cleaned;
    if (cleaned.startsWith("storage/")) return `/${cleaned}`;
    return `/storage/dokumen/${cleaned}`;
  };

  // Format Riwayat Jabatan
  const formattedRiwayatJabatan = await Promise.all(
    riwayatData.riwayatJabatan.map(async (rj) => {
      const nmJabatan = rj.ref_jabatan?.nama_jabatan || "-";
      const arsip = riwayatData.arsipList?.find(a => a.from === rj.id);

      return {
        id: rj.id,
        jnsJab_id: rj.jnsJab_id || "",
        nmJab_id: rj.nmJab_id || "",
        unorInduk_id: rj.unorInduk_id || "",
        eselon_id: rj.eselon_id || "",
        jnsMutasi_id: rj.jnsMutasi_id || "",
        nama_jabatan: nmJabatan,
        jenis_jabatan: rj.ref_jnsjab?.jnsjab || "-",
        unit_kerja: rj.ref_unitorganisasi?.nmUnor || "-",
        sk: rj.sk || "-",
        tgl_sk: formatDateIndo(rj.tglSk),
        tmt_sk: formatDateIndo(rj.tmtSk),
        tglSk: rj.tglSk ? rj.tglSk.toISOString().split('T')[0] : null,
        tmtSk: rj.tmtSk ? rj.tmtSk.toISOString().split('T')[0] : null,
        tmt_pelantikan: rj.tmtPelantikan ? formatDateIndo(rj.tmtPelantikan) : "-",
        tmtPelantikan: rj.tmtPelantikan ? rj.tmtPelantikan.toISOString().split('T')[0] : null,
        eselon: rj.eselon_kode || "-",
        pengesahan: rj.pengesahan || "-",
        dokumen_sk: formatDokumenUrl(arsip?.arsip),
      };
    })
  );

  // Format Riwayat Golongan
  const formattedRiwayatGolongan = riwayatData.riwayatGolongan.map((rg) => {
    const jnsKp = allJnsKp.find(jk => String(jk.id) === String(rg.jnsKp_id));
    const arsip = riwayatData.arsipList?.find(a => a.from === rg.id);
    return {
      id: rg.id,
      gol_id: rg.gol_id,
      jnsKp_id: rg.jnsKp_id,
      golongan: rg.ref_gol?.gol || "-",
      pangkat: rg.ref_gol?.pangkat || "-",
      sk: rg.sk || "-",
      tgl_sk: formatDateIndo(rg.tglSk),
      tmt_sk: formatDateIndo(rg.tmtSk),
      tglSk: rg.tglSk ? rg.tglSk.toISOString().split('T')[0] : null,
      tmtSk: rg.tmtSk ? rg.tmtSk.toISOString().split('T')[0] : null,
      pertek_bkn: rg.pertekBkn || "-",
      pertekBkn: rg.pertekBkn || "",
      tgl_pertek: rg.tglPertek ? formatDateIndo(rg.tglPertek) : "-",
      tglPertek: rg.tglPertek ? rg.tglPertek.toISOString().split('T')[0] : null,
      jenis_kp: jnsKp?.jnskp || "-",
      maskerThn: rg.maskerThn || "",
      maskerBln: rg.maskerBln || "",
      masa_kerja: `${rg.maskerThn || 0} Thn ${rg.maskerBln || 0} Bln`,
      gapok: rg.gapok ? `Rp ${rg.gapok.toLocaleString('id-ID')}` : "-",
      gapok_raw: rg.gapok || null,
      pengesahan: rg.pengesahan || "-",
      dokumen_sk: formatDokumenUrl(arsip?.arsip),
    };
  });

  // Format Riwayat Pendidikan
  const formattedRiwayatPendidikan = riwayatData.riwayatPendidikan.map((rp) => {
    const tkt = allTktPend.find(t => String(t.id) === String(rp.tktPend_id));
    const arsipIjazah = riwayatData.arsipList?.find(a => a.from === rp.id && a.jnsarsip_id === 3) 
      || riwayatData.arsipList?.find(a => a.from === rp.id && !a.arsip?.toLowerCase().includes("transkrip"));
    const arsipTranskrip = riwayatData.arsipList?.find(a => a.from === rp.id && a.jnsarsip_id === 4) 
      || riwayatData.arsipList?.find(a => a.from === rp.id && a.arsip?.toLowerCase().includes("transkrip"));
    return {
      id: rp.id,
      tktPend_id: rp.tktPend_id,
      pend_id: rp.pend_id || "",
      tingkat: tkt?.tktpend || `Tingkat ${rp.tktPend_id}`,
      sekolah: rp.nmSekolah || "-",
      nmSekolah: rp.nmSekolah || "",
      jurusan: rp.jurusan || "-",
      tahun_lulus: rp.thnLulus || "-",
      thnLulus: rp.thnLulus || "",
      no_ijazah: rp.noIjazah || "-",
      noIjazah: rp.noIjazah || "",
      tgl_ijazah: rp.tglIjazah ? formatDateIndo(rp.tglIjazah) : "-",
      tglIjazah: rp.tglIjazah ? rp.tglIjazah.toISOString().split('T')[0] : null,
      gelar_depan: rp.gd || "-",
      gd: rp.gd || "",
      gelar_belakang: rp.gb || "-",
      gb: rp.gb || "",
      pengesahan: rp.pengesahan || "-",
      dokumen_ijazah: formatDokumenUrl(arsipIjazah?.arsip),
      dokumen_transkrip: formatDokumenUrl(arsipTranskrip?.arsip),
    };
  });

  // Format Riwayat Diklat
  const formattedRiwayatDiklat = riwayatData.riwayatDiklat.map((rd) => {
    const jns = allJnsDiklat.find(j => String(j.id) === String(rd.jnsDiklat_id));
    const jenjang = allJenjangDiklat.find(j => String(j.id) === String(rd.jenjangDiklat_id));
    const arsip = riwayatData.arsipList?.find(a => a.from === rd.id);
    return {
      id: rd.id,
      jnsDiklat_id: rd.jnsDiklat_id || "",
      jenjangDiklat_id: rd.jenjangDiklat_id || "",
      nama_diklat: rd.nmDiklat || "-",
      nmDiklat: rd.nmDiklat || "",
      jenis_diklat: jns?.jnsDiklat || "-",
      jenjang_diklat: jenjang?.jenjangDiklat || "-",
      penyelenggara: rd.penyelenggara || "-",
      angkatan: rd.angkatan || "-",
      tempat: rd.t4pelaksanaan || "-",
      t4pelaksanaan: rd.t4pelaksanaan || "",
      no_sertifikat: rd.noSertifikat || "-",
      noSertifikat: rd.noSertifikat || "",
      tgl_sertifikat: rd.tglSertifikat ? formatDateIndo(rd.tglSertifikat) : "-",
      tglSertifikat: rd.tglSertifikat ? rd.tglSertifikat.toISOString().split('T')[0] : null,
      dokumen_diklat: formatDokumenUrl(arsip?.arsip),
    };
  });

  // Format Riwayat KGB
  const formattedRiwayatKgb = riwayatData.riwayatKgb.map((rk) => {
    const golRef = allGol.find(g => String(g.kdGol) === String(rk.gol_id) || g.gol === rk.gol_id);
    const arsip = riwayatData.arsipList?.find(a => a.from === rk.id);
    return {
      id: rk.id,
      gol_id: rk.gol_id || "",
      golongan: golRef ? `${golRef.gol} - ${golRef.pangkat}` : (rk.gol_id || "-"),
      gol_kode: golRef?.gol || rk.gol_id || "-",
      pangkat: golRef?.pangkat || "-",
      sk: rk.sk || "-",
      tgl_sk: formatDateIndo(rk.tglSk),
      tmt_sk: rk.tmtSk ? formatDateIndo(rk.tmtSk) : "-",
      tglSk: rk.tglSk ? rk.tglSk.toISOString().split('T')[0] : null,
      tmtSk: rk.tmtSk ? rk.tmtSk.toISOString().split('T')[0] : null,
      maskerThn: rk.maskerThn || "",
      maskerBln: rk.maskerBln || "",
      masa_kerja: `${rk.maskerThn || 0} Thn ${rk.maskerBln || 0} Bln`,
      gapok: rk.gapok ? `Rp ${rk.gapok.toLocaleString('id-ID')}` : "-",
      gapok_raw: rk.gapok || null,
      pengesahan: rk.pengesahan || "-",
      dokumen_sk: formatDokumenUrl(arsip?.arsip),
    };
  });

  // Format Riwayat Hukdis
  const formattedRiwayatHukdis = riwayatData.riwayatHukdis.map((rh) => {
    const arsip = riwayatData.arsipList?.find(a => a.from === rh.id);
    return {
      id: rh.id,
      tktHukuman_id: rh.tktHukuman_id || "",
      jnsHukuman_id: rh.jnsHukuman_id || "",
      skHd: rh.skHd || "-",
      sk: rh.skHd || "-",
      tglSkHd: rh.tglSkHd ? (typeof rh.tglSkHd === 'string' ? rh.tglSkHd.split('T')[0] : (rh.tglSkHd.toISOString ? rh.tglSkHd.toISOString().split('T')[0] : String(rh.tglSkHd))) : null,
      tgl_sk: rh.tglSkHd ? formatDateIndo(rh.tglSkHd) : "-",
      tmtSkHd: rh.tmtSkHd ? (typeof rh.tmtSkHd === 'string' ? rh.tmtSkHd.split('T')[0] : (rh.tmtSkHd.toISOString ? rh.tmtSkHd.toISOString().split('T')[0] : String(rh.tmtSkHd))) : null,
      tmt_sk: rh.tmtSkHd ? formatDateIndo(rh.tmtSkHd) : "-",
      tglAkhirHukuman: rh.tglAkhirHukuman ? (typeof rh.tglAkhirHukuman === 'string' ? rh.tglAkhirHukuman.split('T')[0] : (rh.tglAkhirHukuman.toISOString ? rh.tglAkhirHukuman.toISOString().split('T')[0] : String(rh.tglAkhirHukuman))) : null,
      tgl_akhir: rh.tglAkhirHukuman ? formatDateIndo(rh.tglAkhirHukuman) : "-",
      tingkat: rh.tktHukuman_nama || "-",
      jenis: rh.jnsHukuman_nama || "-",
      masaHukumanThn: rh.masaHukumanThn ?? "0",
      masaHukumanBln: rh.masaHukumanBln ?? "0",
      masa_hukuman: `${rh.masaHukumanThn || 0} Thn ${rh.masaHukumanBln || 0} Bln`,
      gol_id: rh.gol_id || null,
      noPP: rh.noPP || "-",
      no_pp: rh.noPP || "-",
      alasanHukuman: rh.alasanHukuman || "-",
      alasan: rh.alasanHukuman || "-",
      ket: rh.ket || "-",
      dokumen_sk: formatDokumenUrl(arsip?.arsip),
    };
  });

  // Format CPNS / PNS
  const formattedCpnsPns = riwayatData.dataCpnsPns.map((cp) => {
    const arsip = riwayatData.arsipList?.find(
      (a) => a.from === cp.id || 
             (String(cp.spns_id) === "1" && a.jnsarsip_id === 1 && a.from === cp.id) ||
             (String(cp.spns_id) === "2" && a.jnsarsip_id === 2 && a.from === cp.id)
    );
    return {
      id: cp.id,
      spns_id: String(cp.spns_id || "1"),
      status_pns: cp.spns_nama || (String(cp.spns_id) === '1' ? 'CPNS' : 'PNS'),
      sk: cp.sk || "-",
      tglsk: cp.tglsk ? (typeof cp.tglsk === 'string' ? cp.tglsk.split('T')[0] : (cp.tglsk.toISOString ? cp.tglsk.toISOString().split('T')[0] : String(cp.tglsk))) : null,
      tgl_sk: cp.tglsk ? formatDateIndo(cp.tglsk) : "-",
      tmtsk: cp.tmtsk ? (typeof cp.tmtsk === 'string' ? cp.tmtsk.split('T')[0] : (cp.tmtsk.toISOString ? cp.tmtsk.toISOString().split('T')[0] : String(cp.tmtsk))) : null,
      tmt_sk: cp.tmtsk ? formatDateIndo(cp.tmtsk) : "-",
      gol_id: cp.gol_id,
      golongan: cp.gol_nama ? `${cp.gol_nama} - ${cp.pangkat_nama || ''}` : "-",
      gol_nama: cp.gol_nama || "-",
      pangkat_nama: cp.pangkat_nama || "-",
      maskerThn: cp.maskerThn ?? "0",
      maskerBln: cp.maskerBln ?? "0",
      masa_kerja: `${cp.maskerThn || 0} Thn ${cp.maskerBln || 0} Bln`,
      pertek_bkn: cp.pertekBkn || "-",
      pertekBkn: cp.pertekBkn || "",
      tgl_pertek: cp.tglPertekBkn ? formatDateIndo(cp.tglPertekBkn) : "-",
      tglPertekBkn: cp.tglPertekBkn ? (typeof cp.tglPertekBkn === 'string' ? cp.tglPertekBkn.split('T')[0] : (cp.tglPertekBkn.toISOString ? cp.tglPertekBkn.toISOString().split('T')[0] : String(cp.tglPertekBkn))) : null,
      sttpl: cp.sttpl || "-",
      tgl_sttpl: cp.tglsttpl ? formatDateIndo(cp.tglsttpl) : "-",
      tglsttpl: cp.tglsttpl ? (typeof cp.tglsttpl === 'string' ? cp.tglsttpl.split('T')[0] : (cp.tglsttpl.toISOString ? cp.tglsttpl.toISOString().split('T')[0] : String(cp.tglsttpl))) : null,
      no_karpeg: cp.noKarpeg || "-",
      noKarpeg: cp.noKarpeg || "",
      tgl_karpeg: cp.tglKarpeg ? formatDateIndo(cp.tglKarpeg) : "-",
      tglKarpeg: cp.tglKarpeg ? (typeof cp.tglKarpeg === 'string' ? cp.tglKarpeg.split('T')[0] : (cp.tglKarpeg.toISOString ? cp.tglKarpeg.toISOString().split('T')[0] : String(cp.tglKarpeg))) : null,
      penanda_tangan: cp.penanda_tangan || "-",
      dokumen_sk: formatDokumenUrl(arsip?.arsip),
    };
  });

  // Format Profesi
  const formattedRiwayatProfesi = riwayatData.riwayatProfesi.map((rp) => {
    const arsip = riwayatData.arsipList?.find(a => a.from === rp.id);
    return {
      id: rp.id,
      jns_profesi_id: rp.jns_profesi_id || "",
      profesi: rp.profesi_nama || "-",
      no_sertifikat: rp.no_sertifikat || "-",
      tgl_lulus: rp.tgl_lulus ? formatDateIndo(rp.tgl_lulus) : "-",
      tglLulus: rp.tgl_lulus ? (typeof rp.tgl_lulus === 'string' ? rp.tgl_lulus.split('T')[0] : (rp.tgl_lulus.toISOString ? rp.tgl_lulus.toISOString().split('T')[0] : String(rp.tgl_lulus))) : null,
      berlaku: rp.berlaku || "-",
      ket: rp.ket || "-",
      dokumen_profesi: formatDokumenUrl(arsip?.arsip),
    };
  });

  // Format Riwayat Orang Tua
  const formattedRiwayatOrtu = riwayatData.riwayatOrtu.map((ro) => ({
    id: ro.id,
    orang_id: ro.orang_id,
    hubungan: ro.hubungan || "Orang Tua",
    nama: ro.nama || "-",
    nik: ro.nik || "-",
    t4Lhr: ro.t4Lhr || "",
    tglLhr: ro.tglLhr ? (typeof ro.tglLhr === 'string' ? ro.tglLhr.split('T')[0] : (ro.tglLhr.toISOString ? ro.tglLhr.toISOString().split('T')[0] : String(ro.tglLhr))) : null,
    ttl: `${ro.t4Lhr || '-'}${ro.tglLhr ? `, ${formatDateIndo(ro.tglLhr)}` : ''}`,
    jkl_id: ro.jkl_id || (ro.hubungan === 'Ayah' || ro.hubungan === 'Ayah Mertua' ? '1' : '2'),
    alamat: ro.alamat || "-",
    no_hp: ro.no_hp || "-",
    pns: ro.pns ? "PNS" : "Bukan PNS",
    is_pns: Boolean(ro.pns),
  }));

  // Format Riwayat Pasangan (Suami / Istri)
  const formattedRiwayatPasangan = riwayatData.riwayatPasangan.map((rs) => {
    const arsip = riwayatData.arsipList?.find(
      (a) => a.from === rs.id || (a.jnsarsip_id === 8 && a.from === rs.id)
    );
    return {
      id: rs.id,
      orang_id: rs.orang_id,
      dokumen_sk: formatDokumenUrl(arsip?.arsip),
      dokumen_nikah: formatDokumenUrl(arsip?.arsip),
      hubungan: rs.hubungan || "Pasangan",
      nama: rs.nama || "-",
      nik: rs.nik || "-",
      t4Lhr: rs.t4Lhr || "",
      tglLhr: rs.tglLhr ? (typeof rs.tglLhr === 'string' ? rs.tglLhr.split('T')[0] : (rs.tglLhr.toISOString ? rs.tglLhr.toISOString().split('T')[0] : String(rs.tglLhr))) : null,
      ttl: `${rs.t4Lhr || '-'}${rs.tglLhr ? `, ${formatDateIndo(rs.tglLhr)}` : ''}`,
      jkl_id: rs.jkl_id || (rs.hubungan?.toLowerCase().includes('suami') ? '1' : '2'),
      aktaMenikah: rs.aktaMenikah || "",
      akta_nikah: rs.aktaMenikah || "-",
      tglMenikah: rs.tglMenikah ? (typeof rs.tglMenikah === 'string' ? rs.tglMenikah.split('T')[0] : (rs.tglMenikah.toISOString ? rs.tglMenikah.toISOString().split('T')[0] : String(rs.tglMenikah))) : null,
      tgl_nikah: rs.tglMenikah ? formatDateIndo(rs.tglMenikah) : "-",
      aktaCerai: rs.aktaCerai || "",
      akta_cerai: rs.aktaCerai || "-",
      tglCerai: rs.tglCerai ? (typeof rs.tglCerai === 'string' ? rs.tglCerai.split('T')[0] : (rs.tglCerai.toISOString ? rs.tglCerai.toISOString().split('T')[0] : String(rs.tglCerai))) : null,
      tgl_cerai: rs.tglCerai ? formatDateIndo(rs.tglCerai) : "-",
      aktaMeninggal: rs.aktaMeninggal || "",
      akta_meninggal: rs.aktaMeninggal || "-",
      tglMeninggal: rs.tglMeninggal ? (typeof rs.tglMeninggal === 'string' ? rs.tglMeninggal.split('T')[0] : (rs.tglMeninggal.toISOString ? rs.tglMeninggal.toISOString().split('T')[0] : String(rs.tglMeninggal))) : null,
      tgl_meninggal: rs.tglMeninggal ? formatDateIndo(rs.tglMeninggal) : "-",
      karisKarsu: rs.karisKarsu || "",
      karis_karsu: rs.karisKarsu || "-",
      alamat: rs.alamat || "-",
      no_hp: rs.no_hp || "-",
      npwp: rs.npwp || "-",
      pns: rs.pns ? "PNS" : "Bukan PNS",
      is_pns: Boolean(rs.pns),
    };
  });

  // Format Riwayat Anak
  const formattedRiwayatAnak = riwayatData.riwayatAnak.map((ra) => {
    const jkl = allJkl.find(j => String(j.id) === String(ra.jkl_id));
    const arsip = riwayatData.arsipList?.find(
      (a) => a.from === ra.id || (a.jnsarsip_id === 9 && a.from === ra.id)
    );
    return {
      id: ra.id,
      orang_id: ra.orang_id,
      ortu_id: ra.ortu_id,
      nama_ortu: ra.nama_ortu || "-",
      status_anak: ra.sAnak || "Kandung",
      sAnak: ra.sAnak || "Kandung",
      nama: ra.nama || "-",
      nik: ra.nik || "-",
      t4Lhr: ra.t4Lhr || "",
      tglLhr: ra.tglLhr ? (typeof ra.tglLhr === 'string' ? ra.tglLhr.split('T')[0] : (ra.tglLhr.toISOString ? ra.tglLhr.toISOString().split('T')[0] : String(ra.tglLhr))) : null,
      ttl: `${ra.t4Lhr || '-'}${ra.tglLhr ? `, ${formatDateIndo(ra.tglLhr)}` : ''}`,
      jkl_id: ra.jkl_id ? String(ra.jkl_id) : '1',
      jenis_kelamin: jkl?.jkl || (String(ra.jkl_id) === '1' ? 'Laki-Laki' : 'Perempuan'),
      alamat: ra.alamat || "-",
      no_hp: ra.no_hp || "-",
      pns: ra.pns ? "PNS" : "Bukan PNS",
      is_pns: Boolean(ra.pns),
      dokumen_sk: formatDokumenUrl(arsip?.arsip),
      dokumen_anak: formatDokumenUrl(arsip?.arsip),
    };
  });

  return {
    ...p,
    nama: namaFormatted,
    nama_formatted: namaFormatted,
    gelar_depan: gd || null,
    gelar_belakang: gb || null,
    jabatan: jabatan,
    jabatan_nama: jabatan,
    unit_kerja: rwtJab?.ref_unitorganisasi?.nmUnor || (formattedRiwayatJabatan[0]?.unit_kerja || "-"),
    masa_kerja_golongan: mk_golongan,
    masa_kerja_saat_ini: mk_saat_ini,
    riwayat_jabatan: formattedRiwayatJabatan,
    riwayat_golongan: formattedRiwayatGolongan,
    riwayat_pendidikan: formattedRiwayatPendidikan,
    riwayat_diklat: formattedRiwayatDiklat,
    riwayat_kgb: formattedRiwayatKgb,
    riwayat_hukdis: formattedRiwayatHukdis,
    data_cpns_pns: formattedCpnsPns,
    riwayat_profesi: formattedRiwayatProfesi,
    riwayat_ortu: formattedRiwayatOrtu,
    riwayat_pasangan: formattedRiwayatPasangan,
    riwayat_anak: formattedRiwayatAnak,
  };
};

/**
 * Get Migration Dashboard Data
 */
/**
 * Ambil statistik pegawai global untuk dashboard
 */
export const getPegawaiStatistics = async () => {
  const [stats, jkls, gols, units, jnsJabs, tktPends] = await Promise.all([
    pegawaiRepository.getGlobalStatistics(),
    pegawaiRepository.findAllJkl(),
    pegawaiRepository.findAllGol(),
    pegawaiRepository.findAllUnorInduk(),
    pegawaiRepository.findAllJnsJab(),
    pegawaiRepository.findAllTktPend(),
  ]);

  // 1. Gender mapping
  const genderStats = stats.byGender.map(sg => ({
    label: jkls.find(j => j.id.toString() === sg.jkl_id.toString())?.jkl || "Lainnya",
    count: sg._count._all
  }));

  // 2. Golongan mapping (IV -> I)
  const golStats = stats.byGolongan.map(sg => {
    const ref = gols.find(g => g.kdGol === sg.gol_id);
    return {
      id: sg.gol_id,
      label: ref ? `${ref.pangkat} (${ref.gol})` : "Lainnya",
      count: sg._count._all
    };
  }).sort((a,b) => b.label.localeCompare(a.label));

  // 3. Unit mapping
  const unitStats = stats.byUnit.map(su => ({
    id: su.unorInduk_id,
    label: units.find(u => u.id === su.unorInduk_id)?.nmUnor || "Lainnya",
    count: su._count._all
  }));

  // 4. Jabatan mapping
  const jabStats = stats.byJabatan.map(sj => ({
    id: sj.jnsJab_id,
    label: jnsJabs.find(j => j.id === sj.jnsJab_id)?.jnsjab || "Lainnya",
    count: sj._count._all
  }));

  // 5. Education mapping
  const eduCounts = {};
  stats.byEducation.forEach(p => {
    const tktIdStr = p.rwt_pend?.tktPend_id?.toString();
    if (tktIdStr) {
      eduCounts[tktIdStr] = (eduCounts[tktIdStr] || 0) + 1;
    }
  });

  const eduStats = Object.keys(eduCounts).map(tktIdStr => ({
    id: tktIdStr,
    label: tktPends.find(t => String(t.id) === String(tktIdStr))?.tktpend || "Lainnya",
    count: eduCounts[tktIdStr]
  })).sort((a, b) => (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0));

  // 6. Age mapping
  const now = new Date();
  const currentYear = now.getFullYear();
  const ageRanges = {
    "< 30": 0,
    "31 - 40": 0,
    "41 - 50": 0,
    "51 - 60": 0,
    "> 60": 0
  };

  stats.birthdays.forEach(b => {
    if (!b.tglLhr) return;
    const age = currentYear - new Date(b.tglLhr).getFullYear();
    if (age <= 30) ageRanges["< 30"]++;
    else if (age <= 40) ageRanges["31 - 40"]++;
    else if (age <= 50) ageRanges["41 - 50"]++;
    else if (age <= 60) ageRanges["51 - 60"]++;
    else ageRanges["> 60"]++;
  });

  const ageStats = Object.keys(ageRanges).map(label => ({
    id: label,
    label,
    count: ageRanges[label]
  }));

  return {
    total: stats.total,
    byGender: genderStats,
    byGolongan: golStats,
    byUnit: unitStats,
    byJabatan: jabStats,
    byEducation: eduStats,
    byAge: ageStats
  };
};

/**
 * Resolve nama jabatan berdasarkan ref_jabatan
 */
const getNamaJabatan = (rwtJab) => {
  if (!rwtJab) return "Staf";
  return rwtJab.ref_jabatan?.nama_jabatan || "Staf";
};

/**
 * Ambil data laporan DUK
 */
export const getDUKReport = async (query) => {
  const unorInduk_id = query.unorInduk_id || "";
  const tktPend_id = query.tktPend_id || "";
  const gol_id = query.gol_id || "";
  const jnsJab_id = query.jnsJab_id || "";
  const age_range = query.age_range || "";
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10; // Default 10 per page
  const skip = (page - 1) * limit;

  const { results, total } = await pegawaiRepository.findDUK({ 
    unorInduk_id,
    tktPend_id,
    gol_id,
    jnsJab_id,
    age_range,
    skip,
    take: limit
  });

  const stats = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    per_jabatan: {}
  };

  // Hitung stats per jabatan dari SELURUH pegawai aktif di unit tersebut (High Performance)
  const allJobRecords = await pegawaiRepository.findDUKStats(unorInduk_id, {
    tktPend_id,
    gol_id,
    jnsJab_id,
  });
  const jabatanCache = new Map();
  
  for (const j of allJobRecords) {
    const cacheKey = `${j.jnsJab_id}-${j.nmJab_id}`;
    let jabatan;
    if (jabatanCache.has(cacheKey)) {
      jabatan = jabatanCache.get(cacheKey);
    } else {
      jabatan = getNamaJabatan(j);
      jabatanCache.set(cacheKey, jabatan);
    }
    stats.per_jabatan[jabatan] = (stats.per_jabatan[jabatan] || 0) + 1;
  }
  
  const formattedData = await Promise.all(
    results.map(async (p) => {
      const jabatan = getNamaJabatan(p.rwt_jabatan);

      return {
        id: p.id,
        nip: p.nipBaru,
        nama: p.ta_orang?.nama || "-",
        pangkat_gol: p.rwt_gol?.ref_gol ? `${p.rwt_gol.ref_gol.pangkat} (${p.rwt_gol.ref_gol.gol})` : "-",
        jabatan,
        unit_kerja: p.rwt_jabatan?.ref_unitorganisasi?.nmUnor || "-",
      };
    })
  );

  return {
    data: formattedData,
    stats
  };
};

export const getJabatanSyncStats = async () => {
  const [total, byCategory] = await Promise.all([
    prisma.ref_jabatan.count({ where: { is_deleted: false } }),
    prisma.ref_jabatan.groupBy({
      by: ['kategori'],
      where: { is_deleted: false },
      _count: { _all: true },
    }),
  ]);

  const catMap = {};
  byCategory.forEach(c => { catMap[c.kategori] = c._count._all; });

  return {
    total,
    categories: [
      { 
        name: 'Struktural / Manajerial', 
        count: catMap['STRUKTURAL'] || 0, 
        source: 'ref_jabatan (STRUKTURAL)',
        color: 'indigo'
      },
      { 
        name: 'Fungsional (JF)', 
        count: catMap['FUNGSIONAL'] || 0, 
        source: 'ref_jabatan (FUNGSIONAL)',
        color: 'emerald'
      },
      { 
        name: 'Pelaksana / Administrasi (JA)', 
        count: catMap['PELAKSANA'] || 0, 
        source: 'ref_jabatan (PELAKSANA)',
        color: 'amber'
      }
    ]
  };
};

/**
 * Mengambil daftar referensi golongan dan jenis KP untuk form input
 */
export const getRefGolongan = async () => {
  const [golonganList, jenisKpList] = await Promise.all([
    pegawaiRepository.findAllGol(),
    pegawaiRepository.findAllJnsKp(),
  ]);

  return {
    golongan: golonganList,
    jenis_kp: jenisKpList,
  };
};

/**
 * Tambah Riwayat Golongan baru untuk pegawai
 */
export const addRiwayatGolongan = async (pegawaiId, payload, userId = null, file = null) => {
  const pegawai = await pegawaiRepository.findById(pegawaiId);
  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const rwtGolId = randomUUID();

  const createData = {
    id: rwtGolId,
    pegawai_id: pegawaiId,
    gol_id: payload.gol_id,
    sk: payload.sk || null,
    tglSk: new Date(payload.tglSk),
    tmtSk: new Date(payload.tmtSk),
    maskerThn: payload.maskerThn !== undefined && payload.maskerThn !== null && payload.maskerThn !== '' ? String(payload.maskerThn) : null,
    maskerBln: payload.maskerBln !== undefined && payload.maskerBln !== null && payload.maskerBln !== '' ? String(payload.maskerBln) : null,
    pertekBkn: payload.pertekBkn || null,
    tglPertek: payload.tglPertek ? new Date(payload.tglPertek) : null,
    jnsKp_id: payload.jnsKp_id ? parseInt(payload.jnsKp_id) : null,
    gapok: payload.gapok ? parseInt(payload.gapok) : null,
    pengesahan: payload.pengesahan || null,
    user_created: userId ? parseInt(userId) : null,
  };

  const newRecord = await pegawaiRepository.createRiwayatGolongan(createData);

  // Jika ada dokumen SK yang diunggah
  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtGolId,
      jnsarsipId: 2,
      arsipPath: file.path,
    });
  }

  // Periksa apakah ini riwayat dengan TMT terbaru untuk disinkronkan ke ta_pegawai
  const latest = await pegawaiRepository.findLatestRiwayatGolongan(pegawaiId);
  if (latest && latest.id === newRecord.id) {
    await pegawaiRepository.updatePegawaiActiveGolongan(pegawaiId, newRecord.id);
  }

  return newRecord;
};

/**
 * Update Riwayat Golongan
 */
export const editRiwayatGolongan = async (pegawaiId, rwtGolId, payload, userId = null, file = null) => {
  const existing = await pegawaiRepository.findRiwayatGolonganById(rwtGolId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat golongan tidak ditemukan", 404);
  }

  const updateData = {
    ...(payload.gol_id && { gol_id: payload.gol_id }),
    ...(payload.sk !== undefined && { sk: payload.sk || null }),
    ...(payload.tglSk && { tglSk: new Date(payload.tglSk) }),
    ...(payload.tmtSk && { tmtSk: new Date(payload.tmtSk) }),
    ...(payload.maskerThn !== undefined && { maskerThn: payload.maskerThn !== null && payload.maskerThn !== '' ? String(payload.maskerThn) : null }),
    ...(payload.maskerBln !== undefined && { maskerBln: payload.maskerBln !== null && payload.maskerBln !== '' ? String(payload.maskerBln) : null }),
    ...(payload.pertekBkn !== undefined && { pertekBkn: payload.pertekBkn || null }),
    ...(payload.tglPertek !== undefined && { tglPertek: payload.tglPertek && payload.tglPertek !== 'null' && payload.tglPertek !== 'undefined' ? new Date(payload.tglPertek) : null }),
    ...(payload.jnsKp_id !== undefined && { jnsKp_id: payload.jnsKp_id && !isNaN(parseInt(payload.jnsKp_id)) ? parseInt(payload.jnsKp_id) : null }),
    ...(payload.gapok !== undefined && { gapok: payload.gapok && !isNaN(parseInt(payload.gapok)) ? parseInt(payload.gapok) : null }),
    ...(payload.pengesahan !== undefined && { pengesahan: payload.pengesahan || null }),
    ...(userId && { user_updated: parseInt(userId) }),
  };

  const updatedRecord = await pegawaiRepository.updateRiwayatGolongan(rwtGolId, updateData);

  // Jika ada dokumen SK baru yang diunggah
  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtGolId,
      jnsarsipId: 2,
      arsipPath: file.path,
    });
  }

  // Sinkronisasi status aktif ke ta_pegawai
  const latest = await pegawaiRepository.findLatestRiwayatGolongan(pegawaiId);
  if (latest) {
    await pegawaiRepository.updatePegawaiActiveGolongan(pegawaiId, latest.id);
  }

  return updatedRecord;
};

/**
 * Hapus Riwayat Golongan
 */
export const removeRiwayatGolongan = async (pegawaiId, rwtGolId) => {
  const existing = await pegawaiRepository.findRiwayatGolonganById(rwtGolId);
  if (!existing || existing.pegawai_id !== pegawaiId) {
    throw new AppError("Riwayat golongan tidak ditemukan", 404);
  }

  await pegawaiRepository.deleteRiwayatGolongan(rwtGolId);
  await pegawaiRepository.deleteArsipByFrom(rwtGolId);

  // Sinkronisasi status aktif ta_pegawai ke riwayat terbaru berikutnya jika ada
  const latest = await pegawaiRepository.findLatestRiwayatGolongan(pegawaiId);
  await pegawaiRepository.updatePegawaiActiveGolongan(pegawaiId, latest ? latest.id : null);

  return { success: true, message: "Riwayat golongan berhasil dihapus" };
};

/**
 * Tambah Riwayat KGB baru untuk pegawai
 */
export const addRiwayatKgb = async (pegawaiId, payload, userId = null, file = null) => {
  const pegawai = await pegawaiRepository.findById(pegawaiId);
  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const rwtKgbId = randomUUID();
  const nipBaru = pegawai.nipBaru || "";

  const createData = {
    id: rwtKgbId,
    pegawai_id: pegawaiId,
    nipBaru,
    gol_id: payload.gol_id || null,
    sk: payload.sk || null,
    tglSk: new Date(payload.tglSk),
    tmtSk: payload.tmtSk ? new Date(payload.tmtSk) : null,
    maskerThn: payload.maskerThn !== undefined && payload.maskerThn !== null && payload.maskerThn !== '' ? String(payload.maskerThn) : null,
    maskerBln: payload.maskerBln !== undefined && payload.maskerBln !== null && payload.maskerBln !== '' ? String(payload.maskerBln) : null,
    gapok: payload.gapok && !isNaN(parseInt(payload.gapok)) ? parseInt(payload.gapok) : 0,
    pengesahan: payload.pengesahan || null,
    user_created: userId ? parseInt(userId) : null,
  };

  const newRecord = await pegawaiRepository.createRiwayatKgb(createData);

  // Jika ada dokumen SK yang diunggah
  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtKgbId,
      jnsarsipId: 2,
      arsipPath: file.path,
    });
  }

  return newRecord;
};

/**
 * Update Riwayat KGB
 */
export const editRiwayatKgb = async (pegawaiId, rwtKgbId, payload, userId = null, file = null) => {
  const existing = await pegawaiRepository.findRiwayatKgbById(rwtKgbId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat KGB tidak ditemukan", 404);
  }

  const updateData = {
    ...(payload.gol_id !== undefined && { gol_id: payload.gol_id || null }),
    ...(payload.sk !== undefined && { sk: payload.sk || null }),
    ...(payload.tglSk && { tglSk: new Date(payload.tglSk) }),
    ...(payload.tmtSk && { tmtSk: new Date(payload.tmtSk) }),
    ...(payload.maskerThn !== undefined && { maskerThn: payload.maskerThn !== null && payload.maskerThn !== '' ? String(payload.maskerThn) : null }),
    ...(payload.maskerBln !== undefined && { maskerBln: payload.maskerBln !== null && payload.maskerBln !== '' ? String(payload.maskerBln) : null }),
    ...(payload.gapok !== undefined && { gapok: payload.gapok && !isNaN(parseInt(payload.gapok)) ? parseInt(payload.gapok) : null }),
    ...(payload.pengesahan !== undefined && { pengesahan: payload.pengesahan || null }),
    ...(userId && { user_updated: parseInt(userId) }),
  };

  const updatedRecord = await pegawaiRepository.updateRiwayatKgb(rwtKgbId, updateData);

  // Jika ada dokumen SK baru yang diunggah
  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtKgbId,
      jnsarsipId: 2,
      arsipPath: file.path,
    });
  }

  return updatedRecord;
};

/**
 * Hapus Riwayat KGB
 */
export const removeRiwayatKgb = async (pegawaiId, rwtKgbId) => {
  const existing = await pegawaiRepository.findRiwayatKgbById(rwtKgbId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat KGB tidak ditemukan", 404);
  }

  await pegawaiRepository.deleteRiwayatKgb(rwtKgbId);
  await pegawaiRepository.deleteArsipByFrom(rwtKgbId);

  return { success: true, message: "Riwayat KGB berhasil dihapus" };
};

/**
 * Ambil master referensi untuk form jabatan
 */
export const getRefJabatan = async () => {
  const [
    jenisJabatan,
    jenjangJabatan,
    unorInduk,
    unorTree,
    eselon,
    jenisMutasi,
    jabStruktural,
    jabFungsional,
    jabPelaksana,
  ] = await Promise.all([
    pegawaiRepository.findAllJnsJab(),
    pegawaiRepository.findAllJenjangJab(),
    pegawaiRepository.findAllUnorInduk(false),
    pegawaiRepository.findUnorTree(false),
    pegawaiRepository.findAllEselon(),
    pegawaiRepository.findAllJnsMutasi(),
    pegawaiRepository.findAllRefJabatan(),
    pegawaiRepository.findAllJabatanFungsional(),
    pegawaiRepository.findAllJabatanPelaksana(),
  ]);

  const daftarJabatan = [
    ...jabStruktural.map(j => ({ id: j.id, nama: j.nm_jab, tipe: 'STRUKTURAL', jns_jab_id: j.jns_jab_id, eselon_id: j.eselon_id })),
    ...jabFungsional.map(j => ({ id: j.id, nama: j.nama_jabatan || j.nmJab, tipe: 'FUNGSIONAL' })),
    ...jabPelaksana.map(j => ({ id: j.id, nama: j.nama_jabatan || j.nmJab, tipe: 'PELAKSANA' })),
  ];

  return {
    jenis_jabatan: jenisJabatan,
    jenjang_jabatan: jenjangJabatan.map(j => ({ id: String(j.id), jenjangjab: j.jenjangjab, jnsjab_id: j.jnsjab_id })),
    unor_induk: unorInduk,
    unor_tree: unorTree,
    eselon,
    jenis_mutasi: jenisMutasi,
    daftar_jabatan: daftarJabatan,
  };
};

/**
 * Tambah Riwayat Jabatan baru untuk pegawai
 */
export const addRiwayatJabatan = async (pegawaiId, payload, userId = null, file = null) => {
  const pegawai = await pegawaiRepository.findById(pegawaiId);
  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const rwtJabId = randomUUID();
  const nipBaru = pegawai.nipBaru || "";

  let instansiId = "1";
  let jnsUnorId = "1";
  let unorKode = null;
  let nmJabId = payload.nmJab_id || null;
  let jnsJabId = payload.jnsJab_id || null;

  if (jnsJabId) {
    const refJenjangList = await pegawaiRepository.findAllJenjangJab();
    const foundJenjang = refJenjangList.find(j => String(j.id) === String(jnsJabId));
    if (foundJenjang?.jnsjab_id) {
      jnsJabId = foundJenjang.jnsjab_id;
    }
  }

  if (payload.unorInduk_id) {
    const unorRecord = await pegawaiRepository.findUnorById(payload.unorInduk_id);
    if (unorRecord) {
      instansiId = unorRecord.instansi_id || "1";
      jnsUnorId = unorRecord.jnsUnor_id || "1";
      unorKode = unorRecord.kode || null;

      if (!nmJabId || nmJabId === 'null' || nmJabId === 'undefined') {
        const resolved = await resolveJabatanForUnor({
          nmUnor: unorRecord.nmUnor,
          jabId: unorRecord.jab_id,
          level: unorRecord.level,
        });
        if (resolved?.jab_id) {
          nmJabId = resolved.jab_id;
        }
      }
    }
  }

  const createData = {
    id: rwtJabId,
    pegawai_id: pegawaiId,
    nipBaru,
    sk: payload.sk || null,
    tglSk: new Date(payload.tglSk),
    tmtSk: new Date(payload.tmtSk),
    jnsJab_id: jnsJabId,
    nmJab_id: nmJabId,
    unorInduk_id: payload.unorInduk_id,
    instansi_id: instansiId,
    instansi_kode: "7209",
    jnsUnor_id: jnsUnorId,
    unorInduk_kode: unorKode,
    eselon_id: payload.eselon_id || null,
    jnsMutasi_id: payload.jnsMutasi_id || null,
    pengesahan: payload.pengesahan || "-",
    user_created: userId ? parseInt(userId) : null,
  };

  const newRecord = await pegawaiRepository.createRiwayatJabatan(createData);

  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtJabId,
      jnsarsipId: 1,
      arsipPath: file.path,
    });
  }

  // Sinkronisasi status aktif ta_pegawai jika ini riwayat terbaru
  const latest = await pegawaiRepository.findLatestRiwayatJabatan(pegawaiId);
  if (latest && latest.id === newRecord.id) {
    await pegawaiRepository.updatePegawaiActiveJabatan(pegawaiId, newRecord.id);
  }

  return newRecord;
};

/**
 * Update Riwayat Jabatan
 */
export const editRiwayatJabatan = async (pegawaiId, rwtJabId, payload, userId = null, file = null) => {
  const existing = await pegawaiRepository.findRiwayatJabatanById(rwtJabId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat jabatan tidak ditemukan", 404);
  }

  let unorKode = undefined;
  let instansiId = undefined;
  let jnsUnorId = undefined;
  let nmJabId = payload.nmJab_id !== undefined ? (payload.nmJab_id || null) : undefined;
  let jnsJabId = payload.jnsJab_id !== undefined ? (payload.jnsJab_id || null) : undefined;

  if (jnsJabId) {
    const refJenjangList = await pegawaiRepository.findAllJenjangJab();
    const foundJenjang = refJenjangList.find(j => String(j.id) === String(jnsJabId));
    if (foundJenjang?.jnsjab_id) {
      jnsJabId = foundJenjang.jnsjab_id;
    }
  }

  if (payload.unorInduk_id) {
    const unorRecord = await pegawaiRepository.findUnorById(payload.unorInduk_id);
    if (unorRecord) {
      instansiId = unorRecord.instansi_id || "1";
      jnsUnorId = unorRecord.jnsUnor_id || "1";
      unorKode = unorRecord.kode || null;

      if (!nmJabId || nmJabId === 'null') {
        const resolved = await resolveJabatanForUnor({
          nmUnor: unorRecord.nmUnor,
          jabId: unorRecord.jab_id,
          level: unorRecord.level,
        });
        if (resolved?.jab_id) {
          nmJabId = resolved.jab_id;
        }
      }
    }
  }

  const updateData = {
    ...(payload.sk !== undefined && { sk: payload.sk || null }),
    ...(payload.tglSk && { tglSk: new Date(payload.tglSk) }),
    ...(payload.tmtSk && { tmtSk: new Date(payload.tmtSk) }),
    ...(jnsJabId !== undefined && { jnsJab_id: jnsJabId }),
    ...(nmJabId !== undefined && { nmJab_id: nmJabId }),
    ...(payload.unorInduk_id && { unorInduk_id: payload.unorInduk_id }),
    ...(unorKode !== undefined && { unorInduk_kode: unorKode }),
    ...(instansiId !== undefined && { instansi_id: instansiId }),
    ...(jnsUnorId !== undefined && { jnsUnor_id: jnsUnorId }),
    ...(payload.eselon_id !== undefined && { eselon_id: payload.eselon_id || null }),
    ...(payload.jnsMutasi_id !== undefined && { jnsMutasi_id: payload.jnsMutasi_id || null }),
    ...(payload.pengesahan !== undefined && { pengesahan: payload.pengesahan || "-" }),
    ...(userId && { user_updated: parseInt(userId) }),
  };

  const updatedRecord = await pegawaiRepository.updateRiwayatJabatan(rwtJabId, updateData);

  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtJabId,
      jnsarsipId: 1,
      arsipPath: file.path,
    });
  }

  // Sinkronisasi status aktif ke ta_pegawai
  const latest = await pegawaiRepository.findLatestRiwayatJabatan(pegawaiId);
  if (latest) {
    await pegawaiRepository.updatePegawaiActiveJabatan(pegawaiId, latest.id);
  }

  return updatedRecord;
};

/**
 * Hapus Riwayat Jabatan
 */
export const removeRiwayatJabatan = async (pegawaiId, rwtJabId) => {
  const existing = await pegawaiRepository.findRiwayatJabatanById(rwtJabId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat jabatan tidak ditemukan", 404);
  }

  await pegawaiRepository.deleteRiwayatJabatan(rwtJabId);
  await pegawaiRepository.deleteArsipByFrom(rwtJabId);

  // Sinkronisasi status aktif ta_pegawai ke riwayat terbaru berikutnya jika ada
  const latest = await pegawaiRepository.findLatestRiwayatJabatan(pegawaiId);
  await pegawaiRepository.updatePegawaiActiveJabatan(pegawaiId, latest ? latest.id : null);

  return { success: true, message: "Riwayat jabatan berhasil dihapus" };
};

/**
 * Ambil master referensi untuk form pendidikan
 */
export const getRefPendidikan = async (tktpend_id = null) => {
  const [tingkatPendidikan, programStudi] = await Promise.all([
    pegawaiRepository.findAllTktPend(),
    pegawaiRepository.findAllRefPend(tktpend_id),
  ]);

  return {
    tingkat_pendidikan: tingkatPendidikan,
    program_studi: programStudi,
  };
};

/**
 * Tambah Riwayat Pendidikan baru untuk pegawai
 */
export const addRiwayatPendidikan = async (pegawaiId, payload, userId = null, files = null) => {
  const pegawai = await pegawaiRepository.findById(pegawaiId);
  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const rwtPendId = randomUUID();
  const nipBaru = pegawai.nipBaru || "";

  // Cari pend_id default jika kosong
  let pendId = payload.pend_id || null;
  if (!pendId) {
    const defaultPend = await pegawaiRepository.findAllRefPend(payload.tktPend_id);
    if (defaultPend && defaultPend.length > 0) {
      pendId = defaultPend[0].id;
    } else {
      pendId = randomUUID();
    }
  }

  const createData = {
    id: rwtPendId,
    pegawai_id: pegawaiId,
    nipBaru,
    tktPend_id: parseInt(payload.tktPend_id),
    pend_id: pendId,
    nmSekolah: payload.nmSekolah || "-",
    jurusan: payload.jurusan || null,
    thnLulus: payload.thnLulus ? String(payload.thnLulus) : null,
    noIjazah: payload.noIjazah || null,
    tglIjazah: payload.tglIjazah ? new Date(payload.tglIjazah) : null,
    gd: payload.gd || null,
    gb: payload.gb || null,
    pengesahan: payload.pengesahan || null,
    user_created: userId ? parseInt(userId) : null,
  };

  const newRecord = await pegawaiRepository.createRiwayatPendidikan(createData);

  // Handle upload ijazah & transkrip
  const fileIjazah = files?.dokumen_ijazah?.[0] 
    || (Array.isArray(files) ? files.find(f => f.fieldname === 'dokumen_ijazah') : null) 
    || (files?.fieldname === 'dokumen_ijazah' ? files : null)
    || (files?.path && !files?.fieldname ? files : null);

  const fileTranskrip = files?.dokumen_transkrip?.[0] 
    || (Array.isArray(files) ? files.find(f => f.fieldname === 'dokumen_transkrip') : null) 
    || (files?.fieldname === 'dokumen_transkrip' ? files : null);

  if (fileIjazah) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtPendId,
      jnsarsipId: 3,
      arsipPath: fileIjazah.path,
    });
  }

  if (fileTranskrip) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtPendId,
      jnsarsipId: 4,
      arsipPath: fileTranskrip.path,
    });
  }

  // Sinkronisasi status pendidikan tertinggi ta_pegawai
  const latest = await pegawaiRepository.findLatestRiwayatPendidikan(pegawaiId);
  if (latest && latest.id === newRecord.id) {
    await pegawaiRepository.updatePegawaiActivePendidikan(pegawaiId, newRecord.id);
  }

  return newRecord;
};

/**
 * Update Riwayat Pendidikan
 */
export const editRiwayatPendidikan = async (pegawaiId, rwtPendId, payload, userId = null, files = null) => {
  const existing = await pegawaiRepository.findRiwayatPendidikanById(rwtPendId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat pendidikan tidak ditemukan", 404);
  }

  const updateData = {
    ...(payload.tktPend_id !== undefined && { tktPend_id: parseInt(payload.tktPend_id) }),
    ...(payload.pend_id !== undefined && { pend_id: payload.pend_id || existing.pend_id }),
    ...(payload.nmSekolah !== undefined && { nmSekolah: payload.nmSekolah }),
    ...(payload.jurusan !== undefined && { jurusan: payload.jurusan || null }),
    ...(payload.thnLulus !== undefined && { thnLulus: payload.thnLulus ? String(payload.thnLulus) : null }),
    ...(payload.noIjazah !== undefined && { noIjazah: payload.noIjazah || null }),
    ...(payload.tglIjazah !== undefined && { tglIjazah: payload.tglIjazah ? new Date(payload.tglIjazah) : null }),
    ...(payload.gd !== undefined && { gd: payload.gd || null }),
    ...(payload.gb !== undefined && { gb: payload.gb || null }),
    ...(payload.pengesahan !== undefined && { pengesahan: payload.pengesahan || null }),
    ...(userId && { user_updated: parseInt(userId) }),
  };

  const updatedRecord = await pegawaiRepository.updateRiwayatPendidikan(rwtPendId, updateData);

  // Handle upload ijazah & transkrip
  const fileIjazah = files?.dokumen_ijazah?.[0] 
    || (Array.isArray(files) ? files.find(f => f.fieldname === 'dokumen_ijazah') : null) 
    || (files?.fieldname === 'dokumen_ijazah' ? files : null)
    || (files?.path && !files?.fieldname ? files : null);

  const fileTranskrip = files?.dokumen_transkrip?.[0] 
    || (Array.isArray(files) ? files.find(f => f.fieldname === 'dokumen_transkrip') : null) 
    || (files?.fieldname === 'dokumen_transkrip' ? files : null);

  if (fileIjazah) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtPendId,
      jnsarsipId: 3,
      arsipPath: fileIjazah.path,
    });
  }

  if (fileTranskrip) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtPendId,
      jnsarsipId: 4,
      arsipPath: fileTranskrip.path,
    });
  }

  // Sinkronisasi status pendidikan tertinggi ta_pegawai
  const latest = await pegawaiRepository.findLatestRiwayatPendidikan(pegawaiId);
  if (latest) {
    await pegawaiRepository.updatePegawaiActivePendidikan(pegawaiId, latest.id);
  }

  return updatedRecord;
};

/**
 * Hapus Riwayat Pendidikan
 */
export const removeRiwayatPendidikan = async (pegawaiId, rwtPendId) => {
  const existing = await pegawaiRepository.findRiwayatPendidikanById(rwtPendId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat pendidikan tidak ditemukan", 404);
  }

  await pegawaiRepository.deleteRiwayatPendidikan(rwtPendId);
  await pegawaiRepository.deleteArsipByFrom(rwtPendId);

  // Sinkronisasi status pendidikan tertinggi ta_pegawai
  const latest = await pegawaiRepository.findLatestRiwayatPendidikan(pegawaiId);
  await pegawaiRepository.updatePegawaiActivePendidikan(pegawaiId, latest ? latest.id : null);

  return { success: true, message: "Riwayat pendidikan berhasil dihapus" };
};

/**
 * Ambil master referensi untuk form diklat
 */
export const getRefDiklat = async () => {
  const [jenisDiklat, jenjangDiklat] = await Promise.all([
    pegawaiRepository.findAllJnsDiklat(),
    pegawaiRepository.findAllJenjangDiklat(),
  ]);

  return {
    jenis_diklat: jenisDiklat,
    jenjang_diklat: jenjangDiklat,
  };
};

/**
 * Tambah Riwayat Diklat baru untuk pegawai
 */
export const addRiwayatDiklat = async (pegawaiId, payload, userId = null, file = null) => {
  const pegawai = await pegawaiRepository.findById(pegawaiId);
  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const rwtDiklatId = randomUUID();
  const nipBaru = pegawai.nipBaru || "";

  const createData = {
    id: rwtDiklatId,
    pegawai_id: pegawaiId,
    nipBaru,
    nmDiklat: payload.nmDiklat || "-",
    jnsDiklat_id: payload.jnsDiklat_id || null,
    jenjangDiklat_id: payload.jenjangDiklat_id || null,
    noSertifikat: payload.noSertifikat || null,
    tglSertifikat: payload.tglSertifikat ? new Date(payload.tglSertifikat) : null,
    penyelenggara: payload.penyelenggara || null,
    angkatan: payload.angkatan || null,
    t4pelaksanaan: payload.t4pelaksanaan || null,
    user_created: userId ? parseInt(userId) : null,
  };

  const newRecord = await pegawaiRepository.createRiwayatDiklat(createData);

  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtDiklatId,
      jnsarsipId: 5,
      arsipPath: file.path,
    });
  }

  // Sinkronisasi status diklat aktif ta_pegawai
  const latest = await pegawaiRepository.findLatestRiwayatDiklat(pegawaiId);
  if (latest && latest.id === newRecord.id) {
    await pegawaiRepository.updatePegawaiActiveDiklat(pegawaiId, newRecord.id);
  }

  return newRecord;
};

/**
 * Update Riwayat Diklat
 */
export const editRiwayatDiklat = async (pegawaiId, rwtDiklatId, payload, userId = null, file = null) => {
  const existing = await pegawaiRepository.findRiwayatDiklatById(rwtDiklatId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat diklat tidak ditemukan", 404);
  }

  const updateData = {
    ...(payload.nmDiklat !== undefined && { nmDiklat: payload.nmDiklat }),
    ...(payload.jnsDiklat_id !== undefined && { jnsDiklat_id: payload.jnsDiklat_id || null }),
    ...(payload.jenjangDiklat_id !== undefined && { jenjangDiklat_id: payload.jenjangDiklat_id || null }),
    ...(payload.noSertifikat !== undefined && { noSertifikat: payload.noSertifikat || null }),
    ...(payload.tglSertifikat !== undefined && { tglSertifikat: payload.tglSertifikat ? new Date(payload.tglSertifikat) : null }),
    ...(payload.penyelenggara !== undefined && { penyelenggara: payload.penyelenggara || null }),
    ...(payload.angkatan !== undefined && { angkatan: payload.angkatan || null }),
    ...(payload.t4pelaksanaan !== undefined && { t4pelaksanaan: payload.t4pelaksanaan || null }),
    ...(userId && { user_updated: parseInt(userId) }),
  };

  const updatedRecord = await pegawaiRepository.updateRiwayatDiklat(rwtDiklatId, updateData);

  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtDiklatId,
      jnsarsipId: 5,
      arsipPath: file.path,
    });
  }

  // Sinkronisasi status diklat aktif ta_pegawai
  const latest = await pegawaiRepository.findLatestRiwayatDiklat(pegawaiId);
  if (latest) {
    await pegawaiRepository.updatePegawaiActiveDiklat(pegawaiId, latest.id);
  }

  return updatedRecord;
};

/**
 * Hapus Riwayat Diklat
 */
export const removeRiwayatDiklat = async (pegawaiId, rwtDiklatId) => {
  const existing = await pegawaiRepository.findRiwayatDiklatById(rwtDiklatId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat diklat tidak ditemukan", 404);
  }

  await pegawaiRepository.deleteRiwayatDiklat(rwtDiklatId);
  await pegawaiRepository.deleteArsipByFrom(rwtDiklatId);

  // Sinkronisasi status diklat aktif ta_pegawai
  const latest = await pegawaiRepository.findLatestRiwayatDiklat(pegawaiId);
  await pegawaiRepository.updatePegawaiActiveDiklat(pegawaiId, latest ? latest.id : null);

  return { success: true, message: "Riwayat diklat berhasil dihapus" };
};

/**
 * Ambil master referensi untuk form profesi
 */
export const getRefProfesi = async () => {
  const list = await pegawaiRepository.findAllRefJnsProfesi();
  return list;
};

/**
 * Tambah Riwayat Profesi baru untuk pegawai
 */
export const addRiwayatProfesi = async (pegawaiId, payload, userId = null, file = null) => {
  const pegawai = await pegawaiRepository.findById(pegawaiId);
  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const rwtProfesiId = randomUUID();

  const createData = {
    id: rwtProfesiId,
    pegawai_id: pegawaiId,
    jns_profesi_id: payload.jns_profesi_id,
    no_sertifikat: payload.no_sertifikat,
    tgl_lulus: new Date(payload.tgl_lulus),
    ket: payload.ket || "",
    berlaku: payload.berlaku || null,
  };

  const newRecord = await pegawaiRepository.createRiwayatProfesi(createData);

  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtProfesiId,
      jnsarsipId: 6,
      arsipPath: file.path,
    });
  }

  return newRecord;
};

/**
 * Update Riwayat Profesi
 */
export const editRiwayatProfesi = async (pegawaiId, rwtProfesiId, payload, userId = null, file = null) => {
  const existing = await pegawaiRepository.findRiwayatProfesiById(rwtProfesiId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat profesi tidak ditemukan", 404);
  }

  const updateData = {
    ...(payload.jns_profesi_id !== undefined && { jns_profesi_id: payload.jns_profesi_id }),
    ...(payload.no_sertifikat !== undefined && { no_sertifikat: payload.no_sertifikat }),
    ...(payload.tgl_lulus !== undefined && { tgl_lulus: new Date(payload.tgl_lulus) }),
    ...(payload.ket !== undefined && { ket: payload.ket || "" }),
    ...(payload.berlaku !== undefined && { berlaku: payload.berlaku || null }),
  };

  const updatedRecord = await pegawaiRepository.updateRiwayatProfesi(rwtProfesiId, updateData);

  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtProfesiId,
      jnsarsipId: 6,
      arsipPath: file.path,
    });
  }

  return updatedRecord;
};

/**
 * Hapus Riwayat Profesi
 */
export const removeRiwayatProfesi = async (pegawaiId, rwtProfesiId) => {
  const existing = await pegawaiRepository.findRiwayatProfesiById(rwtProfesiId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat profesi tidak ditemukan", 404);
  }

  await pegawaiRepository.deleteRiwayatProfesi(rwtProfesiId);
  await pegawaiRepository.deleteArsipByFrom(rwtProfesiId);

  return { success: true, message: "Riwayat profesi berhasil dihapus" };
};

/**
 * Ambil master referensi tingkat & jenis hukdis
 */
export const getRefHukdis = async () => {
  const [tingkatHukuman, jenisHukuman] = await Promise.all([
    pegawaiRepository.findAllRefTktHukuman(),
    pegawaiRepository.findAllRefJnsHukuman(),
  ]);

  return {
    tingkat_hukuman: tingkatHukuman,
    jenis_hukuman: jenisHukuman,
  };
};

/**
 * Tambah Riwayat Hukdis baru untuk pegawai
 */
export const addRiwayatHukdis = async (pegawaiId, payload, userId = null, file = null) => {
  const pegawai = await pegawaiRepository.findById(pegawaiId);
  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const rwtHukdisId = randomUUID();

  const createData = {
    id: rwtHukdisId,
    pegawai_id: pegawaiId,
    tktHukuman_id: payload.tktHukuman_id,
    jnsHukuman_id: payload.jnsHukuman_id,
    skHd: payload.skHd,
    tglSkHd: new Date(payload.tglSkHd),
    tmtSkHd: new Date(payload.tmtSkHd),
    masaHukumanThn: payload.masaHukumanThn !== undefined ? String(payload.masaHukumanThn) : "0",
    masaHukumanBln: payload.masaHukumanBln !== undefined ? String(payload.masaHukumanBln) : "0",
    tglAkhirHukuman: new Date(payload.tglAkhirHukuman),
    gol_id: payload.gol_id ? parseInt(payload.gol_id) : (pegawai.rwt_gol?.gol_id ? parseInt(pegawai.rwt_gol.gol_id) : 0),
    noPP: payload.noPP || "PP 94 Tahun 2021",
    alasanHukuman: payload.alasanHukuman || "-",
    ket: payload.ket || null,
  };

  const newRecord = await pegawaiRepository.createRiwayatHukdis(createData);

  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtHukdisId,
      jnsarsipId: 7,
      arsipPath: file.path,
    });
  }

  return newRecord;
};

/**
 * Update Riwayat Hukdis
 */
export const editRiwayatHukdis = async (pegawaiId, rwtHukdisId, payload, userId = null, file = null) => {
  const existing = await pegawaiRepository.findRiwayatHukdisById(rwtHukdisId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat hukuman disiplin tidak ditemukan", 404);
  }

  const updateData = {
    ...(payload.tktHukuman_id !== undefined && { tktHukuman_id: payload.tktHukuman_id }),
    ...(payload.jnsHukuman_id !== undefined && { jnsHukuman_id: payload.jnsHukuman_id }),
    ...(payload.skHd !== undefined && { skHd: payload.skHd }),
    ...(payload.tglSkHd !== undefined && { tglSkHd: new Date(payload.tglSkHd) }),
    ...(payload.tmtSkHd !== undefined && { tmtSkHd: new Date(payload.tmtSkHd) }),
    ...(payload.masaHukumanThn !== undefined && { masaHukumanThn: String(payload.masaHukumanThn) }),
    ...(payload.masaHukumanBln !== undefined && { masaHukumanBln: String(payload.masaHukumanBln) }),
    ...(payload.tglAkhirHukuman !== undefined && { tglAkhirHukuman: new Date(payload.tglAkhirHukuman) }),
    ...(payload.gol_id !== undefined && { gol_id: payload.gol_id ? parseInt(payload.gol_id) : 0 }),
    ...(payload.noPP !== undefined && { noPP: payload.noPP || "PP 94 Tahun 2021" }),
    ...(payload.alasanHukuman !== undefined && { alasanHukuman: payload.alasanHukuman }),
    ...(payload.ket !== undefined && { ket: payload.ket || null }),
  };

  const updatedRecord = await pegawaiRepository.updateRiwayatHukdis(rwtHukdisId, updateData);

  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtHukdisId,
      jnsarsipId: 7,
      arsipPath: file.path,
    });
  }

  return updatedRecord;
};

/**
 * Hapus Riwayat Hukdis
 */
export const removeRiwayatHukdis = async (pegawaiId, rwtHukdisId) => {
  const existing = await pegawaiRepository.findRiwayatHukdisById(rwtHukdisId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat hukuman disiplin tidak ditemukan", 404);
  }

  await pegawaiRepository.deleteRiwayatHukdis(rwtHukdisId);
  await pegawaiRepository.deleteArsipByFrom(rwtHukdisId);

  return { success: true, message: "Riwayat hukuman disiplin berhasil dihapus" };
};

/**
 * Tambah Riwayat Orang Tua baru untuk pegawai
 */
export const addRiwayatOrtu = async (pegawaiId, payload, userId = null) => {
  const pegawai = await pegawaiRepository.findById(pegawaiId);
  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const rwtOrtuId = randomUUID();
  const orangId = payload.orang_id && payload.orang_id.trim() ? payload.orang_id.trim() : randomUUID();

  const isAyah = payload.hubungan?.toLowerCase().includes("ayah");
  const jklId = payload.jkl_id || (isAyah ? "1" : "2");

  const orangData = {
    id: orangId,
    nama: payload.nama.trim(),
    nik: payload.nik ? payload.nik.trim() : null,
    t4Lhr: payload.t4Lhr ? payload.t4Lhr.trim() : "",
    tglLhr: new Date(payload.tglLhr),
    jkl_id: jklId,
    alamat: payload.alamat ? payload.alamat.trim() : null,
    no_hp: payload.no_hp ? payload.no_hp.trim() : null,
  };

  const isPns = payload.pns === true || payload.pns === 1 || payload.pns === "1" || payload.pns === "PNS";

  const ortuData = {
    id: rwtOrtuId,
    pegawai_id: pegawaiId,
    hubungan: payload.hubungan,
    orang_id: orangId,
    pns: isPns,
  };

  const newRecord = await pegawaiRepository.createRiwayatOrtu(ortuData, orangData);
  return newRecord;
};

/**
 * Update Riwayat Orang Tua
 */
export const editRiwayatOrtu = async (pegawaiId, rwtOrtuId, payload, userId = null) => {
  const existing = await pegawaiRepository.findRiwayatOrtuById(rwtOrtuId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat orang tua tidak ditemukan", 404);
  }

  const orangId = existing.orang_id;

  const isAyah = (payload.hubungan || existing.hubungan)?.toLowerCase().includes("ayah");
  const jklId = payload.jkl_id || (isAyah ? "1" : "2");

  const orangData = {
    ...(payload.nama !== undefined && { nama: payload.nama.trim() }),
    ...(payload.nik !== undefined && { nik: payload.nik ? payload.nik.trim() : null }),
    ...(payload.t4Lhr !== undefined && { t4Lhr: payload.t4Lhr.trim() }),
    ...(payload.tglLhr !== undefined && { tglLhr: new Date(payload.tglLhr) }),
    ...(payload.jkl_id !== undefined && { jkl_id: jklId }),
    ...(payload.alamat !== undefined && { alamat: payload.alamat ? payload.alamat.trim() : null }),
    ...(payload.no_hp !== undefined && { no_hp: payload.no_hp ? payload.no_hp.trim() : null }),
  };

  const isPns = payload.pns !== undefined
    ? (payload.pns === true || payload.pns === 1 || payload.pns === "1" || payload.pns === "PNS")
    : existing.pns;

  const ortuData = {
    ...(payload.hubungan !== undefined && { hubungan: payload.hubungan }),
    ...(payload.pns !== undefined && { pns: isPns }),
  };

  const updatedRecord = await pegawaiRepository.updateRiwayatOrtu(rwtOrtuId, orangId, ortuData, orangData);
  return updatedRecord;
};

/**
 * Hapus Riwayat Orang Tua
 */
export const removeRiwayatOrtu = async (pegawaiId, rwtOrtuId) => {
  const existing = await pegawaiRepository.findRiwayatOrtuById(rwtOrtuId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat orang tua tidak ditemukan", 404);
  }

  await pegawaiRepository.deleteRiwayatOrtu(rwtOrtuId);
  return { success: true, message: "Riwayat orang tua berhasil dihapus" };
};

/**
 * Tambah Riwayat Pasangan (Suami / Istri) baru
 */
export const addRiwayatPasangan = async (pegawaiId, payload, userId = null, file = null) => {
  const pegawai = await pegawaiRepository.findById(pegawaiId);
  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const rwtSuisId = randomUUID();
  const orangId = payload.orang_id && payload.orang_id.trim() ? payload.orang_id.trim() : randomUUID();

  const isSuami = payload.hubungan?.toLowerCase().includes("suami");
  const jklId = payload.jkl_id || (isSuami ? "1" : "2");

  const orangData = {
    id: orangId,
    nama: payload.nama.trim(),
    nik: payload.nik ? payload.nik.trim() : null,
    t4Lhr: payload.t4Lhr ? payload.t4Lhr.trim() : "",
    tglLhr: new Date(payload.tglLhr),
    jkl_id: jklId,
    alamat: payload.alamat ? payload.alamat.trim() : null,
    no_hp: payload.no_hp ? payload.no_hp.trim() : null,
    npwp: payload.npwp ? payload.npwp.trim() : null,
  };

  const isPns = payload.pns === true || payload.pns === 1 || payload.pns === "1" || payload.pns === "PNS";

  const suisData = {
    id: rwtSuisId,
    pegawai_id: pegawaiId,
    hubungan: payload.hubungan,
    orang_id: orangId,
    pns: isPns,
    aktaMenikah: payload.aktaMenikah ? payload.aktaMenikah.trim() : null,
    tglMenikah: payload.tglMenikah ? new Date(payload.tglMenikah) : null,
    karisKarsu: payload.karisKarsu ? payload.karisKarsu.trim() : null,
    aktaCerai: payload.aktaCerai ? payload.aktaCerai.trim() : null,
    tglCerai: payload.tglCerai ? new Date(payload.tglCerai) : null,
    aktaMeninggal: payload.aktaMeninggal ? payload.aktaMeninggal.trim() : null,
    tglMeninggal: payload.tglMeninggal ? new Date(payload.tglMeninggal) : null,
  };

  const newRecord = await pegawaiRepository.createRiwayatPasangan(suisData, orangData);

  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtSuisId,
      jnsarsipId: 8,
      arsipPath: file.path,
    });
  }

  return newRecord;
};

/**
 * Update Riwayat Pasangan (Suami / Istri)
 */
export const editRiwayatPasangan = async (pegawaiId, rwtSuisId, payload, userId = null, file = null) => {
  const existing = await pegawaiRepository.findRiwayatPasanganById(rwtSuisId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat pasangan tidak ditemukan", 404);
  }

  const orangId = existing.orang_id;

  const isSuami = (payload.hubungan || existing.hubungan)?.toLowerCase().includes("suami");
  const jklId = payload.jkl_id || (isSuami ? "1" : "2");

  const orangData = {
    ...(payload.nama !== undefined && { nama: payload.nama.trim() }),
    ...(payload.nik !== undefined && { nik: payload.nik ? payload.nik.trim() : null }),
    ...(payload.t4Lhr !== undefined && { t4Lhr: payload.t4Lhr.trim() }),
    ...(payload.tglLhr !== undefined && { tglLhr: new Date(payload.tglLhr) }),
    ...(payload.jkl_id !== undefined && { jkl_id: jklId }),
    ...(payload.alamat !== undefined && { alamat: payload.alamat ? payload.alamat.trim() : null }),
    ...(payload.no_hp !== undefined && { no_hp: payload.no_hp ? payload.no_hp.trim() : null }),
    ...(payload.npwp !== undefined && { npwp: payload.npwp ? payload.npwp.trim() : null }),
  };

  const isPns = payload.pns !== undefined
    ? (payload.pns === true || payload.pns === 1 || payload.pns === "1" || payload.pns === "PNS")
    : existing.pns;

  const suisData = {
    ...(payload.hubungan !== undefined && { hubungan: payload.hubungan }),
    ...(payload.pns !== undefined && { pns: isPns }),
    ...(payload.aktaMenikah !== undefined && { aktaMenikah: payload.aktaMenikah ? payload.aktaMenikah.trim() : null }),
    ...(payload.tglMenikah !== undefined && { tglMenikah: payload.tglMenikah ? new Date(payload.tglMenikah) : null }),
    ...(payload.karisKarsu !== undefined && { karisKarsu: payload.karisKarsu ? payload.karisKarsu.trim() : null }),
    ...(payload.aktaCerai !== undefined && { aktaCerai: payload.aktaCerai ? payload.aktaCerai.trim() : null }),
    ...(payload.tglCerai !== undefined && { tglCerai: payload.tglCerai ? new Date(payload.tglCerai) : null }),
    ...(payload.aktaMeninggal !== undefined && { aktaMeninggal: payload.aktaMeninggal ? payload.aktaMeninggal.trim() : null }),
    ...(payload.tglMeninggal !== undefined && { tglMeninggal: payload.tglMeninggal ? new Date(payload.tglMeninggal) : null }),
  };

  const updatedRecord = await pegawaiRepository.updateRiwayatPasangan(rwtSuisId, orangId, suisData, orangData);

  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtSuisId,
      jnsarsipId: 8,
      arsipPath: file.path,
    });
  }

  return updatedRecord;
};

/**
 * Hapus Riwayat Pasangan
 */
export const removeRiwayatPasangan = async (pegawaiId, rwtSuisId) => {
  const existing = await pegawaiRepository.findRiwayatPasanganById(rwtSuisId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat pasangan tidak ditemukan", 404);
  }

  await pegawaiRepository.deleteRiwayatPasangan(rwtSuisId);
  await pegawaiRepository.deleteArsipByFrom(rwtSuisId);

  return { success: true, message: "Riwayat pasangan berhasil dihapus" };
};

/**
 * Tambah Riwayat Anak baru untuk pegawai
 */
export const addRiwayatAnak = async (pegawaiId, payload, userId = null, file = null) => {
  const pegawai = await pegawaiRepository.findById(pegawaiId);
  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const rwtAnakId = randomUUID();
  const orangId = payload.orang_id && payload.orang_id.trim() ? payload.orang_id.trim() : randomUUID();

  const orangData = {
    id: orangId,
    nama: payload.nama.trim(),
    nik: payload.nik ? payload.nik.trim() : null,
    t4Lhr: payload.t4Lhr ? payload.t4Lhr.trim() : "",
    tglLhr: new Date(payload.tglLhr),
    jkl_id: String(payload.jkl_id || "1"),
    alamat: payload.alamat ? payload.alamat.trim() : null,
    no_hp: payload.no_hp ? payload.no_hp.trim() : null,
  };

  const isPns = payload.pns === true || payload.pns === 1 || payload.pns === "1" || payload.pns === "PNS";

  const anakData = {
    id: rwtAnakId,
    pegawai_id: pegawaiId,
    ortu_id: payload.ortu_id && payload.ortu_id.trim() ? payload.ortu_id.trim() : null,
    sAnak: payload.sAnak || "Kandung",
    orang_id: orangId,
    pns: isPns,
  };

  const newRecord = await pegawaiRepository.createRiwayatAnak(anakData, orangData);

  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtAnakId,
      jnsarsipId: 9,
      arsipPath: file.path,
    });
  }

  return newRecord;
};

/**
 * Update Riwayat Anak
 */
export const editRiwayatAnak = async (pegawaiId, rwtAnakId, payload, userId = null, file = null) => {
  const existing = await pegawaiRepository.findRiwayatAnakById(rwtAnakId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat anak tidak ditemukan", 404);
  }

  const orangId = existing.orang_id;

  const orangData = {
    ...(payload.nama !== undefined && { nama: payload.nama.trim() }),
    ...(payload.nik !== undefined && { nik: payload.nik ? payload.nik.trim() : null }),
    ...(payload.t4Lhr !== undefined && { t4Lhr: payload.t4Lhr.trim() }),
    ...(payload.tglLhr !== undefined && { tglLhr: new Date(payload.tglLhr) }),
    ...(payload.jkl_id !== undefined && { jkl_id: String(payload.jkl_id) }),
    ...(payload.alamat !== undefined && { alamat: payload.alamat ? payload.alamat.trim() : null }),
    ...(payload.no_hp !== undefined && { no_hp: payload.no_hp ? payload.no_hp.trim() : null }),
  };

  const isPns = payload.pns !== undefined
    ? (payload.pns === true || payload.pns === 1 || payload.pns === "1" || payload.pns === "PNS")
    : existing.pns;

  const anakData = {
    ...(payload.ortu_id !== undefined && { ortu_id: payload.ortu_id && payload.ortu_id.trim() ? payload.ortu_id.trim() : null }),
    ...(payload.sAnak !== undefined && { sAnak: payload.sAnak }),
    ...(payload.pns !== undefined && { pns: isPns }),
  };

  const updatedRecord = await pegawaiRepository.updateRiwayatAnak(rwtAnakId, orangId, anakData, orangData);

  if (file) {
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: rwtAnakId,
      jnsarsipId: 9,
      arsipPath: file.path,
    });
  }

  return updatedRecord;
};

/**
 * Hapus Riwayat Anak
 */
export const removeRiwayatAnak = async (pegawaiId, rwtAnakId) => {
  const existing = await pegawaiRepository.findRiwayatAnakById(rwtAnakId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Riwayat anak tidak ditemukan", 404);
  }

  await pegawaiRepository.deleteRiwayatAnak(rwtAnakId);
  await pegawaiRepository.deleteArsipByFrom(rwtAnakId);

  return { success: true, message: "Riwayat anak berhasil dihapus" };
};

/**
 * Tambah Riwayat CPNS / PNS baru untuk pegawai
 */
export const addCpnsPns = async (pegawaiId, payload, userId = null, file = null) => {
  const pegawai = await pegawaiRepository.findById(pegawaiId);
  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const cpnsPnsId = randomUUID();
  const spnsId = String(payload.spns_id || "1");

  const data = {
    id: cpnsPnsId,
    pegawai_id: pegawaiId,
    spns_id: spnsId,
    sk: payload.sk ? payload.sk.trim() : null,
    tglsk: payload.tglsk ? new Date(payload.tglsk) : null,
    tmtsk: payload.tmtsk ? new Date(payload.tmtsk) : null,
    gol_id: payload.gol_id ? parseInt(payload.gol_id, 10) : null,
    maskerThn: payload.maskerThn !== undefined && payload.maskerThn !== null && payload.maskerThn !== "" ? String(payload.maskerThn).padStart(2, "0") : null,
    maskerBln: payload.maskerBln !== undefined && payload.maskerBln !== null && payload.maskerBln !== "" ? String(payload.maskerBln).padStart(2, "0") : null,
    pertekBkn: payload.pertekBkn ? payload.pertekBkn.trim() : null,
    tglPertekBkn: payload.tglPertekBkn ? new Date(payload.tglPertekBkn) : null,
    sttpl: payload.sttpl ? payload.sttpl.trim() : null,
    tglsttpl: payload.tglsttpl ? new Date(payload.tglsttpl) : null,
    noKarpeg: payload.noKarpeg ? payload.noKarpeg.trim() : null,
    tglKarpeg: payload.tglKarpeg ? new Date(payload.tglKarpeg) : null,
    penanda_tangan: payload.penanda_tangan ? payload.penanda_tangan.trim() : "",
  };

  const newRecord = await pegawaiRepository.createCpnsPns(data);

  if (file) {
    const jnsarsipId = spnsId === "1" ? 1 : 2;
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: cpnsPnsId,
      jnsarsipId,
      arsipPath: file.path,
    });
  }

  return newRecord;
};

/**
 * Update Riwayat CPNS / PNS
 */
export const editCpnsPns = async (pegawaiId, cpnsPnsId, payload, userId = null, file = null) => {
  const existing = await pegawaiRepository.findCpnsPnsById(cpnsPnsId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Data CPNS/PNS tidak ditemukan", 404);
  }

  const spnsId = payload.spns_id !== undefined ? String(payload.spns_id) : existing.spns_id;

  const data = {
    ...(payload.spns_id !== undefined && { spns_id: spnsId }),
    ...(payload.sk !== undefined && { sk: payload.sk ? payload.sk.trim() : null }),
    ...(payload.tglsk !== undefined && { tglsk: payload.tglsk ? new Date(payload.tglsk) : null }),
    ...(payload.tmtsk !== undefined && { tmtsk: payload.tmtsk ? new Date(payload.tmtsk) : null }),
    ...(payload.gol_id !== undefined && { gol_id: payload.gol_id ? parseInt(payload.gol_id, 10) : null }),
    ...(payload.maskerThn !== undefined && { maskerThn: payload.maskerThn !== null && payload.maskerThn !== "" ? String(payload.maskerThn).padStart(2, "0") : null }),
    ...(payload.maskerBln !== undefined && { maskerBln: payload.maskerBln !== null && payload.maskerBln !== "" ? String(payload.maskerBln).padStart(2, "0") : null }),
    ...(payload.pertekBkn !== undefined && { pertekBkn: payload.pertekBkn ? payload.pertekBkn.trim() : null }),
    ...(payload.tglPertekBkn !== undefined && { tglPertekBkn: payload.tglPertekBkn ? new Date(payload.tglPertekBkn) : null }),
    ...(payload.sttpl !== undefined && { sttpl: payload.sttpl ? payload.sttpl.trim() : null }),
    ...(payload.tglsttpl !== undefined && { tglsttpl: payload.tglsttpl ? new Date(payload.tglsttpl) : null }),
    ...(payload.noKarpeg !== undefined && { noKarpeg: payload.noKarpeg ? payload.noKarpeg.trim() : null }),
    ...(payload.tglKarpeg !== undefined && { tglKarpeg: payload.tglKarpeg ? new Date(payload.tglKarpeg) : null }),
    ...(payload.penanda_tangan !== undefined && { penanda_tangan: payload.penanda_tangan ? payload.penanda_tangan.trim() : "" }),
  };

  const updatedRecord = await pegawaiRepository.updateCpnsPns(cpnsPnsId, data);

  if (file) {
    const jnsarsipId = spnsId === "1" ? 1 : 2;
    await pegawaiRepository.saveArsipDokumen({
      id: randomUUID(),
      pegawaiId,
      fromId: cpnsPnsId,
      jnsarsipId,
      arsipPath: file.path,
    });
  }

  return updatedRecord;
};

/**
 * Hapus Riwayat CPNS / PNS
 */
export const removeCpnsPns = async (pegawaiId, cpnsPnsId) => {
  const existing = await pegawaiRepository.findCpnsPnsById(cpnsPnsId);
  if (!existing || String(existing.pegawai_id).trim().toLowerCase() !== String(pegawaiId).trim().toLowerCase()) {
    throw new AppError("Data CPNS/PNS tidak ditemukan", 404);
  }

  await pegawaiRepository.deleteCpnsPns(cpnsPnsId);
  await pegawaiRepository.deleteArsipByFrom(cpnsPnsId);

  return { success: true, message: "Data CPNS/PNS berhasil dihapus" };
};

/**
 * Ambil master referensi identitas pegawai
 */
export const getRefIdentitas = async () => {
  return pegawaiRepository.getRefIdentitasData();
};

/**
 * Tambah pegawai baru (ta_orang dan ta_pegawai)
 */
export const addPegawai = async (payload, userId = null) => {
  const nipBaru = payload.nipBaru.trim();

  // Cek apakah NIP Baru sudah terdaftar
  const existing = await pegawaiRepository.findByNip(nipBaru);
  if (existing) {
    throw new AppError(`Pegawai dengan NIP ${nipBaru} sudah terdaftar`, 409);
  }

  const orangId = randomUUID();
  const pegawaiId = randomUUID();

  // Format tanggal lahir
  let tglLhr = null;
  if (payload.tglLhr) {
    tglLhr = new Date(payload.tglLhr);
  }

  const orangData = {
    id: orangId,
    nama: payload.nama.trim(),
    nik: payload.nik ? payload.nik.trim() : "",
    kk: payload.kk ? payload.kk.trim() : "",
    t4Lhr: payload.t4Lhr.trim(),
    tglLhr,
    jkl_id: String(payload.jkl_id),
    agama_id: payload.agama_id ? String(payload.agama_id) : "1",
    kawin_id: payload.kawin_id ? String(payload.kawin_id) : "1",
    golDarah: payload.golDarah ? payload.golDarah.trim() : "-",
    npwp: payload.npwp ? payload.npwp.trim() : "",
    email: payload.email ? payload.email.trim() : "",
    no_hp: payload.no_hp ? payload.no_hp.trim() : "",
    alamat: payload.alamat ? payload.alamat.trim() : "",
    hidup_id: "1",
  };

  const pegawaiData = {
    id: pegawaiId,
    orang_id: orangId,
    nipBaru,
    nipLama: payload.nipLama ? payload.nipLama.trim() : "",
    nik: payload.nik ? payload.nik.trim() : "",
    karpeg: payload.karpeg ? payload.karpeg.trim() : "",
    taspen: payload.taspen ? payload.taspen.trim() : "",
    bpjs: payload.bpjs ? payload.bpjs.trim() : "",
    kedudukanPns_id: payload.kedudukanPns_id ? parseInt(payload.kedudukanPns_id) : 1,
    spns_id: payload.spns_id ? parseInt(payload.spns_id) : 2,
  };

  const newPegawai = await pegawaiRepository.createPegawai(pegawaiData, orangData);
  return newPegawai;
};

/**
 * Edit data identitas pegawai (ta_orang dan ta_pegawai)
 */
export const editIdentitasPegawai = async (pegawaiId, payload, userId = null) => {
  const existing = await pegawaiRepository.findById(pegawaiId);
  if (!existing) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  // Jika NIP diubah, pastikan tidak bentrok dengan pegawai lain
  if (payload.nipBaru && payload.nipBaru.trim() !== existing.nipBaru) {
    const duplicate = await pegawaiRepository.findByNip(payload.nipBaru.trim());
    if (duplicate && duplicate.id !== pegawaiId) {
      throw new AppError(`NIP ${payload.nipBaru.trim()} sudah digunakan oleh pegawai lain`, 409);
    }
  }

  const orangData = {
    ...(payload.nama !== undefined && { nama: payload.nama.trim() }),
    ...(payload.nik !== undefined && { nik: payload.nik ? payload.nik.trim() : "" }),
    ...(payload.kk !== undefined && { kk: payload.kk ? payload.kk.trim() : "" }),
    ...(payload.t4Lhr !== undefined && { t4Lhr: payload.t4Lhr.trim() }),
    ...(payload.tglLhr !== undefined && { tglLhr: payload.tglLhr ? new Date(payload.tglLhr) : null }),
    ...(payload.jkl_id !== undefined && { jkl_id: String(payload.jkl_id) }),
    ...(payload.agama_id !== undefined && { agama_id: String(payload.agama_id) }),
    ...(payload.kawin_id !== undefined && { kawin_id: String(payload.kawin_id) }),
    ...(payload.golDarah !== undefined && { golDarah: payload.golDarah ? payload.golDarah.trim() : "-" }),
    ...(payload.npwp !== undefined && { npwp: payload.npwp ? payload.npwp.trim() : "" }),
    ...(payload.email !== undefined && { email: payload.email ? payload.email.trim() : "" }),
    ...(payload.no_hp !== undefined && { no_hp: payload.no_hp ? payload.no_hp.trim() : "" }),
    ...(payload.alamat !== undefined && { alamat: payload.alamat ? payload.alamat.trim() : "" }),
  };

  const pegawaiData = {
    ...(payload.nipBaru !== undefined && { nipBaru: payload.nipBaru.trim() }),
    ...(payload.nipLama !== undefined && { nipLama: payload.nipLama ? payload.nipLama.trim() : "" }),
    ...(payload.nik !== undefined && { nik: payload.nik ? payload.nik.trim() : "" }),
    ...(payload.karpeg !== undefined && { karpeg: payload.karpeg ? payload.karpeg.trim() : "" }),
    ...(payload.taspen !== undefined && { taspen: payload.taspen ? payload.taspen.trim() : "" }),
    ...(payload.bpjs !== undefined && { bpjs: payload.bpjs ? payload.bpjs.trim() : "" }),
    ...(payload.kedudukanPns_id !== undefined && { kedudukanPns_id: payload.kedudukanPns_id ? parseInt(payload.kedudukanPns_id) : 1 }),
    ...(payload.spns_id !== undefined && { spns_id: payload.spns_id ? parseInt(payload.spns_id) : 2 }),
  };

  const updated = await pegawaiRepository.updateIdentitasPegawai(pegawaiId, pegawaiData, orangData);
  return updated;
};

/**
 * Update foto pegawai
 * @param {string} pegawaiId - ID pegawai
 * @param {object} file - File upload dari Multer
 * @returns {object} { foto, pegawaiId }
 */
export const updateFotoPegawai = async (pegawaiId, file) => {
  if (!file) {
    throw new AppError("File foto tidak ditemukan atau format tidak sesuai", 400);
  }

  const existing = await pegawaiRepository.findById(pegawaiId);
  if (!existing) {
    // Hapus file yang baru diunggah jika pegawai tidak ditemukan
    if (file.path && fs.existsSync(file.path)) {
      try {
        await fs.promises.unlink(file.path);
      } catch (e) {
        logger.warn(`Gagal menghapus file temporary upload: ${file.path}`);
      }
    }
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const fotoPath = file.path.replace(/\\/g, "/");

  const result = await pegawaiRepository.updateFoto(pegawaiId, fotoPath);
  if (!result) {
    throw new AppError("Gagal memperbarui foto pegawai", 500);
  }

  // Hapus foto lama jika ada dan merupakan file lokal
  if (result.oldFoto && typeof result.oldFoto === "string") {
    const isLocal = result.oldFoto.startsWith("storage/") || result.oldFoto.startsWith("public/");
    if (isLocal) {
      try {
        const fullOldPath = path.resolve(result.oldFoto);
        if (fs.existsSync(fullOldPath)) {
          await fs.promises.unlink(fullOldPath);
        }
      } catch (err) {
        logger.warn(`Gagal menghapus file foto lama pegawai: ${result.oldFoto}`);
      }
    }
  }

  return {
    pegawaiId,
    foto: fotoPath,
  };
};

/**
 * Hapus foto pegawai
 * @param {string} pegawaiId - ID pegawai
 * @returns {object} { foto: null, pegawaiId }
 */
export const deleteFotoPegawai = async (pegawaiId) => {
  const existing = await pegawaiRepository.findById(pegawaiId);
  if (!existing) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const oldFoto = existing.ta_orang?.foto;
  if (oldFoto && typeof oldFoto === "string") {
    const isLocal = oldFoto.startsWith("storage/") || oldFoto.startsWith("public/");
    if (isLocal) {
      try {
        const fullOldPath = path.resolve(oldFoto);
        if (fs.existsSync(fullOldPath)) {
          await fs.promises.unlink(fullOldPath);
        }
      } catch (err) {
        logger.warn(`Gagal menghapus file foto pegawai: ${oldFoto}`);
      }
    }
  }

  await pegawaiRepository.updateFoto(pegawaiId, null);

  return {
    pegawaiId,
    foto: null,
  };
};















