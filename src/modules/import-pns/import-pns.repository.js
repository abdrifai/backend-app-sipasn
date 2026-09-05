import prisma from "../../config/database.js";

const importPnsSelect = {
  id: true,
  batch_id: true,
  file_name: true,
  pns_id: true,
  nip_baru: true,
  nip_lama: true,
  nama: true,
  gelar_depan: true,
  gelar_belakang: true,
  tempat_lahir: true,
  tempat_lahir_id: true,
  tanggal_lahir: true,
  jenis_kelamin: true,
  agama_id: true,
  agama_nama: true,
  jenis_kawin_id: true,
  jenis_kawin_nama: true,
  nik: true,
  nomor_hp: true,
  email: true,
  email_gov: true,
  alamat: true,
  npwp_nomor: true,
  bpjs: true,
  jenis_pegawai_id: true,
  jenis_pegawai_nama: true,
  kedudukan_pns_id: true,
  kedudukan_pns_nama: true,
  status_cpns_pns: true,
  kartu_asn_virtual: true,
  nomor_sk_cpns: true,
  tanggal_sk_cpns: true,
  tmt_cpns: true,
  nomor_sk_pns: true,
  tanggal_sk_pns: true,
  tmt_pns: true,
  gol_awal_id: true,
  gol_awal_nama: true,
  gol_akhir_id: true,
  gol_akhir_nama: true,
  tmt_golongan: true,
  mk_tahun: true,
  mk_bulan: true,
  jenis_jabatan_id: true,
  jenis_jabatan_nama: true,
  jabatan_id: true,
  jabatan_nama: true,
  tmt_jabatan: true,
  tingkat_pendidikan_id: true,
  tingkat_pendidikan_nama: true,
  pendidikan_id: true,
  pendidikan_nama: true,
  tahun_lulus: true,
  kpkn_id: true,
  kpkn_nama: true,
  lokasi_kerja_id: true,
  lokasi_kerja_nama: true,
  unor_id: true,
  unor_nama: true,
  instansi_induk_id: true,
  instansi_induk_nama: true,
  instansi_kerja_id: true,
  instansi_kerja_nama: true,
  satuan_kerja_induk_id: true,
  satuan_kerja_induk_nama: true,
  satuan_kerja_kerja_id: true,
  satuan_kerja_kerja_nama: true,
  is_valid_nik: true,
  nama_sekolah: true,
  flag_ikd: true,
  csv_created_at: true,
  csv_updated_at: true,
  eselon_id: true,
  eselon_nama: true,
  is_deleted: true,
  created_at: true,
  updated_at: true,
};

export const createMany = async (records) => {
  return prisma.ta_import_pns.createMany({
    data: records,
  });
};

