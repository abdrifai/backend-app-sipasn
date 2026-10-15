import ExcelJS from "exceljs";
import * as rekapRepository from "./rekapitulasi.repository.js";
import AppError from "../../utils/AppError.js";
import logger from "../../config/logger.js";

/**
 * Helper mapping jenjang jabatan fungsional ke kategori Ahli / Terampil
 */
const classifyJF = (namaJabatan = "", jenjangjab = "", jnsjab = "") => {
  const upperName = (namaJabatan || "").toUpperCase();
  const upperJenjang = (jenjangjab || "").toUpperCase();
  const upperJns = (jnsjab || "").toUpperCase();

  // Cek apakah Ahli
  if (
    upperJenjang.includes("KEAHLIAN") ||
    upperJns.includes("KEAHLIAN") ||
    upperName.includes("AHLI UTAMA") ||
    upperName.includes("AHLI MADYA") ||
    upperName.includes("AHLI MUDA") ||
    upperName.includes("AHLI PERTAMA") ||
    upperName.includes("UTAMA") ||
    upperName.includes("MADYA") ||
    upperName.includes("MUDA") ||
    upperName.includes("PERTAMA")
  ) {
    let jenjang = "Ahli Pertama";
    if (upperName.includes("UTAMA")) jenjang = "Ahli Utama";
    else if (upperName.includes("MADYA")) jenjang = "Ahli Madya";
    else if (upperName.includes("MUDA")) jenjang = "Ahli Muda";
    else if (upperName.includes("PERTAMA")) jenjang = "Ahli Pertama";

    // Bersihkan nama dasar jabatan
    let baseName = namaJabatan
      .replace(/AHLI\s+UTAMA|AHLI\s+MADYA|AHLI\s+MUDA|AHLI\s+PERTAMA/gi, "")
      .replace(/UTAMA|MADYA\s+TINGKAT\s+I|MADYA|MUDA\s+TINGKAT\s+I|MUDA|PERTAMA/gi, "")
      .trim();
    if (!baseName) baseName = namaJabatan;

    return {
      category: "ahli",
      jenjang,
      baseName,
    };
  }

  // Sisanya masuk Terampil
  let jenjang = "Terampil";
  if (upperName.includes("PENYELIA")) jenjang = "Penyelia";
  else if (upperName.includes("MAHIR") || upperName.includes("PELAKSANA LANJUTAN")) jenjang = "Mahir";
  else if (upperName.includes("PEMULA") || upperName.includes("PELAKSANA PEMULA")) jenjang = "Pemula";
  else jenjang = "Terampil";

  let baseName = namaJabatan
    .replace(/PENYELIA|MAHIR|PELAKSANA\s+LANJUTAN|PELAKSANA\s+PEMULA|PEMULA|TERAMPIL/gi, "")
    .trim();
  if (!baseName) baseName = namaJabatan;

  return {
    category: "terampil",
    jenjang,
    baseName,
  };
};

/**
 * 1. Rekap Pegawai Per Jenis Kelamin
 */
export const getRekapGender = async (unorId = null) => {
  const [rows, jkls] = await Promise.all([
    rekapRepository.findRekapGender(unorId),
    rekapRepository.findAllJkl(),
  ]);

  const total = rows.reduce((acc, r) => acc + r.total, 0);

  const data = jkls.map((j, index) => {
    const row = rows.find((r) => String(r.jkl_id) === String(j.id));
    const jumlah = row ? row.total : 0;
    const persentase = total > 0 ? Number(((jumlah / total) * 100).toFixed(2)) : 0;

    return {
      no: index + 1,
      jkl_id: String(j.id),
      jenis_kelamin: j.jkl,
      jumlah,
      persentase,
    };
  });

  return {
    items: data,
    total,
  };
};

/**
 * 2. Rekap Pegawai Per Golongan Ruang dan Jenis Kelamin
 */
