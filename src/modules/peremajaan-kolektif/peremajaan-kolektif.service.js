import { randomUUID } from "crypto";
import fs from "fs";
import prisma from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import * as peremajaanRepository from "./peremajaan-kolektif.repository.js";
import { resolveUnorHierarchy } from "../pegawai/pegawai.service.js";
import { resolveJabatanForUnor } from "../ref-unor/ref-unor.jabatan-resolver.js";

/**
 * Helper untuk menghapus file fisik di storage
 */
const removePhysicalFile = (filePath) => {
  if (!filePath) return;
  try {
    const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    if (fs.existsSync(cleanPath)) {
      fs.unlinkSync(cleanPath);
    }
  } catch (err) {
    // Abaikan error jika file sudah terhapus
  }
};

/**
 * Ambil daftar semua SK Kolektif dengan pagination & filter
 */
export const getAllSkKolektif = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, parseInt(query.limit, 10) || 10);
  const search = (query.search || "").trim();
  const status = (query.status || "").trim();

  return peremajaanRepository.findAllSkKolektif({ page, limit, search, status });
};

/**
 * Ambil satu SK Kolektif beserta daftar pegawai
 */
export const getSkKolektifById = async (id) => {
  const sk = await peremajaanRepository.findSkKolektifById(id);
  if (!sk) {
    throw new AppError("Data SK Kolektif tidak ditemukan", 404);
  }

  // Lengkapi rincian nama unor dan nama jabatan untuk setiap pegawai
  const unorIds = [...new Set(sk.pegawai_list.map((p) => p.unor_id).filter(Boolean))];
  const jabIds = [...new Set(sk.pegawai_list.map((p) => p.nm_jab_id).filter(Boolean))];
  const jnsJabIds = [...new Set(sk.pegawai_list.map((p) => p.jns_jab_id).filter(Boolean))];
  const eselonIds = [...new Set(sk.pegawai_list.map((p) => p.eselon_id).filter(Boolean))];

  const [unors, jabatans, jnsJabs, eselons] = await Promise.all([
    unorIds.length > 0
      ? prisma.ref_unitorganisasi.findMany({
          where: { id: { in: unorIds } },
          select: { id: true, nmUnor: true, level: true },
        })
      : [],
    jabIds.length > 0
      ? prisma.ref_jabatan.findMany({
          where: { id: { in: jabIds } },
          select: { id: true, nama_jabatan: true, kategori: true },
        })
      : [],
    jnsJabIds.length > 0
      ? prisma.ref_jnsjab.findMany({
          where: { id: { in: jnsJabIds } },
          select: { id: true, jnsjab: true },
        })
      : [],
    eselonIds.length > 0
      ? prisma.ref_eselon.findMany({
          where: { id: { in: eselonIds } },
          select: { id: true, eselon: true },
        })
      : [],
  ]);

  const unorMap = new Map(unors.map((u) => [u.id, u]));
  const jabMap = new Map(jabatans.map((j) => [j.id, j]));
  const jnsJabMap = new Map(jnsJabs.map((j) => [j.id, j]));
  const eselonMap = new Map(eselons.map((e) => [e.id, e]));

  const enrichedPegawaiList = sk.pegawai_list.map((p) => ({
    ...p,
    nama_unor: unorMap.get(p.unor_id)?.nmUnor || "-",
    nama_jabatan: jabMap.get(p.nm_jab_id)?.nama_jabatan || "-",
    nama_jns_jab: jnsJabMap.get(p.jns_jab_id)?.jnsjab || "-",
    nama_eselon: eselonMap.get(p.eselon_id)?.eselon || "-",
  }));

  return {
    ...sk,
    pegawai_list: enrichedPegawaiList,
  };
};

/**
 * Buat SK Kolektif baru beserta upload 1 file arsip PDF
 */
