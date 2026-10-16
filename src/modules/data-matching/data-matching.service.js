import ExcelJS from "exceljs";
import { v4 as uuidv4 } from "uuid";
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
 * Normalisasi format golongan (contoh: "III/A", "iii/a" -> "III/A")
 */
const normGol = (gol) => {
  if (!gol) return "";
  return String(gol).trim().toUpperCase();
};

/**
 * Normalisasi string pendidikan untuk komparasi toleran
 */
const normEdu = (str) => {
  if (!str || str === "-") return "";
  return String(str)
    .toUpperCase()
    .replace(/STRATA\s*1/g, "S 1")
    .replace(/STRATA\s*2/g, "S 2")
    .replace(/STRATA\s*3/g, "S 3")
    .replace(/DIPLOMA\s*III/g, "D III")
    .replace(/DIPLOMA\s*IV/g, "D IV")
    .replace(/DIPLOMA\s*II/g, "D II")
    .replace(/DIPLOMA\s*I/g, "D I")
    .replace(/A[.\-\s]*IV/g, "")
    .replace(/[^A-Z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const cleanEduTokens = (str) => {
  const n = normEdu(str);
  if (!n) return "";
  const noise = new Set(["PENDIDIKAN", "DAN", "ILMU", "JURUSAN", "PROGRAM", "STUDI"]);
  return n.split(" ").filter((w) => !noise.has(w)).join(" ");
};

const matchEdu = (a, b) => {
  const nA = normEdu(a);
  const nB = normEdu(b);
  if (!nA || !nB) return false;
  if (nA === nB || nA.includes(nB) || nB.includes(nA)) return true;
  const cA = cleanEduTokens(a);
  const cB = cleanEduTokens(b);
  if (cA && cB && (cA === cB || cA.includes(cB) || cB.includes(cA))) return true;
  return false;
};

/**
 * Dapatkan status kepegawaian (PNS / CPNS) SIASN
 */
const getSiasnStatusKepegawaian = (statusCpnsPns) => {
  if (!statusCpnsPns) return "-";
  const s = String(statusCpnsPns).trim().toUpperCase();
  if (s === "C" || s === "CPNS") return "CPNS";
  if (s === "P" || s === "PNS") return "PNS";
  return s;
};

/**
 * Dapatkan status kepegawaian (PNS / CPNS) Lokal
 */
const getLocalStatusKepegawaian = (pegawai, cpnsSet = new Set(), pnsSet = new Set()) => {
  if (!pegawai) return "-";
  const isCpns = pegawai.spns_id === 1 || ((cpnsSet?.has(pegawai.id)) && !(pnsSet?.has(pegawai.id)));
  return isCpns ? "CPNS" : "PNS";
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
 * Komparasi data lokal vs SIASN untuk 6 atribut utama:
 * 1. Nama
 * 2. Golongan
 * 3. Pendidikan
 * 4. Jabatan
 * 5. Unit Kerja
 * 6. Status Kepegawaian (PNS dan CPNS)
 */
export const buildMatchingDataset = async () => {
  const [localList, siasnList, refMaps] = await Promise.all([
    repository.findAllLocalPegawai(),
    repository.findAllImportPns(),
    repository.getReferenceMaps(),
  ]);

  const { unorMap, pendMap, tktPendMap, pnsPegawaiSet, cpnsPegawaiSet } = refMaps;

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
    nama: 0,
    golongan: 0,
    pendidikan: 0,
    jabatan: 0,
    unit_kerja: 0,
    status_kepegawaian: 0,
  };

  for (const nip of allNips) {
    const local = localMap.get(nip);
    const siasn = siasnMap.get(nip);

    // 1. Hanya ada di Lokal
    if (local && !siasn) {
      countOnlyLocal++;
      const localStatus = getLocalStatusKepegawaian(local, cpnsPegawaiSet, pnsPegawaiSet);
      const localGol = local.rwt_gol?.ref_gol?.gol || "-";
      const localJabatan = local.rwt_jabatan?.ref_jabatan?.nama_jabatan || "-";
      const localUnor = getLocalUnorName(local.rwt_jabatan, unorMap);
      const localPendidikan =
        (local.rwt_pend?.pend_id && pendMap.get(local.rwt_pend.pend_id)) ||
        local.rwt_pend?.jurusan ||
        (local.rwt_pend?.tktPend_id && tktPendMap.get(String(local.rwt_pend.tktPend_id))) ||
        "-";
      const localNama = local.ta_orang?.nama || "-";
      const localNamaLengkap = [local.rwt_pend?.gd, local.ta_orang?.nama, local.rwt_pend?.gb].filter(Boolean).join(" ").trim();

      matchedRecords.push({
        nip,
        status: "only_local",
        mismatches: [],
        local: {
          id: local.id,
          nip: local.nipBaru,
          nik: local.nik || local.ta_orang?.nik || "-",
          nama: localNama,
          gelar_depan: local.rwt_pend?.gd || "",
          gelar_belakang: local.rwt_pend?.gb || "",
          nama_lengkap: localNamaLengkap,
          status_kepegawaian: localStatus,
          golongan: localGol,
          pangkat: local.rwt_gol?.ref_gol?.pangkat || "-",
          pendidikan: localPendidikan,
          jabatan: localJabatan,
          unit_kerja: localUnor,
          unor: localUnor,
          unorInduk_id: local.rwt_jabatan?.unorInduk_id || null,
        },
        siasn: null,
      });
      continue;
    }

    // 2. Hanya ada di SIASN
    if (!local && siasn) {
      countOnlySiasn++;
      const siasnStatus = getSiasnStatusKepegawaian(siasn.status_cpns_pns);
      const siasnGol = siasn.gol_akhir_nama || "-";
      const siasnJabatan = siasn.jabatan_nama || "-";
      const siasnUnor = siasn.unor_nama || "-";
      const siasnPendidikan = siasn.pendidikan_nama || siasn.tingkat_pendidikan_nama || "-";
      const siasnNama = siasn.nama || "-";
      const siasnNamaLengkap = [siasn.gelar_depan, siasn.nama, siasn.gelar_belakang].filter(Boolean).join(" ").trim();

      matchedRecords.push({
        nip,
        status: "only_siasn",
        mismatches: [],
        local: null,
        siasn: {
          id: siasn.id,
          nip: repository.cleanNip(siasn.nip_baru),
          nik: siasn.nik ? String(siasn.nik).replace(/[^0-9]/g, "") : "-",
          nama: siasnNama,
          gelar_depan: siasn.gelar_depan || "",
          gelar_belakang: siasn.gelar_belakang || "",
          nama_lengkap: siasnNamaLengkap,
          status_kepegawaian: siasnStatus,
          golongan: siasnGol,
          pangkat: "-",
          pendidikan: siasnPendidikan,
          jabatan: siasnJabatan,
          unit_kerja: siasnUnor,
          unor: siasnUnor,
          unorInduk_id: null,
        },
      });
      continue;
    }

    // 3. Ada di Lokal & SIASN (Bandingkan hanya 6 atribut utama)
    const localStatus = getLocalStatusKepegawaian(local, cpnsPegawaiSet, pnsPegawaiSet);
    const siasnStatus = getSiasnStatusKepegawaian(siasn.status_cpns_pns);

    const localGol = local.rwt_gol?.ref_gol?.gol || "-";
    const siasnGol = siasn.gol_akhir_nama || "-";

    const localPendidikan =
      (local.rwt_pend?.pend_id && pendMap.get(local.rwt_pend.pend_id)) ||
      local.rwt_pend?.jurusan ||
      (local.rwt_pend?.tktPend_id && tktPendMap.get(String(local.rwt_pend.tktPend_id))) ||
      "-";
    const siasnPendidikan = siasn.pendidikan_nama || siasn.tingkat_pendidikan_nama || "-";

    const localJabatan = local.rwt_jabatan?.ref_jabatan?.nama_jabatan || "-";
    const siasnJabatan = siasn.jabatan_nama || "-";

    const localUnor = getLocalUnorName(local.rwt_jabatan, unorMap);
    const siasnUnor = siasn.unor_nama || "-";

    const localNama = local.ta_orang?.nama || "-";
    const siasnNama = siasn.nama || "-";

    const localNamaLengkap = [local.rwt_pend?.gd, local.ta_orang?.nama, local.rwt_pend?.gb].filter(Boolean).join(" ").trim();
    const siasnNamaLengkap = [siasn.gelar_depan, siasn.nama, siasn.gelar_belakang].filter(Boolean).join(" ").trim();

    const mismatches = [];

    // 1. Cek Nama
    const isNamaMatch = normStr(localNama) === normStr(siasnNama) || normStr(localNamaLengkap) === normStr(siasnNamaLengkap);
    if (!isNamaMatch) {
      mismatches.push("nama");
      mismatchBreakdown.nama++;
    }

    // 2. Cek Status Kepegawaian (PNS vs CPNS)
    if (normStr(localStatus) !== normStr(siasnStatus)) {
      mismatches.push("status_kepegawaian");
      mismatchBreakdown.status_kepegawaian++;
    }

    // 3. Cek Golongan
    if (normGol(localGol) !== normGol(siasnGol)) {
      mismatches.push("golongan");
      mismatchBreakdown.golongan++;
    }

    // 4. Cek Pendidikan
    if (!matchEdu(localPendidikan, siasnPendidikan)) {
      mismatches.push("pendidikan");
      mismatchBreakdown.pendidikan++;
    }

    // 5. Cek Jabatan
    if (normStr(localJabatan) !== normStr(siasnJabatan)) {
      mismatches.push("jabatan");
      mismatchBreakdown.jabatan++;
    }

    // 6. Cek Unit Kerja
    const nLocalUnor = normStr(localUnor);
    const nSiasnUnor = normStr(siasnUnor);
    if (nLocalUnor !== nSiasnUnor && !nSiasnUnor.includes(nLocalUnor) && !nLocalUnor.includes(nSiasnUnor)) {
      mismatches.push("unit_kerja");
      mismatchBreakdown.unit_kerja++;
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
        nama: localNama,
        gelar_depan: local.rwt_pend?.gd || "",
        gelar_belakang: local.rwt_pend?.gb || "",
        nama_lengkap: localNamaLengkap,
        status_kepegawaian: localStatus,
        golongan: localGol,
        pangkat: local.rwt_gol?.ref_gol?.pangkat || "-",
        pendidikan: localPendidikan,
        jabatan: localJabatan,
        unit_kerja: localUnor,
        unor: localUnor,
        unorInduk_id: local.rwt_jabatan?.unorInduk_id || null,
      },
      siasn: {
        id: siasn.id,
        nip: repository.cleanNip(siasn.nip_baru),
        nik: siasn.nik ? String(siasn.nik).replace(/[^0-9]/g, "") : "-",
        nama: siasnNama,
        gelar_depan: siasn.gelar_depan || "",
        gelar_belakang: siasn.gelar_belakang || "",
        nama_lengkap: siasnNamaLengkap,
        status_kepegawaian: siasnStatus,
        golongan: siasnGol,
        pangkat: "-",
        pendidikan: siasnPendidikan,
        jabatan: siasnJabatan,
        unit_kerja: siasnUnor,
        unor: siasnUnor,
        unorInduk_id: null,
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
    const aliasMap = {
      unor: "unit_kerja",
      status_pns: "status_kepegawaian",
    };
    const targetType = aliasMap[mismatch_type] || mismatch_type;
    filtered = filtered.filter((r) => r.mismatches.includes(targetType) || r.mismatches.includes(mismatch_type));
  }

  // 3. Filter Search (NIP, Nama, Unit Kerja, Pendidikan, Jabatan)
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((r) => {
      const nipMatch = r.nip.includes(q);
      const localNameMatch = r.local?.nama?.toLowerCase().includes(q) || r.local?.nama_lengkap?.toLowerCase().includes(q);
      const siasnNameMatch = r.siasn?.nama?.toLowerCase().includes(q) || r.siasn?.nama_lengkap?.toLowerCase().includes(q);
      const unorMatch = r.local?.unit_kerja?.toLowerCase().includes(q) || r.siasn?.unit_kerja?.toLowerCase().includes(q);
      const pendMatch = r.local?.pendidikan?.toLowerCase().includes(q) || r.siasn?.pendidikan?.toLowerCase().includes(q);
      const jabMatch = r.local?.jabatan?.toLowerCase().includes(q) || r.siasn?.jabatan?.toLowerCase().includes(q);
      const statusMatch = r.local?.status_kepegawaian?.toLowerCase().includes(q) || r.siasn?.status_kepegawaian?.toLowerCase().includes(q);
      return nipMatch || localNameMatch || siasnNameMatch || unorMatch || pendMatch || jabMatch || statusMatch;
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

  const { unorMap, pendMap, tktPendMap, pnsPegawaiSet, cpnsPegawaiSet } = refMaps;

  // Local values
  const localStatus = local ? getLocalStatusKepegawaian(local, cpnsPegawaiSet, pnsPegawaiSet) : "-";
  const localGol = local?.rwt_gol?.ref_gol?.gol || "-";
  const localJabatan = local?.rwt_jabatan?.ref_jabatan?.nama_jabatan || "-";
  const localUnor = local ? getLocalUnorName(local.rwt_jabatan, unorMap) : "-";
  const localPendidikan =
    (local?.rwt_pend?.pend_id && pendMap.get(local.rwt_pend.pend_id)) ||
    local?.rwt_pend?.jurusan ||
    (local?.rwt_pend?.tktPend_id && tktPendMap.get(String(local.rwt_pend.tktPend_id))) ||
    "-";
  const localNama = local?.ta_orang?.nama || "-";
  const localNamaLengkap = local ? [local.rwt_pend?.gd, local.ta_orang?.nama, local.rwt_pend?.gb].filter(Boolean).join(" ").trim() : "-";

  // SIASN values
  const siasnStatus = siasn ? getSiasnStatusKepegawaian(siasn.status_cpns_pns) : "-";
  const siasnGol = siasn?.gol_akhir_nama || "-";
  const siasnJabatan = siasn?.jabatan_nama || "-";
  const siasnUnor = siasn?.unor_nama || "-";
  const siasnPendidikan = siasn?.pendidikan_nama || siasn?.tingkat_pendidikan_nama || "-";
  const siasnNama = siasn?.nama || "-";
  const siasnNamaLengkap = siasn ? [siasn.gelar_depan, siasn.nama, siasn.gelar_belakang].filter(Boolean).join(" ").trim() : "-";

  const isNamaMatch = (normStr(localNama) === normStr(siasnNama)) || (normStr(localNamaLengkap) === normStr(siasnNamaLengkap));
  const isGolMatch = normGol(localGol) === normGol(siasnGol);
  const isJabMatch = normStr(localJabatan) === normStr(siasnJabatan);
  const nLocalUnor = normStr(localUnor);
  const nSiasnUnor = normStr(siasnUnor);
  const isUnorMatch = nLocalUnor === nSiasnUnor || nSiasnUnor.includes(nLocalUnor) || nLocalUnor.includes(nSiasnUnor);
  const isPendMatch = matchEdu(localPendidikan, siasnPendidikan);
  const isStatusMatch = normStr(localStatus) === normStr(siasnStatus);

  const comparisonFields = [
    { label: "NIP", local: local?.nipBaru || "-", siasn: siasn ? repository.cleanNip(siasn.nip_baru) : "-", is_same: repository.cleanNip(local?.nipBaru) === repository.cleanNip(siasn?.nip_baru) },
    { label: "Nama Pegawai", local: localNamaLengkap, siasn: siasnNamaLengkap, is_same: isNamaMatch },
    { label: "Status Kepegawaian", local: localStatus, siasn: siasnStatus, is_same: isStatusMatch },
    { label: "Golongan", local: localGol, siasn: siasnGol, is_same: isGolMatch },
    { label: "Pendidikan", local: localPendidikan, siasn: siasnPendidikan, is_same: isPendMatch },
    { label: "Jabatan", local: localJabatan, siasn: siasnJabatan, is_same: isJabMatch },
    { label: "Unit Kerja", local: localUnor, siasn: siasnUnor, is_same: isUnorMatch },
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
 * Generate Excel buffer untuk rekapitulasi data matching 6 atribut
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
  worksheet.mergeCells("A1:O1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "LAPORAN DATA MATCHING (LOKAL VS SIASN BKN)";
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FF1E3A8A" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells("A2:O2");
  const subtitleCell = worksheet.getCell("A2");
  subtitleCell.value = `Tanggal Export: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })} | Total: ${records.length} Pegawai`;
  subtitleCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF6B7280" } };
  subtitleCell.alignment = { vertical: "middle", horizontal: "center" };
  worksheet.getRow(2).height = 20;

  // Header Baris 4 & 5 (Tabel Komparasi 6 Atribut)
  worksheet.mergeCells("A4:A5");
  worksheet.getCell("A4").value = "NO";

  worksheet.mergeCells("B4:B5");
  worksheet.getCell("B4").value = "NIP";

  worksheet.mergeCells("C4:D4");
  worksheet.getCell("C4").value = "NAMA LENGKAP";
  worksheet.getCell("C5").value = "LOKAL";
  worksheet.getCell("D5").value = "SIASN";

  worksheet.mergeCells("E4:F4");
  worksheet.getCell("E4").value = "STATUS KEPEGAWAIAN";
  worksheet.getCell("E5").value = "LOKAL";
  worksheet.getCell("F5").value = "SIASN";

  worksheet.mergeCells("G4:H4");
  worksheet.getCell("G4").value = "GOLONGAN";
  worksheet.getCell("G5").value = "LOKAL";
  worksheet.getCell("H5").value = "SIASN";

  worksheet.mergeCells("I4:J4");
  worksheet.getCell("I4").value = "PENDIDIKAN";
  worksheet.getCell("I5").value = "LOKAL";
  worksheet.getCell("J5").value = "SIASN";

  worksheet.mergeCells("K4:L4");
  worksheet.getCell("K4").value = "JABATAN";
  worksheet.getCell("K5").value = "LOKAL";
  worksheet.getCell("L5").value = "SIASN";

  worksheet.mergeCells("M4:N4");
  worksheet.getCell("M4").value = "UNIT KERJA";
  worksheet.getCell("M5").value = "LOKAL";
  worksheet.getCell("N5").value = "SIASN";

  worksheet.mergeCells("O4:O5");
  worksheet.getCell("O4").value = "STATUS MATCHING";

  // Lebar Kolom
  worksheet.columns = [
    { key: "no", width: 6 },
    { key: "nip", width: 22 },
    { key: "nama_local", width: 28 },
    { key: "nama_siasn", width: 28 },
    { key: "status_local", width: 14 },
    { key: "status_siasn", width: 14 },
    { key: "gol_local", width: 12 },
    { key: "gol_siasn", width: 12 },
    { key: "pend_local", width: 30 },
    { key: "pend_siasn", width: 30 },
    { key: "jab_local", width: 32 },
    { key: "jab_siasn", width: 32 },
    { key: "unor_local", width: 32 },
    { key: "unor_siasn", width: 32 },
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
      r.local?.status_kepegawaian || "-",
      r.siasn?.status_kepegawaian || "-",
      r.local?.golongan || "-",
      r.siasn?.golongan || "-",
      r.local?.pendidikan || "-",
      r.siasn?.pendidikan || "-",
      r.local?.jabatan || "-",
      r.siasn?.jabatan || "-",
      r.local?.unit_kerja || r.local?.unor || "-",
      r.siasn?.unit_kerja || r.siasn?.unor || "-",
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
      if (colNum === 1 || colNum === 2 || colNum === 5 || colNum === 6 || colNum === 7 || colNum === 8 || colNum === 15) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }
    });
  });

  return workbook.xlsx.writeBuffer();
};

/**
 * Helper untuk parsing tanggal fleksibel (mendukung DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD)
 */
export const parseFlexibleDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) return dateVal;

  const str = String(dateVal).trim();
  if (!str) return null;

  // Cek format DD-MM-YYYY atau DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    if (!isNaN(d.getTime())) return d;
  }

  // Cek format YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    if (!isNaN(d.getTime())) return d;
  }

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Format URL arsip dokumen agar dapat diakses dari browser / frontend
 */
export const formatDokumenUrl = (arsipPath) => {
  if (!arsipPath) return null;
  const cleaned = String(arsipPath).replace(/\\/g, "/").trim();
  if (!cleaned) return null;
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) return cleaned;
  if (cleaned.startsWith("/storage/")) return cleaned;
  if (cleaned.startsWith("storage/")) return `/${cleaned}`;
  return `/storage/dokumen/${cleaned}`;
};

