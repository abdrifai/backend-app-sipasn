import Joi from "joi";

export const createPensiunSchema = Joi.object({
  pegawai_id: Joi.string().max(36).required(),
  kedudukanpns_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required(),
  no_sk: Joi.string().max(255).allow(null, "").optional(),
  tgl_sk: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, "").optional(),
  tmt_pensiun: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, "").optional(),
  ket: Joi.string().allow(null, "").optional(),
});

export const updatePensiunSchema = Joi.object({
  pegawai_id: Joi.string().max(36).allow(null, "").optional(),
  kedudukanpns_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional(),
  no_sk: Joi.string().max(255).allow(null, "").optional(),
  tgl_sk: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, "").optional(),
  tmt_pensiun: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, "").optional(),
  ket: Joi.string().allow(null, "").optional(),
  pengesahan: Joi.string().max(255).allow(null, "").optional(),
});
