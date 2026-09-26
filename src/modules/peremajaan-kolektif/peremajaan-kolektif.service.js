import { randomUUID } from "crypto";
import fs from "fs";
import prisma from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import * as peremajaanRepository from "./peremajaan-kolektif.repository.js";
import { resolveUnorHierarchy, formatNamaGelar } from "../pegawai/pegawai.service.js";
import { resolveJabatanForUnor } from "../ref-unor/ref-unor.jabatan-resolver.js";
import { getAllUnorDescendantIds } from "../ref-unor/ref-unor.service.js";

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

  const [unors, jabatans] = await Promise.all([
    unorIds.length > 0
      ? prisma.ref_unitorganisasi.findMany({
          where: { id: { in: unorIds } },
          select: { id: true, nmUnor: true, level: true },
        })
      : [],
    jabIds.length > 0
      ? prisma.ref_jabatan.findMany({
          where: { id: { in: jabIds } },
          select: {
            id: true,
            nama_jabatan: true,
            kategori: true,
            ref_jnsjab: { select: { id: true, jnsjab: true } },
            ref_jenjangjab: { select: { id: true, jenjangjab: true } },
            ref_eselon: { select: { id: true, eselon: true } },
          },
        })
      : [],
  ]);

  const unorMap = new Map(unors.map((u) => [u.id, u]));
  const jabMap = new Map(jabatans.map((j) => [j.id, j]));

  const enrichedPegawaiList = sk.pegawai_list.map((p) => {
    const jab = jabMap.get(p.nm_jab_id);
    return {
      ...p,
      nama_unor: unorMap.get(p.unor_id)?.nmUnor || "-",
      nama_jabatan: jab?.nama_jabatan || "-",
      nama_jns_jab: jab?.ref_jenjangjab?.jenjangjab || jab?.ref_jnsjab?.jnsjab || jab?.kategori || "-",
      nama_eselon: jab?.ref_eselon?.eselon || "-",
    };
  });

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
          nmJab_id: nmJabId,
          unorInduk_id: unorHierarchy?.unorInduk_id || item.unor_id,
          unor_id: unorHierarchy?.unor_id || null,
          subUnor_id: unorHierarchy?.subUnor_id || null,
          subUnorSub_id: unorHierarchy?.subUnorSub_id || null,
          instansi_id: instansiId,
          jnsUnor_id: jnsUnorId,
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

/**
 * Mengambil daftar pegawai aktif berdasarkan unit organisasi (untuk seleksi mutasi masal)
 */
export const getPegawaiByUnor = async (query = {}) => {
  const unorId = (query.unor_id || "").trim();
  if (!unorId) {
    throw new AppError("Unit Organisasi (unor_id) wajib disertakan", 400);
  }

  const includeSub =
    query.include_sub === true ||
    query.include_sub === "true" ||
    query.include_sub === 1 ||
    query.include_sub === "1";
  const search = (query.search || "").trim();
  const skKolektifId = (query.sk_kolektif_id || "").trim() || null;

  let unorIds = [unorId];
  if (includeSub) {
    unorIds = await getAllUnorDescendantIds(unorId);
  }

  const list = await peremajaanRepository.findPegawaiByUnor({
    unorIds,
    search,
    skKolektifId,
  });

  return list.map((item) => ({
    ...item,
    nama: formatNamaGelar(item.nama_raw, item.gd, item.gb),
  }));
};

/**
 * Mutasi Masal: Tambah sekelompok pegawai ke SK Kolektif sekaligus
 */