/**
 * Sinkronisasi data selisih Pangkat / Golongan dari SIASN ke Database Lokal
 * Sekaligus memasukkan pegawai ke antrean upload SK fisik
 */
export const syncGolonganFromSiasn = async ({ nips, userId }) => {
  if (!nips || !Array.isArray(nips) || nips.length === 0) {
    throw new AppError("Daftar NIP pegawai wajib disertakan", 400);
  }

  // Bersihkan dan unikkan NIP
  const cleanNips = [...new Set(nips.map((n) => repository.cleanNip(n)).filter(Boolean))];
  if (cleanNips.length === 0) {
    throw new AppError("Tidak ada NIP valid yang dapat diproses", 400);
  }

  // Ambil data lokal, import SIASN, dan referensi golongan secara paralel
  const [localPegawaiList, siasnList, refGolList] = await Promise.all([
    repository.findPegawaiForSyncGolongan(cleanNips),
    repository.findImportPnsForSyncGolongan(cleanNips),
    repository.findAllRefGol(),
  ]);

  // Indexing lookup map
  const localMap = new Map();
  for (const l of localPegawaiList) {
    const cNip = repository.cleanNip(l.nipBaru);
    if (cNip) localMap.set(cNip, l);
  }

  const siasnMap = new Map();
  for (const s of siasnList) {
    const cNip = repository.cleanNip(s.nip_baru);
    if (cNip) siasnMap.set(cNip, s);
  }

  const refGolKdMap = new Map(refGolList.map((g) => [String(g.kdGol).trim(), g]));
  const refGolNameMap = new Map(refGolList.map((g) => [normGol(g.gol), g]));

  const batchId = uuidv4();
  const success = [];
  const skipped = [];
  const failed = [];

  for (const nip of cleanNips) {
    const local = localMap.get(nip);
    if (!local) {
      failed.push({ nip, nama: "-", alasan: "Pegawai lokal tidak ditemukan di database" });
      continue;
    }

    const siasn = siasnMap.get(nip);
    if (!siasn) {
      failed.push({
        nip,
        nama: local.ta_orang?.nama || "-",
        alasan: "Data SIASN BKN untuk NIP ini tidak ditemukan",
      });
      continue;
    }

    // Resolusi golongan dari SIASN (cocokkan kdGol atau nama golongan)
    let refGolBaru = null;
    if (siasn.gol_akhir_id && refGolKdMap.has(String(siasn.gol_akhir_id).trim())) {
      refGolBaru = refGolKdMap.get(String(siasn.gol_akhir_id).trim());
    } else if (siasn.gol_akhir_nama && refGolNameMap.has(normGol(siasn.gol_akhir_nama))) {
      refGolBaru = refGolNameMap.get(normGol(siasn.gol_akhir_nama));
    }

    if (!refGolBaru) {
      failed.push({
        nip,
        nama: local.ta_orang?.nama || siasn.nama,
        alasan: `Golongan SIASN (${siasn.gol_akhir_nama || siasn.gol_akhir_id || "-"}) tidak cocok dengan data referensi`,
      });
      continue;
    }

    const kdGolBaru = refGolBaru.kdGol;
    const nmGolBaru = refGolBaru.gol;
    const golLama = local.rwt_gol?.ref_gol?.gol || "-";

    // Parse TMT Golongan
    const tmtDate =
      parseFlexibleDate(siasn.tmt_golongan) ||
      parseFlexibleDate(siasn.tanggal_sk_pns) ||
      new Date();

    // 1. Cek apakah sudah pernah disinkronkan ke antrean ta_sync_golongan
    const existingSync = await repository.findExistingSyncGolongan(local.id, kdGolBaru);
    if (existingSync) {
      skipped.push({
        nip,
        nama: local.ta_orang?.nama || siasn.nama,
        gol_baru: nmGolBaru,
        alasan: "Sudah berada di antrean upload SK golongan",
      });
      continue;
    }

    // 2. Cek apakah riwayat golongan dengan gol_id dan tmtSk yang sama sudah ada di rwt_gol
    const existingRwt = await repository.findExistingRiwayatGolongan(local.id, kdGolBaru, tmtDate);
    if (existingRwt) {
      // Hubungkan riwayat yang sudah ada ke antrean upload SK
      const syncGolData = {
        id: uuidv4(),
        pegawai_id: local.id,
        nip,
        nama: local.ta_orang?.nama || siasn.nama,
        gol_lama: golLama,
        gol_baru: nmGolBaru,
        kd_gol_baru: kdGolBaru,
        tmt_golongan: tmtDate,
        status_sk: "PENDING",
        batch_id: batchId,
      };

      await repository.linkExistingRiwayatToSyncQueue({
        pegawaiId: local.id,
        rwtGolId: existingRwt.id,
        syncGolData,
      });

      success.push({
        nip,
        nama: local.ta_orang?.nama || siasn.nama,
        gol_lama: golLama,
        gol_baru: nmGolBaru,
        catatan: "Riwayat golongan ditemukan, antrean upload SK berhasil dibuat",
      });
      continue;
    }

    // 3. Buat riwayat golongan baru di rwt_gol + update pointer aktif + masukkan ke ta_sync_golongan
    const tglSkDate = parseFlexibleDate(siasn.tanggal_sk_pns) || tmtDate;
    const rwtGolId = uuidv4();

    const rwtGolData = {
      id: rwtGolId,
      pegawai_id: local.id,
      gol_id: kdGolBaru,
      sk: siasn.nomor_sk_pns || null,
      tglSk: tglSkDate,
      tmtSk: tmtDate,
      maskerThn: siasn.mk_tahun ? String(siasn.mk_tahun) : null,
      maskerBln: siasn.mk_bulan ? String(siasn.mk_bulan) : null,
      pengesahan: "Sinkronisasi SIASN BKN",
      user_created: userId ? parseInt(userId, 10) : null,
    };

    const syncGolData = {
      id: uuidv4(),
      pegawai_id: local.id,
      nip,
      nama: local.ta_orang?.nama || siasn.nama,
      gol_lama: golLama,
      gol_baru: nmGolBaru,
      kd_gol_baru: kdGolBaru,
      tmt_golongan: tmtDate,
      status_sk: "PENDING",
      batch_id: batchId,
    };

    await repository.executeSyncGolonganItem({
      pegawaiId: local.id,
      rwtGolData,
      syncGolData,
    });

    success.push({
      nip,
      nama: local.ta_orang?.nama || siasn.nama,
      gol_lama: golLama,
      gol_baru: nmGolBaru,
    });
  }

  return {
    batchId,
    total: cleanNips.length,
    successCount: success.length,
    skippedCount: skipped.length,
    failedCount: failed.length,
    results: {
      success,
      skipped,
      failed,
    },
  };
};

