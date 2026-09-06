import ExcelJS from "exceljs";
import * as repository from "./data-matching.repository.js";
import AppError from "../../utils/AppError.js";

/**
 * Normalisasi string untuk komparasi (hilangkan spasi berlebih, huruf besar/kecil)
 */
const normStr = (str) => {
  if (!str) return "";
  return String(str).trim().toLowerCase().replace(/\s+/g, " ");
};

/**
 * Normalisasi format golongan (contoh: "III/A", "iii/a" -> "III/a")
 */
const normGol = (gol) => {
  if (!gol) return "";
  const cleaned = String(gol).trim().toUpperCase();
  // Format standar: IV/E, IV/D, IV/C, IV/B, IV/A, III/D, III/C, III/B, III/A, II/D, II/C, II/B, II/A, I/D, I/C, I/B, I/A
  return cleaned;
};

/**
 * Dapatkan nama unit spesifik lokal
 */
const getLocalUnorName = (rwtJabatan, unorMap) => {
  if (!rwtJabatan) return "-";
  if (rwtJabatan.subUnorSub_id && unorMap.has(rwtJabatan.subUnorSub_id)) {
    return unorMap.get(rwtJabatan.subUnorSub_id);
  }
  if (rwtJabatan.subUnor_id && unorMap.has(rwtJabatan.subUnor_id)) {
    return unorMap.get(rwtJabatan.subUnor_id);
  }
  if (rwtJabatan.unor_id && unorMap.has(rwtJabatan.unor_id)) {
    return unorMap.get(rwtJabatan.unor_id);
  }
  if (rwtJabatan.unorInduk_id && unorMap.has(rwtJabatan.unorInduk_id)) {
    return unorMap.get(rwtJabatan.unorInduk_id);
  }
  return rwtJabatan.ref_unitorganisasi?.nmUnor || "-";
};

/**
 * Komparasi data lokal vs SIASN untuk seluruh pegawai
 */
