import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as pegawaiService from "./pegawai.service.js";

/**
 * Handle request daftar pegawai
 */
export const getPegawai = asyncHandler(async (req, res) => {
  const result = await pegawaiService.getAllPegawai(req.query);
  
  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Data pegawai berhasil diambil",
    data: result.data,
    meta: result.meta,
  });
});

/**
 * Handle request detail pegawai
 */
export const getPegawaiById = asyncHandler(async (req, res) => {
  const pegawai = await pegawaiService.getPegawaiDetail(req.params.id);
  
  if (!pegawai) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: "Pegawai tidak ditemukan",
      errors: null,
    });
  }

  sendSuccess(res, 200, "Detail pegawai berhasil diambil", pegawai);
});

/**
 * Handle request statistik migrasi
 */
export const getMigrationStats = asyncHandler(async (req, res) => {
  const stats = await pegawaiService.getMigrationDashboardData();
  sendSuccess(res, 200, "Statistik migrasi berhasil diambil", stats);
});

/**
 * Handle request laporan DUK
 */
export const getDUK = asyncHandler(async (req, res) => {
  const result = await pegawaiService.getDUKReport(req.query);
  sendSuccess(res, 200, "Laporan DUK berhasil diambil", result);
});
/**
 * Handle request export DUK ke Excel
 */
export const exportDUK = asyncHandler(async (req, res) => {
  const { unorInduk_id } = req.query;
  const workbook = await pegawaiService.generateDUKExcel(unorInduk_id);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=DUK_Export_${Date.now()}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
});

/**
 * Handle request laporan estimasi pensiun pegawai
 */
export const getEstimasiPensiun = asyncHandler(async (req, res) => {
  const result = await pegawaiService.getEstimasiPensiunReport(req.query);
  sendSuccess(res, 200, "Laporan estimasi pensiun berhasil diambil", {
    data: result.data,
    stats: result.stats,
  }, result.meta);
});

/**
 * Handle request export estimasi pensiun ke Excel
 */
export const exportEstimasiPensiun = asyncHandler(async (req, res) => {
  const buffer = await pegawaiService.generateEstimasiPensiunExcel(req.query);

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
 * Handle request statistik pegawai global
 */
export const getStats = asyncHandler(async (req, res) => {
  const stats = await pegawaiService.getPegawaiStatistics();
  sendSuccess(res, 200, "Statistik pegawai berhasil diambil", stats);
});

/**
 * Handle request daftar referensi golongan & jenis KP
 */
export const getRefGolongan = asyncHandler(async (req, res) => {
  const data = await pegawaiService.getRefGolongan();
  sendSuccess(res, 200, "Referensi golongan berhasil diambil", data);
});

/**
 * Handle tambah riwayat golongan pegawai
 */
export const createRiwayatGolongan = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.addRiwayatGolongan(req.params.id, req.body, userId, req.file);
  sendSuccess(res, 201, "Riwayat golongan berhasil ditambahkan", result);
});

/**
 * Handle update riwayat golongan pegawai
 */
export const updateRiwayatGolongan = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.editRiwayatGolongan(
    req.params.id,
    req.params.rwtGolId,
    req.body,
    userId,
    req.file
  );
  sendSuccess(res, 200, "Riwayat golongan berhasil diperbarui", result);
});

/**
 * Handle hapus riwayat golongan pegawai
 */
export const deleteRiwayatGolongan = asyncHandler(async (req, res) => {
  const result = await pegawaiService.removeRiwayatGolongan(
    req.params.id,
    req.params.rwtGolId
  );
  sendSuccess(res, 200, "Riwayat golongan berhasil dihapus", result);
});

/**
 * Handle tambah riwayat KGB pegawai
 */
export const createRiwayatKgb = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.addRiwayatKgb(req.params.id, req.body, userId, req.file);
  sendSuccess(res, 201, "Riwayat KGB berhasil ditambahkan", result);
});

/**
 * Handle update riwayat KGB pegawai
 */