/**
 * Ambil daftar antrean upload SK golongan hasil sinkronisasi
 */
export const getSyncGolonganQueue = async (query = {}) => {
  const { page = 1, limit = 15, search = "", status_sk = "all" } = query;

  const [queueResult, stats] = await Promise.all([
    repository.findSyncGolonganQueue({ page, limit, search, status_sk }),
    repository.getSyncGolonganStats(),
  ]);

  const { items, total } = queueResult;
  const rwtGolIds = items.map((i) => i.rwt_gol_id).filter(Boolean);

  const { arsipList, rwtGolList } = await repository.findArsipAndSkForRwtGolIds(rwtGolIds);

  const arsipMap = new Map(arsipList.map((a) => [a.from, a.arsip]));
  const rwtGolMap = new Map(rwtGolList.map((r) => [r.id, r]));

  const enrichedItems = items.map((item) => {
    const rwt = rwtGolMap.get(item.rwt_gol_id);
    const rawArsip = arsipMap.get(item.rwt_gol_id);

    return {
      ...item,
      sk: rwt?.sk || null,
      tglSk: rwt?.tglSk || null,
      arsip: rawArsip || null,
      dokumen_url: formatDokumenUrl(rawArsip),
    };
  });

  return {
    items: enrichedItems,
    stats,
    meta: {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 15,
      total,
      totalPages: Math.ceil(total / (parseInt(limit, 10) || 15)) || 1,
    },
  };
};

