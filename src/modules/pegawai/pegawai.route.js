import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { uploadDokumenSK, uploadDokumenPendidikan, uploadFotoPegawai } from "../../middlewares/upload.middleware.js";
import {
  getPegawaiSchema,
  createRiwayatGolonganSchema,
  updateRiwayatGolonganSchema,
  createRiwayatKgbSchema,
  updateRiwayatKgbSchema,
  createRiwayatJabatanSchema,
  updateRiwayatJabatanSchema,
  createRiwayatPendidikanSchema,
  updateRiwayatPendidikanSchema,
  createRiwayatDiklatSchema,
  updateRiwayatDiklatSchema,
  createRiwayatProfesiSchema,
  updateRiwayatProfesiSchema,
  createRiwayatHukdisSchema,
  updateRiwayatHukdisSchema,
  createRiwayatOrtuSchema,
  updateRiwayatOrtuSchema,
  createRiwayatPasanganSchema,
  updateRiwayatPasanganSchema,
  createRiwayatAnakSchema,
  updateRiwayatAnakSchema,
  createCpnsPnsSchema,
  updateCpnsPnsSchema,
  createPegawaiSchema,
  updateIdentitasPegawaiSchema,
} from "./pegawai.validation.js";
import * as pegawaiController from "./pegawai.controller.js";

const router = Router();

// Semua route pegawai memerlukan autentikasi
router.use(authenticate);

// GET /api/pegawai - Daftar pegawai dengan search & pagination
router.get("/", validate(getPegawaiSchema), pegawaiController.getPegawai);

// POST /api/pegawai - Tambah pegawai baru
router.post("/", validate(createPegawaiSchema), pegawaiController.createPegawai);

// GET /api/pegawai/referensi/identitas - Master referensi identitas pegawai
router.get("/referensi/identitas", pegawaiController.getRefIdentitas);

// GET /api/pegawai/referensi/golongan - Referensi master golongan & jenis KP
router.get("/referensi/golongan", pegawaiController.getRefGolongan);

// GET /api/pegawai/referensi/jabatan - Referensi master jabatan, unor, eselon, mutasi
router.get("/referensi/jabatan", pegawaiController.getRefJabatan);

// GET /api/pegawai/referensi/pendidikan - Referensi master tingkat pendidikan & jurusan
router.get("/referensi/pendidikan", pegawaiController.getRefPendidikan);

// GET /api/pegawai/referensi/diklat - Referensi master jenis & jenjang diklat
router.get("/referensi/diklat", pegawaiController.getRefDiklat);

// GET /api/pegawai/referensi/profesi - Referensi master jenis profesi
router.get("/referensi/profesi", pegawaiController.getRefProfesi);

// GET /api/pegawai/referensi/hukdis - Referensi master tingkat & jenis hukuman disiplin
router.get("/referensi/hukdis", pegawaiController.getRefHukdis);

// GET /api/pegawai/migration-stats - Statistik migrasi jabatan
router.get("/migration-stats", pegawaiController.getMigrationStats);

// GET /api/pegawai/duk - Laporan DUK
router.get("/duk", pegawaiController.getDUK);

// GET /api/pegawai/duk/export - Export DUK ke Excel
router.get("/duk/export", pegawaiController.exportDUK);

// GET /api/pegawai/pensiun - Laporan Estimasi Pensiun Pegawai
router.get("/pensiun", pegawaiController.getEstimasiPensiun);

// GET /api/pegawai/pensiun/export - Export Estimasi Pensiun ke Excel
router.get("/pensiun/export", pegawaiController.exportEstimasiPensiun);

// GET /api/pegawai/stats - Statistik global
router.get("/stats", pegawaiController.getStats);

// GET /api/pegawai/:id - Detail pegawai
router.get("/:id", pegawaiController.getPegawaiById);

// PUT /api/pegawai/:id/identitas - Update identitas pegawai
router.put("/:id/identitas", validate(updateIdentitasPegawaiSchema), pegawaiController.updateIdentitasPegawai);

// PUT /api/pegawai/:id/foto - Update foto profil pegawai
router.put(
  "/:id/foto",
  uploadFotoPegawai.single("foto"),
  pegawaiController.updateFotoPegawai
);

// DELETE /api/pegawai/:id/foto - Hapus foto profil pegawai
router.delete("/:id/foto", pegawaiController.deleteFotoPegawai);

// POST /api/pegawai/:id/riwayat-golongan - Tambah riwayat golongan (support upload dokumen SK)
router.post(
  "/:id/riwayat-golongan",
  uploadDokumenSK.single("dokumen_sk"),
  validate(createRiwayatGolonganSchema),
  pegawaiController.createRiwayatGolongan
);

// PUT /api/pegawai/:id/riwayat-golongan/:rwtGolId - Update riwayat golongan (support upload dokumen SK)
router.put(
  "/:id/riwayat-golongan/:rwtGolId",
  uploadDokumenSK.single("dokumen_sk"),
  validate(updateRiwayatGolonganSchema),
  pegawaiController.updateRiwayatGolongan
);

