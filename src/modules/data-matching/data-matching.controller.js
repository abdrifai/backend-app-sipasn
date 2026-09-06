import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as service from "./data-matching.service.js";

/**
 * GET /api/data-matching/lokal-siasn/stats
 * Ambil statistik ringkasan data matching
 */
export const getMatchingStats = asyncHandler(async (req, res) => {
  const stats = await service.getMatchingStats();
  sendSuccess(res, 200, "Statistik data matching berhasil diambil", stats);
});

/**
 * GET /api/data-matching/lokal-siasn
 * Ambil daftar perbandingan data matching Lokal vs SIASN berpaginasi
 */
export const getMatchingList = asyncHandler(async (req, res) => {
  const result = await service.getMatchingList(req.query);
  sendSuccess(res, 200, "Daftar data matching berhasil diambil", result.data, {
    ...result.meta,
    stats: result.stats,
  });
});

/**
 * GET /api/data-matching/lokal-siasn/detail/:nip
 * Ambil detail komparasi side-by-side seluruh atribut per NIP
 */
export const getMatchingDetail = asyncHandler(async (req, res) => {
  const detail = await service.getMatchingDetail(req.params.nip);
  sendSuccess(res, 200, "Detail komparasi pegawai berhasil diambil", detail);
});

/**
 * GET /api/data-matching/lokal-siasn/export
 * Download laporan Excel komparasi data matching
 */
export const exportMatchingExcel = asyncHandler(async (req, res) => {
  const buffer = await service.generateMatchingExcel(req.query);
  
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Data_Matching_Lokal_SIASN_${Date.now()}.xlsx`
  );
  res.setHeader("Content-Length", buffer.length);
  
  return res.send(buffer);
});
