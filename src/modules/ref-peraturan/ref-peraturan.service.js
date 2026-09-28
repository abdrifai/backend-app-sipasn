import fs from "fs";
import path from "path";
import * as repo from "./ref-peraturan.repository.js";
import AppError from "../../utils/AppError.js";
import logger from "../../config/logger.js";

// Hierarki Standar Perundang-undangan Indonesia
const LEGAL_LEVELS = [
  {
    key: "UU",
    name: "Undang-Undang / Perpu",
    rank: 1,
    desc: "Tingkat Tertinggi Pengaturan Kepegawaian & Manajemen ASN (Contoh: UU No. 20 Tahun 2023)",
    types: ["UU", "PERPU"],
    theme: {
      color: "amber",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-300 dark:border-amber-700",
      text: "text-amber-800 dark:text-amber-300",
      badge: "bg-amber-500 text-white",
    },
  },
  {
    key: "PP",
    name: "Peraturan Pemerintah (PP)",
    rank: 2,
    desc: "Aturan Pelaksanaan Undang-Undang (Contoh: PP No. 11/2017 & PP No. 94/2021)",
    types: ["PP"],
    theme: {
      color: "emerald",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-300 dark:border-emerald-700",
      text: "text-emerald-800 dark:text-emerald-300",
      badge: "bg-emerald-600 text-white",
    },
  },
  {
    key: "PERPRES",
    name: "Peraturan Presiden (Perpres)",
    rank: 3,
    desc: "Regulasi Pelaksanaan Tingkat Presiden terkait Kebijakan Nasional & Tunjangan",
    types: ["PERPRES"],
    theme: {
      color: "sky",
      bg: "bg-sky-50 dark:bg-sky-950/40",
      border: "border-sky-300 dark:border-sky-700",
      text: "text-sky-800 dark:text-sky-300",
      badge: "bg-sky-600 text-white",
    },
  },
  {
    key: "PERMENPAN",
    name: "Peraturan Menteri & Lembaga (PermenPAN-RB / BKN)",
    rank: 4,
    desc: "Pedoman Teknis Jabatan Fungsional, Evaluasi Kinerja, SOTK, & Manajemen ASN",
    types: ["PERMENPAN", "PERKA_BKN"],
    theme: {
      color: "indigo",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      border: "border-indigo-300 dark:border-indigo-700",
      text: "text-indigo-800 dark:text-indigo-300",
      badge: "bg-indigo-600 text-white",
    },
  },
  {
    key: "PERDA",
    name: "Peraturan Daerah (Perda)",
    rank: 5,
    desc: "Ketentuan Daerah Provinsi dan Kabupaten/Kota",
    types: ["PERDA"],
    theme: {
      color: "purple",
      bg: "bg-purple-50 dark:bg-purple-950/40",
      border: "border-purple-300 dark:border-purple-700",
      text: "text-purple-800 dark:text-purple-300",
      badge: "bg-purple-600 text-white",
    },
  },
  {
    key: "PERBUP",
    name: "Peraturan Bupati (Perbup) / Walikota",
    rank: 6,
    desc: "Regulasi Operasional Daerah, Pembentukan SOTK, TPP, & Tugas Pokok Jabatan",
    types: ["PERBUP"],
    theme: {
      color: "teal",
      bg: "bg-teal-50 dark:bg-teal-950/40",
      border: "border-teal-300 dark:border-teal-700",
      text: "text-teal-800 dark:text-teal-300",
      badge: "bg-teal-600 text-white",
    },
  },
  {
    key: "SK_SE",
    name: "Keputusan (SK) / Surat Edaran (SE) / Instruksi",
    rank: 7,
    desc: "Penetapan Khusus, Surat Edaran Bupati / Sekda, & Juknis Pelaksanaan",
    types: ["SK", "SE", "INSTRUKSI"],
    theme: {
      color: "zinc",
      bg: "bg-zinc-50 dark:bg-zinc-800/60",
      border: "border-zinc-300 dark:border-zinc-700",
      text: "text-zinc-800 dark:text-zinc-200",
      badge: "bg-zinc-600 text-white",
    },
  },
];

/**
 * Mengambil daftar peraturan dengan pagination dan filter
 */