export const getRekapGolonganGender = async (unorId = null) => {
  const [rows, gols] = await Promise.all([
    rekapRepository.findRekapGolonganGender(unorId),
    rekapRepository.findAllGol(),
  ]);

  let totalLaki = 0;
  let totalPerempuan = 0;

  const items = gols.map((g, index) => {
    const lRow = rows.find((r) => r.kdGol === g.kdGol && String(r.jkl_id) === "1");
    const pRow = rows.find((r) => r.kdGol === g.kdGol && String(r.jkl_id) === "2");

    const laki = lRow ? lRow.total : 0;
    const perempuan = pRow ? pRow.total : 0;
    const total = laki + perempuan;

    totalLaki += laki;
    totalPerempuan += perempuan;

    return {
      no: index + 1,
      kdGol: g.kdGol,
      golongan: g.gol,
      pangkat: g.pangkat,
      laki_laki: laki,
      perempuan,
      total,
    };
  });

  return {
    items,
    summary: {
      total_laki: totalLaki,
      total_perempuan: totalPerempuan,
      total_keseluruhan: totalLaki + totalPerempuan,
    },
  };
};

/**
 * 3. Rekap Pegawai Per Pendidikan dan Jenis Kelamin
 */
export const getRekapPendidikanGender = async (unorId = null) => {
  const [rows, tkts] = await Promise.all([
    rekapRepository.findRekapPendidikanGender(unorId),
    rekapRepository.findAllTktPend(),
  ]);

  let totalLaki = 0;
  let totalPerempuan = 0;

  const items = tkts.map((t, index) => {
    const lRow = rows.find((r) => Number(r.tktPend_id) === Number(t.id) && String(r.jkl_id) === "1");
    const pRow = rows.find((r) => Number(r.tktPend_id) === Number(t.id) && String(r.jkl_id) === "2");

    const laki = lRow ? lRow.total : 0;
    const perempuan = pRow ? pRow.total : 0;
    const total = laki + perempuan;

    totalLaki += laki;
    totalPerempuan += perempuan;

    return {
      no: index + 1,
      id: Number(t.id),
      tingkat_pendidikan: t.tktpend,
      laki_laki: laki,
      perempuan,
      total,
    };
  });

  return {
    items,
    summary: {
      total_laki: totalLaki,
      total_perempuan: totalPerempuan,
      total_keseluruhan: totalLaki + totalPerempuan,
    },
  };
};

/**
 * 4. Rekap Jabatan Struktural (Eselon) - Formasi, Terisi, Kosong
 */
export const getRekapJabatanStruktural = async (unorId = null) => {
  const [result, eselons] = await Promise.all([
    rekapRepository.findRekapJabatanStruktural(unorId),
    rekapRepository.findAllEselon(),
  ]);

  const targetEselons = eselons.filter(
    (e) => e.eselon && e.eselon !== "NON ESELON" && ["II.a", "II.b", "III.a", "III.b", "IV.a", "IV.b"].includes(e.eselon)
  );

  let totalFormasi = 0;
  let totalTerisi = 0;
  let totalKosong = 0;

  const items = targetEselons.map((e, index) => {
    const terisiRow = result.terisi.find((t) => t.eselon === e.eselon);
    const formasiRow = result.formasi.find((f) => f.eselon === e.eselon);

    const terisi = terisiRow ? terisiRow.terisi : 0;
    let formasi = formasiRow ? formasiRow.formasi : 0;
    if (formasi < terisi) formasi = terisi; // Penyesuaian formasi minimal sama dengan terisi
    const kosong = Math.max(0, formasi - terisi);
    const persenTerisi = formasi > 0 ? Number(((terisi / formasi) * 100).toFixed(2)) : 0;

    totalFormasi += formasi;
    totalTerisi += terisi;
    totalKosong += kosong;

    return {
      no: index + 1,
      eselon_id: e.id,
      eselon: e.eselon,
      formasi,
      terisi,
      kosong,
      persen_terisi: persenTerisi,
    };
  });

  const persenTotal = totalFormasi > 0 ? Number(((totalTerisi / totalFormasi) * 100).toFixed(2)) : 0;

  return {
    items,
    summary: {
      total_formasi: totalFormasi,
      total_terisi: totalTerisi,
      total_kosong: totalKosong,
      persen_terisi: persenTotal,
    },
  };
};

/**
 * 5. Rekap Pejabat Struktural Per Jenis Kelamin (Eselon)
 */