/**
 * Unggah dokumen fisik SK Golongan untuk entri antrean tertentu
 */
export const uploadSkGolongan = async ({ syncId, file, sk, tglSk }) => {
  const syncItem = await repository.findSyncGolonganById(syncId);
  if (!syncItem) {
    throw new AppError("Data antrean sinkronisasi tidak ditemukan", 404);
  }

  if (!file) {
    throw new AppError("File dokumen fisik SK wajib diunggah (format PDF)", 400);
  }

  const parsedTglSk = tglSk ? parseFlexibleDate(tglSk) : null;
  const filePath = file.filename || file.path.replace(/\\/g, "/");

  const updatedSync = await repository.saveUploadSkGolongan({
    syncId,
    rwtGolId: syncItem.rwt_gol_id,
    pegawaiId: syncItem.pegawai_id,
    filePath,
    sk: sk ? String(sk).trim() : null,
    tglSk: parsedTglSk,
  });

  return {
    ...updatedSync,
    dokumen_url: formatDokumenUrl(filePath),
  };
};

/**
 * Hapus entri antrean sinkronisasi (soft delete)
 */
export const deleteSyncGolongan = async (syncId) => {
  const syncItem = await repository.findSyncGolonganById(syncId);
  if (!syncItem) {
    throw new AppError("Data antrean sinkronisasi tidak ditemukan", 404);
  }

  await repository.softDeleteSyncGolongan(syncId);
  return { id: syncId, message: "Antrean upload SK berhasil dihapus" };
};

