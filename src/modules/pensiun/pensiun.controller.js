import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as pensiunService from "./pensiun.service.js";

export const getAllPensiun = asyncHandler(async (req, res) => {
  const result = await pensiunService.getAllPensiun(req.query);
  return sendSuccess(
    res,
    200,
    "Berhasil mengambil data pensiun",
    result.data,
    result.meta
  );
});

export const getKedudukanOptions = asyncHandler(async (req, res) => {
  const data = await pensiunService.getKedudukanPensiunOptions();
  return sendSuccess(res, 200, "Berhasil mengambil opsi kedudukan pensiun", data);
});

export const getPensiunById = asyncHandler(async (req, res) => {
  const result = await pensiunService.getPensiunById(req.params.id);
  return sendSuccess(res, 200, "Berhasil mengambil data pensiun", result);
});

export const createPensiun = asyncHandler(async (req, res) => {
  const result = await pensiunService.createPensiun(req.body, req.file);
  return sendSuccess(res, 201, "Penetapan pensiun pegawai berhasil disimpan", result);
});

export const updatePensiun = asyncHandler(async (req, res) => {
  const result = await pensiunService.updatePensiun(req.params.id, req.body, req.file);
  return sendSuccess(res, 200, "Data penetapan pensiun berhasil diperbarui", result);
});

export const deletePensiun = asyncHandler(async (req, res) => {
  const result = await pensiunService.deletePensiun(req.params.id);
  return sendSuccess(res, 200, "Data pensiun berhasil dihapus", result);
});

/**
 * Handle request laporan proyeksi estimasi pensiun pegawai
 */
export const getProyeksiPensiun = asyncHandler(async (req, res) => {
  const result = await pensiunService.getEstimasiPensiunReport(req.query);
  sendSuccess(res, 200, "Laporan estimasi pensiun berhasil diambil", {
    data: result.data,
    stats: result.stats,
  }, result.meta);
});

/**
 * Handle request export proyeksi pensiun ke Excel
 */
export const exportProyeksiPensiun = asyncHandler(async (req, res) => {
  const buffer = await pensiunService.generateEstimasiPensiunExcel(req.query);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=Estimasi_Pensiun_${req.query.tahun || 'All'}_${Date.now()}.xlsx`
  );

  res.send(buffer);
});

/**
 * Handle request laporan rekapitulasi tahunan pegawai non-aktif dan perubahan data induk
 */
export const getRekapTahunan = asyncHandler(async (req, res) => {
  const result = await pensiunService.getRekapTahunanReport();
  return sendSuccess(
    res,
    200,
    "Laporan rekapitulasi tahunan berhasil diambil",
    result.data,
    { summary: result.summary }
  );
});

/**
 * Handle request export rekapitulasi tahunan ke Excel
 */
export const exportRekapTahunan = asyncHandler(async (req, res) => {
  const buffer = await pensiunService.generateRekapTahunanExcel();

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=Rekap_Tahunan_NonAktif_${Date.now()}.xlsx`
  );

  res.send(buffer);
});
