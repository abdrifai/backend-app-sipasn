import Joi from "joi";

export const getPegawaiSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().allow("", null).optional(),
}).unknown(true);

export const createRiwayatGolonganSchema = Joi.object({
  gol_id: Joi.string().max(5).required().messages({
    "any.required": "Golongan wajib dipilih",
    "string.empty": "Golongan tidak boleh kosong",
  }),
  sk: Joi.string().max(255).allow("", null).optional(),
  tglSk: Joi.date().iso().required().messages({
    "any.required": "Tanggal SK wajib diisi",
    "date.base": "Format Tanggal SK tidak valid (YYYY-MM-DD)",
  }),
  tmtSk: Joi.date().iso().required().messages({
    "any.required": "TMT Golongan wajib diisi",
    "date.base": "Format TMT Golongan tidak valid (YYYY-MM-DD)",
  }),
  maskerThn: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  maskerBln: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  pertekBkn: Joi.string().max(255).allow("", null).optional(),
  tglPertek: Joi.date().iso().allow("", null).optional(),
  jnsKp_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow("", null).optional(),
  gapok: Joi.alternatives().try(Joi.number().integer().min(0), Joi.string()).allow("", null).optional(),
  pengesahan: Joi.string().max(255).allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
});

export const updateRiwayatGolonganSchema = Joi.object({
  gol_id: Joi.string().max(5).optional(),
  sk: Joi.string().max(255).allow("", null).optional(),
  tglSk: Joi.date().iso().optional(),
  tmtSk: Joi.date().iso().optional(),
  maskerThn: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  maskerBln: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  pertekBkn: Joi.string().max(255).allow("", null).optional(),
  tglPertek: Joi.date().iso().allow("", null).optional(),
  jnsKp_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow("", null).optional(),
  gapok: Joi.alternatives().try(Joi.number().integer().min(0), Joi.string()).allow("", null).optional(),
  pengesahan: Joi.string().max(255).allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
}).min(1);

export const createRiwayatKgbSchema = Joi.object({
  gol_id: Joi.string().max(10).allow("", null).optional(),
  sk: Joi.string().max(255).allow("", null).optional(),
  tglSk: Joi.date().iso().required().messages({
    "any.required": "Tanggal SK KGB wajib diisi",
    "date.base": "Format Tanggal SK tidak valid (YYYY-MM-DD)",
  }),
  tmtSk: Joi.date().iso().required().messages({
    "any.required": "TMT KGB wajib diisi",
    "date.base": "Format TMT KGB tidak valid (YYYY-MM-DD)",
  }),
  maskerThn: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  maskerBln: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  gapok: Joi.alternatives().try(Joi.number().integer().min(0), Joi.string()).required().messages({
    "any.required": "Gaji Pokok Baru wajib diisi",
  }),
  pengesahan: Joi.string().max(255).allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
});

export const updateRiwayatKgbSchema = Joi.object({
  gol_id: Joi.string().max(10).allow("", null).optional(),
  sk: Joi.string().max(255).allow("", null).optional(),
  tglSk: Joi.date().iso().optional(),
  tmtSk: Joi.date().iso().optional(),
  maskerThn: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  maskerBln: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  gapok: Joi.alternatives().try(Joi.number().integer().min(0), Joi.string()).allow("", null).optional(),
  pengesahan: Joi.string().max(255).allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
}).min(1);

export const createRiwayatJabatanSchema = Joi.object({
  jnsJab_id: Joi.string().max(36).allow("", null).optional(),
  nmJab_id: Joi.string().max(255).allow("", null).optional(),
  nama_jabatan_custom: Joi.string().max(255).allow("", null).optional(),
  unorInduk_id: Joi.string().max(36).required().messages({
    "any.required": "Unit Kerja Induk wajib dipilih",
    "string.empty": "Unit Kerja Induk wajib dipilih",
  }),
  eselon_id: Joi.string().max(36).allow("", null).optional(),
  jnsMutasi_id: Joi.string().max(36).allow("", null).optional(),
  sk: Joi.string().max(255).allow("", null).optional(),
  tglSk: Joi.date().iso().required().messages({
    "any.required": "Tanggal SK Jabatan wajib diisi",
    "date.base": "Format Tanggal SK Jabatan tidak valid (YYYY-MM-DD)",
  }),
  tmtSk: Joi.date().iso().required().messages({
    "any.required": "TMT Jabatan wajib diisi",
    "date.base": "Format TMT Jabatan tidak valid (YYYY-MM-DD)",
  }),
  tmtPelantikan: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  pengesahan: Joi.string().max(255).allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
});

