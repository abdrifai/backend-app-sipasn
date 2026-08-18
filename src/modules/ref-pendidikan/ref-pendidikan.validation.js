import Joi from "joi";

/**
 * Schema validasi untuk Manajemen Referensi Pendidikan
 */

export const createPendidikanSchema = Joi.object({
  tktpend_id: Joi.string().required().messages({
    'any.required': 'Tingkat pendidikan wajib dipilih',
  }),
  pend: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Nama pendidikan minimal 2 karakter',
    'any.required': 'Nama pendidikan wajib diisi',
  }),
  kode: Joi.string().max(255).allow('', null),
});

export const updatePendidikanSchema = Joi.object({
  tktpend_id: Joi.string().messages({
    'string.base': 'Tingkat pendidikan harus berupa teks',
  }),
  pend: Joi.string().min(2).max(255).messages({
    'string.min': 'Nama pendidikan minimal 2 karakter',
  }),
  kode: Joi.string().max(255).allow('', null),
});
