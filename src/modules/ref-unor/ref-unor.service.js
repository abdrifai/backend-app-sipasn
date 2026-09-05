import prisma from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { v4 as uuidv4 } from "uuid";
import { resolveJabatanForUnor } from "./ref-unor.jabatan-resolver.js";

// --- JENIS UNOR ---

export const getAllJnsUnor = async (params = {}) => {
  const { instansi_id, search = "" } = params;
  const page = params.page ? Math.max(1, parseInt(params.page, 10)) : null;
  const limit = params.limit ? Math.max(1, parseInt(params.limit, 10)) : null;

  const trimmedSearch = search ? search.trim() : "";
  const numSearch = parseInt(trimmedSearch, 10);
  const isNum = !isNaN(numSearch);

  const codeFilters = [];
  if (isNum) {
    codeFilters.push({ kode: numSearch });
    if (trimmedSearch.length >= 2 && trimmedSearch.length <= 5) {
      const multiplier = Math.pow(10, 6 - trimmedSearch.length);
      codeFilters.push({
        kode: {
          gte: numSearch * multiplier,
          lte: (numSearch + 1) * multiplier - 1
        }
      });
    }
  }

  const where = { 
    is_deleted: false,
    ...(instansi_id ? { instansi_id } : {}),
    ...(trimmedSearch ? {
      OR: [
        { jnsunor: { contains: trimmedSearch } },
        ...codeFilters
      ]
    } : {})
  };

  if (!page && !limit) {
    return prisma.ref_jnsunor.findMany({
      where,
      select: { id: true, jnsunor: true, kode: true, instansi_id: true },
      orderBy: { kode: "asc" }
    });
  }

  const currentPage = page || 1;
  const currentLimit = limit || 10;
  const skip = (currentPage - 1) * currentLimit;

  const [data, total] = await Promise.all([
    prisma.ref_jnsunor.findMany({
      where,
      skip,
      take: currentLimit,
      select: { 
        id: true, 
        instansi_id: true, 
        kode: true, 
        jnsunor: true, 
        created_at: true, 
        updated_at: true 
      },
      orderBy: { kode: "asc" }
    }),
    prisma.ref_jnsunor.count({ where })
  ]);

  return {
    data,
    meta: {
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit)
    }
  };
};

export const getJnsUnorById = async (id) => {
  const data = await prisma.ref_jnsunor.findFirst({
    where: { id, is_deleted: false },
    select: { id: true, instansi_id: true, kode: true, jnsunor: true, created_at: true, updated_at: true }
  });
  if (!data) throw new AppError("Data jenis unit organisasi tidak ditemukan", 404);
  return data;
};

export const createJnsUnor = async (data) => {
  const id = uuidv4();
  return prisma.ref_jnsunor.create({
    data: {
      id,
      instansi_id: data.instansi_id,
      kode: parseInt(data.kode, 10),
      jnsunor: data.jnsunor.trim(),
      is_deleted: false,
    },
    select: { id: true, instansi_id: true, kode: true, jnsunor: true }
  });
};

export const updateJnsUnor = async (id, data) => {
  await getJnsUnorById(id);
  return prisma.ref_jnsunor.update({
    where: { id },
    data: {
      ...(data.instansi_id !== undefined ? { instansi_id: data.instansi_id } : {}),
      ...(data.kode !== undefined ? { kode: parseInt(data.kode, 10) } : {}),
      ...(data.jnsunor !== undefined ? { jnsunor: data.jnsunor.trim() } : {}),
    },
    select: { id: true, instansi_id: true, kode: true, jnsunor: true }
  });
};

export const deleteJnsUnor = async (id) => {
  await getJnsUnorById(id);
  return prisma.ref_jnsunor.update({
    where: { id },
    data: { is_deleted: true },
    select: { id: true }
  });
};

// --- ESELON ---

export const getAllEselon = async () => {
  return prisma.ref_eselon.findMany({
    where: { is_deleted: false },
    select: { id: true, eselon: true, eselon_kode: true },
    orderBy: { eselon_kode: "asc" },
  });
};

// --- HELPER JABATAN ---

