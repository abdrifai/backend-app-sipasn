import Joi from "joi";

export const createSchema = Joi.object({
  kode: Joi.number().integer().required(),
  jnsMutasi: Joi.string().max(255).required(),
  is_aktif: Joi.number().valid(0, 1).default(1).optional(),
});

export const updateSchema = Joi.object({
  kode: Joi.number().integer().required(),
  jnsMutasi: Joi.string().max(255).required(),
  is_aktif: Joi.number().valid(0, 1).optional(),
});
