import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as rekapService from "./rekapitulasi.service.js";

/**
 * GET /api/rekapitulasi/all
 * Ambil semua 8 data rekapitulasi sekaligus
 */
export const getAll = asyncHandler(async (req, res) => {
  const { unor_id, period } = req.query;
  const result = await rekapService.getAllRekapitulasi(unor_id, period);
  sendSuccess(res, 200, "Rekapitulasi pegawai berhasil diambil", result);
});

/**
 * GET /api/rekapitulasi/gender
 * Rekap #1: Per Jenis Kelamin
 */
export const getGender = asyncHandler(async (req, res) => {
  const { unor_id } = req.query;
  const result = await rekapService.getRekapGender(unor_id);
  sendSuccess(res, 200, "Rekapitulasi jenis kelamin berhasil diambil", result);
});

/**
 * GET /api/rekapitulasi/golongan-gender
 * Rekap #2: Per Golongan & Jenis Kelamin
 */
export const getGolonganGender = asyncHandler(async (req, res) => {
  const { unor_id } = req.query;
  const result = await rekapService.getRekapGolonganGender(unor_id);
  sendSuccess(res, 200, "Rekapitulasi golongan dan jenis kelamin berhasil diambil", result);
});

/**
 * GET /api/rekapitulasi/pendidikan-gender
 * Rekap #3: Per Pendidikan & Jenis Kelamin
 */
export const getPendidikanGender = asyncHandler(async (req, res) => {
  const { unor_id } = req.query;
  const result = await rekapService.getRekapPendidikanGender(unor_id);
  sendSuccess(res, 200, "Rekapitulasi pendidikan dan jenis kelamin berhasil diambil", result);
});

/**
 * GET /api/rekapitulasi/jabatan-struktural
 * Rekap #4: Jabatan Struktural (Eselon)
 */
export const getJabatanStruktural = asyncHandler(async (req, res) => {
  const { unor_id } = req.query;
  const result = await rekapService.getRekapJabatanStruktural(unor_id);
  sendSuccess(res, 200, "Rekapitulasi jabatan struktural berhasil diambil", result);
});

/**
 * GET /api/rekapitulasi/struktural-gender
 * Rekap #5: Pejabat Struktural & Jenis Kelamin
 */
export const getStrukturalGender = asyncHandler(async (req, res) => {
  const { unor_id } = req.query;
  const result = await rekapService.getRekapStrukturalGender(unor_id);
  sendSuccess(res, 200, "Rekapitulasi pejabat struktural dan jenis kelamin berhasil diambil", result);
});

/**
 * GET /api/rekapitulasi/struktural-pendidikan
 * Rekap #6: Pendidikan Pejabat Struktural
 */
export const getStrukturalPendidikan = asyncHandler(async (req, res) => {
  const { unor_id } = req.query;
  const result = await rekapService.getRekapStrukturalPendidikan(unor_id);
  sendSuccess(res, 200, "Rekapitulasi pendidikan pejabat struktural berhasil diambil", result);
});

/**
 * GET /api/rekapitulasi/jabatan-gender
 * Rekap #7: Per Jenis Jabatan & Jenis Kelamin
 */
export const getJabatanGender = asyncHandler(async (req, res) => {
  const { unor_id } = req.query;
  const result = await rekapService.getRekapJabatanGender(unor_id);
  sendSuccess(res, 200, "Rekapitulasi jenis jabatan dan jenis kelamin berhasil diambil", result);
});

/**
 * GET /api/rekapitulasi/jabatan-fungsional
 * Rekap #8: Jabatan Fungsional (Ahli & Terampil)
 */
export const getJabatanFungsional = asyncHandler(async (req, res) => {
  const { unor_id } = req.query;
  const result = await rekapService.getRekapJabatanFungsional(unor_id);
  sendSuccess(res, 200, "Rekapitulasi jabatan fungsional berhasil diambil", result);
});

/**
 * POST /api/rekapitulasi/snapshot
 * Simpan snapshot bulanan
 */
export const createSnapshot = asyncHandler(async (req, res) => {
  const { period, unor_id } = req.body;
  const result = await rekapService.createSnapshot(period, unor_id);
  sendSuccess(res, 201, `Snapshot rekapitulasi periode ${period} berhasil disimpan`, result);
});

/**
 * GET /api/rekapitulasi/export/excel
 * Unduh laporan Excel rekapitulasi lengkap
 */
export const exportExcel = asyncHandler(async (req, res) => {
  const { unor_id, type } = req.query;
  const buffer = await rekapService.generateExcel(unor_id, type);

  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `Rekapitulasi_Pegawai_${timestamp}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );

  res.send(buffer);
});