const saveOrUpdateJabatan = async (targetJabId, nm_jab, extraData = {}) => {
  const trimmedJab = nm_jab ? nm_jab.trim() : "";

  const jabData = {
    ...(trimmedJab ? { nama_jabatan: trimmedJab } : {}),
    ...(extraData.kategori ? { kategori: extraData.kategori } : {}),
    ...(extraData.eselon_id !== undefined ? { eselon_id: extraData.eselon_id || null } : {}),
    ...(extraData.jns_jab_id !== undefined ? { jns_jab_id: extraData.jns_jab_id || null } : {}),
    ...(extraData.jenjang_jab_id !== undefined ? { jenjang_jab_id: extraData.jenjang_jab_id ? BigInt(extraData.jenjang_jab_id) : null } : {}),
    ...(extraData.bup !== undefined ? { bup: extraData.bup ? parseInt(extraData.bup, 10) : 58 } : {}),
    ...(extraData.kelas_jabatan !== undefined ? { kelas_jabatan: extraData.kelas_jabatan ? parseInt(extraData.kelas_jabatan, 10) : null } : {}),
    ...(extraData.kode_jabatan !== undefined ? { kode: extraData.kode_jabatan || null } : {}),
  };

  if (!trimmedJab && Object.keys(jabData).length === 0) return targetJabId;

  if (targetJabId) {
    const jabExists = await prisma.ref_jabatan.findUnique({ where: { id: targetJabId } });
    if (jabExists) {
      if (Object.keys(jabData).length > 0) {
        await prisma.ref_jabatan.update({
          where: { id: targetJabId },
          data: jabData,
        });
      }
      return targetJabId;
    }
  }

  if (!trimmedJab) return targetJabId;

  const existingByName = await prisma.ref_jabatan.findFirst({
    where: { nama_jabatan: trimmedJab, is_deleted: false },
    select: { id: true },
  });
  if (existingByName) {
    if (Object.keys(jabData).length > 0) {
      await prisma.ref_jabatan.update({
        where: { id: existingByName.id },
        data: jabData,
      });
    }
    return existingByName.id;
  }
  const newJabId = uuidv4();
  await prisma.ref_jabatan.create({
    data: {
      id: newJabId,
      kategori: extraData.kategori || 'STRUKTURAL',
      ...jabData,
    },
  });
  return newJabId;
};

// --- HELPER GET NODE & RESOLVE JABATAN ---

export const getUnorByIdGeneral = async (id, level = null) => {
  const where = { id, is_deleted: false, ...(level ? { level } : {}) };
  const data = await prisma.ref_unitorganisasi.findFirst({
    where,
    include: {
      ref_instansi: { select: { id: true, instansi: true } },
      ref_jabatan: {
        select: {
          id: true,
          nama_jabatan: true,
          kode: true,
          kategori: true,
          eselon_id: true,
          jns_jab_id: true,
          jenjang_jab_id: true,
          bup: true,
          kelas_jabatan: true,
        },
      },
    },
  });
  if (!data) throw new AppError("Unit organisasi tidak ditemukan", 404);
  
  let jabRecord = data.ref_jabatan;
  let resolvedJabId = data.jab_id;
  let nm_jab = jabRecord?.nama_jabatan || null;

  if (!jabRecord || !nm_jab) {
    const resolved = await resolveJabatanForUnor({
      nmUnor: data.nmUnor,
      jabId: data.jab_id,
      level: data.level,
    });
    if (resolved?.jab_id) {
      resolvedJabId = resolved.jab_id;
      nm_jab = resolved.nm_jab;
      jabRecord = await prisma.ref_jabatan.findUnique({
        where: { id: resolved.jab_id },
        select: {
          id: true,
          nama_jabatan: true,
          kode: true,
          kategori: true,
          eselon_id: true,
          jns_jab_id: true,
          jenjang_jab_id: true,
          bup: true,
          kelas_jabatan: true,
        },
      });
    } else if (resolved?.nm_jab) {
      nm_jab = resolved.nm_jab;
    }
  }

  return {
    ...data,
    jab_id: resolvedJabId,
    nm_jab: nm_jab || "-",
    kategori_jab: jabRecord?.kategori || "STRUKTURAL",
    eselon_id: jabRecord?.eselon_id || data.eselon_id || "",
    jns_jab_id: jabRecord?.jns_jab_id || "",
    jenjang_jab_id: jabRecord?.jenjang_jab_id ? jabRecord.jenjang_jab_id.toString() : "",
    bup: jabRecord?.bup ?? 58,
    kelas_jabatan: jabRecord?.kelas_jabatan ?? "",
    kode_jabatan: jabRecord?.kode || "",
    jabatan_detail: jabRecord || null,
  };
};

// --- CASCADE SOFT DELETE ---

async function softDeleteTreeCascade(id, tx) {
  const children = await tx.ref_unitorganisasi.findMany({
    where: { parent_id: id, is_deleted: false },
    select: { id: true },
  });
  for (const child of children) {
    await softDeleteTreeCascade(child.id, tx);
  }
  return tx.ref_unitorganisasi.update({
    where: { id },
    data: { is_deleted: true },
  });
}

// --- UNOR INDUK ---

