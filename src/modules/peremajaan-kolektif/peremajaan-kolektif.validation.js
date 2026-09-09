import Joi from "joi";

export const createSkKolektifSchema = Joi.object({
  no_sk: Joi.string().max(255).required().messages({
    "any.required": "Nomor SK wajib diisi",
    "string.empty": "Nomor SK tidak boleh kosong",
  }),
  tgl_sk: Joi.alternatives().try(Joi.date().iso(), Joi.string()).required().messages({
    "any.required": "Tanggal SK wajib diisi",
  }),
  tmt_sk: Joi.alternatives().try(Joi.date().iso(), Joi.string()).required().messages({
    "any.required": "TMT Jabatan / SK wajib diisi",
  }),
  jns_mutasi_id: Joi.string().max(36).allow(null, "").optional(),
  pengesahan: Joi.string().max(255).allow(null, "").default("-"),
  keterangan: Joi.string().allow(null, "").optional(),
});

export const updateSkKolektifSchema = Joi.object({
  no_sk: Joi.string().max(255).optional(),
  tgl_sk: Joi.alternatives().try(Joi.date().iso(), Joi.string()).optional(),
  tmt_sk: Joi.alternatives().try(Joi.date().iso(), Joi.string()).optional(),
  jns_mutasi_id: Joi.string().max(36).allow(null, "").optional(),
  pengesahan: Joi.string().max(255).allow(null, "").optional(),
  keterangan: Joi.string().allow(null, "").optional(),
});

export const addPegawaiKolektifSchema = Joi.object({
  pegawai_id: Joi.string().max(36).required().messages({
    "any.required": "Pegawai wajib dipilih",
  }),
  nip: Joi.string().max(20).required().messages({
    "any.required": "NIP pegawai wajib diisi",
  }),
  nama: Joi.string().max(255).allow(null, "").optional(),
  jns_jab_id: Joi.string().max(36).required().messages({
    "any.required": "Jenis jabatan wajib dipilih",
  }),
  unor_id: Joi.string().max(36).required().messages({
    "any.required": "Unit Organisasi (OPD) wajib dipilih",
  }),
  nm_jab_id: Joi.string().max(36).allow(null, "").optional(),
  eselon_id: Joi.string().max(36).allow(null, "").optional(),
  keterangan: Joi.string().allow(null, "").optional(),
});