export const updateRiwayatKgb = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.editRiwayatKgb(
    req.params.id,
    req.params.rwtKgbId,
    req.body,
    userId,
    req.file
  );
  sendSuccess(res, 200, "Riwayat KGB berhasil diperbarui", result);
});

/**
 * Handle hapus riwayat KGB pegawai
 */
export const deleteRiwayatKgb = asyncHandler(async (req, res) => {
  const result = await pegawaiService.removeRiwayatKgb(
    req.params.id,
    req.params.rwtKgbId
  );
  sendSuccess(res, 200, "Riwayat KGB berhasil dihapus", result);
});

/**
 * Handle ambil referensi master jabatan
 */
export const getRefJabatan = asyncHandler(async (req, res) => {
  const result = await pegawaiService.getRefJabatan();
  sendSuccess(res, 200, "Referensi jabatan berhasil diambil", result);
});

/**
 * Handle tambah riwayat jabatan pegawai
 */
export const createRiwayatJabatan = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.addRiwayatJabatan(req.params.id, req.body, userId, req.file);
  sendSuccess(res, 201, "Riwayat jabatan berhasil ditambahkan", result);
});

/**
 * Handle update riwayat jabatan pegawai
 */
export const updateRiwayatJabatan = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.editRiwayatJabatan(
    req.params.id,
    req.params.rwtJabId,
    req.body,
    userId,
    req.file
  );
  sendSuccess(res, 200, "Riwayat jabatan berhasil diperbarui", result);
});

/**
 * Handle hapus riwayat jabatan pegawai
 */
export const deleteRiwayatJabatan = asyncHandler(async (req, res) => {
  const result = await pegawaiService.removeRiwayatJabatan(
    req.params.id,
    req.params.rwtJabId
  );
  sendSuccess(res, 200, "Riwayat jabatan berhasil dihapus", result);
});

/**
 * Handle ambil referensi master pendidikan
 */
export const getRefPendidikan = asyncHandler(async (req, res) => {
  const result = await pegawaiService.getRefPendidikan(req.query.tktpend_id);
  sendSuccess(res, 200, "Referensi pendidikan berhasil diambil", result);
});

/**
 * Handle tambah riwayat pendidikan pegawai
 */
export const createRiwayatPendidikan = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const files = req.files || (req.file ? { dokumen_ijazah: [req.file] } : null);
  const result = await pegawaiService.addRiwayatPendidikan(req.params.id, req.body, userId, files);
  sendSuccess(res, 201, "Riwayat pendidikan berhasil ditambahkan", result);
});

/**
 * Handle update riwayat pendidikan pegawai
 */
export const updateRiwayatPendidikan = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const files = req.files || (req.file ? { dokumen_ijazah: [req.file] } : null);
  const result = await pegawaiService.editRiwayatPendidikan(
    req.params.id,
    req.params.rwtPendId,
    req.body,
    userId,
    files
  );
  sendSuccess(res, 200, "Riwayat pendidikan berhasil diperbarui", result);
});

/**
 * Handle hapus riwayat pendidikan pegawai
 */
export const deleteRiwayatPendidikan = asyncHandler(async (req, res) => {
  const result = await pegawaiService.removeRiwayatPendidikan(
    req.params.id,
    req.params.rwtPendId
  );
  sendSuccess(res, 200, "Riwayat pendidikan berhasil dihapus", result);
});

/**
 * Handle ambil referensi master diklat & jenjang
 */
export const getRefDiklat = asyncHandler(async (req, res) => {
  const result = await pegawaiService.getRefDiklat();
  sendSuccess(res, 200, "Referensi diklat berhasil diambil", result);
});

/**
 * Handle tambah riwayat diklat pegawai
 */
export const createRiwayatDiklat = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.addRiwayatDiklat(req.params.id, req.body, userId, req.file);
  sendSuccess(res, 201, "Riwayat diklat berhasil ditambahkan", result);
});

/**
 * Handle update riwayat diklat pegawai
 */
export const updateRiwayatDiklat = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.editRiwayatDiklat(
    req.params.id,
    req.params.rwtDiklatId,
    req.body,
    userId,
    req.file
  );
  sendSuccess(res, 200, "Riwayat diklat berhasil diperbarui", result);
});

