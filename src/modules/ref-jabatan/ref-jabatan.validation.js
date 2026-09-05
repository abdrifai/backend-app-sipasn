import Joi from "joi";

// --- JABATAN (Unified Master) ---
export const createJabSchema = Joi.object({
  nama_jabatan: Joi.string().max(255),
  nm_jab: Joi.string().max(255),
  kode: Joi.string().max(100).allow(null, ""),
  kategori: Joi.string().valid("STRUKTURAL", "FUNGSIONAL", "PELAKSANA").default("PELAKSANA"),
  jns_jab_id: Joi.string().guid({ version: "uuidv4" }).allow(null, ""),
  jenjang_jab_id: Joi.number().allow(null, ""),
  eselon_id: Joi.string().guid({ version: "uuidv4" }).allow(null, ""),
  bup: Joi.number().min(50).max(70).allow(null, ""),
  kelas_jabatan: Joi.number().min(1).max(17).allow(null, ""),
  is_aktif: Joi.number().valid(0, 1).default(1),
}).or("nama_jabatan", "nm_jab");

export const updateJabSchema = Joi.object({
  nama_jabatan: Joi.string().max(255),
  nm_jab: Joi.string().max(255),
  kode: Joi.string().max(100).allow(null, ""),
  kategori: Joi.string().valid("STRUKTURAL", "FUNGSIONAL", "PELAKSANA"),
  jns_jab_id: Joi.string().guid({ version: "uuidv4" }).allow(null, ""),
  jenjang_jab_id: Joi.number().allow(null, ""),
  eselon_id: Joi.string().guid({ version: "uuidv4" }).allow(null, ""),
  bup: Joi.number().min(50).max(70).allow(null, ""),
  kelas_jabatan: Joi.number().min(1).max(17).allow(null, ""),
  is_aktif: Joi.number().valid(0, 1),
});

// --- JABATAN FUNGSIONAL ---
export const createJabFungsionalSchema = Joi.object({
  jenjangJab_id: Joi.string().guid({ version: "uuidv4" }).allow(null, ""),
  nmJab: Joi.string().max(255).required(),
  ket: Joi.string().allow(null, ""),
  kelompok: Joi.string().allow(null, ""),
});

export const updateJabFungsionalSchema = Joi.object({
  jenjangJab_id: Joi.string().guid({ version: "uuidv4" }).allow(null, ""),
  nmJab: Joi.string().max(255),
  ket: Joi.string().allow(null, ""),
  kelompok: Joi.string().allow(null, ""),
});

// --- JABATAN PELAKSANA ---
export const createJabPelaksanaSchema = Joi.object({
  urusan_id: Joi.number().allow(null, ""),
  suburusan_id: Joi.number().allow(null, ""),
  nmJab: Joi.string().max(255).required(),
});

export const updateJabPelaksanaSchema = Joi.object({
  urusan_id: Joi.number().allow(null, ""),
  suburusan_id: Joi.number().allow(null, ""),
  nmJab: Joi.string().max(255),
});

// --- JENJANG JABATAN ---
export const createJenjangJabSchema = Joi.object({
  jnsjab_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required(),
  jenjangjab: Joi.string().max(255).required(),
});

export const updateJenjangJabSchema = Joi.object({
  jnsjab_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()),
  jenjangjab: Joi.string().max(255),
});

// --- JENIS JABATAN ---
export const createJnsJabSchema = Joi.object({
  kode: Joi.alternatives().try(Joi.string().max(10), Joi.number()).required(),
  jnsjab: Joi.string().max(255).required(),
  kode_sapk: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow("")).allow(null).optional(),
  is_aktif: Joi.number().valid(0, 1).default(1),
});

export const updateJnsJabSchema = Joi.object({
  kode: Joi.alternatives().try(Joi.string().max(10), Joi.number()),
  jnsjab: Joi.string().max(255),
  kode_sapk: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow("")).allow(null).optional(),
  is_aktif: Joi.number().valid(0, 1),
});

// --- NAMA JABATAN LAMA ---
export const createNmJabLamaSchema = Joi.object({
  kode: Joi.string().max(255).allow(null, ""),
  nmJab: Joi.string().max(255).required(),
  jnsRumpunJab_id: Joi.string().guid({ version: "uuidv4" }).allow(null, ""),
  jnsRumpunJab_kode: Joi.string().max(255).allow(null, ""),
  rumpunJab_id: Joi.string().guid({ version: "uuidv4" }).allow(null, ""),
  eselon_id: Joi.string().guid({ version: "uuidv4" }).allow(null, ""),
  eselon_kode: Joi.string().max(255).allow(null, ""),
});

export const updateNmJabLamaSchema = Joi.object({
  kode: Joi.string().max(255).allow(null, ""),
  nmJab: Joi.string().max(255),
  jnsRumpunJab_id: Joi.string().guid({ version: "uuidv4" }).allow(null, ""),
  jnsRumpunJab_kode: Joi.string().max(255).allow(null, ""),
  rumpunJab_id: Joi.string().guid({ version: "uuidv4" }).allow(null, ""),
  eselon_id: Joi.string().guid({ version: "uuidv4" }).allow(null, ""),
  eselon_kode: Joi.string().max(255).allow(null, ""),
});
