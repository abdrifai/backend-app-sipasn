import Joi from "joi";

export const createSchema = Joi.object({
  kode: Joi.number().integer().required(),
  tktHukuman_id: Joi.string().max(36).required(),
  jnsHukuman: Joi.string().max(255).required(),
});

export const updateSchema = Joi.object({
  kode: Joi.number().integer().required(),
  tktHukuman_id: Joi.string().max(36).required(),
  jnsHukuman: Joi.string().max(255).required(),
});
