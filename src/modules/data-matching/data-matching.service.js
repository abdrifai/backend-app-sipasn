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
