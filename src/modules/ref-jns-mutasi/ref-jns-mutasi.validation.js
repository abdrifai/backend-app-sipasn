import Joi from "joi";

export const createSchema = Joi.object({
  kode: Joi.number().integer().required(),
  jnsMutasi: Joi.string().max(255).required(),
});

export const updateSchema = Joi.object({
  kode: Joi.number().integer().required(),
  jnsMutasi: Joi.string().max(255).required(),
});
