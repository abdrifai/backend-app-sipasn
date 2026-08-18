import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as service from "./ref-instansi.service.js";

export const getAll = asyncHandler(async (req, res) => {
  const result = await service.getAll(req.query);
  sendSuccess(res, 200, "Data instansi berhasil diambil", result.data, result.meta);
});
