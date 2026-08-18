import Joi from "joi";

export const createSchema = Joi.object({
  kedudukanpns: Joi.string().max(255).required(),
});

export const updateSchema = Joi.object({
  kedudukanpns: Joi.string().max(255).required(),
});
