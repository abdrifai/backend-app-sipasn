import { parse } from "csv-parse/sync";
import crypto from "crypto";
import * as importPnsRepository from "./import-pns.repository.js";
import AppError from "../../utils/AppError.js";
import logger from "../../config/logger.js";

const HEADER_MAP = {
  "pns id": "pns_id",
  "pns_id": "pns_id",
  "nip baru": "nip_baru",
  "nip_baru": "nip_baru",
  "nip lama": "nip_lama",
  "nip_lama": "nip_lama",
  "nama": "nama",
  "gelar depan": "gelar_depan",
  "gelar_depan": "gelar_depan",
  "gelar belakang": "gelar_belakang",
  "gelar_belakang": "gelar_belakang",
  "tempat lahir": "tempat_lahir",
  "tempat_lahir": "tempat_lahir",
  "tempat lahir nama": "tempat_lahir",
  "tempat_lahir_nama": "tempat_lahir",
  "tempat lahir id": "tempat_lahir_id",
  "tempat_lahir_id": "tempat_lahir_id",
  "tanggal lahir": "tanggal_lahir",
  "tanggal_lahir": "tanggal_lahir",
  "jenis kelamin": "jenis_kelamin",
  "jenis_kelamin": "jenis_kelamin",
  "agama id": "agama_id",
  "agama_id": "agama_id",
  "agama nama": "agama_nama",
  "agama_nama": "agama_nama",
  "jenis kawin id": "jenis_kawin_id",
  "jenis_kawin_id": "jenis_kawin_id",
  "jenis kawin nama": "jenis_kawin_nama",
  "jenis_kawin_nama": "jenis_kawin_nama",
  "nik": "nik",
  "nomor hp": "nomor_hp",
  "nomor_hp": "nomor_hp",
  "no hp": "nomor_hp",
  "email": "email",
  "email gov": "email_gov",
  "email_gov": "email_gov",
  "alamat": "alamat",
  "npwp nomor": "npwp_nomor",
  "npwp_nomor": "npwp_nomor",
  "npwp": "npwp_nomor",
  "bpjs": "bpjs",
  "jenis pegawai id": "jenis_pegawai_id",
  "jenis_pegawai_id": "jenis_pegawai_id",
  "jenis pegawai nama": "jenis_pegawai_nama",
  "jenis_pegawai_nama": "jenis_pegawai_nama",
  "kedudukan pns id": "kedudukan_pns_id",
  "kedudukan_pns_id": "kedudukan_pns_id",
  "kedudukan pns nama": "kedudukan_pns_nama",
  "kedudukan_pns_nama": "kedudukan_pns_nama",
  "status cpns pns": "status_cpns_pns",
  "status_cpns_pns": "status_cpns_pns",
  "status cpns": "status_cpns_pns",
  "status pns": "status_cpns_pns",
  "kartu asn virtual": "kartu_asn_virtual",
  "kartu_asn_virtual": "kartu_asn_virtual",
  "nomor sk cpns": "nomor_sk_cpns",
  "nomor_sk_cpns": "nomor_sk_cpns",
  "tanggal sk cpns": "tanggal_sk_cpns",
  "tanggal_sk_cpns": "tanggal_sk_cpns",
  "tmt cpns": "tmt_cpns",
  "tmt_cpns": "tmt_cpns",
  "nomor sk pns": "nomor_sk_pns",
  "nomor_sk_pns": "nomor_sk_pns",
  "tanggal sk pns": "tanggal_sk_pns",
  "tanggal_sk_pns": "tanggal_sk_pns",
  "tmt pns": "tmt_pns",
  "tmt_pns": "tmt_pns",
  "gol awal id": "gol_awal_id",
  "gol_awal_id": "gol_awal_id",
  "gol awal nama": "gol_awal_nama",
  "gol_awal_nama": "gol_awal_nama",
  "gol akhir id": "gol_akhir_id",
  "gol_akhir_id": "gol_akhir_id",
  "gol akhir nama": "gol_akhir_nama",
  "gol_akhir_nama": "gol_akhir_nama",
  "tmt golongan": "tmt_golongan",
  "tmt_golongan": "tmt_golongan",
  "mk tahun": "mk_tahun",
  "mk_tahun": "mk_tahun",
  "mk bulan": "mk_bulan",
  "mk_bulan": "mk_bulan",
  "jenis jabatan id": "jenis_jabatan_id",
  "jenis_jabatan_id": "jenis_jabatan_id",
  "jenis jabatan nama": "jenis_jabatan_nama",
  "jenis_jabatan_nama": "jenis_jabatan_nama",
  "jabatan id": "jabatan_id",
  "jabatan_id": "jabatan_id",
  "jabatan nama": "jabatan_nama",
  "jabatan_nama": "jabatan_nama",
  "tmt jabatan": "tmt_jabatan",
  "tmt_jabatan": "tmt_jabatan",
  "tingkat pendidikan id": "tingkat_pendidikan_id",
  "tingkat_pendidikan_id": "tingkat_pendidikan_id",
  "tingkat pendidikan nama": "tingkat_pendidikan_nama",
  "tingkat_pendidikan_nama": "tingkat_pendidikan_nama",
  "pendidikan id": "pendidikan_id",
  "pendidikan_id": "pendidikan_id",
  "pendidikan nama": "pendidikan_nama",
  "pendidikan_nama": "pendidikan_nama",
  "tahun lulus": "tahun_lulus",
  "tahun_lulus": "tahun_lulus",
  "kpkn id": "kpkn_id",
  "kpkn_id": "kpkn_id",
  "kpkn nama": "kpkn_nama",
  "kpkn_nama": "kpkn_nama",
  "lokasi kerja id": "lokasi_kerja_id",
  "lokasi_kerja_id": "lokasi_kerja_id",
  "lokasi kerja nama": "lokasi_kerja_nama",
  "lokasi_kerja_nama": "lokasi_kerja_nama",
  "unor id": "unor_id",
  "unor_id": "unor_id",
  "unor nama": "unor_nama",
  "unor_nama": "unor_nama",
  "instansi induk id": "instansi_induk_id",
  "instansi_induk_id": "instansi_induk_id",
  "instansi induk nama": "instansi_induk_nama",
  "instansi_induk_nama": "instansi_induk_nama",
  "instansi kerja id": "instansi_kerja_id",
  "instansi_kerja_id": "instansi_kerja_id",
  "instansi kerja nama": "instansi_kerja_nama",
  "instansi_kerja_nama": "instansi_kerja_nama",
  "satuan kerja induk id": "satuan_kerja_induk_id",
  "satuan_kerja_induk_id": "satuan_kerja_induk_id",
  "satuan kerja induk nama": "satuan_kerja_induk_nama",
  "satuan_kerja_induk_nama": "satuan_kerja_induk_nama",
  "satuan kerja kerja id": "satuan_kerja_kerja_id",
  "satuan_kerja_kerja_id": "satuan_kerja_kerja_id",
  "satuan kerja kerja nama": "satuan_kerja_kerja_nama",
  "satuan_kerja_kerja_nama": "satuan_kerja_kerja_nama",
  "is valid nik": "is_valid_nik",
  "is_valid_nik": "is_valid_nik",
  "nama sekolah": "nama_sekolah",
  "nama_sekolah": "nama_sekolah",
  "flag ikd": "flag_ikd",
  "flag_ikd": "flag_ikd",
  "created at": "csv_created_at",
  "csv_created_at": "csv_created_at",
  "updated at": "csv_updated_at",
  "csv_updated_at": "csv_updated_at",
  "eselon id": "eselon_id",
  "eselon_id": "eselon_id",
  "eselon nama": "eselon_nama",
  "eselon_nama": "eselon_nama",
};

