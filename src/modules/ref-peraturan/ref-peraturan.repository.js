import prisma from "../../config/database.js";

const defaultSelect = {
  id: true,
  nomor_peraturan: true,
  judul: true,
  kategori: true,
  jenis_peraturan: true,
  tahun: true,
  tgl_penetapan: true,
  tgl_berlaku: true,
  status_berlaku: true,
  parent_id: true,
  peraturan_terkait_id: true,
  tipe_relasi: true,
  peraturan_terkait: true,
  tentang: true,
  file_path: true,
  file_nama_asli: true,
  file_size: true,
  keterangan: true,
  created_by: true,
  created_at: true,
  updated_at: true,
  parent: {
    select: {
      id: true,
      nomor_peraturan: true,
      judul: true,
      jenis_peraturan: true,
      tahun: true,
    },
  },
  peraturan_terkait_ref: {
    select: {
      id: true,
      nomor_peraturan: true,
      judul: true,
      jenis_peraturan: true,
      tahun: true,
      status_berlaku: true,
    },
  },
  direferensikan_oleh: {
    where: { is_deleted: false },
    select: {
      id: true,
      nomor_peraturan: true,
      judul: true,
      jenis_peraturan: true,
      tahun: true,
      tipe_relasi: true,
      status_berlaku: true,
    },
  },
};

export const findAll = async ({
  search = "",
  kategori = "",
  jenis_peraturan = "",
  tahun = null,
  status_berlaku = "",
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder = "desc",
}) => {
  const where = {
    is_deleted: false,
  };

  if (search) {
    where.OR = [
      { nomor_peraturan: { contains: search } },
      { judul: { contains: search } },
      { tentang: { contains: search } },
      { keterangan: { contains: search } },
      { peraturan_terkait: { contains: search } },
    ];
  }

  if (kategori) {
    where.kategori = kategori;
  }

  if (jenis_peraturan) {
    where.jenis_peraturan = jenis_peraturan;
  }

  if (tahun) {
    where.tahun = parseInt(tahun, 10);
  }

  if (status_berlaku) {
    where.status_berlaku = status_berlaku;
  }

  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.ref_peraturan.findMany({
      where,
      select: defaultSelect,
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit,
    }),
    prisma.ref_peraturan.count({ where }),
  ]);

  return { data, total };
};

export const findById = async (id) => {
  return prisma.ref_peraturan.findFirst({
    where: {
      id,
      is_deleted: false,
    },
    select: {
      ...defaultSelect,
      children: {
        where: { is_deleted: false },
        select: {
          id: true,
          nomor_peraturan: true,
          judul: true,
          jenis_peraturan: true,
          status_berlaku: true,
          tahun: true,
        },
      },
      direferensikan_oleh: {
        where: { is_deleted: false },
        select: {
          id: true,
          nomor_peraturan: true,
          judul: true,
          tipe_relasi: true,
          status_berlaku: true,
          jenis_peraturan: true,
          tahun: true,
        },
      },
    },
  });
};

export const findByNomor = async (nomor_peraturan, excludeId = null) => {
  const where = {
    nomor_peraturan,
    is_deleted: false,
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  return prisma.ref_peraturan.findFirst({
    where,
    select: { id: true, nomor_peraturan: true },
  });
};

export const create = async (data) => {
  return prisma.ref_peraturan.create({
    data,
    select: defaultSelect,
  });
};

export const update = async (id, data) => {
  return prisma.ref_peraturan.update({
    where: { id },
    data,
    select: defaultSelect,
  });
};

export const softDelete = async (id) => {
  return prisma.ref_peraturan.update({
    where: { id },
    data: { is_deleted: true },
    select: { id: true, nomor_peraturan: true },
  });
};

export const searchLookup = async (search = "", excludeId = null) => {
  const where = {
    is_deleted: false,
  };

  if (excludeId) {
    where.id = { not: excludeId };
  }

  if (search) {
    where.OR = [
      { nomor_peraturan: { contains: search } },
      { judul: { contains: search } },
    ];
  }

  return prisma.ref_peraturan.findMany({
    where,
    select: {
      id: true,
      nomor_peraturan: true,
      judul: true,
      jenis_peraturan: true,
      kategori: true,
      tahun: true,
      status_berlaku: true,
    },
    orderBy: [{ tahun: "desc" }, { nomor_peraturan: "asc" }],
    take: 25,
  });
};

export const getAllForHierarchy = async (kategori = "") => {
  const where = {
    is_deleted: false,
  };

  if (kategori) {
    where.kategori = kategori;
  }

  return prisma.ref_peraturan.findMany({
    where,
    select: {
      id: true,
      nomor_peraturan: true,
      judul: true,
      kategori: true,
      jenis_peraturan: true,
      tahun: true,
      status_berlaku: true,
      parent_id: true,
      peraturan_terkait_id: true,
      tipe_relasi: true,
      peraturan_terkait: true,
      tentang: true,
      file_path: true,
      parent: {
        select: {
          id: true,
          nomor_peraturan: true,
          judul: true,
          jenis_peraturan: true,
        },
      },
      peraturan_terkait_ref: {
        select: {
          id: true,
          nomor_peraturan: true,
          judul: true,
          jenis_peraturan: true,
        },
      },
    },
    orderBy: [{ tahun: "desc" }, { nomor_peraturan: "asc" }],
  });
};

export const getKategoriList = async () => {
  const result = await prisma.ref_peraturan.groupBy({
    by: ["kategori"],
    where: { is_deleted: false },
    _count: { id: true },
  });

  return result.map((item) => ({
    kategori: item.kategori,
    count: item._count.id,
  }));
};

export const getJenisList = async () => {
  const result = await prisma.ref_peraturan.groupBy({
    by: ["jenis_peraturan"],
    where: { is_deleted: false },
    _count: { id: true },
  });

  return result.map((item) => ({
    jenis_peraturan: item.jenis_peraturan,
    count: item._count.id,
  }));
};