/**
 * Handle hapus riwayat diklat pegawai
 */
export const deleteRiwayatDiklat = asyncHandler(async (req, res) => {
  const result = await pegawaiService.removeRiwayatDiklat(
    req.params.id,
    req.params.rwtDiklatId
  );
  sendSuccess(res, 200, "Riwayat diklat berhasil dihapus", result);
});

/**
 * Handle ambil referensi master jenis profesi
 */
export const getRefProfesi = asyncHandler(async (req, res) => {
  const result = await pegawaiService.getRefProfesi();
  sendSuccess(res, 200, "Referensi profesi berhasil diambil", result);
});

/**
 * Handle tambah riwayat profesi pegawai
 */
export const createRiwayatProfesi = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.addRiwayatProfesi(req.params.id, req.body, userId, req.file);
  sendSuccess(res, 201, "Riwayat profesi berhasil ditambahkan", result);
});

/**
 * Handle update riwayat profesi pegawai
 */
export const updateRiwayatProfesi = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.editRiwayatProfesi(
    req.params.id,
    req.params.rwtProfesiId,
    req.body,
    userId,
    req.file
  );
  sendSuccess(res, 200, "Riwayat profesi berhasil diperbarui", result);
});

/**
 * Handle hapus riwayat profesi pegawai
 */
export const deleteRiwayatProfesi = asyncHandler(async (req, res) => {
  const result = await pegawaiService.removeRiwayatProfesi(
    req.params.id,
    req.params.rwtProfesiId
  );
  sendSuccess(res, 200, "Riwayat profesi berhasil dihapus", result);
});

/**
 * Handle ambil referensi master tingkat & jenis hukuman disiplin
 */
export const getRefHukdis = asyncHandler(async (req, res) => {
  const result = await pegawaiService.getRefHukdis();
  sendSuccess(res, 200, "Referensi hukuman disiplin berhasil diambil", result);
});

/**
 * Handle tambah riwayat hukdis pegawai
 */
export const createRiwayatHukdis = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.addRiwayatHukdis(req.params.id, req.body, userId, req.file);
  sendSuccess(res, 201, "Riwayat hukuman disiplin berhasil ditambahkan", result);
});

/**
 * Handle update riwayat hukdis pegawai
 */
export const updateRiwayatHukdis = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.editRiwayatHukdis(
    req.params.id,
    req.params.rwtHukdisId,
    req.body,
    userId,
    req.file
  );
  sendSuccess(res, 200, "Riwayat hukuman disiplin berhasil diperbarui", result);
});

/**
 * Handle hapus riwayat hukdis pegawai
 */
export const deleteRiwayatHukdis = asyncHandler(async (req, res) => {
  const result = await pegawaiService.removeRiwayatHukdis(
    req.params.id,
    req.params.rwtHukdisId
  );
  sendSuccess(res, 200, "Riwayat hukuman disiplin berhasil dihapus", result);
});

/**
 * Handle tambah data riwayat orang tua pegawai
 */
export const createRiwayatOrtu = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.addRiwayatOrtu(req.params.id, req.body, userId);
  sendSuccess(res, 201, "Data orang tua berhasil ditambahkan", result);
});

/**
 * Handle update data riwayat orang tua pegawai
 */
export const updateRiwayatOrtu = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.editRiwayatOrtu(
    req.params.id,
    req.params.rwtOrtuId,
    req.body,
    userId
  );
  sendSuccess(res, 200, "Data orang tua berhasil diperbarui", result);
});

/**
 * Handle hapus data riwayat orang tua pegawai
 */
export const deleteRiwayatOrtu = asyncHandler(async (req, res) => {
  const result = await pegawaiService.removeRiwayatOrtu(
    req.params.id,
    req.params.rwtOrtuId
  );
  sendSuccess(res, 200, "Data orang tua berhasil dihapus", result);
});

/**
 * Handle tambah data riwayat pasangan pegawai (Suami / Istri)
 */
export const createRiwayatPasangan = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.addRiwayatPasangan(
    req.params.id,
    req.body,
    userId,
    req.file
  );
  sendSuccess(res, 201, "Data pasangan berhasil ditambahkan", result);
});

