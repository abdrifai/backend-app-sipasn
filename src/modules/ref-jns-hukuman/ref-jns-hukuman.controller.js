import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as service from "./ref-jns-hukuman.service.js";

export const getAll = asyncHandler(async (req, res) => {
  const result = await service.getAll(req.query);
  sendSuccess(res, 200, "Daftar jenis hukuman berhasil diambil", result.data, result.meta);
});

export const getById = asyncHandler(async (req, res) => {
  const data = await service.getById(req.params.id);
  sendSuccess(res, 200, "Data jenis hukuman berhasil diambil", data);
});

export const create = asyncHandler(async (req, res) => {
  const data = await service.create(req.body);
  sendSuccess(res, 201, "Jenis hukuman berhasil ditambahkan", data);
});

export const update = asyncHandler(async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  sendSuccess(res, 200, "Jenis hukuman berhasil diperbarui", data);
});

export const deleteById = asyncHandler(async (req, res) => {
  await service.deleteById(req.params.id);
  sendSuccess(res, 200, "Jenis hukuman berhasil dihapus");
});

export const getTktHukumanLookup = asyncHandler(async (req, res) => {
  const data = await service.getTktHukumanLookup();
  sendSuccess(res, 200, "Daftar tingkat hukuman berhasil diambil", data);
});