export const getRekapStrukturalGender = async (unorId = null) => {
  const [rows, eselons] = await Promise.all([
    rekapRepository.findRekapStrukturalGender(unorId),
    rekapRepository.findAllEselon(),
  ]);

  const targetEselons = eselons.filter(
    (e) => e.eselon && e.eselon !== "NON ESELON" && ["II.a", "II.b", "III.a", "III.b", "IV.a", "IV.b"].includes(e.eselon)
  );

  let totalLaki = 0;
  let totalPerempuan = 0;

  const items = targetEselons.map((e, index) => {
    const lRow = rows.find((r) => r.eselon === e.eselon && String(r.jkl_id) === "1");
    const pRow = rows.find((r) => r.eselon === e.eselon && String(r.jkl_id) === "2");

    const laki = lRow ? lRow.total : 0;
    const perempuan = pRow ? pRow.total : 0;
    const total = laki + perempuan;

    totalLaki += laki;
    totalPerempuan += perempuan;

    return {
      no: index + 1,
      eselon_id: e.id,
      eselon: e.eselon,
      laki_laki: laki,
      perempuan,
      total,
    };
  });

  return {
    items,
    summary: {
      total_laki: totalLaki,
      total_perempuan: totalPerempuan,
      total_keseluruhan: totalLaki + totalPerempuan,
    },
  };
};

/**
 * 6. Rekap Pendidikan Pejabat Struktural (Eselon)
 */
export const getRekapStrukturalPendidikan = async (unorId = null) => {
  const [rows, eselons, tkts] = await Promise.all([
    rekapRepository.findRekapStrukturalPendidikan(unorId),
    rekapRepository.findAllEselon(),
    rekapRepository.findAllTktPend(),
  ]);

  const targetEselons = eselons.filter(
    (e) => e.eselon && e.eselon !== "NON ESELON" && ["II.a", "II.b", "III.a", "III.b", "IV.a", "IV.b"].includes(e.eselon)
  );

  const tktCols = tkts.map((t) => ({ id: Number(t.id), label: t.tktpend }));

  const summaryPerPendidikan = {};
  for (const t of tktCols) {
    summaryPerPendidikan[t.id] = 0;
  }
  let totalSemua = 0;

  const items = targetEselons.map((e, index) => {
    const rowCounts = {};
    let rowTotal = 0;

    for (const t of tktCols) {
      const match = rows.find(
        (r) => r.eselon === e.eselon && Number(r.tktPend_id) === t.id
      );
      const count = match ? match.total : 0;
      rowCounts[t.id] = count;
      rowTotal += count;
      summaryPerPendidikan[t.id] += count;
    }

    totalSemua += rowTotal;

    return {
      no: index + 1,
      eselon_id: e.id,
      eselon: e.eselon,
      counts: rowCounts,
      total: rowTotal,
    };
  });

  return {
    columns: tktCols,
    items,
    summary: {
      counts: summaryPerPendidikan,
      total_keseluruhan: totalSemua,
    },
  };
};

/**
 * 7. Rekap Pegawai Per Jabatan dan Jenis Kelamin
 */