export const buildMatchingDataset = async () => {
  const [localList, siasnList, refMaps] = await Promise.all([
    repository.findAllLocalPegawai(),
    repository.findAllImportPns(),
    repository.getReferenceMaps(),
  ]);

  const { agamaMap, kawinMap, kedudukanMap, unorMap } = refMaps;

  // Indexing SIASN by clean NIP
  const siasnMap = new Map();
  for (const s of siasnList) {
    const nip = repository.cleanNip(s.nip_baru);
    if (nip) {
      siasnMap.set(nip, s);
    }
  }

  // Indexing Local by clean NIP
  const localMap = new Map();
  for (const l of localList) {
    const nip = repository.cleanNip(l.nipBaru);
    if (nip) {
      localMap.set(nip, l);
    }
  }

  // Gabungkan semua NIP unik
  const allNips = new Set([...localMap.keys(), ...siasnMap.keys()]);
  const matchedRecords = [];

  let countMatch = 0;
  let countMismatch = 0;
  let countOnlyLocal = 0;
  let countOnlySiasn = 0;
  const mismatchBreakdown = {
    golongan: 0,
    jabatan: 0,
    unor: 0,
    nama: 0,
    kedudukan: 0,
  };

  for (const nip of allNips) {
    const local = localMap.get(nip);
    const siasn = siasnMap.get(nip);

    // 1. Hanya ada di Lokal
    if (local && !siasn) {
      countOnlyLocal++;
      const localGol = local.rwt_gol?.ref_gol?.gol || "-";
      const localJabatan = local.rwt_jabatan?.ref_jabatan?.nama_jabatan || "-";
      const localUnor = getLocalUnorName(local.rwt_jabatan, unorMap);
      const localKedudukan = kedudukanMap.get(String(local.kedudukanPns_id)) || "Aktif";

      matchedRecords.push({
        nip,
        status: "only_local",
        mismatches: [],
        local: {
          id: local.id,
          nip: local.nipBaru,
          nik: local.nik || local.ta_orang?.nik || "-",
          nama: local.ta_orang?.nama || "-",
          gelar_depan: local.rwt_pend?.gd || "",
          gelar_belakang: local.rwt_pend?.gb || "",
          nama_lengkap: [local.rwt_pend?.gd, local.ta_orang?.nama, local.rwt_pend?.gb].filter(Boolean).join(" ").trim(),
          golongan: localGol,
          pangkat: local.rwt_gol?.ref_gol?.pangkat || "-",
          jabatan: localJabatan,
          unor: localUnor,
          unorInduk_id: local.rwt_jabatan?.unorInduk_id || null,
          kedudukan: localKedudukan,
        },
        siasn: null,
      });
      continue;
    }

    // 2. Hanya ada di SIASN
    if (!local && siasn) {
      countOnlySiasn++;
      matchedRecords.push({
        nip,
        status: "only_siasn",
        mismatches: [],
        local: null,
        siasn: {
          id: siasn.id,
          nip: repository.cleanNip(siasn.nip_baru),
          nik: siasn.nik ? String(siasn.nik).replace(/[^0-9]/g, "") : "-",
          nama: siasn.nama || "-",
          gelar_depan: siasn.gelar_depan || "",
          gelar_belakang: siasn.gelar_belakang || "",
          nama_lengkap: [siasn.gelar_depan, siasn.nama, siasn.gelar_belakang].filter(Boolean).join(" ").trim(),
          golongan: siasn.gol_akhir_nama || "-",
          pangkat: "-",
          jabatan: siasn.jabatan_nama || "-",
          unor: siasn.unor_nama || "-",
          unorInduk_id: null,
          kedudukan: siasn.kedudukan_pns_nama || "-",
        },
      });
      continue;
    }

    // 3. Ada di Lokal & SIASN (Bandingkan atribut)
    const localGol = local.rwt_gol?.ref_gol?.gol || "-";
    const siasnGol = siasn.gol_akhir_nama || "-";

    const localJabatan = local.rwt_jabatan?.ref_jabatan?.nama_jabatan || "-";
    const siasnJabatan = siasn.jabatan_nama || "-";

    const localUnor = getLocalUnorName(local.rwt_jabatan, unorMap);
    const siasnUnor = siasn.unor_nama || "-";

    const localNama = local.ta_orang?.nama || "-";
    const siasnNama = siasn.nama || "-";

    const localKedudukan = kedudukanMap.get(String(local.kedudukanPns_id)) || "Aktif";
    const siasnKedudukan = siasn.kedudukan_pns_nama || "Aktif";

    const mismatches = [];

    // Cek Golongan
    if (normGol(localGol) !== normGol(siasnGol)) {
      mismatches.push("golongan");
      mismatchBreakdown.golongan++;
    }

    // Cek Jabatan
    if (normStr(localJabatan) !== normStr(siasnJabatan)) {
      mismatches.push("jabatan");
      mismatchBreakdown.jabatan++;
    }

    // Cek Unit Organisasi (pencocokan parsial toleran jika unor lokal terkandung di siasn atau sebaliknya)
    const nLocalUnor = normStr(localUnor);
    const nSiasnUnor = normStr(siasnUnor);
    if (nLocalUnor !== nSiasnUnor && !nSiasnUnor.includes(nLocalUnor) && !nLocalUnor.includes(nSiasnUnor)) {
      mismatches.push("unor");
      mismatchBreakdown.unor++;
    }

    // Cek Nama
    if (normStr(localNama) !== normStr(siasnNama)) {
      mismatches.push("nama");
      mismatchBreakdown.nama++;
    }

    // Cek Kedudukan
    if (normStr(localKedudukan) !== normStr(siasnKedudukan)) {
      mismatches.push("kedudukan");
      mismatchBreakdown.kedudukan++;
    }

    const status = mismatches.length === 0 ? "match" : "mismatch";
    if (status === "match") countMatch++;
    if (status === "mismatch") countMismatch++;

    matchedRecords.push({
      nip,
      status,
      mismatches,
      local: {
        id: local.id,
        nip: local.nipBaru,
        nik: local.nik || local.ta_orang?.nik || "-",
        nama: local.ta_orang?.nama || "-",
        gelar_depan: local.rwt_pend?.gd || "",
        gelar_belakang: local.rwt_pend?.gb || "",
        nama_lengkap: [local.rwt_pend?.gd, local.ta_orang?.nama, local.rwt_pend?.gb].filter(Boolean).join(" ").trim(),
        golongan: localGol,
        pangkat: local.rwt_gol?.ref_gol?.pangkat || "-",
        jabatan: localJabatan,
        unor: localUnor,
        unorInduk_id: local.rwt_jabatan?.unorInduk_id || null,
        kedudukan: localKedudukan,
      },
      siasn: {
        id: siasn.id,
        nip: repository.cleanNip(siasn.nip_baru),
        nik: siasn.nik ? String(siasn.nik).replace(/[^0-9]/g, "") : "-",
        nama: siasn.nama || "-",
        gelar_depan: siasn.gelar_depan || "",
        gelar_belakang: siasn.gelar_belakang || "",
        nama_lengkap: [siasn.gelar_depan, siasn.nama, siasn.gelar_belakang].filter(Boolean).join(" ").trim(),
        golongan: siasnGol,
        pangkat: "-",
        jabatan: siasnJabatan,
        unor: siasnUnor,
        unorInduk_id: null,
        kedudukan: siasnKedudukan,
      },
    });
  }

  return {
    records: matchedRecords,
    stats: {
      total_lokal: localList.length,
      total_siasn: siasnList.length,
      total_all: allNips.size,
      match_count: countMatch,
      mismatch_count: countMismatch,
      only_local_count: countOnlyLocal,
      only_siasn_count: countOnlySiasn,
      mismatch_breakdown: mismatchBreakdown,
    },
  };
};

