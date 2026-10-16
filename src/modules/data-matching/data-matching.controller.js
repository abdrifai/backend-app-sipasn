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

/**
 * POST /api/data-matching/sync/golongan
 * Eksekusi sinkronisasi golongan SIASN -> Database Lokal
 */
export const syncGolongan = asyncHandler(async (req, res) => {
  const result = await service.syncGolonganFromSiasn({
    nips: req.body.nips,
    userId: req.user?.id,
  });
  sendSuccess(res, 200, "Sinkronisasi data golongan berhasil diproses", result);
});

/**
 * GET /api/data-matching/sync/golongan/queue
 * Ambil daftar antrean upload SK golongan hasil sinkronisasi
 */
export const getSyncGolonganQueue = asyncHandler(async (req, res) => {
  const result = await service.getSyncGolonganQueue(req.query);
  sendSuccess(res, 200, "Daftar antrean upload SK golongan berhasil diambil", result.items, {
    ...result.meta,
    stats: result.stats,
  });
});

/**
 * POST /api/data-matching/sync/golongan/:id/upload-sk
 * Unggah berkas fisik SK Golongan untuk item antrean
 */
export const uploadSkGolongan = asyncHandler(async (req, res) => {
  const result = await service.uploadSkGolongan({
    syncId: req.params.id,
    file: req.file,
    sk: req.body.sk,
    tglSk: req.body.tglSk,
  });
  sendSuccess(res, 200, "Dokumen fisik SK golongan berhasil diunggah", result);
});

/**
 * DELETE /api/data-matching/sync/golongan/:id
 * Hapus entri antrean sinkronisasi golongan
 */
export const deleteSyncGolongan = asyncHandler(async (req, res) => {
  const result = await service.deleteSyncGolongan(req.params.id);
  sendSuccess(res, 200, "Antrean upload SK berhasil dihapus", result);
});

/**
 * GET /api/data-matching/sync/pendidikan/check
 * Pre-check status referensi pendidikan SIASN vs master ref_pend lokal
 */
export const checkEducationSync = asyncHandler(async (req, res) => {
  const result = await service.checkEducationSync(req.query.nip);
  sendSuccess(res, 200, "Pengecekan kesiapan sinkronisasi pendidikan berhasil", result);
});

/**
 * GET /api/data-matching/sync/pendidikan/search-ref
 * Cari daftar referensi master ref_pend untuk dropdown / autocomplete
 */
export const searchPendidikan = asyncHandler(async (req, res) => {
  const result = await service.searchPendidikanReferences(req.query);
  sendSuccess(res, 200, "Pencarian referensi pendidikan berhasil", result);
});

/**
 * POST /api/data-matching/sync/pendidikan
 * Eksekusi sinkronisasi pendidikan SIASN -> Database Lokal
 */
export const syncPendidikan = asyncHandler(async (req, res) => {
  const result = await service.syncEducationFromSiasn({
    ...req.body,
    userId: req.user?.id,
  });
  sendSuccess(res, 200, "Sinkronisasi data pendidikan berhasil diproses", result);
});

/**
 * GET /api/data-matching/sync/pendidikan/queue
 * Ambil daftar antrean upload berkas fisik Ijazah
 */
export const getSyncPendidikanQueue = asyncHandler(async (req, res) => {
  const result = await service.getSyncPendidikanQueue(req.query);
  sendSuccess(res, 200, "Daftar antrean upload Ijazah berhasil diambil", result.items, {
    ...result.meta,
    stats: result.stats,
  });
});

/**
 * POST /api/data-matching/sync/pendidikan/:id/upload-ijazah
 * Unggah berkas fisik Ijazah untuk item antrean
 */
export const uploadIjazahPendidikan = asyncHandler(async (req, res) => {
  const result = await service.uploadIjazahPendidikan({
    syncId: req.params.id,
    file: req.file,
    noIjazah: req.body.noIjazah,
    tglIjazah: req.body.tglIjazah,
    nmSekolah: req.body.nmSekolah,
  });
  sendSuccess(res, 200, "Dokumen fisik Ijazah berhasil diunggah", result);
});

/**
 * DELETE /api/data-matching/sync/pendidikan/:id
 * Hapus entri antrean sinkronisasi pendidikan
 */
export const deleteSyncPendidikan = asyncHandler(async (req, res) => {
  const result = await service.deleteSyncPendidikan(req.params.id);
  sendSuccess(res, 200, "Antrean upload Ijazah berhasil dihapus", result);
});


