import prisma from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import { v4 as uuidv4 } from "uuid";

const parseOptionalDate = (val) => {
  if (!val || val === "" || val === "null" || val === "undefined") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const parseOptionalInt = (val) => {
  if (val === undefined || val === null || val === "" || val === "null" || val === "undefined") return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
};

export const getKedudukanPensiunOptions = async () => {
  return prisma.ref_kedudukanpns.findMany({
    where: {
      is_deleted: false,
      id: { in: [2, 3, 4, 5, 9, 11] }, // Pensiun Masa Waktu, Janda/Duda, Pensiun Dini, Disiplin, Pemberhentian
    },
    select: {
      id: true,
      kedudukanpns: true,
    },
    orderBy: { id: "asc" },
  });
};

export const getAllPensiun = async (params = {}) => {
  const { page = 1, limit = 10, search = "", kedudukanpns_id } = params;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const skip = (pageNum - 1) * limitNum;

  const trimmedSearch = search ? search.trim() : "";

  const where = {
    is_deleted: false,
    ...(kedudukanpns_id ? { kedudukanpns_id: parseInt(kedudukanpns_id, 10) } : {}),
    ...(trimmedSearch
      ? {
          OR: [
            { no_sk: { contains: trimmedSearch } },
            { ket: { contains: trimmedSearch } },
          ],
        }
      : {}),
  };

  const [rawPensiunList, total] = await Promise.all([
    prisma.rwt_pensiun.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { created_at: "desc" },
    }),
    prisma.rwt_pensiun.count({ where }),
  ]);

  // Fetch related Pegawai and KedudukanPNS details
  const pegawaiIds = [...new Set(rawPensiunList.map((item) => item.pegawai_id))];
  const kedudukanIds = [...new Set(rawPensiunList.map((item) => item.kedudukanpns_id))];

  const [pegawaiList, kedudukanList] = await Promise.all([
    pegawaiIds.length > 0
      ? prisma.ta_pegawai.findMany({
          where: { id: { in: pegawaiIds } },
          select: {
            id: true,
            nipBaru: true,
            ta_orang: {
              select: {
                nama: true,
                foto: true,
              },
            },
            rwt_jabatan: {
              select: {
                nama_jabatan: true,
                ref_unitorganisasi: {
                  select: {
                    nmUnor: true,
                  },
                },
              },
            },
          },
        })
      : [],
    kedudukanIds.length > 0
      ? prisma.ref_kedudukanpns.findMany({
          where: { id: { in: kedudukanIds } },
          select: { id: true, kedudukanpns: true },
        })
      : [],
  ]);

  const pegawaiMap = new Map(pegawaiList.map((p) => [p.id, p]));
  const kedudukanMap = new Map(kedudukanList.map((k) => [Number(k.id), k.kedudukanpns]));

  const data = rawPensiunList.map((item) => {
    const pegawai = pegawaiMap.get(item.pegawai_id);
    return {
      ...item,
      pegawai: pegawai
        ? {
            id: pegawai.id,
            nipBaru: pegawai.nipBaru,
            nama: pegawai.ta_orang?.nama || "-",
            foto: pegawai.ta_orang?.foto || null,
            jabatan: pegawai.rwt_jabatan?.nama_jabatan || "-",
            unor: pegawai.rwt_jabatan?.ref_unitorganisasi?.nmUnor || "-",
          }
        : null,
      nama_kedudukan: kedudukanMap.get(Number(item.kedudukanpns_id)) || "PENSIUN",
    };
  });

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

export const createPensiun = async (data, file) => {
  const { pegawai_id, kedudukanpns_id, no_sk, tgl_sk, tmt_pensiun, ket } = data;

  const pegawai = await prisma.ta_pegawai.findUnique({
    where: { id: pegawai_id },
    select: { id: true, nipBaru: true },
  });

  if (!pegawai) {
    throw new AppError("Data pegawai tidak ditemukan", 404);
  }

  const kedudukanIdInt = parseInt(kedudukanpns_id, 10);
  const filePath = file ? file.path.replace(/\\/g, "/") : null;
  const pensiunId = uuidv4();

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create rwt_pensiun record
    const pensiun = await tx.rwt_pensiun.create({
      data: {
        id: pensiunId,
        pegawai_id,
        kedudukanpns_id: kedudukanIdInt,
        no_sk: no_sk || null,
        tgl_sk: parseOptionalDate(tgl_sk),
        tmt_pensiun: parseOptionalDate(tmt_pensiun),
        file_sk: filePath,
        ket: ket || null,
        is_deleted: false,
      },
    });

    // 2. Update status kedudukan pegawai di ta_pegawai
    await tx.ta_pegawai.update({
      where: { id: pegawai_id },
      data: {
        kedudukanPns_id: kedudukanIdInt,
      },
    });

    return pensiun;
  });

  return result;
};

export const deletePensiun = async (id) => {
  const existing = await prisma.rwt_pensiun.findFirst({
    where: { id, is_deleted: false },
  });

  if (!existing) {
    throw new AppError("Data pensiun tidak ditemukan", 404);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Soft delete rwt_pensiun
    await tx.rwt_pensiun.update({
      where: { id },
      data: { is_deleted: true },
    });

    // 2. Check remaining pensiun records for this pegawai
    const remainingCount = await tx.rwt_pensiun.count({
      where: { pegawai_id: existing.pegawai_id, is_deleted: false },
    });

    // 3. If no active pensiun record left, revert pegawai kedudukan back to 1 (PNS AKTIF PEMDA)
    if (remainingCount === 0) {
      await tx.ta_pegawai.update({
        where: { id: existing.pegawai_id },
        data: { kedudukanPns_id: 1 },
      });
    }

    return { message: "Data pensiun berhasil dihapus" };
  });
};
