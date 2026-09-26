import Joi from "joi";

export const createPeremajaanDataIndukSchema = Joi.object({
  pegawai_id: Joi.string().max(36).required().messages({
    "any.required": "Pegawai wajib dipilih",
    "string.empty": "Pegawai wajib dipilih",
  }),
  jns_perubahan_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required().messages({
    "any.required": "Jenis perubahan data induk wajib dipilih",
  }),
  sk: Joi.string().max(255).allow(null, "").optional(),
  tglSk: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, "").optional(),
  tmtSk: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, "").optional(),
  pengesahan: Joi.string().max(255).allow(null, "").optional(),
  ket: Joi.string().allow(null, "").optional(),
  // Opsi sinkronisasi ke data pokok profil pegawai
  sync_pegawai: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
  nama_baru: Joi.string().max(255).allow(null, "").optional(),
  nip_baru: Joi.string().max(25).allow(null, "").optional(),
  tgl_lahir_baru: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, "").optional(),
  glr_dpn_baru: Joi.string().max(50).allow(null, "").optional(),
  glr_blk_baru: Joi.string().max(50).allow(null, "").optional(),
});
