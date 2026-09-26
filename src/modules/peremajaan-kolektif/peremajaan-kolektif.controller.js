import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as peremajaanService from "./peremajaan-kolektif.service.js";

export const getAllSkKolektif = asyncHandler(async (req, res) => {
  const result = await peremajaanService.getAllSkKolektif(req.query);
  return sendSuccess(
    res,
    200,
    "Berhasil mengambil daftar SK Kolektif",
    result.data,
    result.meta
  );
});

export const getSkKolektifById = asyncHandler(async (req, res) => {
  const data = await peremajaanService.getSkKolektifById(req.params.id);
  return sendSuccess(res, 200, "Berhasil mengambil rincian SK Kolektif", data);
});

export const createSkKolektif = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await peremajaanService.createSkKolektif(req.body, req.file, userId);
  return sendSuccess(res, 201, "SK Kolektif berhasil dibuat", result);
});

export const updateSkKolektif = asyncHandler(async (req, res) => {
  const result = await peremajaanService.updateSkKolektif(req.params.id, req.body, req.file);
  return sendSuccess(res, 200, "SK Kolektif berhasil diperbarui", result);
});

export const deleteSkKolektif = asyncHandler(async (req, res) => {
  const result = await peremajaanService.deleteSkKolektif(req.params.id);
  return sendSuccess(res, 200, "SK Kolektif berhasil dihapus", result);
});

export const addPegawaiToSkKolektif = asyncHandler(async (req, res) => {
  const result = await peremajaanService.addPegawaiToSkKolektif(req.params.id, req.body);
  return sendSuccess(res, 201, "Pegawai berhasil ditambahkan ke SK Kolektif", result);
});

export const removePegawaiFromSkKolektif = asyncHandler(async (req, res) => {
  const result = await peremajaanService.removePegawaiFromSkKolektif(
    req.params.id,
    req.params.pegawaiItemId
  );
  return sendSuccess(res, 200, "Pegawai berhasil dihapus dari SK Kolektif", result);
});

export const processSkKolektif = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await peremajaanService.processSkKolektif(req.params.id, userId);
  return sendSuccess(
    res,
    200,
    "SK Kolektif berhasil diproses ke Riwayat Jabatan seluruh pegawai",
    result
  );
});

export const getReferensiOptions = asyncHandler(async (req, res) => {
  const data = await peremajaanService.getReferensiOptions();
  return sendSuccess(res, 200, "Berhasil mengambil opsi referensi", data);
});

export const searchPegawaiOptions = asyncHandler(async (req, res) => {
  const data = await peremajaanService.searchPegawaiOptions(req.query);
  return sendSuccess(res, 200, "Berhasil mencari pegawai", data);
});

export const searchJabatanOptions = asyncHandler(async (req, res) => {
  const data = await peremajaanService.searchJabatanOptions(req.query);
  return sendSuccess(res, 200, "Berhasil mencari jabatan", data);
});

export const searchUnorOptions = asyncHandler(async (req, res) => {
  const data = await peremajaanService.searchUnorOptions(req.query);
  return sendSuccess(res, 200, "Berhasil mencari unit organisasi", data);
});

export const getPegawaiByUnor = asyncHandler(async (req, res) => {
  const data = await peremajaanService.getPegawaiByUnor(req.query);
  return sendSuccess(res, 200, "Daftar pegawai berhasil diambil", data);
});

export const addPegawaiBatchToSkKolektif = asyncHandler(async (req, res) => {
  const result = await peremajaanService.addPegawaiBatchToSkKolektif(req.params.id, req.body);
  return sendSuccess(
    res,
    201,
    `${result.total_added} pegawai berhasil ditambahkan ke SK Kolektif`,
    result
  );
});

export const getAllMutasiUnor = asyncHandler(async (req, res) => {
  const result = await peremajaanService.getAllMutasiUnor(req.query);
  return sendSuccess(
    res,
    200,
    "Berhasil mengambil daftar riwayat mutasi unit organisasi",
    result.data,
    result.meta
  );
});

export const getMutasiUnorById = asyncHandler(async (req, res) => {
  const data = await peremajaanService.getMutasiUnorById(req.params.id);
  return sendSuccess(res, 200, "Berhasil mengambil rincian mutasi unit organisasi", data);
});

export const createMutasiUnor = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await peremajaanService.createMutasiUnor(req.body, userId);
  return sendSuccess(
    res,
    201,
    `Berhasil memindahkan ${result.total_pegawai} pegawai ke ${result.nama_tujuan_unor}`,
    result
  );
});

export const restoreMutasiUnor = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const result = await peremajaanService.restoreMutasiUnor(req.params.id, userId);
  return sendSuccess(
    res,
    200,
    `Berhasil mengembalikan ${result.total_restored} pegawai ke unit organisasi asal`,
    result
  );
});


