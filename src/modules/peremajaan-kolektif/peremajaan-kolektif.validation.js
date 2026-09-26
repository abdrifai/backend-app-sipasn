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
  unor_id: Joi.string().max(36).required().messages({
    "any.required": "Unit Organisasi (OPD) wajib dipilih",
  }),
  nm_jab_id: Joi.string().max(36).required().messages({
    "any.required": "Nama jabatan wajib dipilih",
    "string.empty": "Nama jabatan wajib dipilih",
  }),
  jns_jab_id: Joi.string().max(36).allow(null, "").optional(),
  eselon_id: Joi.string().max(36).allow(null, "").optional(),
  keterangan: Joi.string().allow(null, "").optional(),
});

export const getPegawaiByUnorSchema = Joi.object({
  unor_id: Joi.string().max(36).required().messages({
    "any.required": "Unit Organisasi (unor_id) wajib diisi",
    "string.empty": "Unit Organisasi (unor_id) tidak boleh kosong",
  }),
  include_sub: Joi.alternatives().try(Joi.boolean(), Joi.string()).default(true),
  sk_kolektif_id: Joi.string().max(36).allow(null, "").optional(),
  search: Joi.string().allow(null, "").optional(),
});

export const addPegawaiBatchSchema = Joi.object({
  target_unor_id: Joi.string().max(36).required().messages({
    "any.required": "Unit Organisasi tujuan wajib dipilih",
    "string.empty": "Unit Organisasi tujuan tidak boleh kosong",
  }),
  target_nm_jab_id: Joi.string().max(36).allow(null, "").optional(),
  keterangan: Joi.string().max(500).allow(null, "").optional(),
  pegawai_list: Joi.array()
    .items(
      Joi.object({
        pegawai_id: Joi.string().max(36).required().messages({
          "any.required": "ID Pegawai wajib disertakan",
        }),
        nip: Joi.string().max(20).allow(null, "").optional(),
        nama: Joi.string().max(255).allow(null, "").optional(),
        nm_jab_id: Joi.string().max(36).allow(null, "").optional(),
        jns_jab_id: Joi.string().max(36).allow(null, "").optional(),
        eselon_id: Joi.string().max(36).allow(null, "").optional(),
        keterangan: Joi.string().max(500).allow(null, "").optional(),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Pilih minimal 1 pegawai untuk dimutasi",
      "any.required": "Daftar pegawai wajib disertakan",
    }),
});

export const createMutasiUnorSchema = Joi.object({
  asal_unor_id: Joi.string().max(36).required().messages({
    "any.required": "Unit Organisasi Asal wajib dipilih",
    "string.empty": "Unit Organisasi Asal tidak boleh kosong",
  }),
  tujuan_unor_id: Joi.string().max(36).required().messages({
    "any.required": "Unit Organisasi Tujuan wajib dipilih",
    "string.empty": "Unit Organisasi Tujuan tidak boleh kosong",
  }),
  target_nm_jab_id: Joi.string().max(36).allow(null, "").optional(),
  keterangan: Joi.string().max(500).allow(null, "").optional(),
  pegawai_ids: Joi.array()
    .items(Joi.string().max(36).required())
    .optional(),
  pegawai_list: Joi.array()
    .items(
      Joi.object({
        pegawai_id: Joi.string().max(36).required().messages({
          "any.required": "ID Pegawai wajib disertakan",
        }),
        nm_jab_id: Joi.string().max(36).allow(null, "").optional(),
        tujuan_unor_id: Joi.string().max(36).allow(null, "").optional(),
      })
    )
    .optional(),
})
  .or("pegawai_ids", "pegawai_list")
  .messages({
    "object.missing": "Pilih minimal 1 pegawai untuk dipindahkan",
  });