// DELETE /api/pegawai/:id/riwayat-golongan/:rwtGolId - Hapus riwayat golongan
router.delete(
  "/:id/riwayat-golongan/:rwtGolId",
  pegawaiController.deleteRiwayatGolongan
);

// POST /api/pegawai/:id/riwayat-kgb - Tambah riwayat KGB (support upload dokumen SK)
router.post(
  "/:id/riwayat-kgb",
  uploadDokumenSK.single("dokumen_sk"),
  validate(createRiwayatKgbSchema),
  pegawaiController.createRiwayatKgb
);

// PUT /api/pegawai/:id/riwayat-kgb/:rwtKgbId - Update riwayat KGB (support upload dokumen SK)
router.put(
  "/:id/riwayat-kgb/:rwtKgbId",
  uploadDokumenSK.single("dokumen_sk"),
  validate(updateRiwayatKgbSchema),
  pegawaiController.updateRiwayatKgb
);

// DELETE /api/pegawai/:id/riwayat-kgb/:rwtKgbId - Hapus riwayat KGB
router.delete(
  "/:id/riwayat-kgb/:rwtKgbId",
  pegawaiController.deleteRiwayatKgb
);

// POST /api/pegawai/:id/riwayat-jabatan - Tambah riwayat jabatan (support upload dokumen SK)
router.post(
  "/:id/riwayat-jabatan",
  uploadDokumenSK.single("dokumen_sk"),
  validate(createRiwayatJabatanSchema),
  pegawaiController.createRiwayatJabatan
);

// PUT /api/pegawai/:id/riwayat-jabatan/:rwtJabId - Update riwayat jabatan (support upload dokumen SK)
router.put(
  "/:id/riwayat-jabatan/:rwtJabId",
  uploadDokumenSK.single("dokumen_sk"),
  validate(updateRiwayatJabatanSchema),
  pegawaiController.updateRiwayatJabatan
);

// DELETE /api/pegawai/:id/riwayat-jabatan/:rwtJabId - Hapus riwayat jabatan
router.delete(
  "/:id/riwayat-jabatan/:rwtJabId",
  pegawaiController.deleteRiwayatJabatan
);

// POST /api/pegawai/:id/riwayat-pendidikan - Tambah riwayat pendidikan (support upload ijazah & transkrip PDF)
router.post(
  "/:id/riwayat-pendidikan",
  uploadDokumenPendidikan,
  validate(createRiwayatPendidikanSchema),
  pegawaiController.createRiwayatPendidikan
);

// PUT /api/pegawai/:id/riwayat-pendidikan/:rwtPendId - Update riwayat pendidikan (support upload ijazah & transkrip PDF)
router.put(
  "/:id/riwayat-pendidikan/:rwtPendId",
  uploadDokumenPendidikan,
  validate(updateRiwayatPendidikanSchema),
  pegawaiController.updateRiwayatPendidikan
);

// DELETE /api/pegawai/:id/riwayat-pendidikan/:rwtPendId - Hapus riwayat pendidikan
router.delete(
  "/:id/riwayat-pendidikan/:rwtPendId",
  pegawaiController.deleteRiwayatPendidikan
);

// POST /api/pegawai/:id/riwayat-diklat - Tambah riwayat diklat (support upload sertifikat PDF)
router.post(
  "/:id/riwayat-diklat",
  uploadDokumenSK.single("dokumen_diklat"),
  validate(createRiwayatDiklatSchema),
  pegawaiController.createRiwayatDiklat
);

// PUT /api/pegawai/:id/riwayat-diklat/:rwtDiklatId - Update riwayat diklat (support upload sertifikat PDF)
router.put(
  "/:id/riwayat-diklat/:rwtDiklatId",
  uploadDokumenSK.single("dokumen_diklat"),
  validate(updateRiwayatDiklatSchema),
  pegawaiController.updateRiwayatDiklat
);

// DELETE /api/pegawai/:id/riwayat-diklat/:rwtDiklatId - Hapus riwayat diklat
router.delete(
  "/:id/riwayat-diklat/:rwtDiklatId",
  pegawaiController.deleteRiwayatDiklat
);

// POST /api/pegawai/:id/riwayat-profesi - Tambah riwayat profesi (support upload sertifikat/STR PDF)
router.post(
  "/:id/riwayat-profesi",
  uploadDokumenSK.single("dokumen_profesi"),
  validate(createRiwayatProfesiSchema),
  pegawaiController.createRiwayatProfesi
);

// PUT /api/pegawai/:id/riwayat-profesi/:rwtProfesiId - Update riwayat profesi (support upload sertifikat/STR PDF)
router.put(
  "/:id/riwayat-profesi/:rwtProfesiId",
  uploadDokumenSK.single("dokumen_profesi"),
  validate(updateRiwayatProfesiSchema),
  pegawaiController.updateRiwayatProfesi
);