export const updateRiwayatJabatanSchema = Joi.object({
  jnsJab_id: Joi.string().max(36).allow("", null).optional(),
  nmJab_id: Joi.string().max(255).allow("", null).optional(),
  nama_jabatan_custom: Joi.string().max(255).allow("", null).optional(),
  unorInduk_id: Joi.string().max(36).optional(),
  eselon_id: Joi.string().max(36).allow("", null).optional(),
  jnsMutasi_id: Joi.string().max(36).allow("", null).optional(),
  sk: Joi.string().max(255).allow("", null).optional(),
  tglSk: Joi.date().iso().optional(),
  tmtSk: Joi.date().iso().optional(),
  tmtPelantikan: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  pengesahan: Joi.string().max(255).allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
}).min(1);

export const createRiwayatPendidikanSchema = Joi.object({
  tktPend_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required().messages({
    "any.required": "Tingkat Pendidikan wajib dipilih",
    "string.empty": "Tingkat Pendidikan wajib dipilih",
  }),
  nmSekolah: Joi.string().max(255).required().messages({
    "any.required": "Nama Lembaga / Sekolah / Universitas wajib diisi",
    "string.empty": "Nama Lembaga / Sekolah / Universitas tidak boleh kosong",
  }),
  pend_id: Joi.string().max(36).allow("", null).optional(),
  jurusan: Joi.string().max(255).allow("", null).optional(),
  thnLulus: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  noIjazah: Joi.string().max(255).allow("", null).optional(),
  tglIjazah: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  gd: Joi.string().max(10).allow("", null).optional(),
  gb: Joi.string().max(20).allow("", null).optional(),
  pengesahan: Joi.string().max(255).allow("", null).optional(),
  dokumen_ijazah: Joi.any().optional(),
  dokumen_transkrip: Joi.any().optional(),
});

export const updateRiwayatPendidikanSchema = Joi.object({
  tktPend_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional(),
  nmSekolah: Joi.string().max(255).optional(),
  pend_id: Joi.string().max(36).allow("", null).optional(),
  jurusan: Joi.string().max(255).allow("", null).optional(),
  thnLulus: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  noIjazah: Joi.string().max(255).allow("", null).optional(),
  tglIjazah: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  gd: Joi.string().max(10).allow("", null).optional(),
  gb: Joi.string().max(20).allow("", null).optional(),
  pengesahan: Joi.string().max(255).allow("", null).optional(),
  dokumen_ijazah: Joi.any().optional(),
  dokumen_transkrip: Joi.any().optional(),
}).min(1);

export const createRiwayatDiklatSchema = Joi.object({
  nmDiklat: Joi.string().max(255).required().messages({
    "any.required": "Nama Diklat / Pelatihan wajib diisi",
    "string.empty": "Nama Diklat / Pelatihan tidak boleh kosong",
  }),
  jnsDiklat_id: Joi.string().max(36).allow("", null).optional(),
  jenjangDiklat_id: Joi.string().max(36).allow("", null).optional(),
  noSertifikat: Joi.string().max(255).allow("", null).optional(),
  tglSertifikat: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  penyelenggara: Joi.string().max(255).allow("", null).optional(),
  angkatan: Joi.string().max(255).allow("", null).optional(),
  t4pelaksanaan: Joi.string().max(255).allow("", null).optional(),
  dokumen_diklat: Joi.any().optional(),
});

export const updateRiwayatDiklatSchema = Joi.object({
  nmDiklat: Joi.string().max(255).optional(),
  jnsDiklat_id: Joi.string().max(36).allow("", null).optional(),
  jenjangDiklat_id: Joi.string().max(36).allow("", null).optional(),
  noSertifikat: Joi.string().max(255).allow("", null).optional(),
  tglSertifikat: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  penyelenggara: Joi.string().max(255).allow("", null).optional(),
  angkatan: Joi.string().max(255).allow("", null).optional(),
  t4pelaksanaan: Joi.string().max(255).allow("", null).optional(),
  dokumen_diklat: Joi.any().optional(),
}).min(1);