export const findAll = async ({ page = 1, limit = 10, search = "", batch_id = "", status_cpns_pns = "" }) => {
  const skip = (page - 1) * limit;
  const where = {
    is_deleted: false,
  };

  if (batch_id) {
    where.batch_id = batch_id;
  }

  if (status_cpns_pns) {
    if (status_cpns_pns === "PNS" || status_cpns_pns === "P") {
      where.status_cpns_pns = { in: ["P", "PNS", "pns", "p"] };
    } else if (status_cpns_pns === "CPNS" || status_cpns_pns === "C") {
      where.status_cpns_pns = { in: ["C", "CPNS", "cpns", "c"] };
    } else {
      where.status_cpns_pns = status_cpns_pns;
    }
  }

  if (search) {
    where.OR = [
      { nip_baru: { contains: search } },
      { nama: { contains: search } },
      { nik: { contains: search } },
      { unor_nama: { contains: search } },
      { jabatan_nama: { contains: search } },
      { file_name: { contains: search } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.ta_import_pns.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: importPnsSelect,
    }),
    prisma.ta_import_pns.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const findById = async (id) => {
  return prisma.ta_import_pns.findFirst({
    where: { id, is_deleted: false },
    select: importPnsSelect,
  });
};

export const getSummary = async () => {
  const total = await prisma.ta_import_pns.count({
    where: { is_deleted: false },
  });

  const batches = await prisma.ta_import_pns.groupBy({
    by: ["batch_id", "file_name", "created_at"],
    where: { is_deleted: false },
    _count: {
      id: true,
    },
    orderBy: {
      created_at: "desc",
    },
    take: 10,
  });

  return {
    totalRecords: total,
    recentBatches: batches.map((b) => ({
      batchId: b.batch_id,
      fileName: b.file_name,
      createdAt: b.created_at,
      count: b._count.id,
    })),
  };
};

export const softDeleteBatch = async (batchId) => {
  return prisma.ta_import_pns.updateMany({
    where: { batch_id: batchId, is_deleted: false },
    data: { is_deleted: true },
  });
};

export const softDeleteById = async (id) => {
  return prisma.ta_import_pns.update({
    where: { id },
    data: { is_deleted: true },
    select: { id: true },
  });
};

export const getRekapJabatan = async ({ batch_id = "", search = "", jenis_jabatan_nama = "", page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const where = {
    is_deleted: false,
  };

  if (batch_id) {
    where.batch_id = batch_id;
  }

  if (jenis_jabatan_nama) {
    where.jenis_jabatan_nama = jenis_jabatan_nama;
  }

  if (search) {
    where.OR = [
      { jabatan_nama: { contains: search } },
      { jenis_jabatan_nama: { contains: search } },
    ];
  }


  const grouped = await prisma.ta_import_pns.groupBy({
    by: ["jabatan_nama", "jenis_jabatan_nama"],
    where,
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });

  const total = grouped.length;
  const pagedGrouped = grouped.slice(skip, skip + limit);

  const data = await Promise.all(
    pagedGrouped.map(async (item) => {
      const condition = {
        ...where,
        jabatan_nama: item.jabatan_nama,
      };

      const [countPns, countCpns] = await Promise.all([
        prisma.ta_import_pns.count({
          where: {
            ...condition,
            status_cpns_pns: { in: ["P", "PNS", "pns", "p"] },
          },
        }),
        prisma.ta_import_pns.count({
          where: {
            ...condition,
            status_cpns_pns: { in: ["C", "CPNS", "cpns", "c"] },
          },
        }),
      ]);

      return {
        jabatan_nama: item.jabatan_nama || "Tanpa Nama Jabatan",
        jenis_jabatan_nama: item.jenis_jabatan_nama || "-",
        total_pegawai: item._count.id,
        jumlah_pns: countPns,
        jumlah_cpns: countCpns,
      };
    })
  );


  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getRekapJenisJabatan = async ({ batch_id = "", search = "", page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;
  const where = {
    is_deleted: false,
  };

  if (batch_id) {
    where.batch_id = batch_id;
  }

  if (search) {
    where.jenis_jabatan_nama = { contains: search };
  }

  const [grouped, totalRecordsOverall] = await Promise.all([
    prisma.ta_import_pns.groupBy({
      by: ["jenis_jabatan_nama"],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    }),
    prisma.ta_import_pns.count({ where }),
  ]);

  const total = grouped.length;
  const pagedGrouped = grouped.slice(skip, skip + limit);

  const data = await Promise.all(
    pagedGrouped.map(async (item) => {
      const condition = {
        ...where,
        jenis_jabatan_nama: item.jenis_jabatan_nama,
      };

      const [countPns, countCpns] = await Promise.all([
        prisma.ta_import_pns.count({
          where: {
            ...condition,
            status_cpns_pns: { in: ["P", "PNS", "pns", "p"] },
          },
        }),
        prisma.ta_import_pns.count({
          where: {
            ...condition,
            status_cpns_pns: { in: ["C", "CPNS", "cpns", "c"] },
          },
        }),
      ]);

      const totalPegawai = item._count.id;
      const persentase = totalRecordsOverall > 0 ? ((totalPegawai / totalRecordsOverall) * 100).toFixed(1) : "0.0";

      return {
        jenis_jabatan_nama: item.jenis_jabatan_nama || "Tanpa Jenis Jabatan",
        total_pegawai: totalPegawai,
        jumlah_pns: countPns,
        jumlah_cpns: countCpns,
        persentase: parseFloat(persentase),
      };
    })
  );

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      totalRecordsOverall,
    },
  };
};


