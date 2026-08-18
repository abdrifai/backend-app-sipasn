import Joi from "joi";

export const createJenisSchema = Joi.object({
  kode: Joi.string().max(5).required(),
  jnsDiklat: Joi.string().max(255).required(),
});

export const updateJenisSchema = Joi.object({
  kode: Joi.string().max(5),
  jnsDiklat: Joi.string().max(255),
}).min(1);

export const createJenjangSchema = Joi.object({
  jnsDiklat_id: Joi.string().uuid().required(),
  kode: Joi.string().max(5).required(),
  jenjangDiklat: Joi.string().max(255).required(),
});

export const updateJenjangSchema = Joi.object({
  jnsDiklat_id: Joi.string().uuid(),
  kode: Joi.string().max(5),
  jenjangDiklat: Joi.string().max(255),
}).min(1);