export const createSkKolektif = async (payload, file = null, userId = null) => {
  const skId = randomUUID();
  const createData = {
    id: skId,
    no_sk: payload.no_sk,
    tgl_sk: new Date(payload.tgl_sk),
    tmt_sk: new Date(payload.tmt_sk),
    jns_mutasi_id: payload.jns_mutasi_id || null,
    pengesahan: payload.pengesahan || "-",
    keterangan: payload.keterangan || null,
    arsip_path: file ? file.path : null,
    status: "DRAFT",
    created_by: userId ? BigInt(userId) : null,
  };

  return peremajaanRepository.createSkKolektif(createData);
};

/**
 * Update metadata SK Kolektif (hanya jika berstatus DRAFT)
 */
export const updateSkKolektif = async (id, payload, file = null) => {
  const existing = await peremajaanRepository.findSkKolektifById(id);
  if (!existing) {
    throw new AppError("Data SK Kolektif tidak ditemukan", 404);
  }
  if (existing.status === "PROCESSED") {
    throw new AppError("SK Kolektif yang sudah diproses tidak dapat diubah", 400);
  }

  const updateData = {};
  if (payload.no_sk) updateData.no_sk = payload.no_sk;
  if (payload.tgl_sk) updateData.tgl_sk = new Date(payload.tgl_sk);
  if (payload.tmt_sk) updateData.tmt_sk = new Date(payload.tmt_sk);
  if (payload.jns_mutasi_id !== undefined) updateData.jns_mutasi_id = payload.jns_mutasi_id || null;
  if (payload.pengesahan !== undefined) updateData.pengesahan = payload.pengesahan || "-";
  if (payload.keterangan !== undefined) updateData.keterangan = payload.keterangan || null;

  if (file) {
    if (existing.arsip_path && existing.arsip_path !== file.path) {
      removePhysicalFile(existing.arsip_path);
    }
    updateData.arsip_path = file.path;
  }

  return peremajaanRepository.updateSkKolektif(id, updateData);
};

/**
 * Hapus SK Kolektif (hanya jika DRAFT)
 */
export const deleteSkKolektif = async (id) => {
  const existing = await peremajaanRepository.findSkKolektifById(id);
  if (!existing) {
    throw new AppError("Data SK Kolektif tidak ditemukan", 404);
  }
  if (existing.status === "PROCESSED") {
    throw new AppError("SK Kolektif yang sudah diproses tidak dapat dihapus", 400);
  }

  if (existing.arsip_path) {
    removePhysicalFile(existing.arsip_path);
  }

  return peremajaanRepository.softDeleteSkKolektif(id);
};

/**
 * Tambah pegawai ke dalam SK Kolektif
 */
export const addPegawaiToSkKolektif = async (skKolektifId, payload) => {
  const sk = await peremajaanRepository.findSkKolektifById(skKolektifId);
  if (!sk) {
    throw new AppError("Data SK Kolektif tidak ditemukan", 404);
  }
  if (sk.status === "PROCESSED") {
    throw new AppError("Tidak dapat menambah pegawai pada SK Kolektif yang sudah diproses", 400);
  }

  // Cek duplikasi pegawai dalam SK yang sama
  const duplicate = await peremajaanRepository.findPegawaiInSkKolektif(skKolektifId, payload.pegawai_id);
  if (duplicate) {
    throw new AppError(`Pegawai dengan NIP ${payload.nip} sudah ada di dalam daftar SK ini`, 409);
  }

  // Ambil nama pegawai jika belum disertakan
  let namaPegawai = payload.nama;
  if (!namaPegawai) {
    const peg = await prisma.ta_pegawai.findFirst({
      where: { id: payload.pegawai_id },
      select: {
        ta_orang: { select: { nama: true } },
        rwt_pend: { select: { gd: true, gb: true } },
      },
    });
    namaPegawai = formatNamaGelar(
      peg?.ta_orang?.nama,
      peg?.rwt_pend?.gd,
      peg?.rwt_pend?.gb
    );
  }

  const createData = {
    id: randomUUID(),
    sk_kolektif_id: skKolektifId,
    pegawai_id: payload.pegawai_id,
    nip: payload.nip,
    nama: namaPegawai,
    jns_jab_id: payload.jns_jab_id || null,
    unor_id: payload.unor_id,
    nm_jab_id: payload.nm_jab_id || null,
    eselon_id: payload.eselon_id || null,
    status: "DRAFT",
    keterangan: payload.keterangan || null,
  };

  return peremajaanRepository.addPegawaiToSkKolektif(createData);
};