export const createRiwayatProfesiSchema = Joi.object({
  jns_profesi_id: Joi.string().max(36).required().messages({
    "any.required": "Jenis profesi wajib dipilih",
    "string.empty": "Jenis profesi tidak boleh kosong",
  }),
  no_sertifikat: Joi.string().max(200).required().messages({
    "any.required": "Nomor sertifikat / STR wajib diisi",
    "string.empty": "Nomor sertifikat / STR tidak boleh kosong",
  }),
  tgl_lulus: Joi.alternatives().try(Joi.date().iso(), Joi.string()).required().messages({
    "any.required": "Tanggal lulus / terbit sertifikat wajib diisi",
    "any.empty": "Tanggal lulus / terbit sertifikat tidak boleh kosong",
  }),
  ket: Joi.string().max(255).allow("", null).optional(),
  berlaku: Joi.string().max(5).allow("", null).optional(),
  dokumen_profesi: Joi.any().optional(),
});

export const updateRiwayatProfesiSchema = Joi.object({
  jns_profesi_id: Joi.string().max(36).optional(),
  no_sertifikat: Joi.string().max(200).optional(),
  tgl_lulus: Joi.alternatives().try(Joi.date().iso(), Joi.string()).optional(),
  ket: Joi.string().max(255).allow("", null).optional(),
  berlaku: Joi.string().max(5).allow("", null).optional(),
  dokumen_profesi: Joi.any().optional(),
}).min(1);

export const createRiwayatHukdisSchema = Joi.object({
  tktHukuman_id: Joi.string().max(36).required().messages({
    "any.required": "Tingkat hukuman wajib dipilih",
    "string.empty": "Tingkat hukuman tidak boleh kosong",
  }),
  jnsHukuman_id: Joi.string().max(36).required().messages({
    "any.required": "Jenis hukuman wajib dipilih",
    "string.empty": "Jenis hukuman tidak boleh kosong",
  }),
  skHd: Joi.string().max(255).required().messages({
    "any.required": "Nomor SK hukuman disiplin wajib diisi",
    "string.empty": "Nomor SK hukuman disiplin tidak boleh kosong",
  }),
  tglSkHd: Joi.alternatives().try(Joi.date().iso(), Joi.string()).required().messages({
    "any.required": "Tanggal SK hukuman disiplin wajib diisi",
    "any.empty": "Tanggal SK hukuman disiplin tidak boleh kosong",
  }),
  tmtSkHd: Joi.alternatives().try(Joi.date().iso(), Joi.string()).required().messages({
    "any.required": "TMT mulai hukuman disiplin wajib diisi",
    "any.empty": "TMT mulai hukuman disiplin tidak boleh kosong",
  }),
  masaHukumanThn: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  masaHukumanBln: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  tglAkhirHukuman: Joi.alternatives().try(Joi.date().iso(), Joi.string()).required().messages({
    "any.required": "Tanggal akhir hukuman disiplin wajib diisi",
    "any.empty": "Tanggal akhir hukuman disiplin tidak boleh kosong",
  }),
  gol_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow("", null).optional(),
  noPP: Joi.string().max(255).allow("", null).optional(),
  alasanHukuman: Joi.string().required().messages({
    "any.required": "Alasan penjatuhan hukuman disiplin wajib diisi",
    "string.empty": "Alasan penjatuhan hukuman disiplin tidak boleh kosong",
  }),
  ket: Joi.string().allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
});

export const updateRiwayatHukdisSchema = Joi.object({
  tktHukuman_id: Joi.string().max(36).optional(),
  jnsHukuman_id: Joi.string().max(36).optional(),
  skHd: Joi.string().max(255).optional(),
  tglSkHd: Joi.alternatives().try(Joi.date().iso(), Joi.string()).optional(),
  tmtSkHd: Joi.alternatives().try(Joi.date().iso(), Joi.string()).optional(),
  masaHukumanThn: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  masaHukumanBln: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  tglAkhirHukuman: Joi.alternatives().try(Joi.date().iso(), Joi.string()).optional(),
  gol_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow("", null).optional(),
  noPP: Joi.string().max(255).allow("", null).optional(),
  alasanHukuman: Joi.string().optional(),
  ket: Joi.string().allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
}).min(1);

