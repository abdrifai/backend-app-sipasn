import Joi from "joi";

export const createPeraturanSchema = Joi.object({
  nomor_peraturan: Joi.string().trim().max(150).required().messages({
    "string.empty": "Nomor peraturan wajib diisi",
    "any.required": "Nomor peraturan wajib diisi",
  }),
  judul: Joi.string().trim().required().messages({
    "string.empty": "Judul/perihal peraturan wajib diisi",
    "any.required": "Judul/perihal peraturan wajib diisi",
  }),
  kategori: Joi.string().trim().max(100).required().messages({
    "string.empty": "Kategori peraturan wajib dipilih",
    "any.required": "Kategori peraturan wajib dipilih",
  }),
  jenis_peraturan: Joi.string().trim().max(50).required().messages({
    "string.empty": "Jenis peraturan wajib dipilih",
    "any.required": "Jenis peraturan wajib dipilih",
  }),
  tahun: Joi.number().integer().min(1945).max(2100).required().messages({
    "number.base": "Tahun harus berupa angka",
    "any.required": "Tahun peraturan wajib diisi",
  }),
  tgl_penetapan: Joi.date().iso().allow(null, "").optional(),
  tgl_berlaku: Joi.date().iso().allow(null, "").optional(),
  status_berlaku: Joi.string().valid("BERLAKU", "DICABUT", "MENGUBAH").default("BERLAKU"),
  parent_id: Joi.string().trim().max(36).allow(null, "").optional(),
  peraturan_terkait_id: Joi.string().trim().max(36).allow(null, "").optional(),
  tipe_relasi: Joi.string().valid("MENCABUT", "MENGUBAH", "DICABUT_OLEH", "DIUBAH_OLEH", "DASAR_HUKUM", "TERKAIT", "").allow(null, "").optional(),
  peraturan_terkait: Joi.string().trim().max(255).allow(null, "").optional(),
  tentang: Joi.string().trim().allow(null, "").optional(),
  keterangan: Joi.string().trim().allow(null, "").optional(),
});

export const updatePeraturanSchema = Joi.object({
  nomor_peraturan: Joi.string().trim().max(150).optional(),
  judul: Joi.string().trim().optional(),
  kategori: Joi.string().trim().max(100).optional(),
  jenis_peraturan: Joi.string().trim().max(50).optional(),
  tahun: Joi.number().integer().min(1945).max(2100).optional(),
  tgl_penetapan: Joi.date().iso().allow(null, "").optional(),
  tgl_berlaku: Joi.date().iso().allow(null, "").optional(),
  status_berlaku: Joi.string().valid("BERLAKU", "DICABUT", "MENGUBAH").optional(),
  parent_id: Joi.string().trim().max(36).allow(null, "").optional(),
  peraturan_terkait_id: Joi.string().trim().max(36).allow(null, "").optional(),
  tipe_relasi: Joi.string().valid("MENCABUT", "MENGUBAH", "DICABUT_OLEH", "DIUBAH_OLEH", "DASAR_HUKUM", "TERKAIT", "").allow(null, "").optional(),
  peraturan_terkait: Joi.string().trim().max(255).allow(null, "").optional(),
  tentang: Joi.string().trim().allow(null, "").optional(),
  keterangan: Joi.string().trim().allow(null, "").optional(),
});