export const addPegawaiBatchToSkKolektif = async (skKolektifId, payload) => {
  const sk = await peremajaanRepository.findSkKolektifById(skKolektifId);
  if (!sk) {
    throw new AppError("Data SK Kolektif tidak ditemukan", 404);
  }
  if (sk.status === "PROCESSED") {
    throw new AppError("Tidak dapat menambah pegawai pada SK Kolektif yang sudah diproses", 400);
  }

  const { target_unor_id, target_nm_jab_id, keterangan, pegawai_list } = payload;
  if (!pegawai_list || pegawai_list.length === 0) {
    throw new AppError("Daftar pegawai yang akan dimutasi tidak boleh kosong", 400);
  }

  // Cek unit organisasi tujuan
  const targetUnor = await prisma.ref_unitorganisasi.findFirst({
    where: { id: target_unor_id, is_deleted: false },
    select: { id: true, nmUnor: true, jab_id: true, level: true },
  });
  if (!targetUnor) {
    throw new AppError("Unit Organisasi tujuan tidak valid atau tidak ditemukan", 404);
  }

  // Dapatkan daftar pegawai yang sudah ada di SK ini agar tidak duplikat
  const existingPegawaiInSk = await prisma.ta_sk_kolektif_pegawai.findMany({
    where: { sk_kolektif_id: skKolektifId, is_deleted: false },
    select: { pegawai_id: true },
  });
  const existingSet = new Set(existingPegawaiInSk.map((p) => p.pegawai_id));

  // Ambil detail pegawai dari database untuk melengkapi NIP, nama, dan jabatan
  const pegawaiIds = pegawai_list.map((p) => p.pegawai_id);
  const dbPegawaiList = await prisma.ta_pegawai.findMany({
    where: { id: { in: pegawaiIds } },
    select: {
      id: true,
      nipBaru: true,
      ta_orang: { select: { nama: true } },
      rwt_pend: { select: { gd: true, gb: true } },
      rwt_jabatan: {
        select: {
          nmJab_id: true,
          ref_jabatan: {
            select: { eselon_id: true, jns_jab_id: true },
          },
        },
      },
    },
  });
  const dbPegawaiMap = new Map(dbPegawaiList.map((p) => [p.id, p]));

  const recordsToInsert = [];
  const skippedList = [];

  for (const item of pegawai_list) {
    if (existingSet.has(item.pegawai_id)) {
      skippedList.push({ pegawai_id: item.pegawai_id, reason: "Sudah terdaftar di SK ini" });
      continue;
    }

    const dbPeg = dbPegawaiMap.get(item.pegawai_id);
    const nip = item.nip || dbPeg?.nipBaru || "";
    let nama = item.nama;
    if (!nama && dbPeg) {
      nama = formatNamaGelar(dbPeg.ta_orang?.nama, dbPeg.rwt_pend?.gd, dbPeg.rwt_pend?.gb);
    }

    // Tentukan jabatan tujuan:
    // 1. Dari spesifik per-item nm_jab_id (jika ada)
    // 2. Atau target_nm_jab_id batch (jika dipilih)
    // 3. Atau jabatan asal (dbPeg.rwt_jabatan.nmJab_id)
    // 4. Atau jabatan bawaan target unor (targetUnor.jab_id)
    const nmJabId = item.nm_jab_id || target_nm_jab_id || dbPeg?.rwt_jabatan?.nmJab_id || targetUnor.jab_id || null;
    const jnsJabId = item.jns_jab_id || dbPeg?.rwt_jabatan?.ref_jabatan?.jns_jab_id || null;
    const eselonId = item.eselon_id || dbPeg?.rwt_jabatan?.ref_jabatan?.eselon_id || null;
    const ket = item.keterangan || keterangan || null;

    recordsToInsert.push({
      id: randomUUID(),
      sk_kolektif_id: skKolektifId,
      pegawai_id: item.pegawai_id,
      nip,
      nama: nama || "-",
      unor_id: target_unor_id,
      nm_jab_id: nmJabId,
      jns_jab_id: jnsJabId,
      eselon_id: eselonId,
      status: "DRAFT",
      keterangan: ket,
    });

    existingSet.add(item.pegawai_id);
  }

  if (recordsToInsert.length === 0) {
    throw new AppError("Semua pegawai yang dipilih sudah terdaftar di dalam SK Kolektif ini", 400);
  }

  const inserted = await peremajaanRepository.addPegawaiBatch(recordsToInsert);

  return {
    total_added: inserted.length,
    total_skipped: skippedList.length,
    skipped: skippedList,
    items: inserted,
  };
};

/**
 * Ambil daftar riwayat mutasi masal unit organisasi (tanpa SK)
 */