/**
 * Ambil statistik data matching
 */
export const getMatchingStats = async () => {
  const dataset = await buildMatchingDataset();
  return dataset.stats;
};

/**
 * Ambil daftar data matching dengan filter & paginasi
 */
export const getMatchingList = async (query = {}) => {
  const {
    page = 1,
    limit = 15,
    status = "all",
    mismatch_type = "all",
    search = "",
    unorInduk_id = "",
  } = query;

  const dataset = await buildMatchingDataset();
  let filtered = dataset.records;

  // 1. Filter Status
  if (status && status !== "all") {
    filtered = filtered.filter((r) => r.status === status);
  }

  // 2. Filter Tipe Mismatch
  if (mismatch_type && mismatch_type !== "all") {
    filtered = filtered.filter((r) => r.mismatches.includes(mismatch_type));
  }

  // 3. Filter Search (NIP, Nama Lokal, Nama SIASN)
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((r) => {
      const nipMatch = r.nip.includes(q);
      const localNameMatch = r.local?.nama?.toLowerCase().includes(q) || r.local?.nama_lengkap?.toLowerCase().includes(q);
      const siasnNameMatch = r.siasn?.nama?.toLowerCase().includes(q) || r.siasn?.nama_lengkap?.toLowerCase().includes(q);
      const unorMatch = r.local?.unor?.toLowerCase().includes(q) || r.siasn?.unor?.toLowerCase().includes(q);
      return nipMatch || localNameMatch || siasnNameMatch || unorMatch;
    });
  }

  // 4. Filter Unor Induk
  if (unorInduk_id && unorInduk_id.trim()) {
    filtered = filtered.filter((r) => r.local?.unorInduk_id === unorInduk_id);
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 15);
  const total = filtered.length;
  const skip = (pageNum - 1) * limitNum;
  const paginatedData = filtered.slice(skip, skip + limitNum);

  return {
    data: paginatedData,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    stats: dataset.stats,
  };
};

/**
 * Ambil detail perbandingan side-by-side untuk 1 pegawai
 */