/**
 * Handle update data riwayat pasangan pegawai (Suami / Istri)
 */
export const updateRiwayatPasangan = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.editRiwayatPasangan(
    req.params.id,
    req.params.rwtSuisId,
    req.body,
    userId,
    req.file
  );
  sendSuccess(res, 200, "Data pasangan berhasil diperbarui", result);
});

/**
 * Handle hapus data riwayat pasangan pegawai
 */
export const deleteRiwayatPasangan = asyncHandler(async (req, res) => {
  const result = await pegawaiService.removeRiwayatPasangan(
    req.params.id,
    req.params.rwtSuisId
  );
  sendSuccess(res, 200, "Data pasangan berhasil dihapus", result);
});

/**
 * Handle tambah data riwayat anak pegawai
 */
export const createRiwayatAnak = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.addRiwayatAnak(
    req.params.id,
    req.body,
    userId,
    req.file
  );
  sendSuccess(res, 201, "Data anak berhasil ditambahkan", result);
});

/**
 * Handle update data riwayat anak pegawai
 */
export const updateRiwayatAnak = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.editRiwayatAnak(
    req.params.id,
    req.params.rwtAnakId,
    req.body,
    userId,
    req.file
  );
  sendSuccess(res, 200, "Data anak berhasil diperbarui", result);
});

/**
 * Handle hapus data riwayat anak pegawai
 */
export const deleteRiwayatAnak = asyncHandler(async (req, res) => {
  const result = await pegawaiService.removeRiwayatAnak(
    req.params.id,
    req.params.rwtAnakId
  );
  sendSuccess(res, 200, "Data anak berhasil dihapus", result);
});

/**
 * Handle tambah data riwayat CPNS / PNS pegawai
 */
export const createCpnsPns = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.addCpnsPns(
    req.params.id,
    req.body,
    userId,
    req.file
  );
  sendSuccess(res, 201, "Data CPNS/PNS berhasil ditambahkan", result);
});

/**
 * Handle update data riwayat CPNS / PNS pegawai
 */
export const updateCpnsPns = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.editCpnsPns(
    req.params.id,
    req.params.cpnsPnsId,
    req.body,
    userId,
    req.file
  );
  sendSuccess(res, 200, "Data CPNS/PNS berhasil diperbarui", result);
});

/**
 * Handle hapus data riwayat CPNS / PNS pegawai
 */
export const deleteCpnsPns = asyncHandler(async (req, res) => {
  const result = await pegawaiService.removeCpnsPns(
    req.params.id,
    req.params.cpnsPnsId
  );
  sendSuccess(res, 200, "Data CPNS/PNS berhasil dihapus", result);
});

/**
 * Handle request master referensi identitas pegawai
 */
export const getRefIdentitas = asyncHandler(async (req, res) => {
  const data = await pegawaiService.getRefIdentitas();
  sendSuccess(res, 200, "Master referensi identitas berhasil diambil", data);
});

/**
 * Handle request tambah pegawai baru
 */
export const createPegawai = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.addPegawai(req.body, userId);
  sendSuccess(res, 201, "Pegawai baru berhasil ditambahkan", result);
});

/**
 * Handle request update identitas pegawai
 */
export const updateIdentitasPegawai = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await pegawaiService.editIdentitasPegawai(req.params.id, req.body, userId);
  sendSuccess(res, 200, "Identitas pegawai berhasil diperbarui", result);
});

/**
 * Handle request update foto pegawai
 */
export const updateFotoPegawai = asyncHandler(async (req, res) => {
  const result = await pegawaiService.updateFotoPegawai(req.params.id, req.file);
  sendSuccess(res, 200, "Foto pegawai berhasil diperbarui", result);
});

/**
 * Handle request hapus foto pegawai
 */
export const deleteFotoPegawai = asyncHandler(async (req, res) => {
  const result = await pegawaiService.deleteFotoPegawai(req.params.id);
  sendSuccess(res, 200, "Foto pegawai berhasil dihapus", result);
});