// =========================================================================
// SINKRONISASI PENDIDIKAN & ANTREAN UPLOAD IJAZAH
// =========================================================================

/**
 * Mapping tebakan ID tingkat pendidikan dari data SIASN
 */
export const deriveSuggestedTktPendId = (tingkatId, tingkatNama, pendNama) => {
  const tId = String(tingkatId || "").trim();
  const tNama = String(tingkatNama || "").toLowerCase().trim();
  const pNama = String(pendNama || "").toLowerCase().trim();

  // 1. Cek kode tingkat pendidikan SIASN eksplisit
  if (tId === "05") return "1"; // SD
  if (tId === "10") return "2"; // SMP
  if (tId === "15" || tId === "17") return "3"; // SMA
  if (tId === "20") return "4"; // D-I
  if (tId === "25") return "5"; // D-II
  if (tId === "30") return "6"; // D-III
  if (tId === "35") return "7"; // D-IV
  if (tId === "40" || tId === "42") return "8"; // S-1 / Profesi
  if (tId === "45") return "9"; // S-2
  if (tId === "50") return "10"; // S-3

  // 2. Cek teks tingkat pendidikan (urutkan dari yang lebih spesifik)
  if (tNama.includes("s-3") || tNama.includes("doktor")) return "10";
  if (tNama.includes("s-2") || tNama.includes("magister")) return "9";
  if (tNama.includes("s-1") || tNama.includes("sarjana") || tNama.includes("profesi")) return "8";
  if (tNama.includes("diploma iv") || tNama.includes("d-iv") || tNama.includes("d4")) return "7";
  if (tNama.includes("diploma iii") || tNama.includes("d-iii") || tNama.includes("d3") || tNama.includes("sarjana muda")) return "6";
  if (tNama.includes("diploma ii") || tNama.includes("d-ii") || tNama.includes("d2")) return "5";
  if (tNama.includes("diploma i") || tNama.includes("d-i") || tNama.includes("d1")) return "4";
  if (tNama.includes("slta") || tNama.includes("sma") || tNama.includes("smk")) return "3";
  if (tNama.includes("sltp") || tNama.includes("smp")) return "2";
  if (tNama.includes("dasar") || tNama.includes("sd")) return "1";

  // 3. Fallback cek dari prefix nama pendidikan
  if (pNama.startsWith("s-3") || pNama.startsWith("s.3") || pNama.startsWith("doktor")) return "10";
  if (pNama.startsWith("s-2") || pNama.startsWith("s.2") || pNama.startsWith("magister")) return "9";
  if (pNama.startsWith("s-1") || pNama.startsWith("s.1") || pNama.startsWith("sarjana")) return "8";
  if (pNama.startsWith("d-iv") || pNama.startsWith("d.iv") || pNama.startsWith("d4") || pNama.startsWith("diploma iv")) return "7";
  if (pNama.startsWith("d-iii") || pNama.startsWith("d.iii") || pNama.startsWith("d3") || pNama.startsWith("diploma iii")) return "6";
  if (pNama.startsWith("d-ii") || pNama.startsWith("d.ii") || pNama.startsWith("d2") || pNama.startsWith("diploma ii")) return "5";
  if (pNama.startsWith("d-i") || pNama.startsWith("d.i") || pNama.startsWith("d1") || pNama.startsWith("diploma i")) return "4";
  if (pNama.startsWith("slta") || pNama.startsWith("sma") || pNama.startsWith("smk")) return "3";
  if (pNama.startsWith("sltp") || pNama.startsWith("smp")) return "2";
  if (pNama.startsWith("sd")) return "1";

  return "8"; // Default S-1
};