export const getAllMutasiUnor = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.max(1, parseInt(query.limit, 10) || 10);
  const search = (query.search || "").trim();
  const status = (query.status || "").trim();

  const result = await peremajaanRepository.findAllMutasiUnor({ page, limit, search, status });

  // Lengkapi nama unor asal dan tujuan
  const unorIds = [
    ...new Set(
      result.data
        .map((r) => [r.asal_unor_id, r.tujuan_unor_id])
        .flat()
        .filter(Boolean)
    ),
  ];

  const unors =
    unorIds.length > 0
      ? await prisma.ref_unitorganisasi.findMany({
          where: { id: { in: unorIds } },
          select: { id: true, nmUnor: true },
        })
      : [];

  const unorMap = new Map(unors.map((u) => [u.id, u.nmUnor]));

  // Lengkapi data user pembuat & perestore
  const userIds = [
    ...new Set(
      result.data
        .map((r) => [r.created_by, r.restored_by])
        .flat()
        .filter(Boolean)
        .map((id) => BigInt(id))
    ),
  ];

  const userList =
    userIds.length > 0
      ? await prisma.users.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, nama_lengkap: true },
        })
      : [];

  const userMap = new Map(
    userList.map((u) => [
      u.id.toString(),
      {
        id: u.id.toString(),
        username: u.username,
        nama: u.nama_lengkap || u.username,
      },
    ])
  );

  const enrichedData = result.data.map((item) => ({
    ...item,
    nama_asal_unor: unorMap.get(item.asal_unor_id) || "-",
    nama_tujuan_unor: unorMap.get(item.tujuan_unor_id) || "-",
    user_created: item.created_by ? userMap.get(item.created_by.toString()) || null : null,
    user_restored: item.restored_by ? userMap.get(item.restored_by.toString()) || null : null,
  }));

  return {
    data: enrichedData,
    meta: result.meta,
  };
};

/**
 * Ambil rincian satu mutasi unit organisasi beserta daftar pegawai
 */
export const getMutasiUnorById = async (id) => {
  const mutasi = await peremajaanRepository.findMutasiUnorById(id);
  if (!mutasi) {
    throw new AppError("Data riwayat mutasi unit organisasi tidak ditemukan", 404);
  }

  const [asalUnor, tujuanUnor] = await Promise.all([
    prisma.ref_unitorganisasi.findFirst({
      where: { id: mutasi.asal_unor_id },
      select: { id: true, parent_id: true, nmUnor: true, isAktif: true },
    }),
    prisma.ref_unitorganisasi.findFirst({
      where: { id: mutasi.tujuan_unor_id },
      select: { id: true, parent_id: true, nmUnor: true, isAktif: true },
    }),
  ]);

  let isAsalAktif = asalUnor ? asalUnor.isAktif === 1 : false;
  if (isAsalAktif && asalUnor?.parent_id) {
    let currP = asalUnor.parent_id;
    const visitedP = new Set([asalUnor.id]);
    while (currP && !visitedP.has(currP)) {
      visitedP.add(currP);
      const parentNode = await prisma.ref_unitorganisasi.findFirst({
        where: { id: currP, is_deleted: false },
        select: { id: true, parent_id: true, isAktif: true },
      });
      if (parentNode && parentNode.isAktif !== 1) {
        isAsalAktif = false;
        break;
      }
      currP = parentNode?.parent_id;
    }
  }

  const detailUserIds = [mutasi.created_by, mutasi.restored_by]
    .filter(Boolean)
    .map((uid) => BigInt(uid));

  const detailUserList =
    detailUserIds.length > 0
      ? await prisma.users.findMany({
          where: { id: { in: detailUserIds } },
          select: { id: true, username: true, nama_lengkap: true },
        })
      : [];

  const detailUserMap = new Map(
    detailUserList.map((u) => [
      u.id.toString(),
      {
        id: u.id.toString(),
        username: u.username,
        nama: u.nama_lengkap || u.username,
      },
    ])
  );

  return {
    ...mutasi,
    nama_asal_unor: asalUnor?.nmUnor || "-",
    nama_tujuan_unor: tujuanUnor?.nmUnor || "-",
    is_asal_unor_aktif: isAsalAktif,
    user_created: mutasi.created_by ? detailUserMap.get(mutasi.created_by.toString()) || null : null,
    user_restored: mutasi.restored_by ? detailUserMap.get(mutasi.restored_by.toString()) || null : null,
  };
};

/**
 * Terapkan Mutasi Masal Unit Organisasi Langsung (Tanpa SK)
 */
