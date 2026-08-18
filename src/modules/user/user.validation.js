import Joi from "joi";

export const createUserSchema = Joi.object({
  username: Joi.string().min(3).max(255).required().messages({
    "string.empty": "Username wajib diisi",
    "string.min": "Username minimal 3 karakter",
    "any.required": "Username wajib diisi",
  }),
  nama_lengkap: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Nama lengkap wajib diisi",
    "string.min": "Nama lengkap minimal 2 karakter",
    "any.required": "Nama lengkap wajib diisi",
  }),
  email: Joi.string().email().allow("", null).optional().messages({
    "string.email": "Format email tidak valid",
  }),
  password: Joi.string().min(8).max(255).required().messages({
    "string.empty": "Password wajib diisi",
    "string.min": "Password minimal 8 karakter",
    "any.required": "Password wajib diisi",
  }),
  nik: Joi.string().max(255).allow("", null).optional(),
  role_id: Joi.number().integer().positive().allow(null).optional(),
}).unknown(true);

export const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(255).optional().messages({
    "string.min": "Username minimal 3 karakter",
  }),
  nama_lengkap: Joi.string().min(2).max(255).optional().messages({
    "string.min": "Nama lengkap minimal 2 karakter",
  }),
  email: Joi.string().email().allow("", null).optional().messages({
    "string.email": "Format email tidak valid",
  }),
  password: Joi.string().min(8).max(255).allow("", null).optional().messages({
    "string.min": "Password minimal 8 karakter",
  }),
  nik: Joi.string().max(255).allow("", null).optional(),
  role_id: Joi.number().integer().positive().allow(null).optional(),
}).unknown(true);