export const getRekapJabatanGender = async (unorId = null) => {
  const rows = await rekapRepository.findRekapJabatanGender(unorId);

  // Kategori standar:
  // 1. Jabatan Pimpinan Tinggi
  // 2. Jabatan Administrator
  // 3. Jabatan Pengawas
  // 4. Jabatan Fungsional Keahlian
  // 5. Jabatan Fungsional Keterampilan
  // 6. Jabatan Pelaksana
  // 7. Lainnya / Belum Ditentukan

  const groups = [
    { id: 1, name: "Jabatan Pimpinan Tinggi (JPT)", laki: 0, perempuan: 0 },
    { id: 2, name: "Jabatan Administrator", laki: 0, perempuan: 0 },
    { id: 3, name: "Jabatan Pengawas", laki: 0, perempuan: 0 },
    { id: 4, name: "Jabatan Fungsional Keahlian", laki: 0, perempuan: 0 },
    { id: 5, name: "Jabatan Fungsional Keterampilan", laki: 0, perempuan: 0 },
    { id: 6, name: "Jabatan Pelaksana", laki: 0, perempuan: 0 },
    { id: 7, name: "Lainnya / Belum Ditentukan", laki: 0, perempuan: 0 },
  ];

  for (const r of rows) {
    const kat = (r.kategori || "").toUpperCase();
    const jenjang = (r.jenjangjab || "").toUpperCase();
    const jns = (r.jnsjab || "").toUpperCase();
    const eselon = (r.eselon || "").toUpperCase();
    const isLaki = String(r.jkl_id) === "1";
    const count = r.total;

    let targetIdx = 6; // default Lainnya

    if (kat === "STRUKTURAL" || jns.includes("STRUKTURAL") || eselon.includes("II") || eselon.includes("III") || eselon.includes("IV")) {
      if (eselon.startsWith("II") || jenjang.includes("PIMPINAN TINGGI") || jns.includes("PIMPINAN TINGGI")) {
        targetIdx = 0;
      } else if (eselon.startsWith("III") || jenjang.includes("ADMINISTRATOR") || jenjang.includes("ADMINISTRASI")) {
        targetIdx = 1;
      } else if (eselon.startsWith("IV") || jenjang.includes("PENGAWAS")) {
        targetIdx = 2;
      } else {
        targetIdx = 0;
      }
    } else if (kat === "FUNGSIONAL" || jns.includes("FUNGSIONAL")) {
      if (jenjang.includes("KEAHLIAN") || jns.includes("KEAHLIAN")) {
        targetIdx = 3;
      } else if (jenjang.includes("KETERAMPILAN") || jns.includes("KETERAMPILAN")) {
        targetIdx = 4;
      } else {
        // default jika umum fungsional
        targetIdx = 3;
      }
    } else if (kat === "PELAKSANA" || jenjang.includes("PELAKSANA") || jns.includes("PELAKSANA")) {
      targetIdx = 5;
    }

    if (isLaki) {
      groups[targetIdx].laki += count;
    } else {
      groups[targetIdx].perempuan += count;
    }
  }

  let totalLaki = 0;
  let totalPerempuan = 0;

  const items = groups.map((g, index) => {
    totalLaki += g.laki;
    totalPerempuan += g.perempuan;
    return {
      no: index + 1,
      jenis_jabatan: g.name,
      laki_laki: g.laki,
      perempuan: g.perempuan,
      total: g.laki + g.perempuan,
    };
  });

  return {
    items,
    summary: {
      total_laki: totalLaki,
      total_perempuan: totalPerempuan,
      total_keseluruhan: totalLaki + totalPerempuan,
    },
  };
};

/**
 * 8. Rekap Jabatan Fungsional (Kelompok Jabatan & Kategori Jenjang per Gender)
 */
export const getRekapJabatanFungsional = async (unorId = null) => {
  const rows = await rekapRepository.findRekapJabatanFungsional(unorId);

  const items = rows.map((r, idx) => ({
    no: idx + 1,
    kelompok_jabatan: r.kelompok_jabatan,
    ahli: {
      laki: Number(r.ahli_l || 0),
      perempuan: Number(r.ahli_p || 0),
      total: Number(r.ahli_total || 0),
    },
    terampil: {
      laki: Number(r.terampil_l || 0),
      perempuan: Number(r.terampil_p || 0),
      total: Number(r.terampil_total || 0),
    },
    total: {
      laki: Number(r.total_l || 0),
      perempuan: Number(r.total_p || 0),
      semua: Number(r.total_semua || 0),
    },
  }));

  const summary = items.reduce(
    (acc, cur) => ({
      ahli_l: acc.ahli_l + cur.ahli.laki,
      ahli_p: acc.ahli_p + cur.ahli.perempuan,
      ahli_total: acc.ahli_total + cur.ahli.total,
      terampil_l: acc.terampil_l + cur.terampil.laki,
      terampil_p: acc.terampil_p + cur.terampil.perempuan,
      terampil_total: acc.terampil_total + cur.terampil.total,
      total_l: acc.total_l + cur.total.laki,
      total_p: acc.total_p + cur.total.perempuan,
      total_semua: acc.total_semua + cur.total.semua,
    }),
    {
      ahli_l: 0,
      ahli_p: 0,
      ahli_total: 0,
      terampil_l: 0,
      terampil_p: 0,
      terampil_total: 0,
      total_l: 0,
      total_p: 0,
      total_semua: 0,
    }
  );

  return {
    items,
    summary,
  };
};

/**
 * 9. Gabungan Semua Rekapitulasi (Endpoint /all)
 */