/**
 * Mendeteksi otomatis delimiter CSV (pipa |, titik koma ;, koma ,, atau tab \t)
 */
const detectDelimiter = (contentStr) => {
  const firstLine = contentStr.split(/\r?\n/).find((line) => line.trim().length > 0) || "";
  const candidates = ["|", ";", ",", "\t"];
  let bestDelimiter = ",";
  let maxCount = 0;

  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = d;
    }
  }

  return bestDelimiter;
};

export const processCsvImport = async (fileBuffer, fileName) => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new AppError("File CSV kosong atau tidak valid", 400);
  }

  const contentStr = fileBuffer.toString("utf-8");
  const delimiter = detectDelimiter(contentStr);

  logger.info("Memproses import CSV dengan delimiter terdeteksi:", {
    fileName,
    detectedDelimiter: delimiter === "\t" ? "\\t" : delimiter,
  });

  let records = [];
  try {
    records = parse(fileBuffer, {
      delimiter,
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_column_count: true,
      relax_quotes: true,
    });
  } catch (err) {
    // Fallback: coba parse dengan quote dinonaktifkan jika ada ketidakkonsistenan quote karakter
    try {
      records = parse(fileBuffer, {
        delimiter,
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true,
        relax_quotes: true,
        quote: null,
      });
    } catch (fallbackErr) {
      logger.error("Gagal parsing CSV:", { error: fallbackErr.stack });
      throw new AppError(`Format CSV tidak valid: ${fallbackErr.message}`, 400);
    }
  }


  if (records.length === 0) {
    throw new AppError("Tidak ada baris data yang ditemukan dalam file CSV", 400);
  }

  const batchId = crypto.randomUUID();
  const normalizedRecords = [];

  for (const row of records) {
    const record = {
      id: crypto.randomUUID(),
      batch_id: batchId,
      file_name: fileName || "import_pns.csv",
      is_deleted: false,
    };

    for (const [key, rawVal] of Object.entries(row)) {
      const cleanKey = key.trim().toLowerCase().replace(/\s+/g, " ");
      const mappedField = HEADER_MAP[cleanKey] || HEADER_MAP[cleanKey.replace(/_/g, " ")];

      if (mappedField) {
        const val = typeof rawVal === "string" ? rawVal.trim() : rawVal;
        record[mappedField] = val !== "" && val !== null && val !== undefined ? String(val) : null;
      }
    }

    // Pastikan ada setidaknya salah satu identifier (nip_baru, nama, nik, pns_id)
    if (record.nip_baru || record.nama || record.nik || record.pns_id) {
      normalizedRecords.push(record);
    }
  }

  if (normalizedRecords.length === 0) {
    throw new AppError("Tidak ada data valid yang dapat diimport dari CSV", 400);
  }

  // Chunk insert per 500 rows for performance
  const chunkSize = 500;
  let insertedCount = 0;

  for (let i = 0; i < normalizedRecords.length; i += chunkSize) {
    const chunk = normalizedRecords.slice(i, i + chunkSize);
    const result = await importPnsRepository.createMany(chunk);
    insertedCount += result.count;
  }

  logger.info("Import CSV PNS berhasil diproses", {
    batchId,
    fileName,
    totalRows: normalizedRecords.length,
    insertedCount,
  });

  return {
    batchId,
    fileName,
    totalRows: normalizedRecords.length,
    insertedCount,
  };
};