export const getAllPeraturan = async (queryParams) => {
  const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(queryParams.limit, 10) || 10));
  const search = queryParams.search ? queryParams.search.trim() : "";
  const kategori = queryParams.kategori ? queryParams.kategori.trim() : "";
  const jenis_peraturan = queryParams.jenis_peraturan ? queryParams.jenis_peraturan.trim() : "";
  const tahun = queryParams.tahun ? parseInt(queryParams.tahun, 10) : null;
  const status_berlaku = queryParams.status_berlaku ? queryParams.status_berlaku.trim() : "";
  const sortBy = ["created_at", "tahun", "tgl_penetapan", "nomor_peraturan"].includes(queryParams.sortBy)
    ? queryParams.sortBy
    : "created_at";
  const sortOrder = queryParams.sortOrder === "asc" ? "asc" : "desc";

  const { data, total } = await repo.findAll({
    search,
    kategori,
    jenis_peraturan,
    tahun,
    status_berlaku,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Mengambil detail peraturan berdasarkan ID
 */
export const getPeraturanById = async (id) => {
  const peraturan = await repo.findById(id);
  if (!peraturan) {
    throw new AppError("Arsip peraturan tidak ditemukan", 404);
  }
  return peraturan;
};

/**
 * Membuat peraturan baru beserta upload dokumen
 */
export const createPeraturan = async (body, file, userId = null) => {
  // Cek duplikasi nomor peraturan
  const existing = await repo.findByNomor(body.nomor_peraturan.trim());
  if (existing) {
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        logger.error("Gagal menghapus file temporary saat duplikasi", { error: err.message });
      }
    }
    throw new AppError(`Peraturan dengan nomor '${body.nomor_peraturan}' sudah ada di sistem`, 409);
  }

  const payload = {
    nomor_peraturan: body.nomor_peraturan.trim(),
    judul: body.judul.trim(),
    kategori: body.kategori.trim(),
    jenis_peraturan: body.jenis_peraturan.trim(),
    tahun: parseInt(body.tahun, 10),
    tgl_penetapan: body.tgl_penetapan ? new Date(body.tgl_penetapan) : null,
    tgl_berlaku: body.tgl_berlaku ? new Date(body.tgl_berlaku) : null,
    status_berlaku: body.status_berlaku || "BERLAKU",
    parent_id: body.parent_id ? body.parent_id.trim() : null,
    peraturan_terkait_id: body.peraturan_terkait_id ? body.peraturan_terkait_id.trim() : null,
    tipe_relasi: body.tipe_relasi ? body.tipe_relasi.trim() : null,
    peraturan_terkait: body.peraturan_terkait ? body.peraturan_terkait.trim() : null,
    tentang: body.tentang ? body.tentang.trim() : null,
    keterangan: body.keterangan ? body.keterangan.trim() : null,
    created_by: userId ? BigInt(userId) : null,
  };

  if (file) {
    payload.file_path = file.path.replace(/\\/g, "/");
    payload.file_nama_asli = file.originalname;
    payload.file_size = BigInt(file.size);
  }

  const newPeraturan = await repo.create(payload);

  // Jika tipe relasi adalah MENCABUT dan terdapat peraturan_terkait_id, ubah status target menjadi DICABUT
  if (payload.tipe_relasi === "MENCABUT" && payload.peraturan_terkait_id) {
    try {
      await repo.update(payload.peraturan_terkait_id, { status_berlaku: "DICABUT" });
      logger.info(`Peraturan ${payload.peraturan_terkait_id} otomatis ditandai DICABUT`);
    } catch (e) {
      logger.warn("Gagal memperbarui status peraturan terkait ke DICABUT", { error: e.message });
    }
  }

  logger.info("Berhasil membuat arsip peraturan baru", { id: newPeraturan.id, nomor: newPeraturan.nomor_peraturan });
  return newPeraturan;
};

/**
 * Memperbarui data peraturan & opsional ganti dokumen file
 */
