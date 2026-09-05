import Joi from "joi";

export const queryImportPnsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow("").optional(),
  batch_id: Joi.string().allow("").optional(),
  status_cpns_pns: Joi.string().allow("").optional(),
});

export const batchIdParamSchema = Joi.object({
  batchId: Joi.string().required().messages({
    "any.required": "Batch ID wajib diisi",
  }),
});

export const idParamSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "ID data wajib diisi",
  }),
});