export const createMutasiUnor = async (payload, userId = null) => {
  const { asal_unor_id, tujuan_unor_id, target_nm_jab_id, keterangan, pegawai_ids, pegawai_list } = payload;

  if (asal_unor_id === tujuan_unor_id) {
    throw new AppError("Unit Organisasi tujuan tidak boleh sama dengan Unit Organisasi asal", 400);
  }

  // 1. Validasi kedua unor
  const [asalUnor, tujuanUnor] = await Promise.all([
    prisma.ref_unitorganisasi.findFirst({
      where: { id: asal_unor_id, is_deleted: false },
      select: { id: true, nmUnor: true },
    }),
    prisma.ref_unitorganisasi.findFirst({
      where: { id: tujuan_unor_id, is_deleted: false },
      select: { id: true, nmUnor: true },
    }),
  ]);

  if (!asalUnor) throw new AppError("Unit Organisasi Asal tidak ditemukan", 404);
  if (!tujuanUnor) throw new AppError("Unit Organisasi Tujuan tidak ditemukan", 404);

  // 2. Resolve hierarki untuk unor tujuan
  const unorHierarchy = await resolveUnorHierarchy(tujuan_unor_id);
  const newUnorData = {
    unorInduk_id: unorHierarchy?.unorInduk_id || tujuan_unor_id,
    unor_id: unorHierarchy?.unor_id || null,
    subUnor_id: unorHierarchy?.subUnor_id || null,
    subUnorSub_id: unorHierarchy?.subUnorSub_id || null,
    instansi_id: unorHierarchy?.instansi_id || "1",
    jnsUnor_id: unorHierarchy?.jnsUnor_id || "1",
  };

  // Tentukan target pegawai IDs & mapping custom jabatan per pegawai jika ada
  const targetIds = Array.isArray(pegawai_list) && pegawai_list.length > 0
    ? pegawai_list.map((p) => p.pegawai_id)
    : (Array.isArray(pegawai_ids) ? pegawai_ids : []);

  if (targetIds.length === 0) {
    throw new AppError("Pilih minimal 1 pegawai untuk dipindahkan", 400);
  }

  const customMapByPegawai = new Map();
  if (Array.isArray(pegawai_list)) {
    for (const item of pegawai_list) {
      if (item.pegawai_id) {
        customMapByPegawai.set(item.pegawai_id, item);
      }
    }
  }

  // 3. Ambil data pegawai beserta rwt_jabatan aktif
  const targetPegawaiList = await prisma.ta_pegawai.findMany({
    where: {
      id: { in: targetIds },
      kedudukanPns_id: { in: [1, 7, 8, 10] },
    },
    select: {
      id: true,
      nipBaru: true,
      ta_orang: { select: { nama: true } },
      rwt_pend: { select: { gd: true, gb: true } },
      rwt_jabatan: {
        select: {
          id: true,
          unorInduk_id: true,
          unor_id: true,
          subUnor_id: true,
          subUnorSub_id: true,
          instansi_id: true,
          jnsUnor_id: true,
          nmJab_id: true,
        },
      },
    },
  });

  if (targetPegawaiList.length === 0) {
    throw new AppError("Tidak ada pegawai aktif yang valid untuk dipindahkan", 400);
  }

  const mutasiId = randomUUID();
  const mutasiData = {
    id: mutasiId,
    tgl_mutasi: new Date(),
    asal_unor_id,
    tujuan_unor_id,
    keterangan: keterangan || null,
    status: "APPLIED",
    created_by: userId ? BigInt(userId) : null,
  };

  const pegawaiRecords = [];
  const rwtJabUpdates = [];

  for (const peg of targetPegawaiList) {
    if (!peg.rwt_jabatan?.id) continue;

    const namaFormatted = formatNamaGelar(
      peg.ta_orang?.nama,
      peg.rwt_pend?.gd,
      peg.rwt_pend?.gb
    );

    const empCustom = customMapByPegawai.get(peg.id);
    const empTujuanUnorId = empCustom?.tujuan_unor_id || tujuan_unor_id;

    let empUnorData = newUnorData;
    if (empTujuanUnorId && empTujuanUnorId !== tujuan_unor_id) {
      const customHierarchy = await resolveUnorHierarchy(empTujuanUnorId);
      empUnorData = {
        unorInduk_id: customHierarchy?.unorInduk_id || empTujuanUnorId,
        unor_id: customHierarchy?.unor_id || null,
        subUnor_id: customHierarchy?.subUnor_id || null,
        subUnorSub_id: customHierarchy?.subUnorSub_id || null,
        instansi_id: customHierarchy?.instansi_id || "1",
        jnsUnor_id: customHierarchy?.jnsUnor_id || "1",
      };
    }

    const oldNmJabId = peg.rwt_jabatan.nmJab_id || null;
    const newNmJabId = empCustom?.nm_jab_id || target_nm_jab_id || oldNmJabId;

    // Catat snapshot data lama dan data baru
    pegawaiRecords.push({
      id: randomUUID(),
      mutasi_unor_id: mutasiId,
      pegawai_id: peg.id,
      nip: peg.nipBaru,
      nama: namaFormatted || "-",
      rwt_jab_id: peg.rwt_jabatan.id,
      old_unorInduk_id: peg.rwt_jabatan.unorInduk_id,
      old_unor_id: peg.rwt_jabatan.unor_id,
      old_subUnor_id: peg.rwt_jabatan.subUnor_id,
      old_subUnorSub_id: peg.rwt_jabatan.subUnorSub_id,
      old_instansi_id: peg.rwt_jabatan.instansi_id,
      old_jnsUnor_id: peg.rwt_jabatan.jnsUnor_id,
      old_nm_jab_id: oldNmJabId,
      new_unorInduk_id: empUnorData.unorInduk_id,
      new_unor_id: empUnorData.unor_id,
      new_subUnor_id: empUnorData.subUnor_id,
      new_subUnorSub_id: empUnorData.subUnorSub_id,
      new_instansi_id: empUnorData.instansi_id,
      new_jnsUnor_id: empUnorData.jnsUnor_id,
      new_nm_jab_id: newNmJabId,
    });

    rwtJabUpdates.push({
      rwt_jab_id: peg.rwt_jabatan.id,
      newUnorData: {
        ...empUnorData,
        ...(newNmJabId && newNmJabId !== oldNmJabId ? { nmJab_id: newNmJabId } : {}),
      },
    });
  }

  const result = await peremajaanRepository.createMutasiUnorTransaction({
    mutasiData,
    pegawaiRecords,
    rwtJabUpdates,
  });

  return {
    ...result,
    total_pegawai: pegawaiRecords.length,
    nama_asal_unor: asalUnor.nmUnor,
    nama_tujuan_unor: tujuanUnor.nmUnor,
  };
};

