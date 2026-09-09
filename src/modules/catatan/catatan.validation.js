import Joi from "joi";

export const createCatatanSchema = Joi.object({
  judul: Joi.string().trim().min(3).max(255).required().messages({
    "string.empty": "Judul catatan tidak boleh kosong",
    "string.min": "Judul catatan minimal 3 karakter",
    "string.max": "Judul catatan maksimal 255 karakter",
    "any.required": "Judul catatan wajib diisi",
  }),
  konten: Joi.string().trim().min(1).required().messages({
    "string.empty": "Isi catatan tidak boleh kosong",
    "any.required": "Isi catatan wajib diisi",
  }),
  kategori: Joi.string().trim().max(100).allow(null, "").optional(),
  penulis: Joi.string().trim().max(255).allow(null, "").optional(),
  is_pinned: Joi.boolean().optional(),
});

export const updateCatatanSchema = Joi.object({
  judul: Joi.string().trim().min(3).max(255).optional().messages({
    "string.empty": "Judul catatan tidak boleh kosong",
    "string.min": "Judul catatan minimal 3 karakter",
    "string.max": "Judul catatan maksimal 255 karakter",
  }),
  konten: Joi.string().trim().min(1).optional().messages({
    "string.empty": "Isi catatan tidak boleh kosong",
  }),
  kategori: Joi.string().trim().max(100).allow(null, "").optional(),
  penulis: Joi.string().trim().max(255).allow(null, "").optional(),
  is_pinned: Joi.boolean().optional(),
});