/**
 * Pre-check sinkronisasi pendidikan:
 * Mengecek apakah pendidikan dari SIASN sudah terdaftar di master ref_pend atau belum,
 * serta menyiapkan usulan form penambahan referensi jika belum ada.
 */
export const checkEducationSync = async (nip) => {
  if (!nip) {
    throw new AppError("NIP pegawai wajib disertakan", 400);
  }

  const cleanNip = repository.cleanNip(nip);
  const [local, siasn, tktPendList] = await Promise.all([
    repository.findLocalPegawaiByNip(cleanNip),
    repository.findImportPnsByNip(cleanNip),
    repository.findAllRefTktPend(),
  ]);

  if (!local) {
    throw new AppError("Pegawai tidak ditemukan di Database Lokal", 404);
  }
  if (!siasn) {
    throw new AppError("Data pegawai tidak ditemukan di data import SIASN", 404);
  }

  const siasnPendNama = siasn.pendidikan_nama || siasn.tingkat_pendidikan_nama || "";
  const siasnPendKode = siasn.pendidikan_id || "";
  const siasnTktId = siasn.tingkat_pendidikan_id || "";
  const siasnTktNama = siasn.tingkat_pendidikan_nama || "";

  // Cari di master ref_pend
  let matchedRef = null;
  if (siasnPendKode || siasnPendNama) {
    matchedRef = await repository.findRefPendByKodeOrName({
      kode: siasnPendKode,
      name: siasnPendNama,
    });
  }

  // Jika belum ketemu eksak, coba cari kandidat yang mirip
  if (!matchedRef && siasnPendNama) {
    const searchMatches = await repository.searchRefPendList({ search: siasnPendNama.substring(0, 10), limit: 10 });
    if (searchMatches && searchMatches.length > 0) {
      const candidate = searchMatches.find((c) => matchEdu(c.pend, siasnPendNama));
      if (candidate) {
        matchedRef = candidate;
      }
    }
  }

  const suggestedTktPendId = deriveSuggestedTktPendId(siasnTktId, siasnTktNama, siasnPendNama);

  // Ambil nama pendidikan lokal saat ini
  let localPendidikanNama = "-";
  if (local.rwt_pend) {
    if (local.rwt_pend.pend_id) {
      const ref = await repository.findRefPendById(local.rwt_pend.pend_id);
      localPendidikanNama = ref?.pend || local.rwt_pend.jurusan || "-";
    } else {
      localPendidikanNama = local.rwt_pend.jurusan || "-";
    }
  }

  return {
    nip: cleanNip,
    nama: local.ta_orang?.nama || siasn.nama,
    local: {
      pegawai_id: local.id,
      pendidikan: localPendidikanNama,
      thn_lulus: local.rwt_pend?.thnLulus || null,
      nm_sekolah: local.rwt_pend?.nmSekolah || null,
    },
    siasn: {
      pendidikan_nama: siasnPendNama,
      pendidikan_kode: siasnPendKode,
      tingkat_pendidikan_id: siasnTktId,
      tingkat_pendidikan_nama: siasnTktNama,
      tahun_lulus: siasn.tahun_lulus || null,
      nama_sekolah: siasn.nama_sekolah || null,
    },
    matched_ref: matchedRef
      ? {
          id: matchedRef.id,
          pend: matchedRef.pend,
          kode: matchedRef.kode,
          tktpend_id: matchedRef.tktpend_id ? matchedRef.tktpend_id.toString() : null,
          tingkat: matchedRef.ref_tktpend?.tktpend || null,
        }
      : null,
    suggestion: {
      tktpend_id: suggestedTktPendId,
      pend: siasnPendNama.toUpperCase().trim(),
      kode: siasnPendKode || null,
      thn_lulus: siasn.tahun_lulus || null,
      nm_sekolah: siasn.nama_sekolah || null,
    },
    tingkat_list: tktPendList,
  };
};