/**
 * Kembalikan (Restore) Mutasi Masal Unit Organisasi ke Unit Asal
 */
export const restoreMutasiUnor = async (id, userId = null) => {
  const mutasi = await peremajaanRepository.findMutasiUnorById(id);
  if (!mutasi) {
    throw new AppError("Data riwayat mutasi unit organisasi tidak ditemukan", 404);
  }

  if (mutasi.status === "RESTORED") {
    throw new AppError("Mutasi unit organisasi ini sudah pernah dikembalikan (restored)", 400);
  }

  if (!mutasi.pegawai_list || mutasi.pegawai_list.length === 0) {
    throw new AppError("Tidak ada pegawai dalam riwayat mutasi ini", 400);
  }

  // Validasi: Unit organisasi asal harus berstatus aktif
  const asalUnor = await prisma.ref_unitorganisasi.findFirst({
    where: { id: mutasi.asal_unor_id, is_deleted: false },
    select: { id: true, parent_id: true, nmUnor: true, isAktif: true },
  });

  if (!asalUnor) {
    throw new AppError("Unit organisasi asal tidak ditemukan atau sudah dihapus", 400);
  }

  if (asalUnor.isAktif !== 1) {
    throw new AppError(
      `Tidak dapat mengembalikan pegawai. Unit organisasi asal "${asalUnor.nmUnor}" berstatus Non-Aktif`,
      400
    );
  }

  // Periksa rantai atasan unit asal
  let currParentId = asalUnor.parent_id;
  const visitedParents = new Set([asalUnor.id]);
  while (currParentId && !visitedParents.has(currParentId)) {
    visitedParents.add(currParentId);
    const parentNode = await prisma.ref_unitorganisasi.findFirst({
      where: { id: currParentId, is_deleted: false },
      select: { id: true, parent_id: true, nmUnor: true, isAktif: true },
    });
    if (parentNode && parentNode.isAktif !== 1) {
      throw new AppError(
        `Tidak dapat mengembalikan pegawai. Induk dari unit organisasi asal "${parentNode.nmUnor}" berstatus Non-Aktif`,
        400
      );
    }
    currParentId = parentNode?.parent_id;
  }

  const rwtJabRestores = mutasi.pegawai_list.map((item) => ({
    rwt_jab_id: item.rwt_jab_id,
    oldUnorData: {
      unorInduk_id: item.old_unorInduk_id,
      unor_id: item.old_unor_id,
      subUnor_id: item.old_subUnor_id,
      subUnorSub_id: item.old_subUnorSub_id,
      instansi_id: item.old_instansi_id || "1",
      jnsUnor_id: item.old_jnsUnor_id || "1",
      ...(item.old_nm_jab_id ? { nmJab_id: item.old_nm_jab_id } : {}),
    },
  }));

  const restoreHeaderData = {
    status: "RESTORED",
    restored_at: new Date(),
    restored_by: userId ? BigInt(userId) : null,
  };

  const result = await peremajaanRepository.restoreMutasiUnorTransaction({
    mutasiId: id,
    restoreHeaderData,
    rwtJabRestores,
  });

  return {
    ...result,
    total_restored: rwtJabRestores.length,
  };
};


