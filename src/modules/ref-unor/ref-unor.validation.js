import Joi from "joi";

// Common fields
const commonUnorSchema = {
  kode: Joi.string().max(255).allow(null, "").optional(),
  nmUnor: Joi.string().max(255).required(),
  jab_id: Joi.string().max(255).allow(null, "").optional(),
  nm_jab: Joi.string().max(255).allow(null, "").optional(),
  jnsUnor_id: Joi.string().max(255).allow(null, "").optional(),
  jnsUnor_kode: Joi.string().max(255).allow(null, "").optional(),
  kategori_jab: Joi.string().valid("STRUKTURAL", "FUNGSIONAL", "PELAKSANA").allow(null, "").optional(),
  eselon_id: Joi.string().max(36).allow(null, "").optional(),
  jns_jab_id: Joi.string().max(36).allow(null, "").optional(),
  jenjang_jab_id: Joi.alternatives().try(Joi.number(), Joi.string()).allow(null, "").optional(),
  bup: Joi.alternatives().try(Joi.number().min(50).max(70), Joi.string()).allow(null, "").optional(),
  kelas_jabatan: Joi.alternatives().try(Joi.number().min(1).max(17), Joi.string()).allow(null, "").optional(),
  kode_jabatan: Joi.string().max(100).allow(null, "").optional(),
  peraturan: Joi.string().max(255).allow(null, "").optional(),
  tglPeraturan: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, "").optional(),
  tahun: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow(null, "").optional(),
  ket: Joi.string().allow(null, "").optional(),
  no_urut: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string()).allow(null, "").optional(),
  isAktif: Joi.alternatives().try(Joi.number().integer().valid(0, 1), Joi.string()).optional(),
};


export const createJnsUnorSchema = Joi.object({
  instansi_id: Joi.string().max(36).required(),
  kode: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required(),
  jnsunor: Joi.string().max(255).required(),
});

export const updateJnsUnorSchema = Joi.object({
  instansi_id: Joi.string().max(36).optional(),
  kode: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional(),
  jnsunor: Joi.string().max(255).optional(),
}).min(1);

export const createUnorIndukSchema = Joi.object({
  ...commonUnorSchema,
  instansi_id: Joi.string().max(255).allow(null, "").optional(),
  instansi_kode: Joi.string().max(255).allow(null, "").optional(),
  peraturan: Joi.string().max(255).allow(null, "").optional(),
  tglPeraturan: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, "").optional(),
  tahun: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow(null, "").optional(),
  ket: Joi.string().allow(null, "").optional(),
  isAktif: Joi.alternatives().try(Joi.number().integer().valid(0, 1), Joi.string()).default(1),
  kategori_jab: Joi.string().valid("STRUKTURAL", "FUNGSIONAL", "PELAKSANA").allow(null, "").optional(),
  eselon_id: Joi.string().max(36).allow(null, "").optional(),
  jns_jab_id: Joi.string().max(36).allow(null, "").optional(),
  jenjang_jab_id: Joi.alternatives().try(Joi.number(), Joi.string()).allow(null, "").optional(),
  bup: Joi.alternatives().try(Joi.number().min(50).max(70), Joi.string()).allow(null, "").optional(),
  kelas_jabatan: Joi.alternatives().try(Joi.number().min(1).max(17), Joi.string()).allow(null, "").optional(),
  kode_jabatan: Joi.string().max(100).allow(null, "").optional(),
});

export const updateUnorIndukSchema = Joi.object({
  kode: Joi.string().max(255).allow(null, "").optional(),
  nmUnor: Joi.string().max(255).optional(),
  jab_id: Joi.string().max(255).allow(null, "").optional(),
  nm_jab: Joi.string().max(255).allow(null, "").optional(),
  instansi_id: Joi.string().max(255).allow(null, "").optional(),
  instansi_kode: Joi.string().max(255).allow(null, "").optional(),
  jnsUnor_id: Joi.string().max(255).allow(null, "").optional(),
  jnsUnor_kode: Joi.string().max(255).allow(null, "").optional(),
  peraturan: Joi.string().max(255).allow(null, "").optional(),
  tglPeraturan: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, "").optional(),
  tahun: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow(null, "").optional(),
  ket: Joi.string().allow(null, "").optional(),
  no_urut: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string()).allow(null, "").optional(),
  isAktif: Joi.alternatives().try(Joi.number().integer().valid(0, 1), Joi.string()).optional(),
  kategori_jab: Joi.string().valid("STRUKTURAL", "FUNGSIONAL", "PELAKSANA").allow(null, "").optional(),
  eselon_id: Joi.string().max(36).allow(null, "").optional(),
  jns_jab_id: Joi.string().max(36).allow(null, "").optional(),
  jenjang_jab_id: Joi.alternatives().try(Joi.number(), Joi.string()).allow(null, "").optional(),
  bup: Joi.alternatives().try(Joi.number().min(50).max(70), Joi.string()).allow(null, "").optional(),
  kelas_jabatan: Joi.alternatives().try(Joi.number().min(1).max(17), Joi.string()).allow(null, "").optional(),
  kode_jabatan: Joi.string().max(100).allow(null, "").optional(),
}).min(1);