/**
 * Cari referensi pendidikan untuk autocomplete / dropdown pilihan
 */
export const searchPendidikanReferences = async ({ search = "", limit = 25 }) => {
  return repository.searchRefPendList({ search, limit: parseInt(limit, 10) || 25 });
};

/**
 * Eksekusi sinkronisasi pendidikan:
 * - Jika mode 'new', tambahkan ke ref_pend
 * - Buat rwt_pend baru
 * - Update pointer ta_pegawai.rwtPend_id
 * - Masukkan ke antrean upload Ijazah (ta_sync_pendidikan)
 */
export const syncEducationFromSiasn = async ({
  nip,
  mode,
  selected_pend_id,
  new_ref,
  thnLulus,
  nmSekolah,
  noIjazah,
  tglIjazah,
  userId,
}) => {
  if (!nip) {
    throw new AppError("NIP pegawai wajib disertakan", 400);
  }
  if (!mode || (mode !== "existing" && mode !== "new")) {
    throw new AppError("Mode sinkronisasi harus 'existing' atau 'new'", 400);
  }

  const cleanNip = repository.cleanNip(nip);
  const [local, siasn] = await Promise.all([
    repository.findLocalPegawaiByNip(cleanNip),
    repository.findImportPnsByNip(cleanNip),
  ]);

  if (!local) throw new AppError("Pegawai tidak ditemukan di Database Lokal", 404);
  if (!siasn) throw new AppError("Data pegawai tidak ditemukan di data import SIASN", 404);

  let pendId = null;
  let tktPendId = null;
  let pendNama = "";
  let tktPendNama = "";
  let newRefData = null;

  if (mode === "existing") {
    if (!selected_pend_id) {
      throw new AppError("ID referensi pendidikan yang dipilih wajib disertakan", 400);
    }
    const ref = await repository.findRefPendById(selected_pend_id);
    if (!ref) {
      throw new AppError("Referensi pendidikan yang dipilih tidak ditemukan", 404);
    }
    pendId = ref.id;
    tktPendId = Number(ref.tktpend_id);
    pendNama = ref.pend;
    tktPendNama = ref.ref_tktpend?.tktpend || "";
  } else {
    // mode === 'new'
    if (!new_ref || !new_ref.pend || !new_ref.tktpend_id) {
      throw new AppError("Data referensi baru (Nama pendidikan dan Tingkat pendidikan) wajib diisi", 400);
    }

    const tktList = await repository.findAllRefTktPend();
    const foundTkt = tktList.find((t) => t.id === String(new_ref.tktpend_id));
    tktPendNama = foundTkt?.tktpend || "";

    pendNama = String(new_ref.pend).trim().toUpperCase();
    tktPendId = parseInt(new_ref.tktpend_id, 10);

    // Cek apakah sudah ada di ref_pend untuk menghindari duplikasi
    const existingRef = await repository.findRefPendByKodeOrName({
      kode: new_ref.kode,
      name: pendNama,
    });

    if (existingRef) {
      pendId = existingRef.id;
      tktPendId = Number(existingRef.tktpend_id);
      pendNama = existingRef.pend;
      tktPendNama = existingRef.ref_tktpend?.tktpend || tktPendNama;
    } else {
      newRefData = {
        id: uuidv4(),
        tktpend_id: tktPendId,
        pend: pendNama,
        kode: new_ref.kode ? String(new_ref.kode).trim() : null,
      };
      pendId = newRefData.id;
    }
  }

  // 1. Cek antrean yang sudah ada
  const existingSync = await repository.findExistingSyncPendidikan(local.id, pendId);
  if (existingSync) {
    return {
      status: "skipped",
      message: `Pendidikan (${pendNama}) sudah pernah disinkronkan ke antrean upload Ijazah`,
      sync_id: existingSync.id,
    };
  }

  // 2. Ambil nama pendidikan lokal lama
  let localPendidikanNama = "-";
  if (local.rwt_pend) {
    if (local.rwt_pend.pend_id) {
      const ref = await repository.findRefPendById(local.rwt_pend.pend_id);
      localPendidikanNama = ref?.pend || local.rwt_pend.jurusan || "-";
    } else {
      localPendidikanNama = local.rwt_pend.jurusan || "-";
    }
  }

  const finalThnLulus = thnLulus || siasn.tahun_lulus || null;
  const finalNmSekolah = nmSekolah || siasn.nama_sekolah || null;
  const parsedTglIjazah = tglIjazah ? parseFlexibleDate(tglIjazah) : null;

  // 3. Cek apakah riwayat pendidikan sudah ada
  const existingRwt = await repository.findExistingRiwayatPendidikan(local.id, pendId);
  if (existingRwt) {
    const syncPendData = {
      id: uuidv4(),
      pegawai_id: local.id,
      pend_id: pendId,
      nip: local.nipBaru,
      nama: local.ta_orang?.nama || siasn.nama,
      pend_lama: localPendidikanNama,
      pend_baru: pendNama,
      tkt_pend_baru: tktPendNama,
      thn_lulus: finalThnLulus,
      status_ijazah: "PENDING",
      batch_id: siasn.batch_id || null,
    };

    const newSync = await repository.linkExistingRiwayatPendidikanToSyncQueue({
      pegawaiId: local.id,
      rwtPendId: existingRwt.id,
      syncPendData,
    });

    return {
      status: "linked",
      message: "Riwayat pendidikan ditemukan, antrean upload Ijazah berhasil dibuat",
      sync_id: newSync.id,
      pend_baru: pendNama,
    };
  }

  // 4. Buat riwayat pendidikan baru + update ta_pegawai + antrean
  const rwtPendId = uuidv4();
  const rwtPendData = {
    id: rwtPendId,
    pegawai_id: local.id,
    nipBaru: local.nipBaru,
    tktPend_id: tktPendId,
    pend_id: pendId,
    jurusan: pendNama,
    thnLulus: finalThnLulus,
    nmSekolah: finalNmSekolah,
    noIjazah: noIjazah ? String(noIjazah).trim() : null,
    tglIjazah: parsedTglIjazah,
    pengesahan: "Sinkronisasi SIASN BKN",
    user_created: userId ? parseInt(userId, 10) : null,
  };

  const syncPendData = {
    id: uuidv4(),
    pegawai_id: local.id,
    rwt_pend_id: rwtPendId,
    pend_id: pendId,
    nip: local.nipBaru,
    nama: local.ta_orang?.nama || siasn.nama,
    pend_lama: localPendidikanNama,
    pend_baru: pendNama,
    tkt_pend_baru: tktPendNama,
    thn_lulus: finalThnLulus,
    status_ijazah: "PENDING",
    batch_id: siasn.batch_id || null,
  };

  const result = await repository.executeSyncPendidikanItem({
    pegawaiId: local.id,
    newRefData,
    rwtPendData,
    syncPendData,
  });

  return {
    status: "created",
    message: `Pendidikan (${pendNama}) berhasil disinkronkan dan masuk ke antrean upload Ijazah`,
    sync_id: result.newSync.id,
    rwt_pend_id: result.newRwtPend.id,
    pend_baru: pendNama,
  };
};

