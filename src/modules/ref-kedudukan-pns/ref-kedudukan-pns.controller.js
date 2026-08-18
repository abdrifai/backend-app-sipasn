import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as service from "./ref-kedudukan-pns.service.js";

export const getAll = asyncHandler(async (req, res) => {
  const result = await service.getAll(req.query);
  sendSuccess(res, 200, "Daftar kedudukan PNS berhasil diambil", result.data, result.meta);
});

export const getById = asyncHandler(async (req, res) => {
  const data = await service.getById(req.params.id);
  sendSuccess(res, 200, "Data kedudukan PNS berhasil diambil", data);
});

export const create = asyncHandler(async (req, res) => {
  const data = await service.create(req.body);
  sendSuccess(res, 201, "Kedudukan PNS berhasil ditambahkan", data);
});

export const update = asyncHandler(async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  sendSuccess(res, 200, "Kedudukan PNS berhasil diperbarui", data);
});

export const deleteById = asyncHandler(async (req, res) => {
  await service.deleteById(req.params.id);
  sendSuccess(res, 200, "Kedudukan PNS berhasil dihapus");
});