export const createUnorSchema = Joi.object({
  ...commonUnorSchema,
  unorinduk_id: Joi.string().max(255).required(),
  unorinduk_kode: Joi.string().max(255).allow(null, "").optional(),
});

const commonUpdateUnorSchema = {
  kode: Joi.string().max(255).allow(null, "").optional(),
  nmUnor: Joi.string().max(255).optional(),
  jab_id: Joi.string().max(255).allow(null, "").optional(),
  nm_jab: Joi.string().max(255).allow(null, "").optional(),
  jnsUnor_id: Joi.string().max(255).allow(null, "").optional(),
  jnsUnor_kode: Joi.string().max(255).allow(null, "").optional(),
  kategori_jab: Joi.string().valid("STRUKTURAL", "FUNGSIONAL", "PELAKSANA").allow(null, "").optional(),
  eselon_id: Joi.string().max(36).allow(null, "").optional(),
  jns_jab_id: Joi.string().max(36).allow(null, "").optional(),
  jenjang_jab_id: Joi.alternatives().try(Joi.number(), Joi.string()).allow(null, "").optional(),
  bup: Joi.alternatives().try(Joi.number().min(50).max(70), Joi.string()).allow(null, "").optional(),
  kelas_jabatan: Joi.alternatives().try(Joi.number().min(1).max(17), Joi.string()).allow(null, "").optional(),
  kode_jabatan: Joi.string().max(100).allow(null, "").optional(),
  peraturan: Joi.string().max(255).allow(null, "").optional(),
  tglPeraturan: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow(null, "").optional(),
  tahun: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow(null, "").optional(),
  ket: Joi.string().allow(null, "").optional(),
  no_urut: Joi.alternatives().try(Joi.number().integer().min(1), Joi.string()).allow(null, "").optional(),
  isAktif: Joi.alternatives().try(Joi.number().integer().valid(0, 1), Joi.string()).optional(),
};

export const updateUnorSchema = Joi.object({
  ...commonUpdateUnorSchema,
  unorinduk_id: Joi.string().max(255).allow(null, "").optional(),
  unorinduk_kode: Joi.string().max(255).allow(null, "").optional(),
}).min(1);

export const createSubUnorSchema = Joi.object({
  ...commonUnorSchema,
  unor_id: Joi.string().max(255).required(),
  unor_kode: Joi.string().max(255).allow(null, "").optional(),
});

export const updateSubUnorSchema = Joi.object({
  ...commonUpdateUnorSchema,
  unor_id: Joi.string().max(255).allow(null, "").optional(),
  unor_kode: Joi.string().max(255).allow(null, "").optional(),
}).min(1);

export const createSubUnorSubSchema = Joi.object({
  ...commonUnorSchema,
  subUnor_id: Joi.string().max(255).required(),
  subUnor_kode: Joi.string().max(255).allow(null, "").optional(),
});

export const updateSubUnorSubSchema = Joi.object({
  ...commonUpdateUnorSchema,
  subUnor_id: Joi.string().max(255).allow(null, "").optional(),
  subUnor_kode: Joi.string().max(255).allow(null, "").optional(),
}).min(1);

export const moveUnorSchema = Joi.object({
  id: Joi.string().max(255).required(),
  target_parent_id: Joi.string().max(255).allow(null, "").optional(),
  target_instansi_id: Joi.string().max(255).allow(null, "").optional(),
  target_type: Joi.string().valid("instansi", "unor").default("unor"),
});

export const reorderUnorSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().max(255).required(),
        no_urut: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
});


