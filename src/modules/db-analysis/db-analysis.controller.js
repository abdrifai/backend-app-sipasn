import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as dbService from "./db-analysis.service.js";

/**
 * Controller untuk merespon request analisis database
 */
export const getAnalysis = asyncHandler(async (req, res) => {
  const analysis = await dbService.analyzeDatabase();
  sendSuccess(res, 200, "Analisis database berhasil dilakukan", analysis);
});