export const getAllRekapitulasi = async (unorId = null, period = null) => {
  // Jika ada parameter period snapshot yang diminta
  if (period) {
    const snapshot = await rekapRepository.findSnapshot(period, "all", unorId);
    if (snapshot && snapshot.data) {
      return {
        ...snapshot.data,
        is_snapshot: true,
        snapshot_period: period,
      };
    }
  }

  // Ambil data real-time
  const [
    totalPegawai,
    unorInfo,
    rekapGender,
    rekapGolonganGender,
    rekapPendidikanGender,
    rekapJabatanStruktural,
    rekapStrukturalGender,
    rekapStrukturalPendidikan,
    rekapJabatanGender,
    rekapJabatanFungsional,
    availablePeriods,
  ] = await Promise.all([
    rekapRepository.countActivePegawai(unorId),
    rekapRepository.findUnorById(unorId),
    getRekapGender(unorId),
    getRekapGolonganGender(unorId),
    getRekapPendidikanGender(unorId),
    getRekapJabatanStruktural(unorId),
    getRekapStrukturalGender(unorId),
    getRekapStrukturalPendidikan(unorId),
    getRekapJabatanGender(unorId),
    getRekapJabatanFungsional(unorId),
    rekapRepository.listAvailableSnapshots(),
  ]);

  return {
    total_pegawai: totalPegawai,
    filter: {
      unor_id: unorId,
      unor_nama: unorInfo ? unorInfo.nmUnor : "Semua Unit Kerja",
      period: period || null,
    },
    rekap_gender: rekapGender,
    rekap_golongan_gender: rekapGolonganGender,
    rekap_pendidikan_gender: rekapPendidikanGender,
    rekap_jabatan_struktural: rekapJabatanStruktural,
    rekap_struktural_gender: rekapStrukturalGender,
    rekap_struktural_pendidikan: rekapStrukturalPendidikan,
    rekap_jabatan_gender: rekapJabatanGender,
    rekap_jabatan_fungsional: rekapJabatanFungsional,
    available_periods: availablePeriods,
    generated_at: new Date().toISOString(),
  };
};

/**
 * Simpan snapshot rekapitulasi bulanan
 */
export const createSnapshot = async (period, unorId = null) => {
  const currentData = await getAllRekapitulasi(unorId, null);
  const saved = await rekapRepository.saveSnapshot(period, "all", unorId, currentData);
  return saved;
};

/**
 * Generate Laporan Excel Rekapitulasi menggunakan ExcelJS
 */