export const getAllUnorInduk = async (params = {}) => {
  const { page = 1, limit = 10, search = "", instansi_id, instansi_kode = "7209", isAktif } = params;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const where = {
    is_deleted: false,
    level: "induk",
    nmUnor: { not: "" },
    ...(isAktif !== undefined && isAktif !== "" ? { isAktif: parseInt(isAktif, 10) } : { isAktif: 1 }),
    ...(instansi_id ? { instansi_id } : {}),
    ...(instansi_kode ? {
      OR: [
        { instansi_id: "47a536f3-8610-4492-aa81-d3a6e5b4399f" },
        { kode: { startsWith: String(instansi_kode) } },
        { ref_instansi: { kode: parseInt(instansi_kode, 10) || 7209 } },
        { ref_instansi: { instansi: { contains: "TOJO UNA-UNA" } } },
      ],
    } : {}),
    ...(search ? { nmUnor: { contains: search } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.ref_unitorganisasi.findMany({
      where,
      skip,
      take: limitNum,
      select: {
        id: true,
        nmUnor: true,
        kode: true,
        level: true,
        no_urut: true,
        isAktif: true,
        instansi_id: true,
      },
      orderBy: [{ no_urut: "asc" }, { nmUnor: "asc" }],
    }),
    prisma.ref_unitorganisasi.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export const getUnorIndukById = async (id) => getUnorByIdGeneral(id, "induk");

const getNextNoUrut = async (parentId, level, instansiId = null) => {
  const where = {
    is_deleted: false,
    level,
    ...(parentId ? { parent_id: parentId } : { parent_id: null }),
    ...(instansiId ? { instansi_id: instansiId } : {}),
  };
  const maxRecord = await prisma.ref_unitorganisasi.findFirst({
    where,
    orderBy: { no_urut: "desc" },
    select: { no_urut: true },
  });
  return (maxRecord?.no_urut || 0) + 1;
};

export const createUnorInduk = async (data) => {
  const id = uuidv4();
  const generatedKode = data.kode || `${data.instansi_kode || "7209"}${Date.now().toString().slice(-5)}`;
  let targetJabId = data.jab_id || null;
  if (data.nm_jab) {
    targetJabId = await saveOrUpdateJabatan(targetJabId, data.nm_jab, {
      kategori: data.kategori_jab || "STRUKTURAL",
      eselon_id: data.eselon_id,
      jns_jab_id: data.jns_jab_id,
      jenjang_jab_id: data.jenjang_jab_id,
      bup: data.bup,
      kelas_jabatan: data.kelas_jabatan,
      kode_jabatan: data.kode_jabatan,
    });
  }

  const noUrut = data.no_urut !== undefined && data.no_urut !== null && data.no_urut !== ""
    ? parseInt(data.no_urut, 10)
    : await getNextNoUrut(null, "induk", data.instansi_id || null);

  return prisma.ref_unitorganisasi.create({
    data: {
      id,
      parent_id: null,
      instansi_id: data.instansi_id || null,
      kode: generatedKode,
      nmUnor: data.nmUnor,
      level: "induk",
      no_urut: noUrut,
      jab_id: targetJabId,
      jnsUnor_id: data.jnsUnor_id || null,
      peraturan: data.peraturan || null,
      tglPeraturan: data.tglPeraturan ? new Date(data.tglPeraturan) : null,
      tahun: data.tahun !== undefined && data.tahun !== null ? parseInt(data.tahun, 10) : null,
      ket: data.ket || null,
      is_pimpinan: false,
      isAktif: data.isAktif ?? 1,
      is_deleted: false,
    },
  });
};

export const updateUnorInduk = async (id, data) => {
  const existing = await getUnorIndukById(id);
  let targetJabId = data.jab_id !== undefined ? data.jab_id : existing.jab_id;
  if (data.nm_jab) {
    targetJabId = await saveOrUpdateJabatan(targetJabId, data.nm_jab, {
      kategori: data.kategori_jab || "STRUKTURAL",
      eselon_id: data.eselon_id,
      jns_jab_id: data.jns_jab_id,
      jenjang_jab_id: data.jenjang_jab_id,
      bup: data.bup,
      kelas_jabatan: data.kelas_jabatan,
      kode_jabatan: data.kode_jabatan,
    });
  }

  return prisma.ref_unitorganisasi.update({
    where: { id },
    data: {
      ...(data.kode ? { kode: data.kode } : {}),
      ...(data.nmUnor ? { nmUnor: data.nmUnor } : {}),
      ...(data.instansi_id !== undefined ? { instansi_id: data.instansi_id } : {}),
      ...(targetJabId !== undefined ? { jab_id: targetJabId } : {}),
      ...(data.jnsUnor_id !== undefined ? { jnsUnor_id: data.jnsUnor_id } : {}),
      ...(data.peraturan !== undefined ? { peraturan: data.peraturan } : {}),
      ...(data.tglPeraturan !== undefined ? { tglPeraturan: data.tglPeraturan ? new Date(data.tglPeraturan) : null } : {}),
      ...(data.tahun !== undefined ? { tahun: data.tahun !== null ? parseInt(data.tahun, 10) : null } : {}),
      ...(data.ket !== undefined ? { ket: data.ket } : {}),
      ...(data.no_urut !== undefined ? { no_urut: data.no_urut !== null && data.no_urut !== '' ? parseInt(data.no_urut, 10) : 1 } : {}),
      ...(data.isAktif !== undefined ? { isAktif: data.isAktif } : {}),
    },
  });
};


export const deleteUnorInduk = async (id) => {
  await getUnorIndukById(id);
  return prisma.$transaction(async (tx) => {
    return softDeleteTreeCascade(id, tx);
  });
};

// --- UNOR ---

export const getAllUnor = async (params = {}) => {
  const { page = 1, limit = 10, search = "", parent_id, unorinduk_id } = params;
  const skip = (page - 1) * limit;
  const pId = parent_id || unorinduk_id;
  const where = {
    is_deleted: false,
    level: "unor",
    ...(pId ? { parent_id: pId } : {}),
    ...(search ? { nmUnor: { contains: search } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.ref_unitorganisasi.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: [{ no_urut: "asc" }, { nmUnor: "asc" }, { kode: "asc" }],
    }),
    prisma.ref_unitorganisasi.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUnorById = async (id) => getUnorByIdGeneral(id, "unor");

export const createUnor = async (data) => {
  const induk = await getUnorIndukById(data.unorinduk_id);
  const id = uuidv4();
  const generatedKode = data.kode || `${data.unorinduk_kode || induk?.kode || "7209"}${Date.now().toString().slice(-4)}`;
  let targetJabId = data.jab_id || null;
  if (data.nm_jab) {
    targetJabId = await saveOrUpdateJabatan(targetJabId, data.nm_jab);
  }

  const isPimpinan = Boolean(
    generatedKode.endsWith("1001") ||
    generatedKode.endsWith("001") ||
    (induk && data.nmUnor?.trim().toLowerCase() === induk.nmUnor?.trim().toLowerCase())
  );

  const noUrut = data.no_urut !== undefined && data.no_urut !== null && data.no_urut !== ""
    ? parseInt(data.no_urut, 10)
    : await getNextNoUrut(data.unorinduk_id, "unor", induk?.instansi_id || null);

  return prisma.ref_unitorganisasi.create({
    data: {
      id,
      parent_id: data.unorinduk_id,
      instansi_id: induk?.instansi_id || null,
      kode: generatedKode,
      nmUnor: data.nmUnor,
      level: "unor",
      no_urut: noUrut,
      jab_id: targetJabId,
      jnsUnor_id: data.jnsUnor_id || null,
      peraturan: data.peraturan || null,
      tglPeraturan: data.tglPeraturan ? new Date(data.tglPeraturan) : null,
      tahun: data.tahun !== undefined && data.tahun !== null ? parseInt(data.tahun, 10) : null,
      ket: data.ket || null,
      is_pimpinan: isPimpinan,
      isAktif: data.isAktif !== undefined ? parseInt(data.isAktif, 10) : 1,
      is_deleted: false,
    },
  });
};

export const updateUnor = async (id, data) => {
  const existing = await getUnorById(id);
  if (data.unorinduk_id) await getUnorIndukById(data.unorinduk_id);
  let targetJabId = data.jab_id !== undefined ? data.jab_id : existing.jab_id;
  if (data.nm_jab || data.eselon_id !== undefined || data.kategori_jab !== undefined) {
    targetJabId = await saveOrUpdateJabatan(targetJabId, data.nm_jab, {
      kategori: data.kategori_jab,
      eselon_id: data.eselon_id,
      jns_jab_id: data.jns_jab_id,
      jenjang_jab_id: data.jenjang_jab_id,
      bup: data.bup,
      kelas_jabatan: data.kelas_jabatan,
      kode_jabatan: data.kode_jabatan,
    });
  }

  return prisma.ref_unitorganisasi.update({
    where: { id },
    data: {
      ...(data.kode ? { kode: data.kode } : {}),
      ...(data.nmUnor ? { nmUnor: data.nmUnor } : {}),
      ...(data.unorinduk_id ? { parent_id: data.unorinduk_id } : {}),
      ...(data.jnsUnor_id !== undefined ? { jnsUnor_id: data.jnsUnor_id } : {}),
      ...(data.peraturan !== undefined ? { peraturan: data.peraturan } : {}),
      ...(data.tglPeraturan !== undefined ? { tglPeraturan: data.tglPeraturan ? new Date(data.tglPeraturan) : null } : {}),
      ...(data.tahun !== undefined ? { tahun: data.tahun !== null ? parseInt(data.tahun, 10) : null } : {}),
      ...(data.ket !== undefined ? { ket: data.ket } : {}),
      ...(data.no_urut !== undefined ? { no_urut: data.no_urut !== null && data.no_urut !== "" ? parseInt(data.no_urut, 10) : 1 } : {}),
      ...(targetJabId !== undefined ? { jab_id: targetJabId } : {}),
      ...(data.isAktif !== undefined ? { isAktif: parseInt(data.isAktif, 10) } : {}),
    },
  });
};

export const deleteUnor = async (id) => {
  await getUnorById(id);
  return prisma.$transaction(async (tx) => {
    return softDeleteTreeCascade(id, tx);
  });
};

// --- SUB UNOR ---

export const getAllSubUnor = async (params = {}) => {
  const { page = 1, limit = 10, search = "", parent_id, unor_id } = params;
  const skip = (page - 1) * limit;
  const pId = parent_id || unor_id;
  const where = {
    is_deleted: false,
    level: "sub",
    ...(pId ? { parent_id: pId } : {}),
    ...(search ? { nmUnor: { contains: search } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.ref_unitorganisasi.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: [{ no_urut: "asc" }, { nmUnor: "asc" }, { kode: "asc" }],
    }),
    prisma.ref_unitorganisasi.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSubUnorById = async (id) => getUnorByIdGeneral(id, "sub");

export const createSubUnor = async (data) => {
  const parentUnor = await getUnorById(data.unor_id);
  const id = uuidv4();
  const generatedKode = data.kode || `${data.unor_kode || parentUnor?.kode || "7209"}${Date.now().toString().slice(-4)}`;
  let targetJabId = data.jab_id || null;
  if (data.nm_jab || data.eselon_id !== undefined) {
    targetJabId = await saveOrUpdateJabatan(targetJabId, data.nm_jab, {
      kategori: data.kategori_jab,
      eselon_id: data.eselon_id,
      jns_jab_id: data.jns_jab_id,
      jenjang_jab_id: data.jenjang_jab_id,
      bup: data.bup,
      kelas_jabatan: data.kelas_jabatan,
      kode_jabatan: data.kode_jabatan,
    });
  }

  const isPimpinan = Boolean(
    generatedKode.endsWith("10011001") ||
    (parentUnor && data.nmUnor?.trim().toLowerCase() === parentUnor.nmUnor?.trim().toLowerCase())
  );

  const noUrut = data.no_urut !== undefined && data.no_urut !== null && data.no_urut !== ""
    ? parseInt(data.no_urut, 10)
    : await getNextNoUrut(data.unor_id, "sub", parentUnor?.instansi_id || null);

  return prisma.ref_unitorganisasi.create({
    data: {
      id,
      parent_id: data.unor_id,
      instansi_id: parentUnor?.instansi_id || null,
      kode: generatedKode,
      nmUnor: data.nmUnor,
      level: "sub",
      no_urut: noUrut,
      jab_id: targetJabId,
      jnsUnor_id: data.jnsUnor_id || null,
      peraturan: data.peraturan || null,
      tglPeraturan: data.tglPeraturan ? new Date(data.tglPeraturan) : null,
      tahun: data.tahun !== undefined && data.tahun !== null ? parseInt(data.tahun, 10) : null,
      ket: data.ket || null,
      is_pimpinan: isPimpinan,
      isAktif: data.isAktif !== undefined ? parseInt(data.isAktif, 10) : 1,
      is_deleted: false,
    },
  });
};

export const updateSubUnor = async (id, data) => {
  const existing = await getSubUnorById(id);
  if (data.unor_id) await getUnorById(data.unor_id);
  let targetJabId = data.jab_id !== undefined ? data.jab_id : existing.jab_id;
  if (data.nm_jab || data.eselon_id !== undefined || data.kategori_jab !== undefined) {
    targetJabId = await saveOrUpdateJabatan(targetJabId, data.nm_jab, {
      kategori: data.kategori_jab,
      eselon_id: data.eselon_id,
      jns_jab_id: data.jns_jab_id,
      jenjang_jab_id: data.jenjang_jab_id,
      bup: data.bup,
      kelas_jabatan: data.kelas_jabatan,
      kode_jabatan: data.kode_jabatan,
    });
  }

  return prisma.ref_unitorganisasi.update({
    where: { id },
    data: {
      ...(data.kode ? { kode: data.kode } : {}),
      ...(data.nmUnor ? { nmUnor: data.nmUnor } : {}),
      ...(data.unor_id ? { parent_id: data.unor_id } : {}),
      ...(data.jnsUnor_id !== undefined ? { jnsUnor_id: data.jnsUnor_id } : {}),
      ...(data.peraturan !== undefined ? { peraturan: data.peraturan } : {}),
      ...(data.tglPeraturan !== undefined ? { tglPeraturan: data.tglPeraturan ? new Date(data.tglPeraturan) : null } : {}),
      ...(data.tahun !== undefined ? { tahun: data.tahun !== null ? parseInt(data.tahun, 10) : null } : {}),
      ...(data.ket !== undefined ? { ket: data.ket } : {}),
      ...(data.no_urut !== undefined ? { no_urut: data.no_urut !== null && data.no_urut !== "" ? parseInt(data.no_urut, 10) : 1 } : {}),
      ...(targetJabId !== undefined ? { jab_id: targetJabId } : {}),
      ...(data.isAktif !== undefined ? { isAktif: parseInt(data.isAktif, 10) } : {}),
    },
  });
};

export const deleteSubUnor = async (id) => {
  await getSubUnorById(id);
  return prisma.$transaction(async (tx) => {
    return softDeleteTreeCascade(id, tx);
  });
};

// --- SUB UNOR SUB ---

export const getAllSubUnorSub = async (params = {}) => {
  const { page = 1, limit = 10, search = "", parent_id, subUnor_id } = params;
  const skip = (page - 1) * limit;
  const pId = parent_id || subUnor_id;
  const where = {
    is_deleted: false,
    level: "sub-sub",
    ...(pId ? { parent_id: pId } : {}),
    ...(search ? { nmUnor: { contains: search } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.ref_unitorganisasi.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: [{ no_urut: "asc" }, { nmUnor: "asc" }, { kode: "asc" }],
    }),
    prisma.ref_unitorganisasi.count({ where }),
  ]);

  return {
    data,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSubUnorSubById = async (id) => getUnorByIdGeneral(id, "sub-sub");

export const createSubUnorSub = async (data) => {
  const parentSub = await getSubUnorById(data.subUnor_id);
  const id = uuidv4();
  const generatedKode = data.kode || `${data.subUnor_kode || parentSub?.kode || "7209"}${Date.now().toString().slice(-4)}`;
  let targetJabId = data.jab_id || null;
  if (data.nm_jab || data.eselon_id !== undefined) {
    targetJabId = await saveOrUpdateJabatan(targetJabId, data.nm_jab, {
      kategori: data.kategori_jab,
      eselon_id: data.eselon_id,
      jns_jab_id: data.jns_jab_id,
      jenjang_jab_id: data.jenjang_jab_id,
      bup: data.bup,
      kelas_jabatan: data.kelas_jabatan,
      kode_jabatan: data.kode_jabatan,
    });
  }

  const noUrut = data.no_urut !== undefined && data.no_urut !== null && data.no_urut !== ""
    ? parseInt(data.no_urut, 10)
    : await getNextNoUrut(data.subUnor_id, "sub-sub", parentSub?.instansi_id || null);

  return prisma.ref_unitorganisasi.create({
    data: {
      id,
      parent_id: data.subUnor_id,
      instansi_id: parentSub?.instansi_id || null,
      kode: generatedKode,
      nmUnor: data.nmUnor,
      level: "sub-sub",
      no_urut: noUrut,
      jab_id: targetJabId,
      jnsUnor_id: data.jnsUnor_id || null,
      peraturan: data.peraturan || null,
      tglPeraturan: data.tglPeraturan ? new Date(data.tglPeraturan) : null,
      tahun: data.tahun !== undefined && data.tahun !== null ? parseInt(data.tahun, 10) : null,
      ket: data.ket || null,
      is_pimpinan: false,
      isAktif: data.isAktif !== undefined ? parseInt(data.isAktif, 10) : 1,
      is_deleted: false,
    },
  });
};

export const updateSubUnorSub = async (id, data) => {
  const existing = await getSubUnorSubById(id);
  if (data.subUnor_id) await getSubUnorById(data.subUnor_id);
  let targetJabId = data.jab_id !== undefined ? data.jab_id : existing.jab_id;
  if (data.nm_jab || data.eselon_id !== undefined || data.kategori_jab !== undefined) {
    targetJabId = await saveOrUpdateJabatan(targetJabId, data.nm_jab, {
      kategori: data.kategori_jab,
      eselon_id: data.eselon_id,
      jns_jab_id: data.jns_jab_id,
      jenjang_jab_id: data.jenjang_jab_id,
      bup: data.bup,
      kelas_jabatan: data.kelas_jabatan,
      kode_jabatan: data.kode_jabatan,
    });
  }

  return prisma.ref_unitorganisasi.update({
    where: { id },
    data: {
      ...(data.kode ? { kode: data.kode } : {}),
      ...(data.nmUnor ? { nmUnor: data.nmUnor } : {}),
      ...(data.subUnor_id ? { parent_id: data.subUnor_id } : {}),
      ...(data.jnsUnor_id !== undefined ? { jnsUnor_id: data.jnsUnor_id } : {}),
      ...(data.peraturan !== undefined ? { peraturan: data.peraturan } : {}),
      ...(data.tglPeraturan !== undefined ? { tglPeraturan: data.tglPeraturan ? new Date(data.tglPeraturan) : null } : {}),
      ...(data.tahun !== undefined ? { tahun: data.tahun !== null ? parseInt(data.tahun, 10) : null } : {}),
      ...(data.ket !== undefined ? { ket: data.ket } : {}),
      ...(data.no_urut !== undefined ? { no_urut: data.no_urut !== null && data.no_urut !== "" ? parseInt(data.no_urut, 10) : 1 } : {}),
      ...(targetJabId !== undefined ? { jab_id: targetJabId } : {}),
      ...(data.isAktif !== undefined ? { isAktif: parseInt(data.isAktif, 10) } : {}),
    },
  });
};

export const deleteSubUnorSub = async (id) => {
  await getSubUnorSubById(id);
  return prisma.$transaction(async (tx) => {
    return softDeleteTreeCascade(id, tx);
  });
};

// --- PINDAH UNIT ORGANISASI (MOVE / TRANSFER) ---

export const getAllDescendantIds = async (nodeId) => {
  const descendants = [];
  const queue = [nodeId];
  while (queue.length > 0) {
    const curr = queue.shift();
    const children = await prisma.ref_unitorganisasi.findMany({
      where: { parent_id: curr, is_deleted: false },
      select: { id: true },
    });
    for (const child of children) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }
  return descendants;
};

export const getTargetParentOptions = async (params = {}) => {
  const { exclude_id, search = "", instansi_id, instansi_kode = "7209" } = params;

  let excludeIds = [];
  if (exclude_id) {
    const descIds = await getAllDescendantIds(exclude_id);
    excludeIds = [exclude_id, ...descIds];
  }

  const trimmedSearch = search ? search.trim() : "";

  const instansiFilter = instansi_id
    ? { instansi_id }
    : instansi_kode
    ? {
        OR: [
          { instansi_id: "47a536f3-8610-4492-aa81-d3a6e5b4399f" },
          { kode: { startsWith: String(instansi_kode) } },
          { ref_instansi: { kode: parseInt(instansi_kode, 10) || 7209 } },
          { ref_instansi: { instansi: { contains: "TOJO UNA-UNA" } } },
        ],
      }
    : {};

  const where = {
    is_deleted: false,
    level: { in: ["induk", "unor", "sub"] }, // Level sub-sub tidak dapat memiliki cabang lagi
    ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    ...instansiFilter,
    ...(trimmedSearch ? { nmUnor: { contains: trimmedSearch } } : {}),
  };

  const data = await prisma.ref_unitorganisasi.findMany({
    where,
    select: {
      id: true,
      kode: true,
      nmUnor: true,
      level: true,
      no_urut: true,
      parent_id: true,
      instansi_id: true,
      parent: {
        select: {
          id: true,
          nmUnor: true,
          level: true,
          parent: {
            select: {
              id: true,
              nmUnor: true,
              level: true,
            },
          },
        },
      },
    },
    take: 2000,
    orderBy: [{ level: "asc" }, { no_urut: "asc" }, { nmUnor: "asc" }],
  });

  return data.map((item) => {
    const parts = [];
    if (item.parent?.parent?.nmUnor) parts.push(item.parent.parent.nmUnor);
    if (item.parent?.nmUnor) parts.push(item.parent.nmUnor);
    parts.push(item.nmUnor);
    return {
      id: item.id,
      value: item.id,
      label: item.nmUnor,
      level: item.level,
      kode: item.kode,
      no_urut: item.no_urut,
      path: parts.join(" > "),
    };
  });
};

export const moveUnorNode = async (payload) => {
  const { id, target_parent_id, target_instansi_id, target_type } = payload;

  const node = await prisma.ref_unitorganisasi.findFirst({
    where: { id, is_deleted: false },
    select: {
      id: true,
      nmUnor: true,
      level: true,
      parent_id: true,
      instansi_id: true,
      kode: true,
    },
  });

  if (!node) {
    throw new AppError("Unit organisasi yang akan dipindahkan tidak ditemukan", 404);
  }

  let newLevel = "induk";
  let newParentId = null;
  let newInstansiId = node.instansi_id;

  if (target_type === "instansi" || (!target_parent_id && target_instansi_id)) {
    const instansiId = target_instansi_id || node.instansi_id;
    const instansi = await prisma.ref_instansi.findFirst({
      where: { id: instansiId, is_deleted: false },
      select: { id: true, instansi: true, kode: true },
    });
    if (!instansi) {
      throw new AppError("Instansi tujuan tidak ditemukan", 404);
    }
    newLevel = "induk";
    newParentId = null;
    newInstansiId = instansi.id;
  } else {
    if (!target_parent_id) {
      throw new AppError("Silakan pilih unit organisasi tujuan", 400);
    }
    if (target_parent_id === id) {
      throw new AppError("Tidak dapat memindahkan unit organisasi ke dirinya sendiri", 400);
    }

    const descendantIds = await getAllDescendantIds(id);
    if (descendantIds.includes(target_parent_id)) {
      throw new AppError("Tidak dapat memindahkan unit organisasi ke cabang di bawahnya sendiri", 400);
    }

    const targetParent = await prisma.ref_unitorganisasi.findFirst({
      where: { id: target_parent_id, is_deleted: false },
      select: {
        id: true,
        nmUnor: true,
        level: true,
        instansi_id: true,
        kode: true,
      },
    });

    if (!targetParent) {
      throw new AppError("Unit organisasi tujuan tidak ditemukan", 404);
    }

    if (targetParent.level === "sub-sub") {
      throw new AppError("Unit tujuan sudah berada di tingkat terdalam (sub-sub), tidak dapat menambah sub-unit lagi", 400);
    }

    if (targetParent.level === "induk") {
      newLevel = "unor";
    } else if (targetParent.level === "unor") {
      newLevel = "sub";
    } else if (targetParent.level === "sub") {
      newLevel = "sub-sub";
    }

    newParentId = targetParent.id;
    newInstansiId = targetParent.instansi_id || node.instansi_id;
  }

  // Hitung nomor urut otomatis untuk level dan parent baru
  const newNoUrut = await getNextNoUrut(newParentId, newLevel, newInstansiId);

  // Hierarki level map untuk cascade update anak
  const levelHierarchyMap = {
    induk: "unor",
    unor: "sub",
    sub: "sub-sub",
    "sub-sub": "sub-sub",
  };

  const cascadeUpdateChildrenLevels = async (parentId, parentLevel, tx) => {
    const nextChildLevel = levelHierarchyMap[parentLevel] || "sub-sub";
    const children = await tx.ref_unitorganisasi.findMany({
      where: { parent_id: parentId, is_deleted: false },
      select: { id: true, level: true },
    });

    for (const child of children) {
      await tx.ref_unitorganisasi.update({
        where: { id: child.id },
        data: {
          level: nextChildLevel,
          instansi_id: newInstansiId,
        },
        select: { id: true },
      });
      await cascadeUpdateChildrenLevels(child.id, nextChildLevel, tx);
    }
  };

  const updatedNode = await prisma.$transaction(async (tx) => {
    const updated = await tx.ref_unitorganisasi.update({
      where: { id },
      data: {
        parent_id: newParentId,
        instansi_id: newInstansiId,
        level: newLevel,
        no_urut: newNoUrut,
      },
      select: {
        id: true,
        nmUnor: true,
        level: true,
        parent_id: true,
        instansi_id: true,
        no_urut: true,
        kode: true,
      },
    });

    await cascadeUpdateChildrenLevels(id, newLevel, tx);
    return updated;
  });

  return updatedNode;
};

// --- REORDER UNOR NODES ---

export const reorderUnorNodes = async (payload) => {
  const { items } = payload;
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("Daftar unit organisasi yang akan diurutkan tidak valid", 400);
  }

  return prisma.$transaction(async (tx) => {
    const updates = [];
    for (const item of items) {
      if (!item.id || item.no_urut === undefined) continue;
      const updated = await tx.ref_unitorganisasi.update({
        where: { id: item.id },
        data: {
          no_urut: parseInt(item.no_urut, 10),
        },
        select: {
          id: true,
          nmUnor: true,
          no_urut: true,
        },
      });
      updates.push(updated);
    }
    return updates;
  });
};


