import Joi from "joi";

const validMismatchTypes = ["all", "nama", "golongan", "pendidikan", "jabatan", "unit_kerja", "unor", "status_kepegawaian", "kedudukan"];

export const getMatchingListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(15),
  status: Joi.string().valid("all", "match", "mismatch", "only_local", "only_siasn").default("all"),
  mismatch_type: Joi.string().valid(...validMismatchTypes).default("all"),
  search: Joi.string().allow("").default(""),
  unorInduk_id: Joi.string().allow("").default(""),
});

export const getMatchingDetailSchema = Joi.object({
  nip: Joi.string().required(),
});

export const exportMatchingSchema = Joi.object({
  status: Joi.string().valid("all", "match", "mismatch", "only_local", "only_siasn").default("all"),
  mismatch_type: Joi.string().valid(...validMismatchTypes).default("all"),
  search: Joi.string().allow("").default(""),
  unorInduk_id: Joi.string().allow("").default(""),
});

export const syncGolonganSchema = Joi.object({
  nips: Joi.array().items(Joi.string().required()).min(1).required(),
});

export const getSyncQueueSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(15),
  search: Joi.string().allow("").default(""),
  status_sk: Joi.string().valid("all", "PENDING", "UPLOADED").default("all"),
});

export const uploadSkGolonganSchema = Joi.object({
  sk: Joi.string().allow("", null).optional(),
  tglSk: Joi.string().allow("", null).optional(),
});

export const checkEducationSyncSchema = Joi.object({
  nip: Joi.string().required(),
});

export const searchPendidikanSchema = Joi.object({
  search: Joi.string().allow("").default(""),
  limit: Joi.number().integer().min(1).max(100).default(25),
});

export const syncPendidikanSchema = Joi.object({
  nip: Joi.string().required(),
  mode: Joi.string().valid("existing", "new").required(),
  selected_pend_id: Joi.when("mode", {
    is: "existing",
    then: Joi.string().required(),
    otherwise: Joi.string().allow("", null).optional(),
  }),
  new_ref: Joi.when("mode", {
    is: "new",
    then: Joi.object({
      tktpend_id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
      pend: Joi.string().min(2).max(255).required(),
      kode: Joi.string().allow("", null).optional(),
    }).required(),
    otherwise: Joi.object().optional(),
  }),
  thnLulus: Joi.string().allow("", null).optional(),
  nmSekolah: Joi.string().allow("", null).optional(),
  noIjazah: Joi.string().allow("", null).optional(),
  tglIjazah: Joi.string().allow("", null).optional(),
});

export const getSyncPendidikanQueueSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(15),
  search: Joi.string().allow("").default(""),
  status_ijazah: Joi.string().valid("all", "PENDING", "UPLOADED").default("all"),
});

export const uploadIjazahPendidikanSchema = Joi.object({
  noIjazah: Joi.string().allow("", null).optional(),
  tglIjazah: Joi.string().allow("", null).optional(),
  nmSekolah: Joi.string().allow("", null).optional(),
});


