import Joi from "joi";

export const loginSchema = Joi.object({
  username: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Username wajib diisi",
    "string.min": "Username minimal 3 karakter",
    "any.required": "Username wajib diisi",
  }),
  password: Joi.string().min(6).max(255).required().messages({
    "string.empty": "Password wajib diisi",
    "string.min": "Password minimal 6 karakter",
    "any.required": "Password wajib diisi",
  }),
});

export const updateProfileSchema = Joi.object({
  nama_lengkap: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().allow("", null),
  nik: Joi.string().length(16).allow("", null),
  password: Joi.string().min(8).allow("", null),
}).unknown(true);