export const getMatchingDetail = async (nip) => {
  const clean = repository.cleanNip(nip);
  if (!clean) {
    throw new AppError("NIP pegawai tidak valid", 400);
  }

  const [local, siasn, refMaps] = await Promise.all([
    repository.findLocalPegawaiByNip(clean),
    repository.findImportPnsByNip(clean),
    repository.getReferenceMaps(),
  ]);

  if (!local && !siasn) {
    throw new AppError("Data pegawai tidak ditemukan di Lokal maupun SIASN", 404);
  }

  const { agamaMap, kawinMap, kedudukanMap, tktPendMap, unorMap } = refMaps;

  // Format Field Comparison
  const formatDate = (d) => {
    if (!d) return "-";
    if (typeof d === "string") return d;
    const date = new Date(d);
    if (isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const localNamaLengkap = local ? [local.rwt_pend?.gd, local.ta_orang?.nama, local.rwt_pend?.gb].filter(Boolean).join(" ").trim() : "-";
  const siasnNamaLengkap = siasn ? [siasn.gelar_depan, siasn.nama, siasn.gelar_belakang].filter(Boolean).join(" ").trim() : "-";

  const localAgama = local?.ta_orang?.agama_id ? (agamaMap.get(String(local.ta_orang.agama_id)) || "-") : "-";
  const siasnAgama = siasn?.agama_nama || "-";

  const localKawin = local?.ta_orang?.kawin_id ? (kawinMap.get(String(local.ta_orang.kawin_id)) || "-") : "-";
  const siasnKawin = siasn?.jenis_kawin_nama || "-";

  const localKedudukan = local?.kedudukanPns_id ? (kedudukanMap.get(String(local.kedudukanPns_id)) || "Aktif") : "-";
  const siasnKedudukan = siasn?.kedudukan_pns_nama || "-";

  const localGol = local?.rwt_gol?.ref_gol?.gol || "-";
  const siasnGol = siasn?.gol_akhir_nama || "-";

  const localTmtGol = formatDate(local?.rwt_gol?.tmtSk);
  const siasnTmtGol = siasn?.tmt_golongan || "-";

  const localJabatan = local?.rwt_jabatan?.ref_jabatan?.nama_jabatan || "-";
  const siasnJabatan = siasn?.jabatan_nama || "-";

  const localTmtJabatan = formatDate(local?.rwt_jabatan?.tmtSk);
  const siasnTmtJabatan = siasn?.tmt_jabatan || "-";

  const localUnor = local ? getLocalUnorName(local.rwt_jabatan, unorMap) : "-";
  const siasnUnor = siasn?.unor_nama || "-";

  const localPendidikan = local?.rwt_pend?.jurusan || local?.rwt_pend?.nmSekolah || "-";
  const siasnPendidikan = siasn?.pendidikan_nama || "-";

  const localTktPend = local?.rwt_pend?.tktPend_id ? (tktPendMap.get(String(local.rwt_pend.tktPend_id)) || "-") : "-";
  const siasnTktPend = siasn?.tingkat_pendidikan_nama || "-";

  const comparisonFields = [
    { label: "NIP", local: local?.nipBaru || "-", siasn: siasn ? repository.cleanNip(siasn.nip_baru) : "-", is_same: repository.cleanNip(local?.nipBaru) === repository.cleanNip(siasn?.nip_baru) },
    { label: "NIK", local: local?.nik || local?.ta_orang?.nik || "-", siasn: siasn?.nik ? String(siasn.nik).replace(/[^0-9]/g, "") : "-", is_same: normStr(local?.nik) === normStr(siasn?.nik) },
    { label: "Nama Lengkap", local: localNamaLengkap, siasn: siasnNamaLengkap, is_same: normStr(localNamaLengkap) === normStr(siasnNamaLengkap) },
    { label: "Tempat Lahir", local: local?.ta_orang?.t4Lhr || "-", siasn: siasn?.tempat_lahir || "-", is_same: normStr(local?.ta_orang?.t4Lhr) === normStr(siasn?.tempat_lahir) },
    { label: "Tanggal Lahir", local: formatDate(local?.ta_orang?.tglLhr), siasn: siasn?.tanggal_lahir || "-", is_same: formatDate(local?.ta_orang?.tglLhr) === (siasn?.tanggal_lahir || "-") },
    { label: "Agama", local: localAgama, siasn: siasnAgama, is_same: normStr(localAgama) === normStr(siasnAgama) },
    { label: "Status Perkawinan", local: localKawin, siasn: siasnKawin, is_same: normStr(localKawin) === normStr(siasnKawin) },
    { label: "Kedudukan PNS", local: localKedudukan, siasn: siasnKedudukan, is_same: normStr(localKedudukan) === normStr(siasnKedudukan) },
    { label: "Golongan / Pangkat", local: `${localGol} (${local?.rwt_gol?.ref_gol?.pangkat || '-'})`, siasn: siasnGol, is_same: normGol(localGol) === normGol(siasnGol) },
    { label: "TMT Golongan", local: localTmtGol, siasn: siasnTmtGol, is_same: localTmtGol === siasnTmtGol },
    { label: "Jabatan", local: localJabatan, siasn: siasnJabatan, is_same: normStr(localJabatan) === normStr(siasnJabatan) },
    { label: "TMT Jabatan", local: localTmtJabatan, siasn: siasnTmtJabatan, is_same: localTmtJabatan === siasnTmtJabatan },
    { label: "Unit Organisasi (OPD)", local: localUnor, siasn: siasnUnor, is_same: normStr(localUnor) === normStr(siasnUnor) },
    { label: "Tingkat Pendidikan", local: localTktPend, siasn: siasnTktPend, is_same: normStr(localTktPend) === normStr(siasnTktPend) },
    { label: "Pendidikan / Jurusan", local: localPendidikan, siasn: siasnPendidikan, is_same: normStr(localPendidikan) === normStr(siasnPendidikan) },
    { label: "Tahun Lulus", local: local?.rwt_pend?.thnLulus ? String(local.rwt_pend.thnLulus) : "-", siasn: siasn?.tahun_lulus ? String(siasn.tahun_lulus) : "-", is_same: String(local?.rwt_pend?.thnLulus || '') === String(siasn?.tahun_lulus || '') },
    { label: "Nomor HP", local: local?.ta_orang?.no_hp || "-", siasn: siasn?.nomor_hp || "-", is_same: normStr(local?.ta_orang?.no_hp) === normStr(siasn?.nomor_hp) },
    { label: "Email", local: local?.ta_orang?.email || "-", siasn: siasn?.email || "-", is_same: normStr(local?.ta_orang?.email) === normStr(siasn?.email) },
    { label: "NPWP", local: local?.ta_orang?.npwp || "-", siasn: siasn?.npwp_nomor || "-", is_same: normStr(local?.ta_orang?.npwp) === normStr(siasn?.npwp_nomor) },
  ];

  return {
    nip: clean,
    has_local: Boolean(local),
    has_siasn: Boolean(siasn),
    fields: comparisonFields,
    local_raw: local,
    siasn_raw: siasn,
  };
};

/**
 * Generate Excel buffer untuk rekapitulasi data matching
 */
export const generateMatchingExcel = async (query = {}) => {
  const result = await getMatchingList({ ...query, page: 1, limit: 100000 });
  const records = result.data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIPASN Tojo Una-Una";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Data Matching", {
    views: [{ showGridLines: true }],
  });

  // Judul Laporan
  worksheet.mergeCells("A1:K1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "LAPORAN DATA MATCHING (LOKAL VS SIASN BKN)";
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FF1E3A8A" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells("A2:K2");
  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = `Tanggal Export: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })} | Total: ${records.length} Pegawai`;
  subtitleCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF6B7280" } };
  subtitleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(2).height = 20;

  // Header Baris 4 & 5 (Tabel Komparasi)
  worksheet.mergeCells("A4:A5");
  worksheet.getCell("A4").value = "NO";
  worksheet.mergeCells("B4:B5");
  worksheet.getCell("B4").value = "NIP";
  worksheet.mergeCells("C4:D4");
  worksheet.getCell("C4").value = "NAMA LENGKAP";
  worksheet.getCell("C5").value = "LOKAL";
  worksheet.getCell("D5").value = "SIASN";

  worksheet.mergeCells("E4:F4");
  worksheet.getCell("E4").value = "GOLONGAN";
  worksheet.getCell("E5").value = "LOKAL";
  worksheet.getCell("F5").value = "SIASN";

  worksheet.mergeCells("G4:H4");
  worksheet.getCell("G4").value = "JABATAN";
  worksheet.getCell("G5").value = "LOKAL";
  worksheet.getCell("H5").value = "SIASN";

  worksheet.mergeCells("I4:J4");
  worksheet.getCell("I4").value = "UNIT ORGANISASI";
  worksheet.getCell("I5").value = "LOKAL";
  worksheet.getCell("J5").value = "SIASN";

  worksheet.mergeCells("K4:K5");
  worksheet.getCell("K4").value = "STATUS MATCHING";

  // Lebar Kolom
  worksheet.columns = [
    { key: "no", width: 6 },
    { key: "nip", width: 22 },
    { key: "nama_local", width: 30 },
    { key: "nama_siasn", width: 30 },
    { key: "gol_local", width: 12 },
    { key: "gol_siasn", width: 12 },
    { key: "jab_local", width: 35 },
    { key: "jab_siasn", width: 35 },
    { key: "unor_local", width: 35 },
    { key: "unor_siasn", width: 35 },
    { key: "status", width: 22 },
  ];

  // Styling Header
  [4, 5].forEach((rowNum) => {
    const row = worksheet.getRow(rowNum);
    row.height = 22;
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E40AF" },
      };
      cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Isi Baris Data
  records.forEach((r, idx) => {
    let statusText = "Sesuai";
    if (r.status === "only_local") statusText = "Hanya di Lokal";
    else if (r.status === "only_siasn") statusText = "Hanya di SIASN";
    else if (r.status === "mismatch") statusText = `Selisih (${r.mismatches.join(", ")})`;

    const row = worksheet.addRow([
      idx + 1,
      r.nip,
      r.local?.nama_lengkap || "-",
      r.siasn?.nama_lengkap || "-",
      r.local?.golongan || "-",
      r.siasn?.golongan || "-",
      r.local?.jabatan || "-",
      r.siasn?.jabatan || "-",
      r.local?.unor || "-",
      r.siasn?.unor || "-",
      statusText,
    ]);

    row.height = 20;
    row.eachCell((cell, colNum) => {
      cell.font = { name: "Arial", size: 9 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
      if (colNum === 1 || colNum === 2 || colNum === 5 || colNum === 6 || colNum === 11) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }
    });
  });

  return workbook.xlsx.writeBuffer();
};