export const getImportedPnsList = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const search = query.search || "";
  const batchId = query.batch_id || "";
  const statusCpnsPns = query.status_cpns_pns || "";

  return importPnsRepository.findAll({
    page,
    limit,
    search,
    batch_id: batchId,
    status_cpns_pns: statusCpnsPns,
  });
};

export const getImportedPnsById = async (id) => {
  const record = await importPnsRepository.findById(id);
  if (!record) {
    throw new AppError("Data import PNS tidak ditemukan", 404);
  }
  return record;
};

export const getImportSummary = async () => {
  return importPnsRepository.getSummary();
};

export const getRekapJabatan = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const search = query.search || "";
  const batchId = query.batch_id || "";
  const jenisJabatanNama = query.jenis_jabatan_nama || "";

  return importPnsRepository.getRekapJabatan({
    page,
    limit,
    search,
    batch_id: batchId,
    jenis_jabatan_nama: jenisJabatanNama,
  });
};


export const getRekapJenisJabatan = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const search = query.search || "";
  const batchId = query.batch_id || "";

  return importPnsRepository.getRekapJenisJabatan({
    page,
    limit,
    search,
    batch_id: batchId,
  });
};



export const deleteBatch = async (batchId) => {
  if (!batchId) {
    throw new AppError("Batch ID wajib disertakan", 400);
  }
  const result = await importPnsRepository.softDeleteBatch(batchId);
  return {
    batchId,
    deletedCount: result.count,
  };
};

export const deleteSingleRecord = async (id) => {
  const record = await importPnsRepository.findById(id);
  if (!record) {
    throw new AppError("Data tidak ditemukan", 404);
  }
  await importPnsRepository.softDeleteById(id);
  return { id };
};