/**
 * Ambil daftar antrean upload Ijazah pendidikan
 */
export const getSyncPendidikanQueue = async (query = {}) => {
  const { page = 1, limit = 15, search = "", status_ijazah = "" } = query;

  const [queueResult, stats] = await Promise.all([
    repository.findSyncPendidikanQueue({ page, limit, search, status_ijazah }),
    repository.getSyncPendidikanStats(),
  ]);

  const { items, total } = queueResult;
  const rwtPendIds = items.map((i) => i.rwt_pend_id).filter(Boolean);

  const { arsipList, rwtPendList } = await repository.findArsipAndDetailsForRwtPendIds(rwtPendIds);

  const arsipMap = new Map(arsipList.map((a) => [a.from, a.arsip]));
  const rwtPendMap = new Map(rwtPendList.map((r) => [r.id, r]));

  const enrichedItems = items.map((item) => {
    const rwt = rwtPendMap.get(item.rwt_pend_id);
    const rawArsip = arsipMap.get(item.rwt_pend_id);

    return {
      ...item,
      noIjazah: rwt?.noIjazah || null,
      tglIjazah: rwt?.tglIjazah || null,
      nmSekolah: rwt?.nmSekolah || null,
      arsip: rawArsip || null,
      dokumen_url: formatDokumenUrl(rawArsip),
    };
  });

  return {
    items: enrichedItems,
    stats,
    meta: {
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 15,
      total,
      totalPages: Math.ceil(total / (parseInt(limit, 10) || 15)) || 1,
    },
  };
};

/**
 * Unggah dokumen fisik Ijazah untuk entri antrean tertentu
 */
export const uploadIjazahPendidikan = async ({ syncId, file, noIjazah, tglIjazah, nmSekolah }) => {
  const syncItem = await repository.findSyncPendidikanById(syncId);
  if (!syncItem) {
    throw new AppError("Data antrean sinkronisasi pendidikan tidak ditemukan", 404);
  }

  if (!file) {
    throw new AppError("File dokumen fisik Ijazah wajib diunggah (format PDF)", 400);
  }

  const parsedTglIjazah = tglIjazah ? parseFlexibleDate(tglIjazah) : null;
  const filePath = file.filename || file.path.replace(/\\/g, "/");

  const updatedSync = await repository.saveUploadIjazahPendidikan({
    syncId,
    rwtPendId: syncItem.rwt_pend_id,
    pegawaiId: syncItem.pegawai_id,
    filePath,
    noIjazah: noIjazah ? String(noIjazah).trim() : null,
    tglIjazah: parsedTglIjazah,
    nmSekolah: nmSekolah ? String(nmSekolah).trim() : null,
  });

  return {
    ...updatedSync,
    dokumen_url: formatDokumenUrl(filePath),
  };
};

/**
 * Hapus entri antrean sinkronisasi pendidikan (soft delete)
 */
export const deleteSyncPendidikan = async (syncId) => {
  const syncItem = await repository.findSyncPendidikanById(syncId);
  if (!syncItem) {
    throw new AppError("Data antrean sinkronisasi pendidikan tidak ditemukan", 404);
  }

  await repository.softDeleteSyncPendidikan(syncId);
  return { id: syncId, message: "Antrean upload Ijazah berhasil dihapus" };
};