export const generateExcel = async (unorId = null, type = "all") => {
  const data = await getAllRekapitulasi(unorId);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIPASN Kabupaten Tojo Una-Una";
  workbook.created = new Date();

  const applyHeaderStyle = (cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E40AF" }, // Navy / Blue-800
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  };

  const applyDataRowStyle = (row, isTotal = false) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (isTotal) {
        cell.font = { bold: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" }, // Slate-100
        };
      }
    });
  };

  // Sheet 1: Rekap Jenis Kelamin
  const sheet1 = workbook.addWorksheet("1. Jenis Kelamin");
  sheet1.addRow([`REKAPITULASI PEGAWAI PER JENIS KELAMIN - ${data.filter.unor_nama}`]);
  sheet1.addRow([]);
  sheet1.addRow(["No", "Jenis Kelamin", "Jumlah Pegawai", "Persentase (%)"]);
  sheet1.getRow(3).eachCell(applyHeaderStyle);

  data.rekap_gender.items.forEach((item) => {
    const row = sheet1.addRow([item.no, item.jenis_kelamin, item.jumlah, `${item.persentase}%`]);
    applyDataRowStyle(row);
  });
  const row1Total = sheet1.addRow(["", "Total", data.rekap_gender.total, "100%"]);
  applyDataRowStyle(row1Total, true);
  sheet1.columns = [{ width: 8 }, { width: 25 }, { width: 18 }, { width: 18 }];

  // Sheet 2: Rekap Golongan & Gender
  const sheet2 = workbook.addWorksheet("2. Golongan & Gender");
  sheet2.addRow([`REKAPITULASI PEGAWAI PER GOLONGAN DAN JENIS KELAMIN - ${data.filter.unor_nama}`]);
  sheet2.addRow([]);
  sheet2.addRow(["No", "Golongan / Ruang", "Pangkat", "Laki-Laki", "Perempuan", "Total"]);
  sheet2.getRow(3).eachCell(applyHeaderStyle);

  data.rekap_golongan_gender.items.forEach((item) => {
    const row = sheet2.addRow([item.no, item.golongan, item.pangkat, item.laki_laki, item.perempuan, item.total]);
    applyDataRowStyle(row);
  });
  const row2Total = sheet2.addRow([
    "",
    "Total",
    "",
    data.rekap_golongan_gender.summary.total_laki,
    data.rekap_golongan_gender.summary.total_perempuan,
    data.rekap_golongan_gender.summary.total_keseluruhan,
  ]);
  applyDataRowStyle(row2Total, true);
  sheet2.columns = [{ width: 8 }, { width: 18 }, { width: 25 }, { width: 14 }, { width: 14 }, { width: 14 }];

  // Sheet 3: Rekap Pendidikan & Gender
  const sheet3 = workbook.addWorksheet("3. Pendidikan & Gender");
  sheet3.addRow([`REKAPITULASI PEGAWAI PER PENDIDIKAN DAN JENIS KELAMIN - ${data.filter.unor_nama}`]);
  sheet3.addRow([]);
  sheet3.addRow(["No", "Tingkat Pendidikan", "Laki-Laki", "Perempuan", "Total"]);
  sheet3.getRow(3).eachCell(applyHeaderStyle);

  data.rekap_pendidikan_gender.items.forEach((item) => {
    const row = sheet3.addRow([item.no, item.tingkat_pendidikan, item.laki_laki, item.perempuan, item.total]);
    applyDataRowStyle(row);
  });
  const row3Total = sheet3.addRow([
    "",
    "Total",
    data.rekap_pendidikan_gender.summary.total_laki,
    data.rekap_pendidikan_gender.summary.total_perempuan,
    data.rekap_pendidikan_gender.summary.total_keseluruhan,
  ]);
  applyDataRowStyle(row3Total, true);
  sheet3.columns = [{ width: 8 }, { width: 25 }, { width: 14 }, { width: 14 }, { width: 14 }];

  // Sheet 4: Rekap Jabatan Struktural (Eselon)
  const sheet4 = workbook.addWorksheet("4. Formasi Eselon");
  sheet4.addRow([`REKAPITULASI JABATAN STRUKTURAL (ESELON) - ${data.filter.unor_nama}`]);
  sheet4.addRow([]);
  sheet4.addRow(["No", "Eselon", "Formasi", "Terisi", "Kosong", "% Terisi"]);
  sheet4.getRow(3).eachCell(applyHeaderStyle);

  data.rekap_jabatan_struktural.items.forEach((item) => {
    const row = sheet4.addRow([item.no, item.eselon, item.formasi, item.terisi, item.kosong, `${item.persen_terisi}%`]);
    applyDataRowStyle(row);
  });
  const row4Total = sheet4.addRow([
    "",
    "Total",
    data.rekap_jabatan_struktural.summary.total_formasi,
    data.rekap_jabatan_struktural.summary.total_terisi,
    data.rekap_jabatan_struktural.summary.total_kosong,
    `${data.rekap_jabatan_struktural.summary.persen_terisi}%`,
  ]);
  applyDataRowStyle(row4Total, true);
  sheet4.columns = [{ width: 8 }, { width: 18 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }];

  // Sheet 5: Rekap Pejabat Struktural & Gender
  const sheet5 = workbook.addWorksheet("5. Pejabat Eselon & Gender");
  sheet5.addRow([`REKAPITULASI PEJABAT STRUKTURAL PER JENIS KELAMIN - ${data.filter.unor_nama}`]);
  sheet5.addRow([]);
  sheet5.addRow(["No", "Eselon", "Laki-Laki", "Perempuan", "Total"]);
  sheet5.getRow(3).eachCell(applyHeaderStyle);

  data.rekap_struktural_gender.items.forEach((item) => {
    const row = sheet5.addRow([item.no, item.eselon, item.laki_laki, item.perempuan, item.total]);
    applyDataRowStyle(row);
  });
  const row5Total = sheet5.addRow([
    "",
    "Total",
    data.rekap_struktural_gender.summary.total_laki,
    data.rekap_struktural_gender.summary.total_perempuan,
    data.rekap_struktural_gender.summary.total_keseluruhan,
  ]);
  applyDataRowStyle(row5Total, true);
  sheet5.columns = [{ width: 8 }, { width: 18 }, { width: 14 }, { width: 14 }, { width: 14 }];

  // Sheet 6: Rekap Pendidikan Pejabat Struktural
  const sheet6 = workbook.addWorksheet("6. Pendidikan Pejabat Eselon");
  sheet6.addRow([`REKAPITULASI PENDIDIKAN PEJABAT STRUKTURAL - ${data.filter.unor_nama}`]);
  sheet6.addRow([]);
  const pColHeaders = ["No", "Eselon", ...data.rekap_struktural_pendidikan.columns.map((c) => c.label), "Total"];
  sheet6.addRow(pColHeaders);
  sheet6.getRow(3).eachCell(applyHeaderStyle);

  data.rekap_struktural_pendidikan.items.forEach((item) => {
    const rowVals = [
      item.no,
      item.eselon,
      ...data.rekap_struktural_pendidikan.columns.map((c) => item.counts[c.id] || 0),
      item.total,
    ];
    const row = sheet6.addRow(rowVals);
    applyDataRowStyle(row);
  });
  const row6Total = sheet6.addRow([
    "",
    "Total",
    ...data.rekap_struktural_pendidikan.columns.map(
      (c) => data.rekap_struktural_pendidikan.summary.counts[c.id] || 0
    ),
    data.rekap_struktural_pendidikan.summary.total_keseluruhan,
  ]);
  applyDataRowStyle(row6Total, true);
  sheet6.columns = [{ width: 8 }, { width: 16 }, ...data.rekap_struktural_pendidikan.columns.map(() => ({ width: 12 })), { width: 14 }];

  // Sheet 7: Rekap Jabatan & Gender
  const sheet7 = workbook.addWorksheet("7. Jenis Jabatan & Gender");
  sheet7.addRow([`REKAPITULASI PEGAWAI PER JENIS JABATAN DAN JENIS KELAMIN - ${data.filter.unor_nama}`]);
  sheet7.addRow([]);
  sheet7.addRow(["No", "Jenis Jabatan", "Laki-Laki", "Perempuan", "Total"]);
  sheet7.getRow(3).eachCell(applyHeaderStyle);

  data.rekap_jabatan_gender.items.forEach((item) => {
    const row = sheet7.addRow([item.no, item.jenis_jabatan, item.laki_laki, item.perempuan, item.total]);
    applyDataRowStyle(row);
  });
  const row7Total = sheet7.addRow([
    "",
    "Total",
    data.rekap_jabatan_gender.summary.total_laki,
    data.rekap_jabatan_gender.summary.total_perempuan,
    data.rekap_jabatan_gender.summary.total_keseluruhan,
  ]);
  applyDataRowStyle(row7Total, true);
  sheet7.columns = [{ width: 8 }, { width: 35 }, { width: 14 }, { width: 14 }, { width: 14 }];

  // Sheet 8: Rekap Jabatan Fungsional (Kelompok Jabatan & Jenjang per Gender)
  const sheet8 = workbook.addWorksheet("8. Jabatan Fungsional");
  sheet8.addRow([`REKAPITULASI JABATAN FUNGSIONAL - ${data.filter.unor_nama}`]);
  sheet8.addRow([]);
  sheet8.addRow(["No", "Kelompok Jabatan", "Jenjang Ahli", "", "", "Jenjang Terampil", "", "", "Total Pegawai", "", ""]);
  sheet8.addRow(["", "", "L", "P", "Jml", "L", "P", "Jml", "L", "P", "Total"]);

  sheet8.mergeCells("A3:A4");
  sheet8.mergeCells("B3:B4");
  sheet8.mergeCells("C3:E3");
  sheet8.mergeCells("F3:H3");
  sheet8.mergeCells("I3:K3");

  sheet8.getRow(3).eachCell(applyHeaderStyle);
  sheet8.getRow(4).eachCell(applyHeaderStyle);

  data.rekap_jabatan_fungsional.items.forEach((item) => {
    const row = sheet8.addRow([
      item.no,
      item.kelompok_jabatan,
      item.ahli.laki,
      item.ahli.perempuan,
      item.ahli.total,
      item.terampil.laki,
      item.terampil.perempuan,
      item.terampil.total,
      item.total.laki,
      item.total.perempuan,
      item.total.semua,
    ]);
    applyDataRowStyle(row);
  });

  const sum8 = data.rekap_jabatan_fungsional.summary;
  const row8Total = sheet8.addRow([
    "",
    "TOTAL KESELURUHAN",
    sum8.ahli_l,
    sum8.ahli_p,
    sum8.ahli_total,
    sum8.terampil_l,
    sum8.terampil_p,
    sum8.terampil_total,
    sum8.total_l,
    sum8.total_p,
    sum8.total_semua,
  ]);
  applyDataRowStyle(row8Total, true);
  sheet8.columns = [
    { width: 8 },
    { width: 35 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
  ];

  return workbook.xlsx.writeBuffer();
};
