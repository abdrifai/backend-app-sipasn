import Joi from "joi";

export const getMatchingListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(15),
  status: Joi.string().valid("all", "match", "mismatch", "only_local", "only_siasn").default("all"),
  mismatch_type: Joi.string().valid("all", "golongan", "jabatan", "unor", "nama", "kedudukan").default("all"),
  search: Joi.string().allow("").default(""),
  unorInduk_id: Joi.string().allow("").default(""),
});

export const getMatchingDetailSchema = Joi.object({
  nip: Joi.string().required(),
});

export const exportMatchingSchema = Joi.object({
  status: Joi.string().valid("all", "match", "mismatch", "only_local", "only_siasn").default("all"),
  mismatch_type: Joi.string().valid("all", "golongan", "jabatan", "unor", "nama", "kedudukan").default("all"),
  search: Joi.string().allow("").default(""),
  unorInduk_id: Joi.string().allow("").default(""),
});
