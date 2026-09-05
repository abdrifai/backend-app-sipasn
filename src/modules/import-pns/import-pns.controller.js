import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import AppError from "../../utils/AppError.js";
import * as importPnsService from "./import-pns.service.js";

export const uploadCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("File CSV belum dipilih. Silakan upload file dengan format .csv", 400);
  }

  const result = await importPnsService.processCsvImport(req.file.buffer, req.file.originalname);

  return sendSuccess(res, 201, "Data PNS dari CSV berhasil diimport", result);
});

export const getList = asyncHandler(async (req, res) => {
  const result = await importPnsService.getImportedPnsList(req.query);
  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Data import PNS berhasil diambil",
    data: result.data,
    meta: result.meta,
  });
});

export const getDetail = asyncHandler(async (req, res) => {
  const record = await importPnsService.getImportedPnsById(req.params.id);
  return sendSuccess(res, 200, "Detail data import PNS berhasil diambil", record);
});

export const getSummary = asyncHandler(async (req, res) => {
  const summary = await importPnsService.getImportSummary();
  return sendSuccess(res, 200, "Ringkasan data import PNS berhasil diambil", summary);
});

export const getRekapJabatan = asyncHandler(async (req, res) => {
  const result = await importPnsService.getRekapJabatan(req.query);
  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Rekapitulasi PNS per jabatan berhasil diambil",
    data: result.data,
    meta: result.meta,
  });
});

export const getRekapJenisJabatan = asyncHandler(async (req, res) => {
  const result = await importPnsService.getRekapJenisJabatan(req.query);
  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Rekapitulasi PNS per jenis jabatan berhasil diambil",
    data: result.data,
    meta: result.meta,
  });
});



export const downloadTemplate = asyncHandler(async (req, res) => {
  const csvContent = importPnsService.getCsvTemplate();
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="template_import_pns.csv"');
  return res.status(200).send(csvContent);
});

export const deleteBatch = asyncHandler(async (req, res) => {
  const result = await importPnsService.deleteBatch(req.params.batchId);
  return sendSuccess(res, 200, `Batch import ${req.params.batchId} berhasil dihapus`, result);
});

export const deleteSingle = asyncHandler(async (req, res) => {
  const result = await importPnsService.deleteSingleRecord(req.params.id);
  return sendSuccess(res, 200, "Data import PNS berhasil dihapus", result);
});