// DELETE /api/pegawai/:id/riwayat-profesi/:rwtProfesiId - Hapus riwayat profesi
router.delete(
  "/:id/riwayat-profesi/:rwtProfesiId",
  pegawaiController.deleteRiwayatProfesi
);

// POST /api/pegawai/:id/riwayat-hukdis - Tambah riwayat hukdis (support upload SK PDF)
router.post(
  "/:id/riwayat-hukdis",
  uploadDokumenSK.single("dokumen_sk"),
  validate(createRiwayatHukdisSchema),
  pegawaiController.createRiwayatHukdis
);

// PUT /api/pegawai/:id/riwayat-hukdis/:rwtHukdisId - Update riwayat hukdis (support upload SK PDF)
router.put(
  "/:id/riwayat-hukdis/:rwtHukdisId",
  uploadDokumenSK.single("dokumen_sk"),
  validate(updateRiwayatHukdisSchema),
  pegawaiController.updateRiwayatHukdis
);

// DELETE /api/pegawai/:id/riwayat-hukdis/:rwtHukdisId - Hapus riwayat hukdis
router.delete(
  "/:id/riwayat-hukdis/:rwtHukdisId",
  pegawaiController.deleteRiwayatHukdis
);

// POST /api/pegawai/:id/riwayat-ortu - Tambah data orang tua
router.post(
  "/:id/riwayat-ortu",
  validate(createRiwayatOrtuSchema),
  pegawaiController.createRiwayatOrtu
);

// PUT /api/pegawai/:id/riwayat-ortu/:rwtOrtuId - Update data orang tua
router.put(
  "/:id/riwayat-ortu/:rwtOrtuId",
  validate(updateRiwayatOrtuSchema),
  pegawaiController.updateRiwayatOrtu
);

// DELETE /api/pegawai/:id/riwayat-ortu/:rwtOrtuId - Hapus data orang tua
router.delete(
  "/:id/riwayat-ortu/:rwtOrtuId",
  pegawaiController.deleteRiwayatOrtu
);

// POST /api/pegawai/:id/riwayat-pasangan - Tambah data pasangan (support upload Buku Nikah)
router.post(
  "/:id/riwayat-pasangan",
  uploadDokumenSK.single("dokumen_sk"),
  validate(createRiwayatPasanganSchema),
  pegawaiController.createRiwayatPasangan
);

// PUT /api/pegawai/:id/riwayat-pasangan/:rwtSuisId - Update data pasangan (support upload Buku Nikah)
router.put(
  "/:id/riwayat-pasangan/:rwtSuisId",
  uploadDokumenSK.single("dokumen_sk"),
  validate(updateRiwayatPasanganSchema),
  pegawaiController.updateRiwayatPasangan
);

// DELETE /api/pegawai/:id/riwayat-pasangan/:rwtSuisId - Hapus data pasangan
router.delete(
  "/:id/riwayat-pasangan/:rwtSuisId",
  pegawaiController.deleteRiwayatPasangan
);

// POST /api/pegawai/:id/riwayat-anak - Tambah data anak (support upload Akta Kelahiran)
router.post(
  "/:id/riwayat-anak",
  uploadDokumenSK.single("dokumen_sk"),
  validate(createRiwayatAnakSchema),
  pegawaiController.createRiwayatAnak
);

// PUT /api/pegawai/:id/riwayat-anak/:rwtAnakId - Update data anak (support upload Akta Kelahiran)
router.put(
  "/:id/riwayat-anak/:rwtAnakId",
  uploadDokumenSK.single("dokumen_sk"),
  validate(updateRiwayatAnakSchema),
  pegawaiController.updateRiwayatAnak
);

// DELETE /api/pegawai/:id/riwayat-anak/:rwtAnakId - Hapus data anak
router.delete(
  "/:id/riwayat-anak/:rwtAnakId",
  pegawaiController.deleteRiwayatAnak
);

// POST /api/pegawai/:id/cpns-pns - Tambah data CPNS / PNS (support upload SK)
router.post(
  "/:id/cpns-pns",
  uploadDokumenSK.single("dokumen_sk"),
  validate(createCpnsPnsSchema),
  pegawaiController.createCpnsPns
);

// PUT /api/pegawai/:id/cpns-pns/:cpnsPnsId - Update data CPNS / PNS (support upload SK)
router.put(
  "/:id/cpns-pns/:cpnsPnsId",
  uploadDokumenSK.single("dokumen_sk"),
  validate(updateCpnsPnsSchema),
  pegawaiController.updateCpnsPns
);

// DELETE /api/pegawai/:id/cpns-pns/:cpnsPnsId - Hapus data CPNS / PNS
router.delete(
  "/:id/cpns-pns/:cpnsPnsId",
  pegawaiController.deleteCpnsPns
);

export default router;