export const getCsvTemplate = () => {
  const headers = [
    "PNS ID",
    "NIP BARU",
    "NIP LAMA",
    "NAMA",
    "GELAR DEPAN",
    "GELAR BELAKANG",
    "TEMPAT LAHIR",
    "TEMPAT LAHIR ID",
    "TANGGAL LAHIR",
    "JENIS KELAMIN",
    "AGAMA ID",
    "AGAMA NAMA",
    "JENIS KAWIN ID",
    "JENIS KAWIN NAMA",
    "NIK",
    "NOMOR HP",
    "EMAIL",
    "EMAIL GOV",
    "ALAMAT",
    "NPWP NOMOR",
    "BPJS",
    "JENIS PEGAWAI ID",
    "JENIS PEGAWAI NAMA",
    "KEDUDUKAN PNS ID",
    "KEDUDUKAN PNS NAMA",
    "STATUS CPNS PNS",
    "KARTU ASN VIRTUAL",
    "NOMOR SK CPNS",
    "TANGGAL SK CPNS",
    "TMT CPNS",
    "NOMOR SK PNS",
    "TANGGAL SK PNS",
    "TMT PNS",
    "GOL AWAL ID",
    "GOL AWAL NAMA",
    "GOL AKHIR ID",
    "GOL AKHIR NAMA",
    "TMT GOLONGAN",
    "MK TAHUN",
    "MK BULAN",
    "JENIS JABATAN ID",
    "JENIS JABATAN NAMA",
    "JABATAN ID",
    "JABATAN NAMA",
    "TMT JABATAN",
    "TINGKAT PENDIDIKAN ID",
    "TINGKAT PENDIDIKAN NAMA",
    "PENDIDIKAN ID",
    "PENDIDIKAN NAMA",
    "TAHUN LULUS",
    "KPKN ID",
    "KPKN NAMA",
    "LOKASI KERJA ID",
    "LOKASI KERJA NAMA",
    "UNOR ID",
    "UNOR NAMA",
    "INSTANSI INDUK ID",
    "INSTANSI INDUK NAMA",
    "INSTANSI KERJA ID",
    "INSTANSI KERJA NAMA",
    "SATUAN KERJA INDUK ID",
    "SATUAN KERJA INDUK NAMA",
    "SATUAN KERJA KERJA ID",
    "SATUAN KERJA KERJA NAMA",
    "IS VALID NIK",
    "NAMA SEKOLAH",
    "FLAG IKD",
    "CREATED AT",
    "UPDATED AT",
    "ESELON ID",
    "ESELON NAMA"
  ];

  const sampleRow = [
    "A84B3041F93D5A56E040640A04026364",
    "198501012010011001",
    "",
    "AHMAD FAUZI",
    "Dr.",
    "S.Kom., M.Kom.",
    "JAKARTA",
    "3171",
    "1985-01-01",
    "M",
    "1",
    "Islam",
    "1",
    "Menikah",
    "3171010101850001",
    "081234567890",
    "ahmad.fauzi@example.com",
    "ahmad.fauzi@go.id",
    "Jl. Merdeka No. 123",
    "01.234.567.8-012.000",
    "00012345678",
    "1",
    "PNS Pusat",
    "1",
    "Aktif",
    "PNS",
    "Ya",
    "800/123/2010",
    "2010-01-01",
    "2010-01-01",
    "800/456/2011",
    "2011-01-01",
    "2011-01-01",
    "31",
    "III/a",
    "33",
    "III/c",
    "2020-04-01",
    "10",
    "03",
    "2",
    "Jabatan Fungsional",
    "JF001",
    "Pranata Komputer Ahli Muda",
    "2020-04-01",
    "50",
    "S-2",
    "5001",
    "Magister Ilmu Komputer",
    "2018",
    "01",
    "KPKN Jakarta I",
    "0101",
    "Kantor Pusat",
    "UNOR001",
    "Direktorat Sistem Informasi",
    "INS001",
    "Badan Kepegawaian Negara",
    "INS001",
    "Badan Kepegawaian Negara",
    "SAT001",
    "Sekretariat Utama",
    "SAT001",
    "Sekretariat Utama",
    "1",
    "Universitas Indonesia",
    "1",
    "2026-01-01 10:00:00",
    "2026-09-01 12:00:00",
    "31",
    "Eselon III.a"
  ];

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return "";
    const s = String(str);
    if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
      return `"${s.replace(/"/g, "\"\"")}"`;
    }
    return s;
  };

  const headerLine = headers.map(escapeCsv).join(",");
  const sampleLine = sampleRow.map(escapeCsv).join(",");

  return `${headerLine}\n${sampleLine}\n`;
};