export const createRiwayatOrtuSchema = Joi.object({
  orang_id: Joi.string().max(36).allow("", null).optional(),
  hubungan: Joi.string().max(255).required().messages({
    "any.required": "Hubungan keluarga wajib dipilih",
    "string.empty": "Hubungan keluarga tidak boleh kosong",
  }),
  nama: Joi.string().max(200).required().messages({
    "any.required": "Nama orang tua wajib diisi",
    "string.empty": "Nama orang tua tidak boleh kosong",
  }),
  nik: Joi.string().max(19).allow("", null).optional(),
  t4Lhr: Joi.string().max(200).required().messages({
    "any.required": "Tempat lahir wajib diisi",
    "string.empty": "Tempat lahir tidak boleh kosong",
  }),
  tglLhr: Joi.alternatives().try(Joi.date().iso(), Joi.string()).required().messages({
    "any.required": "Tanggal lahir wajib diisi",
    "any.empty": "Tanggal lahir tidak boleh kosong",
  }),
  jkl_id: Joi.string().max(36).allow("", null).optional(),
  pns: Joi.alternatives().try(Joi.boolean(), Joi.number(), Joi.string()).allow("", null).optional(),
  alamat: Joi.string().max(255).allow("", null).optional(),
  no_hp: Joi.string().max(15).allow("", null).optional(),
});

export const updateRiwayatOrtuSchema = Joi.object({
  orang_id: Joi.string().max(36).allow("", null).optional(),
  hubungan: Joi.string().max(255).optional(),
  nama: Joi.string().max(200).optional(),
  nik: Joi.string().max(19).allow("", null).optional(),
  t4Lhr: Joi.string().max(200).optional(),
  tglLhr: Joi.alternatives().try(Joi.date().iso(), Joi.string()).optional(),
  jkl_id: Joi.string().max(36).allow("", null).optional(),
  pns: Joi.alternatives().try(Joi.boolean(), Joi.number(), Joi.string()).allow("", null).optional(),
  alamat: Joi.string().max(255).allow("", null).optional(),
  no_hp: Joi.string().max(15).allow("", null).optional(),
}).min(1);

export const createRiwayatPasanganSchema = Joi.object({
  orang_id: Joi.string().max(36).allow("", null).optional(),
  hubungan: Joi.string().max(100).required().messages({
    "any.required": "Hubungan pasangan wajib dipilih / diisi (contoh: Istri Ke-1, Suami Ke-1)",
    "string.empty": "Hubungan pasangan tidak boleh kosong",
  }),
  nama: Joi.string().max(200).required().messages({
    "any.required": "Nama lengkap pasangan wajib diisi",
    "string.empty": "Nama lengkap pasangan tidak boleh kosong",
  }),
  nik: Joi.string().max(19).allow("", null).optional(),
  t4Lhr: Joi.string().max(200).required().messages({
    "any.required": "Tempat lahir wajib diisi",
    "string.empty": "Tempat lahir tidak boleh kosong",
  }),
  tglLhr: Joi.alternatives().try(Joi.date().iso(), Joi.string()).required().messages({
    "any.required": "Tanggal lahir wajib diisi",
    "any.empty": "Tanggal lahir tidak boleh kosong",
  }),
  jkl_id: Joi.string().max(36).allow("", null).optional(),
  pns: Joi.alternatives().try(Joi.boolean(), Joi.number(), Joi.string()).allow("", null).optional(),
  aktaMenikah: Joi.string().max(255).allow("", null).optional(),
  tglMenikah: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  karisKarsu: Joi.string().max(200).allow("", null).optional(),
  aktaCerai: Joi.string().max(255).allow("", null).optional(),
  tglCerai: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  aktaMeninggal: Joi.string().max(255).allow("", null).optional(),
  tglMeninggal: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  npwp: Joi.string().max(25).allow("", null).optional(),
  alamat: Joi.string().max(255).allow("", null).optional(),
  no_hp: Joi.string().max(15).allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
  dokumen_nikah: Joi.any().optional(),
});

export const updateRiwayatPasanganSchema = Joi.object({
  orang_id: Joi.string().max(36).allow("", null).optional(),
  hubungan: Joi.string().max(100).optional(),
  nama: Joi.string().max(200).optional(),
  nik: Joi.string().max(19).allow("", null).optional(),
  t4Lhr: Joi.string().max(200).optional(),
  tglLhr: Joi.alternatives().try(Joi.date().iso(), Joi.string()).optional(),
  jkl_id: Joi.string().max(36).allow("", null).optional(),
  pns: Joi.alternatives().try(Joi.boolean(), Joi.number(), Joi.string()).allow("", null).optional(),
  aktaMenikah: Joi.string().max(255).allow("", null).optional(),
  tglMenikah: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  karisKarsu: Joi.string().max(200).allow("", null).optional(),
  aktaCerai: Joi.string().max(255).allow("", null).optional(),
  tglCerai: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  aktaMeninggal: Joi.string().max(255).allow("", null).optional(),
  tglMeninggal: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  npwp: Joi.string().max(25).allow("", null).optional(),
  alamat: Joi.string().max(255).allow("", null).optional(),
  no_hp: Joi.string().max(15).allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
  dokumen_nikah: Joi.any().optional(),
}).min(1);

