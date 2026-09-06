import prisma from "../../config/database.js";

/**
 * Ambil semua data master jabatan terpadu (ref_jabatan) dengan pagination & filter
 */
export const findAll = async (params = {}) => {
  const { search = "", kategori = "", jns_jab_id = "", eselon_id = "", jenjang_jab_id = "" } = params;
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.max(1, parseInt(params.limit, 10) || 10);
  const skip = (page - 1) * limit;

  let kategoriFilter = {};
  if (kategori === "STRUKTURAL") {
    kategoriFilter = {
      OR: [
        { kategori: "STRUKTURAL" },
        { jenjang_jab_id: { in: [1, 2, 8] } }
      ]
    };
  } else if (kategori === "FUNGSIONAL") {
    kategoriFilter = {
      OR: [
        { kategori: "FUNGSIONAL" },
        { jenjang_jab_id: { in: [4, 5] } }
      ]
    };
  } else if (kategori === "PELAKSANA") {
    kategoriFilter = {
      OR: [
        { kategori: "PELAKSANA" },
        { jenjang_jab_id: 3 }
      ]
    };
  } else if (kategori) {
    kategoriFilter = { kategori };
  }

  let jenjangFilter = {};
  if (jenjang_jab_id) {
    const num = parseInt(jenjang_jab_id, 10);
    if (!isNaN(num)) {
      jenjangFilter = { jenjang_jab_id: num };
    }
  }

  const where = {
    is_deleted: false,
    AND: [
      search ? { nama_jabatan: { contains: search } } : {},
      kategoriFilter,
      jns_jab_id ? { jns_jab_id } : {},
      eselon_id ? { eselon_id } : {},
      jenjangFilter,
    ],
  };

  const [data, total] = await Promise.all([
    prisma.ref_jabatan.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        kode: true,
        nama_jabatan: true,
        kategori: true,
        jns_jab_id: true,
        jenjang_jab_id: true,
        eselon_id: true,
        bup: true,
        kelas_jabatan: true,
        is_aktif: true,
        ref_unitorganisasi: {
          where: { is_deleted: false },
          select: { id: true, nmUnor: true, parent_id: true, level: true, kode: true }
        },
        ref_jnsjab: {
          select: { id: true, jnsjab: true, kode: true }
        },
        ref_jenjangjab: {
          select: { id: true, jenjangjab: true }
        },
        ref_eselon: {
          select: { id: true, eselon: true, eselon_kode: true }
        },
        created_at: true,
        updated_at: true,
      },
      orderBy: { nama_jabatan: "asc" },
    }),
    prisma.ref_jabatan.count({ where }),
  ]);

  // Pre-fetch active units to map parent OPD names
  const allUnors = await prisma.ref_unitorganisasi.findMany({
    where: { is_deleted: false },
    select: { id: true, parent_id: true, nmUnor: true, level: true, kode: true }
  });

  const unorIdMap = new Map();
  const unorKodeMap = new Map();
  allUnors.forEach(u => {
    unorIdMap.set(u.id, u);
    if (u.kode && u.kode.length >= 9) {
      unorKodeMap.set(u.kode.substring(0, 9), u);
    }
  });

  function getParentOpd(unor) {
    if (!unor) return "";
    let curr = unor;
    while (curr && curr.parent_id && curr.level !== "induk") {
      curr = unorIdMap.get(curr.parent_id);
    }
    return curr ? curr.nmUnor : "";
  }

  // Map nama_jabatan dan info unit terhubung agar mudah dibedakan saat pencarian
  const formattedData = data.map(item => {
    let unitLabel = "";
    const activeUnorList = Array.isArray(item.ref_unitorganisasi) 
      ? item.ref_unitorganisasi 
      : (item.ref_unitorganisasi ? [item.ref_unitorganisasi] : []);
    
    const isDirectLinked = activeUnorList.length > 0;

    if (isDirectLinked) {
      const primaryUnor = activeUnorList[0];
      const parentOpd = getParentOpd(primaryUnor);
      if (parentOpd && parentOpd !== primaryUnor.nmUnor) {
        unitLabel = `${primaryUnor.nmUnor} (${parentOpd})`;
      } else {
        unitLabel = primaryUnor.nmUnor;
      }
    } else if (item.kode) {
      const prefix = item.kode.substring(0, 9);
      const matched = unorKodeMap.get(prefix);
      if (matched) {
        unitLabel = getParentOpd(matched) || matched.nmUnor;
      }
    }

    const fullLabel = unitLabel 
      ? `${item.nama_jabatan} — (${unitLabel})`
      : item.nama_jabatan;

    return {
      ...item,
      nm_jab: fullLabel,
      nama_jabatan_murni: item.nama_jabatan,
      is_unor_terhubung: isDirectLinked,
      unit_terhubung: unitLabel || null,
    };
  });

  return {
    data: formattedData,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Cari jabatan berdasarkan ID
 */
export const findById = async (id) => {
  const data = await prisma.ref_jabatan.findFirst({
    where: { id, is_deleted: false },
    select: {
      id: true,
      kode: true,
      nama_jabatan: true,
      kategori: true,
      jns_jab_id: true,
      jenjang_jab_id: true,
      eselon_id: true,
      bup: true,
      kelas_jabatan: true,
      is_aktif: true,
      ref_unitorganisasi: {
        where: { is_deleted: false },
        select: { id: true, nmUnor: true }
      },
      ref_jnsjab: {
        select: { id: true, jnsjab: true, kode: true }
      },
      ref_jenjangjab: {
        select: { id: true, jenjangjab: true }
      },
      ref_eselon: {
        select: { id: true, eselon: true, eselon_kode: true }
      },
    },
  });

  if (!data) return null;
  return {
    ...data,
    nm_jab: data.nama_jabatan,
    is_unor_terhubung: (data.ref_unitorganisasi || []).length > 0,
  };
};

/**
 * Tambah data master jabatan baru
 */
export const create = async (data) => {
  let derivedKategori = data.kategori;
  let derivedJnsJabId = data.jns_jab_id;

  if (data.jenjang_jab_id) {
    const jId = Number(data.jenjang_jab_id);
    if ([1, 2, 6, 7, 8].includes(jId)) {
      if (!derivedKategori) derivedKategori = "STRUKTURAL";
      if (!derivedJnsJabId) derivedJnsJabId = jId === 8 ? "d7ec3033-9729-4d3e-86fb-16f30cfe3127" : "4a71c9b4-e57d-439d-8ccd-e8bf3ec83de5";
    } else if ([4, 5].includes(jId)) {
      if (!derivedKategori) derivedKategori = "FUNGSIONAL";
      if (!derivedJnsJabId) derivedJnsJabId = "490b8479-fd4f-4f99-992e-880a5611b890"; // JABATAN FUNGSIONAL (JF)
    } else if (jId === 3) {
      if (!derivedKategori) derivedKategori = "PELAKSANA";
      if (!derivedJnsJabId) derivedJnsJabId = "4a71c9b4-e57d-439d-8ccd-e8bf3ec83de5"; // JABATAN ADMINISTRASI (JA)
    }
  }

  const payload = {
    ...data,
    nama_jabatan: data.nama_jabatan || data.nm_jab,
    kategori: derivedKategori || "PELAKSANA",
    jns_jab_id: derivedJnsJabId || data.jns_jab_id || null,
  };
  delete payload.nm_jab;

  const result = await prisma.ref_jabatan.create({
    data: payload,
    select: { id: true, nama_jabatan: true, kategori: true, jns_jab_id: true, jenjang_jab_id: true },
  });

  return {
    ...result,
    nm_jab: result.nama_jabatan,
  };
};

/**
 * Update data master jabatan
 */
export const update = async (id, data) => {
  let derivedKategori = data.kategori;
  let derivedJnsJabId = data.jns_jab_id;

  if (data.jenjang_jab_id) {
    const jId = Number(data.jenjang_jab_id);
    if ([1, 2, 6, 7, 8].includes(jId)) {
      if (!derivedKategori) derivedKategori = "STRUKTURAL";
      if (!derivedJnsJabId) derivedJnsJabId = jId === 8 ? "d7ec3033-9729-4d3e-86fb-16f30cfe3127" : "4a71c9b4-e57d-439d-8ccd-e8bf3ec83de5";
    } else if ([4, 5].includes(jId)) {
      if (!derivedKategori) derivedKategori = "FUNGSIONAL";
      if (!derivedJnsJabId) derivedJnsJabId = "490b8479-fd4f-4f99-992e-880a5611b890"; // JABATAN FUNGSIONAL (JF)
    } else if (jId === 3) {
      if (!derivedKategori) derivedKategori = "PELAKSANA";
      if (!derivedJnsJabId) derivedJnsJabId = "4a71c9b4-e57d-439d-8ccd-e8bf3ec83de5"; // JABATAN ADMINISTRASI (JA)
    }
  }

  const payload = {
    ...data,
    ...(derivedKategori ? { kategori: derivedKategori } : {}),
    ...(derivedJnsJabId ? { jns_jab_id: derivedJnsJabId } : {}),
  };
  if (payload.nm_jab) {
    payload.nama_jabatan = payload.nm_jab;
    delete payload.nm_jab;
  }

  const result = await prisma.ref_jabatan.update({
    where: { id },
    data: payload,
    select: { id: true, nama_jabatan: true, kategori: true, jns_jab_id: true, jenjang_jab_id: true },
  });

  return {
    ...result,
    nm_jab: result.nama_jabatan,
  };
};

/**
 * Soft delete data master jabatan
 */
export const softDelete = async (id) => {
  return prisma.ref_jabatan.update({
    where: { id },
    data: { is_deleted: true },
    select: { id: true },
  });
};

/**
 * Ambil statistik ringkasan per kategori master jabatan
 */
export const getStats = async () => {
  const [total, byCategory] = await Promise.all([
    prisma.ref_jabatan.count({ where: { is_deleted: false } }),
    prisma.ref_jabatan.groupBy({
      by: ["kategori"],
      where: { is_deleted: false },
      _count: { _all: true },
    }),
  ]);

  const catMap = {
    STRUKTURAL: 0,
    FUNGSIONAL: 0,
    PELAKSANA: 0,
  };
  byCategory.forEach((c) => {
    catMap[c.kategori] = c._count._all;
  });

  return {
    total,
    struktural: catMap.STRUKTURAL || 0,
    fungsional: catMap.FUNGSIONAL || 0,
    pelaksana: catMap.PELAKSANA || 0,
  };
};
