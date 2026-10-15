import Joi from "joi";

/**
 * Validasi parameter query rekapitulasi
 */
export const queryRekapitulasiSchema = Joi.object({
  unor_id: Joi.string().allow("", null).optional(),
  period: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).allow("", null).optional(),
  type: Joi.string().allow("", null).optional(),
});

/**
 * Validasi pembuatan snapshot data rekapitulasi bulanan
 */
export const createSnapshotSchema = Joi.object({
  period: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).required().messages({
    "string.pattern.base": "Format periode harus YYYY-MM (contoh: 2026-10)",
    "any.required": "Periode snapshot wajib diisi",
  }),
  unor_id: Joi.string().allow("", null).optional(),
});