export const createRiwayatAnakSchema = Joi.object({
  orang_id: Joi.string().max(36).allow("", null).optional(),
  ortu_id: Joi.string().max(36).allow("", null).optional(),
  sAnak: Joi.string().max(100).required().messages({
    "any.required": "Status anak wajib dipilih (Kandung/Tiri/Angkat)",
    "string.empty": "Status anak tidak boleh kosong",
  }),
  nama: Joi.string().max(200).required().messages({
    "any.required": "Nama lengkap anak wajib diisi",
    "string.empty": "Nama lengkap anak tidak boleh kosong",
  }),
  nik: Joi.string().max(19).allow("", null).optional(),
  t4Lhr: Joi.string().max(200).required().messages({
    "any.required": "Tempat lahir anak wajib diisi",
    "string.empty": "Tempat lahir anak tidak boleh kosong",
  }),
  tglLhr: Joi.alternatives().try(Joi.date().iso(), Joi.string()).required().messages({
    "any.required": "Tanggal lahir anak wajib diisi",
    "any.empty": "Tanggal lahir anak tidak boleh kosong",
  }),
  jkl_id: Joi.string().valid("1", "2").required().messages({
    "any.required": "Jenis kelamin anak wajib dipilih",
    "any.only": "Jenis kelamin harus Laki-Laki atau Perempuan",
  }),
  pns: Joi.alternatives().try(Joi.boolean(), Joi.number(), Joi.string()).allow("", null).optional(),
  alamat: Joi.string().max(255).allow("", null).optional(),
  no_hp: Joi.string().max(15).allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
  dokumen_anak: Joi.any().optional(),
});

export const updateRiwayatAnakSchema = Joi.object({
  orang_id: Joi.string().max(36).allow("", null).optional(),
  ortu_id: Joi.string().max(36).allow("", null).optional(),
  sAnak: Joi.string().max(100).optional(),
  nama: Joi.string().max(200).optional(),
  nik: Joi.string().max(19).allow("", null).optional(),
  t4Lhr: Joi.string().max(200).optional(),
  tglLhr: Joi.alternatives().try(Joi.date().iso(), Joi.string()).optional(),
  jkl_id: Joi.string().valid("1", "2").optional(),
  pns: Joi.alternatives().try(Joi.boolean(), Joi.number(), Joi.string()).allow("", null).optional(),
  alamat: Joi.string().max(255).allow("", null).optional(),
  no_hp: Joi.string().max(15).allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
  dokumen_anak: Joi.any().optional(),
}).min(1);

export const createCpnsPnsSchema = Joi.object({
  spns_id: Joi.alternatives().try(Joi.string(), Joi.number()).required().messages({
    "any.required": "Status penetapan (CPNS / PNS) wajib dipilih",
    "string.empty": "Status penetapan tidak boleh kosong",
  }),
  sk: Joi.string().max(255).required().messages({
    "any.required": "Nomor SK wajib diisi",
    "string.empty": "Nomor SK tidak boleh kosong",
  }),
  tglsk: Joi.alternatives().try(Joi.date().iso(), Joi.string()).required().messages({
    "any.required": "Tanggal SK wajib diisi",
    "any.empty": "Tanggal SK tidak boleh kosong",
  }),
  tmtsk: Joi.alternatives().try(Joi.date().iso(), Joi.string()).required().messages({
    "any.required": "TMT SK wajib diisi",
    "any.empty": "TMT SK tidak boleh kosong",
  }),
  gol_id: Joi.alternatives().try(Joi.number(), Joi.string()).allow("", null).optional(),
  maskerThn: Joi.alternatives().try(Joi.string().max(2), Joi.number()).allow("", null).optional(),
  maskerBln: Joi.alternatives().try(Joi.string().max(2), Joi.number()).allow("", null).optional(),
  pertekBkn: Joi.string().max(255).allow("", null).optional(),
  tglPertekBkn: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  sttpl: Joi.string().max(255).allow("", null).optional(),
  tglsttpl: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  noKarpeg: Joi.string().max(255).allow("", null).optional(),
  tglKarpeg: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  penanda_tangan: Joi.string().max(200).allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
});