export const updatePeraturan = async (id, body, file) => {
  const existing = await repo.findById(id);
  if (!existing) {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new AppError("Arsip peraturan tidak ditemukan", 404);
  }

  if (body.nomor_peraturan && body.nomor_peraturan.trim() !== existing.nomor_peraturan) {
    const duplicate = await repo.findByNomor(body.nomor_peraturan.trim(), id);
    if (duplicate) {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new AppError(`Peraturan dengan nomor '${body.nomor_peraturan}' sudah ada di sistem`, 409);
    }
  }

  const payload = {};
  if (body.nomor_peraturan !== undefined) payload.nomor_peraturan = body.nomor_peraturan.trim();
  if (body.judul !== undefined) payload.judul = body.judul.trim();
  if (body.kategori !== undefined) payload.kategori = body.kategori.trim();
  if (body.jenis_peraturan !== undefined) payload.jenis_peraturan = body.jenis_peraturan.trim();
  if (body.tahun !== undefined) payload.tahun = parseInt(body.tahun, 10);
  if (body.tgl_penetapan !== undefined) payload.tgl_penetapan = body.tgl_penetapan ? new Date(body.tgl_penetapan) : null;
  if (body.tgl_berlaku !== undefined) payload.tgl_berlaku = body.tgl_berlaku ? new Date(body.tgl_berlaku) : null;
  if (body.status_berlaku !== undefined) payload.status_berlaku = body.status_berlaku;
  if (body.parent_id !== undefined) payload.parent_id = body.parent_id ? body.parent_id.trim() : null;
  if (body.peraturan_terkait_id !== undefined) payload.peraturan_terkait_id = body.peraturan_terkait_id ? body.peraturan_terkait_id.trim() : null;
  if (body.tipe_relasi !== undefined) payload.tipe_relasi = body.tipe_relasi ? body.tipe_relasi.trim() : null;
  if (body.peraturan_terkait !== undefined) payload.peraturan_terkait = body.peraturan_terkait ? body.peraturan_terkait.trim() : null;
  if (body.tentang !== undefined) payload.tentang = body.tentang ? body.tentang.trim() : null;
  if (body.keterangan !== undefined) payload.keterangan = body.keterangan ? body.keterangan.trim() : null;

  if (file) {
    payload.file_path = file.path.replace(/\\/g, "/");
    payload.file_nama_asli = file.originalname;
    payload.file_size = BigInt(file.size);

    // Hapus file lama jika ada
    if (existing.file_path && fs.existsSync(existing.file_path)) {
      try {
        fs.unlinkSync(existing.file_path);
      } catch (err) {
        logger.error("Gagal menghapus file lama saat update peraturan", { path: existing.file_path, error: err.message });
      }
    }
  }

  const updated = await repo.update(id, payload);

  // Jika tipe relasi diupdate menjadi MENCABUT dan terdapat target, tandai target DICABUT
  if (payload.tipe_relasi === "MENCABUT" && payload.peraturan_terkait_id) {
    try {
      await repo.update(payload.peraturan_terkait_id, { status_berlaku: "DICABUT" });
    } catch (e) {
      logger.warn("Gagal memperbarui status peraturan terkait ke DICABUT", { error: e.message });
    }
  }

  logger.info("Berhasil memperbarui arsip peraturan", { id });
  return updated;
};

/**
 * Menghapus arsip peraturan (soft delete)
 */
export const deletePeraturan = async (id) => {
  const existing = await repo.findById(id);
  if (!existing) {
    throw new AppError("Arsip peraturan tidak ditemukan", 404);
  }

  const result = await repo.softDelete(id);
  logger.info("Berhasil menghapus (soft delete) arsip peraturan", { id });
  return result;
};

/**
 * Pencarian lookup untuk combobox / autocomplete
 */
export const searchLookup = async (search = "", excludeId = null) => {
  return repo.searchLookup(search ? search.trim() : "", excludeId);
};

/**
 * Mengambil ringkasan opsi filter (kategori & jenis)
 */
export const getFilterOptions = async () => {
  const [kategoriList, jenisList] = await Promise.all([
    repo.getKategoriList(),
    repo.getJenisList(),
  ]);

  return {
    kategoriList,
    jenisList,
  };
};

/**
 * Mengambil data pohon hierarki interaktif (Node-based / Mindmap)
 */
export const getHierarchyTree = async (kategori = "") => {
  const allPeraturan = await repo.getAllForHierarchy(kategori);

  // 1. Kelompokkan peraturan ke dalam tingkatan perundang-undangan (Legal Levels)
  const levelsWithItems = LEGAL_LEVELS.map((lvl) => {
    const items = allPeraturan.filter((p) => lvl.types.includes(p.jenis_peraturan));
    return {
      ...lvl,
      totalCount: items.length,
      items,
    };
  });

  // 2. Kumpulkan edge/relasi antar peraturan (dependency links)
  const links = [];
  allPeraturan.forEach((item) => {
    // Relasi parent / dasar hukum
    if (item.parent_id && item.parent) {
      links.push({
        id: `link-parent-${item.id}-${item.parent_id}`,
        source: item.parent_id,
        target: item.id,
        type: "DASAR_HUKUM",
        label: "Dasar Hukum / Peraturan Pelaksana",
      });
    }

    // Relasi peraturan terkait (Mencabut, Mengubah, dll)
    if (item.peraturan_terkait_id && item.peraturan_terkait_ref) {
      links.push({
        id: `link-rel-${item.id}-${item.peraturan_terkait_id}`,
        source: item.id,
        target: item.peraturan_terkait_id,
        type: item.tipe_relasi || "TERKAIT",
        label: item.tipe_relasi || "Terkait",
      });
    }
  });

  // 3. Bangun silsilah/hierarki murni (Parent-Child tree)
  const itemMap = new Map();
  allPeraturan.forEach((item) => {
    itemMap.set(item.id, {
      ...item,
      children: [],
    });
  });

  const rootItems = [];
  allPeraturan.forEach((item) => {
    const mapped = itemMap.get(item.id);
    if (item.parent_id && itemMap.has(item.parent_id)) {
      itemMap.get(item.parent_id).children.push(mapped);
    } else {
      rootItems.push(mapped);
    }
  });

  return {
    levels: levelsWithItems,
    dependencyRoots: rootItems,
    links,
    totalPeraturan: allPeraturan.length,
  };
};
