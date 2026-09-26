import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as peremajaanService from "./peremajaan-data-induk.service.js";

export const getJenisOptions = asyncHandler(async (req, res) => {
  const data = await peremajaanService.getJenisOptions();
  return sendSuccess(res, 200, "Berhasil mengambil opsi jenis perubahan data induk", data);
});

export const getStats = asyncHandler(async (req, res) => {
  const data = await peremajaanService.getStats();
  return sendSuccess(res, 200, "Berhasil mengambil statistik peremajaan data induk", data);
});

export const getAllPeremajaan = asyncHandler(async (req, res) => {
  const result = await peremajaanService.getAllPeremajaan(req.query);
  return sendSuccess(
    res,
    200,
    "Berhasil mengambil data riwayat perubahan data induk",
    result.data,
    result.meta
  );
});

export const createPeremajaan = asyncHandler(async (req, res) => {
  const result = await peremajaanService.createPeremajaan(req.body, req.file);
  return sendSuccess(res, 201, "Perubahan data induk berhasil disimpan", result);
});

export const deletePeremajaan = asyncHandler(async (req, res) => {
  const result = await peremajaanService.deletePeremajaan(req.params.id);
  return sendSuccess(res, 200, "Data perubahan data induk berhasil dihapus", result);
});