export const updateCpnsPnsSchema = Joi.object({
  spns_id: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
  sk: Joi.string().max(255).optional(),
  tglsk: Joi.alternatives().try(Joi.date().iso(), Joi.string()).optional(),
  tmtsk: Joi.alternatives().try(Joi.date().iso(), Joi.string()).optional(),
  gol_id: Joi.alternatives().try(Joi.number(), Joi.string()).allow("", null).optional(),
  maskerThn: Joi.alternatives().try(Joi.string().max(2), Joi.number()).allow("", null).optional(),
  maskerBln: Joi.alternatives().try(Joi.string().max(2), Joi.number()).allow("", null).optional(),
  pertekBkn: Joi.string().max(255).allow("", null).optional(),
  tglPertekBkn: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  sttpl: Joi.string().max(255).allow("", null).optional(),
  tglsttpl: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  noKarpeg: Joi.string().max(255).allow("", null).optional(),
  tglKarpeg: Joi.alternatives().try(Joi.date().iso(), Joi.string()).allow("", null).optional(),
  penanda_tangan: Joi.string().max(200).allow("", null).optional(),
  dokumen_sk: Joi.any().optional(),
}).min(1);

export const createPegawaiSchema = Joi.object({
  nama: Joi.string().max(200).required().messages({
    "any.required": "Nama lengkap pegawai wajib diisi",
    "string.empty": "Nama lengkap pegawai tidak boleh kosong",
  }),
  nipBaru: Joi.string().max(18).required().messages({
    "any.required": "NIP Baru wajib diisi",
    "string.empty": "NIP Baru tidak boleh kosong",
  }),
  nipLama: Joi.string().max(9).allow("", null).optional(),
  nik: Joi.string().max(19).allow("", null).optional(),
  kk: Joi.string().max(25).allow("", null).optional(),
  t4Lhr: Joi.string().max(200).required().messages({
    "any.required": "Tempat lahir wajib diisi",
    "string.empty": "Tempat lahir tidak boleh kosong",
  }),
  tglLhr: Joi.alternatives().try(Joi.date().iso(), Joi.string()).required().messages({
    "any.required": "Tanggal lahir wajib diisi",
    "any.empty": "Tanggal lahir tidak boleh kosong",
  }),
  jkl_id: Joi.string().valid("1", "2").required().messages({
    "any.required": "Jenis kelamin wajib dipilih",
    "any.only": "Jenis kelamin harus Laki-Laki atau Perempuan",
  }),
  agama_id: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  kawin_id: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  golDarah: Joi.string().max(2).allow("", null).optional(),
  npwp: Joi.string().max(25).allow("", null).optional(),
  email: Joi.string().email().allow("", null).optional(),
  no_hp: Joi.string().max(15).allow("", null).optional(),
  alamat: Joi.string().max(255).allow("", null).optional(),
  karpeg: Joi.string().max(100).allow("", null).optional(),
  taspen: Joi.string().max(100).allow("", null).optional(),
  bpjs: Joi.string().max(100).allow("", null).optional(),
  kedudukanPns_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow("", null).optional(),
  spns_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow("", null).optional(),
});

export const updateIdentitasPegawaiSchema = Joi.object({
  nama: Joi.string().max(200).optional(),
  nipBaru: Joi.string().max(18).optional(),
  nipLama: Joi.string().max(9).allow("", null).optional(),
  nik: Joi.string().max(19).allow("", null).optional(),
  kk: Joi.string().max(25).allow("", null).optional(),
  t4Lhr: Joi.string().max(200).optional(),
  tglLhr: Joi.alternatives().try(Joi.date().iso(), Joi.string()).optional(),
  jkl_id: Joi.string().valid("1", "2").optional(),
  agama_id: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  kawin_id: Joi.alternatives().try(Joi.string(), Joi.number()).allow("", null).optional(),
  golDarah: Joi.string().max(2).allow("", null).optional(),
  npwp: Joi.string().max(25).allow("", null).optional(),
  email: Joi.string().email().allow("", null).optional(),
  no_hp: Joi.string().max(15).allow("", null).optional(),
  alamat: Joi.string().max(255).allow("", null).optional(),
  karpeg: Joi.string().max(100).allow("", null).optional(),
  taspen: Joi.string().max(100).allow("", null).optional(),
  bpjs: Joi.string().max(100).allow("", null).optional(),
  kedudukanPns_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow("", null).optional(),
  spns_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).allow("", null).optional(),
}).min(1);