/**
 * Hapus pegawai dari daftar SK Kolektif
 */
export const removePegawaiFromSkKolektif = async (skKolektifId, pegawaiItemId) => {
  const sk = await peremajaanRepository.findSkKolektifById(skKolektifId);
  if (!sk) {
    throw new AppError("Data SK Kolektif tidak ditemukan", 404);
  }
  if (sk.status === "PROCESSED") {
    throw new AppError("Tidak dapat menghapus pegawai dari SK Kolektif yang sudah diproses", 400);
  }

  const item = await peremajaanRepository.findSkKolektifPegawaiById(pegawaiItemId);
  if (!item || item.sk_kolektif_id !== skKolektifId) {
    throw new AppError("Data pegawai dalam SK tidak ditemukan", 404);
  }

  return peremajaanRepository.softDeletePegawaiFromSkKolektif(pegawaiItemId);
};

/**
 * PROSES KOLEKTIF: Simpan semua data pegawai ke rwt_jabatan & ta_arsip (1 arsip bersama)
 */
export const processSkKolektif = async (skKolektifId, userId = null) => {
  const sk = await peremajaanRepository.findSkKolektifById(skKolektifId);
  if (!sk) {
    throw new AppError("Data SK Kolektif tidak ditemukan", 404);
  }
  if (sk.status === "PROCESSED") {
    throw new AppError("SK Kolektif ini sudah pernah diproses ke riwayat jabatan", 400);
  }

  const pendingList = sk.pegawai_list.filter((p) => p.status === "DRAFT");
  if (pendingList.length === 0) {
    throw new AppError("Tidak ada pegawai berstatus draft untuk diproses", 400);
  }

  // Jalankan transaksi database atomic
  const result = await prisma.$transaction(
    async (tx) => {
      const processedResults = [];

      for (const item of pendingList) {
        const rwtJabId = randomUUID();
        const nipBaru = item.nip || "";

        let instansiId = "1";
        let jnsUnorId = "1";
        let unorHierarchy = null;
        let nmJabId = item.nm_jab_id || null;
        let jnsJabId = item.jns_jab_id || null;

        // Resolve hierarki UNOR
        if (item.unor_id) {
          unorHierarchy = await resolveUnorHierarchy(item.unor_id, tx);
          if (unorHierarchy) {
            instansiId = unorHierarchy.instansi_id || "1";
            jnsUnorId = unorHierarchy.jnsUnor_id || "1";

            // Jika nama jabatan belum terisi, coba selesaikan otomatis berdasarkan UNOR
            if (!nmJabId) {
              const resolved = await resolveJabatanForUnor({
                nmUnor: unorHierarchy.deepestUnor.nmUnor,
                jabId: unorHierarchy.deepestUnor.jab_id,
                level: unorHierarchy.deepestUnor.level,
              });
              if (resolved?.jab_id) {
                nmJabId = resolved.jab_id;
              }
            }
          }
        }

        // Siapkan record rwt_jabatan
        const rwtJabatanData = {
          id: rwtJabId,
          pegawai_id: item.pegawai_id,
          nipBaru,
          sk: sk.no_sk,
          tglSk: sk.tgl_sk,
          tmtSk: sk.tmt_sk,
          jnsJab_id: jnsJabId,
          nmJab_id: nmJabId,
          unorInduk_id: unorHierarchy?.unorInduk_id || item.unor_id,
          unorInduk_kode: unorHierarchy?.unorInduk_kode || null,
          unor_id: unorHierarchy?.unor_id || null,
          unor_kode: unorHierarchy?.unor_kode || null,
          subUnor_id: unorHierarchy?.subUnor_id || null,
          subUnor_kode: unorHierarchy?.subUnor_kode || null,
          subUnorSub_id: unorHierarchy?.subUnorSub_id || null,
          subUnorSub_kode: unorHierarchy?.subUnorSub_kode || null,
          instansi_id: instansiId,
          instansi_kode: "7209",
          jnsUnor_id: jnsUnorId,
          eselon_id: item.eselon_id || null,
          jnsMutasi_id: sk.jns_mutasi_id || null,
          pengesahan: sk.pengesahan || "-",
          user_created: userId ? parseInt(userId, 10) : null,
        };

        // 1. Simpan ke rwt_jabatan
        await tx.rwt_jabatan.create({
          data: rwtJabatanData,
          select: { id: true },
        });

        // 2. Simpan referensi ke ta_arsip (menggunakan 1 file fisik SK yang sama di server)
        if (sk.arsip_path) {
          const existingArsip = await tx.ta_arsip.findFirst({
            where: { from: rwtJabId, jnsarsip_id: 1 },
            select: { id: true },
          });

          if (existingArsip) {
            await tx.ta_arsip.update({
              where: { id: existingArsip.id },
              data: { arsip: sk.arsip_path },
              select: { id: true },
            });
          } else {
            await tx.ta_arsip.create({
              data: {
                id: randomUUID(),
                pegawai_id: item.pegawai_id,
                from: rwtJabId,
                jnsarsip_id: 1, // Jenis arsip SK Jabatan
                arsip: sk.arsip_path,
              },
              select: { id: true },
            });
          }
        }

        // 3. Update jabatan aktif di ta_pegawai jika tmtSk ini adalah yang terbaru
        const latestJab = await tx.rwt_jabatan.findFirst({
          where: { pegawai_id: item.pegawai_id },
          orderBy: { tmtSk: "desc" },
          select: { id: true },
        });

        if (latestJab && latestJab.id === rwtJabId) {
          await tx.ta_pegawai.update({
            where: { id: item.pegawai_id },
            data: { rwtJab_id: rwtJabId },
            select: { id: true },
          });
        }

        // 4. Update status item di ta_sk_kolektif_pegawai
        await tx.ta_sk_kolektif_pegawai.update({
          where: { id: item.id },
          data: {
            rwt_jab_id: rwtJabId,
            status: "PROCESSED",
          },
          select: { id: true },
        });

        processedResults.push({
          pegawai_id: item.pegawai_id,
          nip: item.nip,
          rwt_jab_id: rwtJabId,
        });
      }

      // 5. Update header SK Kolektif menjadi PROCESSED
      await tx.ta_sk_kolektif.update({
        where: { id: skKolektifId },
        data: {
          status: "PROCESSED",
          processed_at: new Date(),
          processed_by: userId ? BigInt(userId) : null,
        },
        select: { id: true },
      });

      return {
        total_processed: processedResults.length,
        items: processedResults,
      };
    },
    { timeout: 60000 } // 60s timeout untuk batch processing
  );

  return result;
};

/**
 * Autocomplete pencarian pegawai
 */
export const searchPegawaiOptions = async (query = {}) => {
  const keyword = (query.keyword || query.q || "").trim();
  return peremajaanRepository.searchPegawai(keyword, 20);
};

/**
 * Ambil master referensi options untuk dropdown form
 */
export const getReferensiOptions = async () => {
  return peremajaanRepository.getReferensiOptions();
};

/**
 * Cari daftar jabatan untuk autocomplete
 */
export const searchJabatanOptions = async (query = {}) => {
  const keyword = (query.keyword || query.q || "").trim();
  const kategori = (query.kategori || "").trim();
  return peremajaanRepository.searchJabatan(keyword, kategori);
};

/**
 * Cari daftar Unit Organisasi (OPD) untuk autocomplete
 */
export const searchUnorOptions = async (query = {}) => {
  const keyword = (query.keyword || query.q || "").trim();
  return peremajaanRepository.searchUnor(keyword);
};
