import fs from "fs";
import prisma from "../../config/database.js";

/**
 * Ambil data pegawai dengan pagination, search, dan relations
 */
export const findAll = async ({ page = 1, limit = 10, search = "", sortBy = "id", sortOrder = "asc" }) => {
  const skip = (page - 1) * limit;

  const where = {
    kedudukanPns_id: { in: [1, 7, 8, 10] },
    ...(search && {
      OR: [
        { nipBaru: { contains: search } },
        { ta_orang: { nama: { contains: search } } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.ta_pegawai.findMany({
      where,
      select: {
        id: true,
        nipBaru: true,
        ta_orang: {
          select: {
            nama: true,
            nik: true,
            foto: true,
          },
        },
        rwt_gol: {
          select: {
            ref_gol: {
              select: {
                gol: true,
                pangkat: true,
              },
            },
          },
        },
        rwt_jabatan: {
          include: {
            ref_unitorganisasi: { select: { nmUnor: true, level: true } },
            ref_jnsjab: { select: { id: true, jnsjab: true } },
            ref_jabatan: { select: { nama_jabatan: true, kategori: true, eselon_id: true } },
          },
        },
        rwt_pend: {
          select: {
            gd: true,
            gb: true,
          },
        },
      },
      skip,
      take: limit,
      // Default ordering by nipBaru
      orderBy: { nipBaru: 'asc' },
    }),
    prisma.ta_pegawai.count({ where }),
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

/**
 * Ambil statistik migrasi jabatan untuk dashboard
 */
export const getMigrationStats = async () => {
  const activePnsWhere = { kedudukanPns_id: { in: [1, 7, 8, 10] } };

  // Hitung total pegawai pns aktif
  const totalPegawai = await prisma.ta_pegawai.count({ where: activePnsWhere });

  // Ambil rwt_jabatan terbaru untuk setiap pegawai
  const stats = await prisma.rwt_jabatan.groupBy({
    by: ['jnsJab_id'],
    _count: { _all: true },
    where: {
      ta_pegawai: activePnsWhere
    }
  });

  return {
    total: totalPegawai,
    byType: stats
  };
};

/**
 * Cari detail pegawai berdasarkan ID
 */
export const findById = async (id) => {
  return prisma.ta_pegawai.findUnique({
    where: { id },
    include: {
      ta_orang: true,
      rwt_gol: {
        include: {
          ref_gol: true,
        },
      },
      rwt_jabatan: {
        include: {
          ref_jabatan: true,
          ref_unitorganisasi: true,
          ref_jnsjab: true,
        },
      },
      rwt_pend: true,
      rwt_diklat: true,
    },
  });
};

export const findDetail = findById;

/**
 * Ambil seluruh riwayat lengkap pegawai
 */
export const findRiwayatByPegawaiId = async (pegawaiId, nipBaru) => {
  const [
    riwayatJabatan,
    riwayatGolongan,
    riwayatPendidikan,
    riwayatDiklat,
    riwayatKgb,
    riwayatHukdis,
    dataCpnsPns,
    riwayatProfesi,
    riwayatOrtu,
    riwayatPasangan,
    riwayatAnak,
    arsipList,
  ] = await Promise.all([
    // 1. Riwayat Jabatan
    prisma.rwt_jabatan.findMany({
      where: { pegawai_id: pegawaiId },
      orderBy: { tmtSk: "desc" },
      include: {
        ref_jabatan: true,
        ref_unitorganisasi: true,
        ref_jnsjab: true,
      },
    }),

    // 2. Riwayat Golongan / KP
    prisma.rwt_gol.findMany({
      where: { pegawai_id: pegawaiId },
      orderBy: { tmtSk: "desc" },
      include: {
        ref_gol: true,
      },
    }),

    // 3. Riwayat Pendidikan
    prisma.rwt_pend.findMany({
      where: { pegawai_id: pegawaiId },
      orderBy: { thnLulus: "desc" },
    }),

    // 4. Riwayat Diklat
    prisma.rwt_diklat.findMany({
      where: {
        OR: [
          { pegawai_id: pegawaiId },
          ...(nipBaru ? [{ nipBaru }] : []),
        ],
      },
      orderBy: { tglSertifikat: "desc" },
    }),

    // 5. Riwayat KGB
    prisma.rwt_kgb.findMany({
      where: {
        OR: [
          { pegawai_id: pegawaiId },
          ...(nipBaru ? [{ nipBaru }] : []),
        ],
      },
      orderBy: { tmtSk: "desc" },
    }),

    // 6. Riwayat Hukdis
    prisma.$queryRaw`
      SELECT h.*, j.jnshukuman as jnsHukuman_nama, t.tkthukuman as tktHukuman_nama
      FROM rwt_hukdis h
      LEFT JOIN ref_jnshukuman j ON h.jnsHukuman_id = j.id
      LEFT JOIN ref_tkthukuman t ON h.tktHukuman_id = t.id
      WHERE h.pegawai_id = ${pegawaiId}
      ORDER BY h.tmtSkHd DESC
    `.catch(() => []),

    // 7. Data CPNS / PNS
    prisma.$queryRaw`
      SELECT c.*, g.gol as gol_nama, g.pangkat as pangkat_nama, s.spns as spns_nama
      FROM ta_cpnspns c
      LEFT JOIN ref_gol g ON c.gol_id = g.kdGol
      LEFT JOIN ref_spns s ON c.spns_id = s.id
      WHERE c.pegawai_id = ${pegawaiId}
      ORDER BY c.tmtsk ASC
    `.catch(() => []),

    // 8. Riwayat Profesi
    prisma.$queryRaw`
      SELECT p.*, j.jns_profesi as profesi_nama
      FROM rwt_profesi p
      LEFT JOIN ref_jns_profesi j ON p.jns_profesi_id = j.id
      WHERE p.pegawai_id = ${pegawaiId}
      ORDER BY p.tgl_lulus DESC
    `.catch(() => []),

    // 9. Riwayat Orang Tua
    prisma.$queryRaw`
      SELECT r.*, o.nama, o.nik, o.t4Lhr, o.tglLhr, o.alamat, o.no_hp
      FROM rwt_ortu r
      LEFT JOIN ta_orang o ON r.orang_id = o.id
      WHERE r.pegawai_id = ${pegawaiId}
    `.catch(() => []),

    // 10. Riwayat Pasangan (Suami / Istri)
    prisma.$queryRaw`
      SELECT r.*, o.nama, o.nik, o.t4Lhr, o.tglLhr, o.alamat, o.no_hp, o.npwp
      FROM rwt_suis r
      LEFT JOIN ta_orang o ON r.orang_id = o.id
      WHERE r.pegawai_id = ${pegawaiId}
    `.catch(() => []),

    // 11. Riwayat Anak
    prisma.$queryRaw`
      SELECT r.*, o.nama, o.nik, o.t4Lhr, o.tglLhr, o.jkl_id, o.alamat, o.no_hp,
             ortu.nama as nama_ortu
      FROM rwt_anak r
      LEFT JOIN ta_orang o ON r.orang_id = o.id
      LEFT JOIN ta_orang ortu ON r.ortu_id = ortu.id
      WHERE r.pegawai_id = ${pegawaiId}
      ORDER BY o.tglLhr ASC, r.created_at ASC
    `.catch(() => []),

    // 12. Arsip Dokumen Digital
    prisma.ta_arsip.findMany({
      where: { pegawai_id: pegawaiId },
      select: {
        id: true,
        pegawai_id: true,
        from: true,
        jnsarsip_id: true,
        arsip: true,
      },
    }),
  ]);

  return {
    riwayatJabatan,
    riwayatGolongan,
    riwayatPendidikan,
    riwayatDiklat,
    riwayatKgb,
    riwayatHukdis,
    dataCpnsPns,
    riwayatProfesi,
    riwayatOrtu,
    riwayatPasangan,
    riwayatAnak,
    arsipList,
  };
};

/**
 * Ambil nama jabatan fungsional (JF)
 */
export const findJabatanFungsionalById = async (id) => {
  const jab = await prisma.ref_jabatan.findFirst({
    where: { id },
    select: { nama_jabatan: true },
  });
  return jab ? { nmJab: jab.nama_jabatan } : null;
};

/**
 * Ambil nama jabatan pelaksana / administrasi / fungsional (JF/JA)
 */
export const findJabatanPelaksanaById = async (id) => {
  const jab = await prisma.ref_jabatan.findFirst({
    where: { id },
    select: { nama_jabatan: true },
  });
  return jab ? { nmJab: jab.nama_jabatan } : null;
};
/**
 * Ambil data DUK (Daftar Urut Kepangkatan) dengan filter unit kerja
 */
export const findDUK = async ({ unorInduk_id = "", tktPend_id = "", gol_id = "", jnsJab_id = "", age_range = "", skip = 0, take = 1000 }) => {
  const activePnsWhere = { kedudukanPns_id: { in: [1, 7, 8, 10] } };

  let ageCondition = {};
  if (age_range) {
    const currentYear = new Date().getFullYear();
    if (age_range === "< 30") {
      ageCondition = { tglLhr: { gte: new Date(`${currentYear - 30}-01-01`) } };
    } else if (age_range === "31 - 40") {
      ageCondition = {
        tglLhr: {
          gte: new Date(`${currentYear - 40}-01-01`),
          lt: new Date(`${currentYear - 30}-01-01`)
        }
      };
    } else if (age_range === "41 - 50") {
      ageCondition = {
        tglLhr: {
          gte: new Date(`${currentYear - 50}-01-01`),
          lt: new Date(`${currentYear - 40}-01-01`)
        }
      };
    } else if (age_range === "51 - 60") {
      ageCondition = {
        tglLhr: {
          gte: new Date(`${currentYear - 60}-01-01`),
          lt: new Date(`${currentYear - 50}-01-01`)
        }
      };
    } else if (age_range === "> 60") {
      ageCondition = { tglLhr: { lt: new Date(`${currentYear - 60}-01-01`) } };
    }
  }

  const where = {
    ...activePnsWhere,
    ...((unorInduk_id || jnsJab_id) && {
      rwt_jabatan: {
        ...(unorInduk_id && { unorInduk_id }),
        ...(jnsJab_id && { jnsJab_id }),
      }
    }),
    ...(tktPend_id && {
      rwt_pend: { tktPend_id: parseInt(tktPend_id) },
    }),
    ...(gol_id && {
      rwt_gol: { gol_id },
    }),
    ...(age_range && {
      ta_orang: ageCondition
    })
  };

  const [results, total] = await prisma.$transaction([
    prisma.ta_pegawai.findMany({
      where,
    select: {
      id: true,
      nipBaru: true,
      ta_orang: {
        select: {
          nama: true,
          tglLhr: true,
        },
      },
      rwt_gol: {
        select: {
          gol_id: true,
          ref_gol: {
            select: {
              gol: true,
              pangkat: true,
            },
          },
        },
      },
      rwt_jabatan: {
        select: {
          nmJab_id: true,
          jnsJab_id: true,
          ref_unitorganisasi: {
            select: { nmUnor: true, level: true },
          },
          ref_jabatan: {
            select: {
              nama_jabatan: true,
              kategori: true,
              ref_eselon: {
                select: { eselon_kode: true },
              },
            },
          },
        },
      },
    },
    // Sorting dasar: Pangkat teratas dan usia tertua
    orderBy: [
      { rwt_gol: { gol_id: "desc" } },
      { ta_orang: { tglLhr: "asc" } },
    ],
    skip: parseInt(skip),
    take: parseInt(take),
  }),
  prisma.ta_pegawai.count({ where })
  ]);

  return { results, total };
};

/**
 * Ambil statistik jabatan untuk satu unit kerja (hanya pegawai aktif)
 */
export const findDUKStats = async (unorInduk_id, filters = {}) => {
  const activePnsWhere = { kedudukanPns_id: { in: [1, 7, 8, 10] } };
  const { tktPend_id, gol_id, jnsJab_id } = filters;

  const where = {
    ...activePnsWhere,
    ...((unorInduk_id || jnsJab_id) && {
      rwt_jabatan: {
        ...(unorInduk_id && { unorInduk_id }),
        ...(jnsJab_id && { jnsJab_id }),
      },
    }),
    ...(tktPend_id && {
      rwt_pend: { tktPend_id: parseInt(tktPend_id) },
    }),
    ...(gol_id && {
      rwt_gol: { gol_id },
    }),
  };

  const pegawais = await prisma.ta_pegawai.findMany({
    where,
    select: {
      rwt_jabatan: {
        select: {
          nmJab_id: true,
          jnsJab_id: true,
          ref_jabatan: {
            select: { nama_jabatan: true, kategori: true },
          },
        },
      },
    },
  });

  return pegawais.map((p) => p.rwt_jabatan).filter(Boolean);
};

/**
 * Ambil data proyeksi estimasi pensiun pegawai aktif beserta statistik
 */
export const findEstimasiPensiun = async ({
  tahun = "",
  bulan = "",
  rentang = "",
  unorInduk_id = "",
  kategori = "",
  search = "",
  skip = 0,
  take = 15,
}) => {
  // PNS Aktif: 1 (Aktif Pemda), 7 (Aktif Diperkerjakan), 8 (Aktif Non Job), 10 (Persetujuan Pindah Wilayah Kerja)
  const activePnsWhere = { kedudukanPns_id: { in: [1, 7, 8, 10] } };

  const where = {
    ...activePnsWhere,
    ta_orang: {
      is: {
        nama: { not: "" },
        ...(search ? {
          OR: [
            { nama: { contains: search } },
            { ta_pegawai: { nipBaru: { contains: search } } },
          ],
        } : {}),
      },
    },
    ...(unorInduk_id && {
      rwt_jabatan: {
        unorInduk_id,
      },
    }),
  };

  const allPegawai = await prisma.ta_pegawai.findMany({
    where,
    select: {
      id: true,
      nipBaru: true,
      ta_orang: {
        select: {
          nama: true,
          tglLhr: true,
          jkl_id: true,
          foto: true,
        },
      },
      rwt_gol: {
        select: {
          gol_id: true,
          ref_gol: {
            select: {
              gol: true,
              pangkat: true,
            },
          },
        },
      },
      rwt_jabatan: {
        select: {
          nmJab_id: true,
          jnsJab_id: true,
          unorInduk_id: true,
          ref_unitorganisasi: {
            select: { id: true, nmUnor: true, level: true },
          },
          ref_jabatan: {
            select: {
              id: true,
              nama_jabatan: true,
              kategori: true,
              bup: true,
              ref_eselon: {
                select: { eselon: true, eselon_kode: true },
              },
              ref_jenjangjab: {
                select: { jenjangjab: true },
              },
            },
          },
        },
      },
    },
    orderBy: [
      { ta_orang: { tglLhr: "asc" } },
    ],
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Hitung pensiun untuk setiap pegawai aktif
  const calculated = allPegawai.map((p) => {
    const tglLhr = p.ta_orang?.tglLhr ? new Date(p.ta_orang.tglLhr) : null;
    if (!tglLhr || isNaN(tglLhr.getTime())) return null;

    const jab = p.rwt_jabatan?.ref_jabatan;
    let bup = jab?.bup;
    if (!bup) {
      if (jab?.kategori === 'STRUKTURAL' && jab?.ref_eselon?.eselon_kode && [21, 22].includes(jab.ref_eselon.eselon_kode)) {
        bup = 60;
      } else if (jab?.kategori === 'FUNGSIONAL' && jab?.nama_jabatan && (jab.nama_jabatan.toLowerCase().includes('madya') || jab.nama_jabatan.toLowerCase().includes('guru') || jab.nama_jabatan.toLowerCase().includes('dokter'))) {
        bup = 60;
      } else if (jab?.kategori === 'FUNGSIONAL' && jab?.nama_jabatan && jab.nama_jabatan.toLowerCase().includes('utama')) {
        bup = 65;
      } else {
        bup = 58;
      }
    }

    const birthYear = tglLhr.getFullYear();
    const birthMonth = tglLhr.getMonth(); // 0-indexed
    const birthDay = tglLhr.getDate();

    let pensiunYear = birthYear + bup;
    let pensiunMonth = birthMonth + 1; // 1-12 (month after birth if birthDay > 1)
    if (birthDay > 1) {
      pensiunMonth += 1;
      if (pensiunMonth > 12) {
        pensiunMonth = 1;
        pensiunYear += 1;
      }
    }

    // Format TMT Pensiun: YYYY-MM-01
    const tmtPensiunDate = new Date(pensiunYear, pensiunMonth - 1, 1);
    const tmtPensiunStr = `${pensiunYear}-${String(pensiunMonth).padStart(2, '0')}-01`;

    // Hitung usia saat ini (dalam tahun & bulan)
    let ageYears = now.getFullYear() - birthYear;
    let ageMonths = now.getMonth() - birthMonth;
    if (now.getDate() < birthDay) {
      ageMonths -= 1;
    }
    if (ageMonths < 0) {
      ageYears -= 1;
      ageMonths += 12;
    }

    // Hitung selisih waktu pensiun dari sekarang
    const diffTime = tmtPensiunDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let sisaTahun = pensiunYear - now.getFullYear();
    let sisaBulan = (pensiunMonth - 1) - now.getMonth();
    if (sisaBulan < 0) {
      sisaTahun -= 1;
      sisaBulan += 12;
    }

    let sisaText = "";
    let statusPensiun = ""; // 'SUDAH_BUP' | 'SEGERA' | 'MENDEKATI' | 'PERSIAPAN' | 'NORMAL'
    let statusBadge = "";

    if (diffDays <= 0) {
      statusPensiun = "SUDAH_BUP";
      statusBadge = "rose";
      sisaText = "Telah Mencapai BUP";
    } else if (diffDays <= 180) {
      statusPensiun = "SEGERA";
      statusBadge = "rose";
      sisaText = `${Math.ceil(diffDays / 30)} Bulan lagi`;
    } else if (diffDays <= 365) {
      statusPensiun = "MENDEKATI";
      statusBadge = "amber";
      sisaText = sisaTahun > 0 ? `${sisaTahun} Thn ${sisaBulan} Bln lagi` : `${sisaBulan} Bulan lagi`;
    } else if (diffDays <= 365 * 3) {
      statusPensiun = "PERSIAPAN";
      statusBadge = "indigo";
      sisaText = `${sisaTahun} Thn ${sisaBulan} Bln lagi`;
    } else {
      statusPensiun = "NORMAL";
      statusBadge = "emerald";
      sisaText = `${sisaTahun} Thn lagi`;
    }

    const itemKategori = jab?.kategori || 'PELAKSANA';

    return {
      id: p.id,
      nip: p.nipBaru,
      nama: p.ta_orang?.nama || '-',
      jkl: p.ta_orang?.jkl_id || 'L',
      foto: p.ta_orang?.foto,
      tgl_lahir: tglLhr.toISOString().split('T')[0],
      usia_sekarang: `${ageYears} Thn ${ageMonths} Bln`,
      usia_tahun: ageYears,
      bup,
      tmt_pensiun: tmtPensiunStr,
      tmt_pensiun_date: tmtPensiunDate,
      pensiun_tahun: pensiunYear,
      pensiun_bulan: pensiunMonth,
      diff_days: diffDays,
      sisa_waktu: sisaText,
      status_pensiun: statusPensiun,
      status_badge: statusBadge,
      jabatan: jab?.nama_jabatan || 'Staf',
      kategori: itemKategori,
      eselon: jab?.ref_eselon?.eselon || '-',
      jenjang: jab?.ref_jenjangjab?.jenjangjab || '-',
      pangkat_gol: p.rwt_gol?.ref_gol ? `${p.rwt_gol.ref_gol.pangkat} (${p.rwt_gol.ref_gol.gol})` : '-',
      unit_kerja: p.rwt_jabatan?.ref_unitorganisasi?.nmUnor || '-',
    };
  }).filter(Boolean);

  // Pisahkan antara pegawai yang AKAN pensiun (mendatang) vs yang SUDAH lewat masa BUP
  const upcomingRetirements = calculated.filter(p => p.tmt_pensiun_date >= currentMonthStart);
  const pastBupRetirements = calculated.filter(p => p.tmt_pensiun_date < currentMonthStart);

  // Global statistics over active employees
  const stats = {
    total_pns: calculated.length,
    tahun_ini: upcomingRetirements.filter(p => p.pensiun_tahun === currentYear).length,
    tahun_depan: upcomingRetirements.filter(p => p.pensiun_tahun === currentYear + 1).length,
    lima_tahun: upcomingRetirements.filter(p => p.pensiun_tahun >= currentYear && p.pensiun_tahun <= currentYear + 4).length,
    sudah_bup: pastBupRetirements.length,
    distribusi_tahun: {},
    distribusi_kategori: {
      STRUKTURAL: 0,
      FUNGSIONAL: 0,
      PELAKSANA: 0,
    },
    distribusi_bulan: {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0,
      7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0,
    },
  };

  // Build full yearly projection stats (currentYear to currentYear + 10)
  for (let y = currentYear; y <= currentYear + 10; y++) {
    stats.distribusi_tahun[y] = 0;
  }
  upcomingRetirements.forEach(p => {
    if (stats.distribusi_tahun[p.pensiun_tahun] !== undefined) {
      stats.distribusi_tahun[p.pensiun_tahun]++;
    }
  });

  // Default: Hanya ambil pegawai aktif yang AKAN pensiun (kecuali jika user memilih rentang 'sudah_bup')
  let filtered = rentang === 'sudah_bup' ? pastBupRetirements : upcomingRetirements;

  if (tahun && tahun !== 'all' && rentang !== 'sudah_bup') {
    const targetYear = parseInt(tahun, 10);
    filtered = filtered.filter(p => p.pensiun_tahun === targetYear);
  }

  if (bulan && bulan !== 'all') {
    const targetMonth = parseInt(bulan, 10);
    filtered = filtered.filter(p => p.pensiun_bulan === targetMonth);
  }

  if (rentang && rentang !== 'sudah_bup') {
    if (rentang === '1_tahun') {
      filtered = filtered.filter(p => p.pensiun_tahun === currentYear || p.pensiun_tahun === currentYear + 1);
    } else if (rentang === '5_tahun') {
      filtered = filtered.filter(p => p.pensiun_tahun >= currentYear && p.pensiun_tahun <= currentYear + 4);
    }
  }

  if (kategori && kategori !== 'all') {
    filtered = filtered.filter(p => p.kategori === kategori);
  }

  // Update filtered category & monthly distribution
  filtered.forEach(p => {
    stats.distribusi_kategori[p.kategori] = (stats.distribusi_kategori[p.kategori] || 0) + 1;
    if (stats.distribusi_bulan[p.pensiun_bulan] !== undefined) {
      stats.distribusi_bulan[p.pensiun_bulan]++;
    }
  });

  // Sort by TMT Pensiun ascending
  filtered.sort((a, b) => a.tmt_pensiun.localeCompare(b.tmt_pensiun));

  const totalFiltered = filtered.length;
  const pageNum = Math.max(1, parseInt(skip / take, 10) + 1 || 1);
  const limitNum = Math.max(1, parseInt(take, 10) || 15);
  const paginatedData = filtered.slice(parseInt(skip, 10), parseInt(skip, 10) + limitNum);

  return {
    data: paginatedData,
    all_filtered: filtered, // for excel export
    stats,
    meta: {
      page: pageNum,
      limit: limitNum,
      total: totalFiltered,
      totalPages: Math.ceil(totalFiltered / limitNum),
    },
  };
};

/**
 * Ambil semua data agama
 */
export const findAllAgama = async () => {
  return prisma.ref_agama.findMany({
    select: { id: true, agama: true },
  });
};

/**
 * Ambil semua data jenis kelamin
 */
export const findAllJkl = async () => {
  return prisma.ref_jkl.findMany({
    select: { id: true, jkl: true },
  });
};

/**
 * Ambil semua data status perkawinan
 */
export const findAllKawin = async () => {
  return prisma.ref_kawin.findMany({
    select: { id: true, kawin: true },
  });
};

/**
 * Agregasi data statistik untuk dashboard global
 */
export const getGlobalStatistics = async () => {
  const activePnsWhere = { kedudukanPns_id: { in: [1, 7, 8, 10] } };

  const [
    total,
    byGender,
    byGolongan,
    byJabatan,
    byUnit,
    byEducation,
    birthdays
  ] = await Promise.all([
    // 1. Total
    prisma.ta_pegawai.count({ where: activePnsWhere }),
    
    // 2. Gender
    prisma.ta_orang.groupBy({
      by: ['jkl_id'],
      _count: { _all: true },
      where: { ta_pegawai: activePnsWhere }
    }),

    // 3. Golongan
    prisma.rwt_gol.groupBy({
      by: ['gol_id'],
      _count: { _all: true },
      where: { ta_pegawai: activePnsWhere }
    }),

    // 4. Jenis Jabatan
    prisma.rwt_jabatan.groupBy({
      by: ['jnsJab_id'],
      _count: { _all: true },
      where: { ta_pegawai: activePnsWhere }
    }),

    // 5. Unit Kerja Induk
    prisma.rwt_jabatan.groupBy({
      by: ['unorInduk_id'],
      _count: { _all: true },
      where: { ta_pegawai: activePnsWhere },
      orderBy: { _count: { unorInduk_id: 'desc' } }
    }),

    // 6. Tingkat Pendidikan
    prisma.ta_pegawai.findMany({
      where: activePnsWhere,
      select: {
        rwt_pend: {
          select: { tktPend_id: true }
        }
      }
    }),

    // 7. Usia (Ambil tglLhr untuk dihitung di service)
    prisma.ta_orang.findMany({
      where: { ta_pegawai: activePnsWhere },
      select: { tglLhr: true }
    })
  ]);

  return {
    total,
    byGender,
    byGolongan,
    byJabatan,
    byUnit,
    byEducation,
    birthdays
  };
};

/**
 * Helper internal untuk resolve nama jabatan dan metadata dari nama unit organisasi
 */
const createJabatanResolver = async () => {
  const normalize = (s) => (s || '').trim().toLowerCase();

  const refJabs = await prisma.ref_jabatan.findMany({
    where: { is_deleted: false, kategori: 'STRUKTURAL' },
    select: { id: true, nama_jabatan: true, eselon_id: true, jns_jab_id: true },
  });

  const jabMapById = new Map();
  const jabMapByName = new Map();
  for (const j of refJabs) {
    jabMapById.set(j.id, j);
    jabMapByName.set(normalize(j.nama_jabatan), j);
  }

  return (nmUnor, level, jabId) => {
    const clean = (nmUnor || '').trim();
    const upper = clean.toUpperCase();

    // 1. Jika jabId terdaftar di ref_jabatan
    if (jabId && jabMapById.has(jabId)) {
      const existingJab = jabMapById.get(jabId);
      const jabNameUpper = existingJab.nama_jabatan.toUpperCase();
      const isMismatched = (
        (upper === 'SEKRETARIAT' && (jabNameUpper.includes('SUBBAGIAN') || jabNameUpper.includes('SEKSI'))) ||
        (upper.startsWith('BIDANG') && (jabNameUpper.includes('SUBBIDANG') || jabNameUpper.includes('SEKRETARIS'))) ||
        (level === 'induk' && (jabNameUpper.includes('SUBBAGIAN') || jabNameUpper.includes('SEKSI') || jabNameUpper.includes('SUBBIDANG')))
      );
      if (!isMismatched) {
        return {
          jab_id: existingJab.id,
          nm_jab: existingJab.nama_jabatan,
          eselon_id: existingJab.eselon_id,
          jns_jab_id: existingJab.jns_jab_id,
        };
      }
    }

    // 2. Jika nama unor sama persis dengan nama jabatan
    if (jabMapByName.has(normalize(clean))) {
      const j = jabMapByName.get(normalize(clean));
      return { jab_id: j.id, nm_jab: j.nama_jabatan, eselon_id: j.eselon_id, jns_jab_id: j.jns_jab_id };
    }

    // 3. Prediksi nama pimpinan berdasarkan pola hierarki unit
    const candidates = [];
    if (level === 'induk') {
      candidates.push(`KEPALA ${upper}`);
      if (upper.startsWith('KECAMATAN ') || upper.startsWith('KANTOR CAMAT ')) {
        candidates.push(`CAMAT ${upper.replace('KECAMATAN ', '').replace('KANTOR CAMAT ', '')}`);
      }
      if (upper.startsWith('KELURAHAN ') || upper.startsWith('KANTOR LURAH ')) {
        candidates.push(`LURAH ${upper.replace('KELURAHAN ', '').replace('KANTOR LURAH ', '')}`);
      }
      if (upper.includes('INSPEKTORAT')) {
        candidates.push(`INSPEKTUR ${upper.replace('INSPEKTORAT ', '')}`);
        candidates.push('INSPEKTUR');
      }
      if (upper.includes('SEKRETARIAT DAERAH')) candidates.push('SEKRETARIS DAERAH');
      if (upper.includes('SEKRETARIAT DPRD')) candidates.push('SEKRETARIS DPRD');
    } else {
      if (upper === 'SEKRETARIAT') {
        candidates.push('SEKRETARIS');
      } else if (upper.startsWith('BIDANG ') || upper.startsWith('BAGIAN ') || upper.startsWith('SEKSI ')) {
        candidates.push(`KEPALA ${upper}`);
      } else if (upper.startsWith('SUBBAGIAN ') || upper.startsWith('SUB BAGIAN ')) {
        candidates.push(`KEPALA ${upper}`);
        if (upper.startsWith('SUB BAGIAN ')) candidates.push(`KEPALA ${upper.replace('SUB BAGIAN ', 'SUBBAGIAN ')}`);
        else candidates.push(`KEPALA ${upper.replace('SUBBAGIAN ', 'SUB BAGIAN ')}`);
      } else if (upper.startsWith('SUBBIDANG ') || upper.startsWith('SUB BIDANG ')) {
        candidates.push(`KEPALA ${upper}`);
        if (upper.startsWith('SUB BIDANG ')) candidates.push(`KEPALA ${upper.replace('SUB BIDANG ', 'SUBBIDANG ')}`);
        else candidates.push(`KEPALA ${upper.replace('SUBBIDANG ', 'SUB BIDANG ')}`);
      } else if (upper.startsWith('INSPEKTUR PEMBANTU')) {
        candidates.push(upper);
        const roman = upper.replace(' 1', ' I').replace(' 2', ' II').replace(' 3', ' III').replace(' 4', ' IV');
        if (roman !== upper) candidates.push(roman);
      } else if (upper.startsWith('UPT ') || upper.startsWith('UNIT PELAKSANA TEKNIS ')) {
        candidates.push(`KEPALA ${upper}`);
      } else if (upper.startsWith('PUSKESMAS ')) {
        candidates.push(`KEPALA ${upper}`);
      } else if (upper.startsWith('RSUD ') || upper.startsWith('RUMAH SAKIT ')) {
        candidates.push(`DIREKTUR ${upper}`);
      } else {
        candidates.push(`KEPALA ${upper}`);
      }
    }

    for (const cand of candidates) {
      const normCand = normalize(cand);
      if (jabMapByName.has(normCand)) {
        const found = jabMapByName.get(normCand);
        return {
          jab_id: found.id,
          nm_jab: found.nama_jabatan,
          eselon_id: found.eselon_id,
          jns_jab_id: found.jns_jab_id,
        };
      }
    }

    return {
      jab_id: null,
      nm_jab: candidates[0] || `KEPALA ${upper}`,
      eselon_id: null,
      jns_jab_id: 'cb96a38e-5d24-46a8-bc47-7f4677ff603d',
    };
  };
};

/**
 * Ambil unit kerja aktif dari ref_unitorganisasi (khusus Instansi Pemerintah Kab. Tojo Una-Una)
 */
export const findAllUnorInduk = async (onlyActive = true) => {
  const resolveJabatan = await createJabatanResolver();

  const unors = await prisma.ref_unitorganisasi.findMany({
    where: {
      is_deleted: false,
      ...(onlyActive && { isAktif: 1 }),
      nmUnor: { not: '' },
      OR: [
        { instansi_id: '47a536f3-8610-4492-aa81-d3a6e5b4399f' },
        { kode: { startsWith: '7209' } },
        { ref_instansi: { instansi: { contains: 'TOJO UNA-UNA' } } },
      ],
    },
    select: {
      id: true,
      nmUnor: true,
      level: true,
      kode: true,
      jab_id: true,
      parent_id: true,
      isAktif: true,
    },
    orderBy: [
      { nmUnor: 'asc' },
    ],
  });

  return unors.map((u) => {
    const cleanNm = u.nmUnor ? u.nmUnor.trim() : '';
    const resolved = resolveJabatan(cleanNm, u.level, u.jab_id);
    return {
      ...u,
      nmUnor: cleanNm,
      nm_jab: resolved.nm_jab,
      resolved_jab_id: resolved.jab_id,
      eselon_id: resolved.eselon_id,
      jns_jab_id: resolved.jns_jab_id,
    };
  });
};

/**
 * Ambil pohon hierarki unit kerja (Tree View) khusus Tojo Una-Una
 */
export const findUnorTree = async (onlyActive = true) => {
  const normalize = (s) => (s || '').trim().toLowerCase();
  const resolveJabatan = await createJabatanResolver();

  const allNodes = await prisma.ref_unitorganisasi.findMany({
    where: {
      is_deleted: false,
      ...(onlyActive && { isAktif: 1 }),
      nmUnor: { not: '' },
      OR: [
        { instansi_id: '47a536f3-8610-4492-aa81-d3a6e5b4399f' },
        { kode: { startsWith: '7209' } },
        { ref_instansi: { instansi: { contains: 'TOJO UNA-UNA' } } },
      ],
    },
    select: {
      id: true,
      parent_id: true,
      kode: true,
      nmUnor: true,
      level: true,
      jab_id: true,
      isAktif: true,
    },
    orderBy: { nmUnor: 'asc' },
  });

  const childrenByParent = {};
  for (const node of allNodes) {
    const pId = node.parent_id || 'root';
    if (!childrenByParent[pId]) childrenByParent[pId] = [];
    childrenByParent[pId].push(node);
  }

  function buildTree(parentId, parentName = '') {
    const list = childrenByParent[parentId] || [];
    const result = [];
    for (const item of list) {
      const cleanName = item.nmUnor.trim();
      const resolved = resolveJabatan(cleanName, item.level, item.jab_id);
      const isInactive = item.isAktif === 0;

      if (parentName && normalize(cleanName) === normalize(parentName)) {
        const grandchildren = buildTree(item.id, cleanName);
        result.push(...grandchildren);
      } else {
        const children = buildTree(item.id, cleanName);
        result.push({
          id: item.id,
          label: cleanName + (isInactive ? ' (Non-Aktif)' : ''),
          level: item.level,
          isAktif: item.isAktif,
          nm_jab: resolved.nm_jab,
          jab_id: resolved.jab_id,
          eselon_id: resolved.eselon_id,
          jns_jab_id: resolved.jns_jab_id,
          children,
        });
      }
    }
    return result;
  }

  return buildTree('root');
};

/**
 * Ambil semua tingkat pendidikan untuk label
 */
export const findAllTktPend = async () => {
  return prisma.ref_tktpend.findMany({
    select: { id: true, tktpend: true },
    orderBy: { id: 'asc' }
  });
};

/**
 * Ambil semua jenis jabatan untuk label
 */
export const findAllJnsJab = async () => {
  return prisma.ref_jnsjab.findMany({
    select: { id: true, jnsjab: true }
  });
};

/**
 * Ambil semua jenjang jabatan untuk label
 */
export const findAllJenjangJab = async () => {
  return prisma.ref_jenjangjab.findMany({
    where: { is_deleted: false },
    select: { id: true, jenjangjab: true, jnsjab_id: true },
    orderBy: { id: 'asc' },
  });
};
/**
 * Ambil semua golongan untuk label
 */
export const findAllGol = async () => {
  return prisma.ref_gol.findMany({
    select: { kdGol: true, gol: true, pangkat: true }
  });
};

/**
 * Ambil semua jenis diklat untuk label
 */
export const findAllJnsDiklat = async () => {
  return prisma.ref_jnsdiklat.findMany({
    where: { is_deleted: false },
    select: { id: true, kode: true, jnsDiklat: true },
    orderBy: { jnsDiklat: "asc" }
  });
};

/**
 * Ambil semua jenjang diklat untuk label
 */
export const findAllJenjangDiklat = async () => {
  return prisma.ref_jenjangdiklat.findMany({
    where: { is_deleted: false },
    select: { id: true, jnsDiklat_id: true, kode: true, jenjangDiklat: true },
    orderBy: { jenjangDiklat: "asc" }
  });
};

/**
 * Ambil semua jenis KP untuk label
 */
export const findAllJnsKp = async () => {
  return prisma.ref_jnskp.findMany({
    select: { id: true, jnskp: true }
  });
};

/**
 * Buat data riwayat golongan baru
 */
export const createRiwayatGolongan = async (data) => {
  return prisma.rwt_gol.create({
    data,
    select: {
      id: true,
      pegawai_id: true,
      gol_id: true,
      sk: true,
      tglSk: true,
      tmtSk: true,
      maskerThn: true,
      maskerBln: true,
      pertekBkn: true,
      tglPertek: true,
      jnsKp_id: true,
      gapok: true,
      pengesahan: true,
      ref_gol: {
        select: {
          kdGol: true,
          gol: true,
          pangkat: true,
        },
      },
    },
  });
};

/**
 * Cari riwayat golongan berdasarkan ID
 */
export const findRiwayatGolonganById = async (id) => {
  return prisma.rwt_gol.findUnique({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
      gol_id: true,
      sk: true,
      tglSk: true,
      tmtSk: true,
      maskerThn: true,
      maskerBln: true,
      pertekBkn: true,
      tglPertek: true,
      jnsKp_id: true,
      gapok: true,
      pengesahan: true,
      ref_gol: {
        select: {
          kdGol: true,
          gol: true,
          pangkat: true,
        },
      },
    },
  });
};

/**
 * Update riwayat golongan
 */
export const updateRiwayatGolongan = async (id, data) => {
  return prisma.rwt_gol.update({
    where: { id },
    data,
    select: {
      id: true,
      pegawai_id: true,
      gol_id: true,
      sk: true,
      tglSk: true,
      tmtSk: true,
      maskerThn: true,
      maskerBln: true,
      pertekBkn: true,
      tglPertek: true,
      jnsKp_id: true,
      gapok: true,
      pengesahan: true,
      ref_gol: {
        select: {
          kdGol: true,
          gol: true,
          pangkat: true,
        },
      },
    },
  });
};

/**
 * Hapus riwayat golongan
 */
export const deleteRiwayatGolongan = async (id) => {
  return prisma.rwt_gol.delete({
    where: { id },
    select: { id: true, pegawai_id: true },
  });
};

/**
 * Cari riwayat golongan terbaru dari seorang pegawai (berdasarkan tmtSk desc)
 */
export const findLatestRiwayatGolongan = async (pegawaiId) => {
  return prisma.rwt_gol.findFirst({
    where: { pegawai_id: pegawaiId },
    orderBy: { tmtSk: "desc" },
    select: {
      id: true,
      tmtSk: true,
      gol_id: true,
    },
  });
};

/**
 * Update status rwtGol_id aktif pada data pegawai utama
 */
export const updatePegawaiActiveGolongan = async (pegawaiId, rwtGolId) => {
  return prisma.ta_pegawai.update({
    where: { id: pegawaiId },
    data: { rwtGol_id: rwtGolId },
    select: { id: true, rwtGol_id: true },
  });
};

/**
 * Cari arsip dokumen berdasarkan ID sumber (from) dan jenis arsip
 */
export const findArsipByFrom = async (fromId, jnsarsipId = null) => {
  return prisma.ta_arsip.findFirst({
    where: {
      from: fromId,
      ...(jnsarsipId ? { jnsarsip_id: jnsarsipId } : {}),
    },
    select: { id: true, pegawai_id: true, from: true, jnsarsip_id: true, arsip: true },
  });
};

/**
 * Cari semua arsip dokumen berdasarkan ID sumber (from)
 */
export const findAllArsipByFrom = async (fromId) => {
  return prisma.ta_arsip.findMany({
    where: { from: fromId },
    select: { id: true, pegawai_id: true, from: true, jnsarsip_id: true, arsip: true },
  });
};

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
    // Abaikan jika file tidak ditemukan atau sudah terhapus
  }
};

/**
 * Simpan / perbarui arsip dokumen digital
 */
export const saveArsipDokumen = async ({ id, pegawaiId, fromId, jnsarsipId = 2, arsipPath }) => {
  const existing = await findArsipByFrom(fromId, jnsarsipId);
  if (existing) {
    // Jika path file baru berbeda dengan yang lama, hapus file fisik yang lama
    if (existing.arsip && existing.arsip !== arsipPath) {
      removePhysicalFile(existing.arsip);
    }

    return prisma.ta_arsip.update({
      where: { id: existing.id },
      data: { arsip: arsipPath },
      select: { id: true, pegawai_id: true, from: true, jnsarsip_id: true, arsip: true },
    });
  }

  return prisma.ta_arsip.create({
    data: {
      id,
      pegawai_id: pegawaiId,
      from: fromId,
      jnsarsip_id: jnsarsipId,
      arsip: arsipPath,
    },
    select: { id: true, pegawai_id: true, from: true, jnsarsip_id: true, arsip: true },
  });
};

/**
 * Hapus seluruh arsip dokumen beserta file fisik di backend storage berdasarkan fromId
 */
export const deleteArsipByFrom = async (fromId) => {
  const existingList = await findAllArsipByFrom(fromId);
  if (existingList.length > 0) {
    for (const existing of existingList) {
      if (existing.arsip) {
        removePhysicalFile(existing.arsip);
      }
    }

    return prisma.ta_arsip.deleteMany({
      where: { from: fromId },
    });
  }
  return null;
};

/**
 * Buat data riwayat KGB baru
 */
export const createRiwayatKgb = async (data) => {
  return prisma.rwt_kgb.create({
    data,
    select: {
      id: true,
      pegawai_id: true,
      nipBaru: true,
      gol_id: true,
      sk: true,
      tglSk: true,
      tmtSk: true,
      maskerThn: true,
      maskerBln: true,
      gapok: true,
      pengesahan: true,
    },
  });
};

/**
 * Cari riwayat KGB berdasarkan ID
 */
export const findRiwayatKgbById = async (id) => {
  return prisma.rwt_kgb.findUnique({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
      nipBaru: true,
      gol_id: true,
      sk: true,
      tglSk: true,
      tmtSk: true,
      maskerThn: true,
      maskerBln: true,
      gapok: true,
      pengesahan: true,
    },
  });
};

/**
 * Update riwayat KGB
 */
export const updateRiwayatKgb = async (id, data) => {
  return prisma.rwt_kgb.update({
    where: { id },
    data,
    select: {
      id: true,
      pegawai_id: true,
      nipBaru: true,
      gol_id: true,
      sk: true,
      tglSk: true,
      tmtSk: true,
      maskerThn: true,
      maskerBln: true,
      gapok: true,
      pengesahan: true,
    },
  });
};

/**
 * Hapus riwayat KGB
 */
export const deleteRiwayatKgb = async (id) => {
  return prisma.rwt_kgb.delete({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
    },
  });
};

/**
 * Ambil semua data Eselon
 */
export const findAllEselon = async () => {
  return prisma.ref_eselon.findMany({
    select: { id: true, eselon: true },
  });
};

/**
 * Ambil semua Jenis Mutasi
 */
export const findAllJnsMutasi = async () => {
  return prisma.ref_jnsmutasi.findMany({
    select: { id: true, jnsMutasi: true },
  });
};

/**
 * Ambil semua Master Jabatan (Struktural, JF, Pelaksana)
 */
export const findAllRefJabatan = async (filter = {}) => {
  const where = { is_deleted: false, ...(filter.kategori ? { kategori: filter.kategori } : {}) };
  return prisma.ref_jabatan.findMany({
    select: { id: true, nama_jabatan: true, kategori: true, jns_jab_id: true, eselon_id: true },
    where,
    orderBy: { nama_jabatan: 'asc' },
  });
};

/**
 * Ambil semua Master Jabatan Fungsional
 */
export const findAllJabatanFungsional = async () => {
  return prisma.ref_jabatan.findMany({
    where: { is_deleted: false, kategori: 'FUNGSIONAL' },
    select: { id: true, nama_jabatan: true },
    orderBy: { nama_jabatan: 'asc' },
  });
};

/**
 * Ambil semua Master Jabatan Pelaksana
 */
export const findAllJabatanPelaksana = async () => {
  return prisma.ref_jabatan.findMany({
    where: { is_deleted: false, kategori: 'PELAKSANA' },
    select: { id: true, nama_jabatan: true },
    orderBy: { nama_jabatan: 'asc' },
  });
};

/**
 * Buat data riwayat jabatan baru
 */
export const createRiwayatJabatan = async (data) => {
  return prisma.rwt_jabatan.create({
    data,
    select: {
      id: true,
      pegawai_id: true,
      nipBaru: true,
      sk: true,
      tglSk: true,
      tmtSk: true,
      jnsJab_id: true,
      nmJab_id: true,
      unorInduk_id: true,
      eselon_id: true,
      jnsMutasi_id: true,
      pengesahan: true,
    },
  });
};

/**
 * Cari riwayat jabatan berdasarkan ID
 */
export const findRiwayatJabatanById = async (id) => {
  return prisma.rwt_jabatan.findUnique({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
      nipBaru: true,
      sk: true,
      tglSk: true,
      tmtSk: true,
      jnsJab_id: true,
      nmJab_id: true,
      unorInduk_id: true,
      eselon_id: true,
      jnsMutasi_id: true,
      pengesahan: true,
    },
  });
};

/**
 * Update riwayat jabatan
 */
export const updateRiwayatJabatan = async (id, data) => {
  return prisma.rwt_jabatan.update({
    where: { id },
    data,
    select: {
      id: true,
      pegawai_id: true,
      nipBaru: true,
      sk: true,
      tglSk: true,
      tmtSk: true,
      jnsJab_id: true,
      nmJab_id: true,
      unorInduk_id: true,
      eselon_id: true,
      jnsMutasi_id: true,
      pengesahan: true,
    },
  });
};

/**
 * Hapus riwayat jabatan
 */
export const deleteRiwayatJabatan = async (id) => {
  return prisma.rwt_jabatan.delete({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
    },
  });
};

/**
 * Cari riwayat jabatan dengan TMT terbaru
 */
export const findLatestRiwayatJabatan = async (pegawaiId) => {
  return prisma.rwt_jabatan.findFirst({
    where: { pegawai_id: pegawaiId },
    orderBy: { tmtSk: "desc" },
    select: {
      id: true,
      pegawai_id: true,
      tmtSk: true,
    },
  });
};

/**
 * Sinkronisasi jabatan aktif ke ta_pegawai
 */
export const updatePegawaiActiveJabatan = async (pegawaiId, rwtJabId) => {
  return prisma.ta_pegawai.update({
    where: { id: pegawaiId },
    data: { rwtJab_id: rwtJabId },
    select: { id: true, rwtJab_id: true },
  });
};

/**
 * Ambil daftar nama program studi / jurusan pendidikan
 */
export const findAllRefPend = async (tktpend_id = null) => {
  return prisma.ref_pend.findMany({
    where: {
      is_deleted: false,
      ...(tktpend_id ? { tktpend_id: String(tktpend_id) } : {}),
    },
    select: {
      id: true,
      tktpend_id: true,
      pend: true,
      kode: true,
    },
    orderBy: { pend: "asc" },
  });
};

/**
 * Buat data riwayat pendidikan baru
 */
export const createRiwayatPendidikan = async (data) => {
  return prisma.rwt_pend.create({
    data,
    select: {
      id: true,
      pegawai_id: true,
      nipBaru: true,
      tktPend_id: true,
      pend_id: true,
      nmSekolah: true,
      jurusan: true,
      thnLulus: true,
      noIjazah: true,
      tglIjazah: true,
      gd: true,
      gb: true,
      pengesahan: true,
    },
  });
};

/**
 * Cari riwayat pendidikan berdasarkan ID
 */
export const findRiwayatPendidikanById = async (id) => {
  return prisma.rwt_pend.findUnique({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
      nipBaru: true,
      tktPend_id: true,
      pend_id: true,
      nmSekolah: true,
      jurusan: true,
      thnLulus: true,
      noIjazah: true,
      tglIjazah: true,
      gd: true,
      gb: true,
      pengesahan: true,
    },
  });
};

/**
 * Update riwayat pendidikan
 */
export const updateRiwayatPendidikan = async (id, data) => {
  return prisma.rwt_pend.update({
    where: { id },
    data,
    select: {
      id: true,
      pegawai_id: true,
      nipBaru: true,
      tktPend_id: true,
      pend_id: true,
      nmSekolah: true,
      jurusan: true,
      thnLulus: true,
      noIjazah: true,
      tglIjazah: true,
      gd: true,
      gb: true,
      pengesahan: true,
    },
  });
};

/**
 * Hapus riwayat pendidikan
 */
export const deleteRiwayatPendidikan = async (id) => {
  return prisma.rwt_pend.delete({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
    },
  });
};

/**
 * Cari riwayat pendidikan tertinggi / terbaru
 */
export const findLatestRiwayatPendidikan = async (pegawaiId) => {
  return prisma.rwt_pend.findFirst({
    where: { pegawai_id: pegawaiId },
    orderBy: [
      { tktPend_id: "desc" },
      { thnLulus: "desc" },
    ],
    select: {
      id: true,
      pegawai_id: true,
      tktPend_id: true,
      thnLulus: true,
    },
  });
};

/**
 * Sinkronisasi pendidikan aktif ke ta_pegawai
 */
export const updatePegawaiActivePendidikan = async (pegawaiId, rwtPendId) => {
  return prisma.ta_pegawai.update({
    where: { id: pegawaiId },
    data: { rwtPend_id: rwtPendId },
    select: { id: true, rwtPend_id: true },
  });
};

/**
 * Buat data riwayat diklat baru
 */
export const createRiwayatDiklat = async (data) => {
  return prisma.rwt_diklat.create({
    data,
    select: {
      id: true,
      pegawai_id: true,
      nipBaru: true,
      jnsDiklat_id: true,
      jenjangDiklat_id: true,
      nmDiklat: true,
      noSertifikat: true,
      tglSertifikat: true,
      penyelenggara: true,
      angkatan: true,
      t4pelaksanaan: true,
    },
  });
};

/**
 * Cari riwayat diklat berdasarkan ID
 */
export const findRiwayatDiklatById = async (id) => {
  return prisma.rwt_diklat.findUnique({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
      nipBaru: true,
      jnsDiklat_id: true,
      jenjangDiklat_id: true,
      nmDiklat: true,
      noSertifikat: true,
      tglSertifikat: true,
      penyelenggara: true,
      angkatan: true,
      t4pelaksanaan: true,
    },
  });
};

/**
 * Update riwayat diklat
 */
export const updateRiwayatDiklat = async (id, data) => {
  return prisma.rwt_diklat.update({
    where: { id },
    data,
    select: {
      id: true,
      pegawai_id: true,
      nipBaru: true,
      jnsDiklat_id: true,
      jenjangDiklat_id: true,
      nmDiklat: true,
      noSertifikat: true,
      tglSertifikat: true,
      penyelenggara: true,
      angkatan: true,
      t4pelaksanaan: true,
    },
  });
};

/**
 * Hapus riwayat diklat
 */
export const deleteRiwayatDiklat = async (id) => {
  return prisma.rwt_diklat.delete({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
    },
  });
};

/**
 * Cari riwayat diklat terbaru
 */
export const findLatestRiwayatDiklat = async (pegawaiId) => {
  return prisma.rwt_diklat.findFirst({
    where: { pegawai_id: pegawaiId },
    orderBy: [
      { tglSertifikat: "desc" },
      { created_at: "desc" },
    ],
    select: {
      id: true,
      pegawai_id: true,
      tglSertifikat: true,
    },
  });
};

/**
 * Sinkronisasi diklat aktif ke ta_pegawai
 */
export const updatePegawaiActiveDiklat = async (pegawaiId, rwtDiklatId) => {
  return prisma.ta_pegawai.update({
    where: { id: pegawaiId },
    data: { rwtDiklat_id: rwtDiklatId },
    select: { id: true, rwtDiklat_id: true },
  });
};

/**
 * Ambil semua jenis profesi
 */
export const findAllRefJnsProfesi = async () => {
  return prisma.ref_jns_profesi.findMany({
    select: { id: true, jns_profesi: true },
    orderBy: { jns_profesi: "asc" },
  });
};

/**
 * Buat data riwayat profesi baru
 */
export const createRiwayatProfesi = async (data) => {
  return prisma.rwt_profesi.create({
    data,
    select: {
      id: true,
      pegawai_id: true,
      jns_profesi_id: true,
      no_sertifikat: true,
      ket: true,
      tgl_lulus: true,
      berlaku: true,
    },
  });
};

/**
 * Cari riwayat profesi berdasarkan ID
 */
export const findRiwayatProfesiById = async (id) => {
  return prisma.rwt_profesi.findUnique({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
      jns_profesi_id: true,
      no_sertifikat: true,
      ket: true,
      tgl_lulus: true,
      berlaku: true,
    },
  });
};

/**
 * Update riwayat profesi
 */
export const updateRiwayatProfesi = async (id, data) => {
  return prisma.rwt_profesi.update({
    where: { id },
    data,
    select: {
      id: true,
      pegawai_id: true,
      jns_profesi_id: true,
      no_sertifikat: true,
      ket: true,
      tgl_lulus: true,
      berlaku: true,
    },
  });
};

/**
 * Hapus riwayat profesi
 */
export const deleteRiwayatProfesi = async (id) => {
  return prisma.rwt_profesi.delete({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
    },
  });
};

/**
 * Ambil master tingkat hukuman
 */
export const findAllRefTktHukuman = async () => {
  return prisma.ref_tkthukuman.findMany({
    where: { is_deleted: false },
    select: { id: true, kode: true, tktHukuman: true },
    orderBy: { kode: "asc" },
  });
};

/**
 * Ambil master jenis hukuman
 */
export const findAllRefJnsHukuman = async () => {
  return prisma.ref_jnshukuman.findMany({
    where: { is_deleted: false },
    select: { id: true, kode: true, tktHukuman_id: true, jnsHukuman: true },
    orderBy: { kode: "asc" },
  });
};

/**
 * Buat data riwayat hukdis baru
 */
export const createRiwayatHukdis = async (data) => {
  return prisma.rwt_hukdis.create({
    data,
    select: {
      id: true,
      pegawai_id: true,
      tktHukuman_id: true,
      jnsHukuman_id: true,
      skHd: true,
      tglSkHd: true,
      tmtSkHd: true,
      masaHukumanThn: true,
      masaHukumanBln: true,
      tglAkhirHukuman: true,
      gol_id: true,
      noPP: true,
      alasanHukuman: true,
      ket: true,
    },
  });
};

/**
 * Cari riwayat hukdis berdasarkan ID
 */
export const findRiwayatHukdisById = async (id) => {
  return prisma.rwt_hukdis.findUnique({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
      tktHukuman_id: true,
      jnsHukuman_id: true,
      skHd: true,
      tglSkHd: true,
      tmtSkHd: true,
      masaHukumanThn: true,
      masaHukumanBln: true,
      tglAkhirHukuman: true,
      gol_id: true,
      noPP: true,
      alasanHukuman: true,
      ket: true,
    },
  });
};

/**
 * Update riwayat hukdis
 */
export const updateRiwayatHukdis = async (id, data) => {
  return prisma.rwt_hukdis.update({
    where: { id },
    data,
    select: {
      id: true,
      pegawai_id: true,
      tktHukuman_id: true,
      jnsHukuman_id: true,
      skHd: true,
      tglSkHd: true,
      tmtSkHd: true,
      masaHukumanThn: true,
      masaHukumanBln: true,
      tglAkhirHukuman: true,
      gol_id: true,
      noPP: true,
      alasanHukuman: true,
      ket: true,
    },
  });
};

/**
 * Hapus riwayat hukdis
 */
export const deleteRiwayatHukdis = async (id) => {
  return prisma.rwt_hukdis.delete({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
    },
  });
};

/**
 * Buat data riwayat ortu baru (dan simpan ke ta_orang jika belum ada)
 */
export const createRiwayatOrtu = async (ortuData, orangData) => {
  return prisma.$transaction(async (tx) => {
    const existingOrang = await tx.ta_orang.findUnique({
      where: { id: ortuData.orang_id },
      select: { id: true },
    });

    if (!existingOrang && orangData) {
      await tx.ta_orang.create({
        data: orangData,
      });
    } else if (existingOrang && orangData) {
      await tx.ta_orang.update({
        where: { id: ortuData.orang_id },
        data: orangData,
      });
    }

    const newOrtu = await tx.rwt_ortu.create({
      data: ortuData,
      select: {
        id: true,
        pegawai_id: true,
        hubungan: true,
        orang_id: true,
        pns: true,
      },
    });

    return newOrtu;
  });
};

/**
 * Cari riwayat ortu berdasarkan ID beserta data ta_orang
 */
export const findRiwayatOrtuById = async (id) => {
  const result = await prisma.$queryRaw`
    SELECT r.*, o.nama, o.nik, o.t4Lhr, o.tglLhr, o.jkl_id, o.alamat, o.no_hp
    FROM rwt_ortu r
    LEFT JOIN ta_orang o ON r.orang_id = o.id
    WHERE r.id = ${id}
    LIMIT 1
  `;
  return result[0] || null;
};

/**
 * Update riwayat ortu dan data ta_orang
 */
export const updateRiwayatOrtu = async (id, orangId, ortuData, orangData) => {
  return prisma.$transaction(async (tx) => {
    if (orangData && Object.keys(orangData).length > 0 && orangId) {
      await tx.ta_orang.update({
        where: { id: orangId },
        data: orangData,
      });
    }

    const updatedOrtu = await tx.rwt_ortu.update({
      where: { id },
      data: ortuData,
      select: {
        id: true,
        pegawai_id: true,
        hubungan: true,
        orang_id: true,
        pns: true,
      },
    });

    return updatedOrtu;
  });
};

/**
 * Hapus riwayat ortu
 */
export const deleteRiwayatOrtu = async (id) => {
  return prisma.rwt_ortu.delete({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
      orang_id: true,
    },
  });
};

/**
 * Buat data riwayat pasangan baru (dan simpan ke ta_orang jika belum ada)
 */
export const createRiwayatPasangan = async (suisData, orangData) => {
  return prisma.$transaction(async (tx) => {
    const existingOrang = await tx.ta_orang.findUnique({
      where: { id: suisData.orang_id },
      select: { id: true },
    });

    if (!existingOrang && orangData) {
      await tx.ta_orang.create({
        data: orangData,
      });
    } else if (existingOrang && orangData) {
      await tx.ta_orang.update({
        where: { id: suisData.orang_id },
        data: orangData,
      });
    }

    const newSuis = await tx.rwt_suis.create({
      data: suisData,
      select: {
        id: true,
        pegawai_id: true,
        hubungan: true,
        orang_id: true,
        pns: true,
        aktaMenikah: true,
        tglMenikah: true,
        karisKarsu: true,
        aktaCerai: true,
        tglCerai: true,
        aktaMeninggal: true,
        tglMeninggal: true,
      },
    });

    return newSuis;
  });
};

/**
 * Cari riwayat pasangan berdasarkan ID beserta data ta_orang
 */
export const findRiwayatPasanganById = async (id) => {
  const result = await prisma.$queryRaw`
    SELECT r.*, o.nama, o.nik, o.t4Lhr, o.tglLhr, o.jkl_id, o.alamat, o.no_hp, o.npwp
    FROM rwt_suis r
    LEFT JOIN ta_orang o ON r.orang_id = o.id
    WHERE r.id = ${id}
    LIMIT 1
  `;
  return result[0] || null;
};

/**
 * Update riwayat pasangan dan data ta_orang
 */
export const updateRiwayatPasangan = async (id, orangId, suisData, orangData) => {
  return prisma.$transaction(async (tx) => {
    if (orangData && Object.keys(orangData).length > 0 && orangId) {
      await tx.ta_orang.update({
        where: { id: orangId },
        data: orangData,
      });
    }

    const updatedSuis = await tx.rwt_suis.update({
      where: { id },
      data: suisData,
      select: {
        id: true,
        pegawai_id: true,
        hubungan: true,
        orang_id: true,
        pns: true,
        aktaMenikah: true,
        tglMenikah: true,
        karisKarsu: true,
        aktaCerai: true,
        tglCerai: true,
        aktaMeninggal: true,
        tglMeninggal: true,
      },
    });

    return updatedSuis;
  });
};

/**
 * Hapus riwayat pasangan
 */
export const deleteRiwayatPasangan = async (id) => {
  return prisma.rwt_suis.delete({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
      orang_id: true,
    },
  });
};

/**
 * Buat data riwayat anak dan ta_orang secara atomic
 */
export const createRiwayatAnak = async (anakData, orangData) => {
  return prisma.$transaction(async (tx) => {
    const existingOrang = await tx.ta_orang.findUnique({
      where: { id: orangData.id },
      select: { id: true },
    });

    if (!existingOrang) {
      await tx.ta_orang.create({
        data: orangData,
      });
    } else {
      await tx.ta_orang.update({
        where: { id: orangData.id },
        data: orangData,
      });
    }

    return tx.rwt_anak.create({
      data: anakData,
      select: {
        id: true,
        pegawai_id: true,
        ortu_id: true,
        sAnak: true,
        orang_id: true,
        pns: true,
        created_at: true,
        updated_at: true,
      },
    });
  });
};

/**
 * Cari riwayat anak berdasarkan ID
 */
export const findRiwayatAnakById = async (id) => {
  return prisma.rwt_anak.findUnique({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
      ortu_id: true,
      sAnak: true,
      orang_id: true,
      pns: true,
      created_at: true,
      updated_at: true,
    },
  });
};

/**
 * Update riwayat anak dan ta_orang secara atomic
 */
export const updateRiwayatAnak = async (id, orangId, anakData, orangData) => {
  return prisma.$transaction(async (tx) => {
    if (orangId && Object.keys(orangData).length > 0) {
      const existingOrang = await tx.ta_orang.findUnique({
        where: { id: orangId },
        select: { id: true },
      });

      if (existingOrang) {
        await tx.ta_orang.update({
          where: { id: orangId },
          data: orangData,
        });
      } else {
        await tx.ta_orang.create({
          data: {
            id: orangId,
            ...orangData,
          },
        });
      }
    }

    return tx.rwt_anak.update({
      where: { id },
      data: anakData,
      select: {
        id: true,
        pegawai_id: true,
        ortu_id: true,
        sAnak: true,
        orang_id: true,
        pns: true,
        created_at: true,
        updated_at: true,
      },
    });
  });
};

/**
 * Hapus riwayat anak
 */
export const deleteRiwayatAnak = async (id) => {
  return prisma.rwt_anak.delete({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
      orang_id: true,
    },
  });
};

/**
 * Buat data riwayat CPNS / PNS
 */
export const createCpnsPns = async (data) => {
  return prisma.ta_cpnspns.create({
    data,
    select: {
      id: true,
      pegawai_id: true,
      sk: true,
      tglsk: true,
      tmtsk: true,
      gol_id: true,
      maskerThn: true,
      maskerBln: true,
      pertekBkn: true,
      tglPertekBkn: true,
      sttpl: true,
      tglsttpl: true,
      spns_id: true,
      noKarpeg: true,
      tglKarpeg: true,
      penanda_tangan: true,
      created_at: true,
      updated_at: true,
    },
  });
};

/**
 * Cari riwayat CPNS / PNS berdasarkan ID
 */
export const findCpnsPnsById = async (id) => {
  return prisma.ta_cpnspns.findUnique({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
      sk: true,
      tglsk: true,
      tmtsk: true,
      gol_id: true,
      maskerThn: true,
      maskerBln: true,
      pertekBkn: true,
      tglPertekBkn: true,
      sttpl: true,
      tglsttpl: true,
      spns_id: true,
      noKarpeg: true,
      tglKarpeg: true,
      penanda_tangan: true,
      created_at: true,
      updated_at: true,
    },
  });
};

/**
 * Update data riwayat CPNS / PNS
 */
export const updateCpnsPns = async (id, data) => {
  return prisma.ta_cpnspns.update({
    where: { id },
    data,
    select: {
      id: true,
      pegawai_id: true,
      sk: true,
      tglsk: true,
      tmtsk: true,
      gol_id: true,
      maskerThn: true,
      maskerBln: true,
      pertekBkn: true,
      tglPertekBkn: true,
      sttpl: true,
      tglsttpl: true,
      spns_id: true,
      noKarpeg: true,
      tglKarpeg: true,
      penanda_tangan: true,
      created_at: true,
      updated_at: true,
    },
  });
};

/**
 * Hapus riwayat CPNS / PNS
 */
export const deleteCpnsPns = async (id) => {
  return prisma.ta_cpnspns.delete({
    where: { id },
    select: {
      id: true,
      pegawai_id: true,
    },
  });
};

/**
 * Ambil master referensi identitas pegawai (Agama, Kawin, Jkl, Kedudukan PNS, SPNS)
 */
export const getRefIdentitasData = async () => {
  const [agama, kawin, jkl, kedudukanPns, spns] = await Promise.all([
    prisma.ref_agama.findMany({
      select: { id: true, agama: true },
      orderBy: { id: "asc" },
    }),
    prisma.ref_kawin.findMany({
      select: { id: true, kawin: true },
      orderBy: { id: "asc" },
    }),
    prisma.ref_jkl.findMany({
      select: { id: true, jkl: true },
      orderBy: { id: "asc" },
    }),
    prisma.ref_kedudukanpns.findMany({
      where: { is_deleted: false },
      select: { id: true, kedudukanpns: true },
      orderBy: { id: "asc" },
    }),
    prisma.ref_spns.findMany({
      select: { id: true, spns: true },
      orderBy: { id: "asc" },
    }),
  ]);

  return {
    agama: agama.map((a) => ({ id: String(a.id), agama: a.agama })),
    kawin: kawin.map((k) => ({ id: String(k.id), kawin: k.kawin })),
    jkl: jkl.map((j) => ({ id: String(j.id), jkl: j.jkl })),
    kedudukan_pns: kedudukanPns.map((kp) => ({ id: Number(kp.id), kedudukanPns: kp.kedudukanpns })),
    spns: spns.map((s) => ({ id: Number(s.id), spns: s.spns })),
  };
};

/**
 * Cari pegawai berdasarkan NIP Baru
 */
export const findByNip = async (nipBaru) => {
  return prisma.ta_pegawai.findFirst({
    where: { nipBaru },
    select: {
      id: true,
      nipBaru: true,
      orang_id: true,
    },
  });
};

/**
 * Buat data pegawai baru beserta ta_orang secara atomic
 */
export const createPegawai = async (pegawaiData, orangData) => {
  return prisma.$transaction(async (tx) => {
    // 1. Buat ta_orang
    await tx.ta_orang.create({
      data: orangData,
    });

    // 2. Buat ta_pegawai
    return tx.ta_pegawai.create({
      data: pegawaiData,
      select: {
        id: true,
        orang_id: true,
        nipBaru: true,
        nipLama: true,
        nik: true,
        karpeg: true,
        taspen: true,
        bpjs: true,
        kedudukanPns_id: true,
        spns_id: true,
        created_at: true,
        updated_at: true,
      },
    });
  });
};

/**
 * Update data identitas pegawai dan ta_orang secara atomic
 */
export const updateIdentitasPegawai = async (pegawaiId, pegawaiData, orangData) => {
  return prisma.$transaction(async (tx) => {
    const existingPegawai = await tx.ta_pegawai.findUnique({
      where: { id: pegawaiId },
      select: { id: true, orang_id: true },
    });

    if (!existingPegawai) {
      return null;
    }

    // 1. Update ta_orang jika ada data orang
    if (existingPegawai.orang_id && Object.keys(orangData).length > 0) {
      await tx.ta_orang.update({
        where: { id: existingPegawai.orang_id },
        data: orangData,
      });
    }

    // 2. Update ta_pegawai jika ada data pegawai
    if (Object.keys(pegawaiData).length > 0) {
      await tx.ta_pegawai.update({
        where: { id: pegawaiId },
        data: pegawaiData,
      });
    }

    return tx.ta_pegawai.findUnique({
      where: { id: pegawaiId },
      include: {
        ta_orang: true,
      },
    });
  });
};

/**
 * Update foto pegawai di ta_orang
 */
export const updateFoto = async (pegawaiId, fotoPath) => {
  return prisma.$transaction(async (tx) => {
    const pegawai = await tx.ta_pegawai.findUnique({
      where: { id: pegawaiId },
      select: {
        id: true,
        orang_id: true,
        ta_orang: {
          select: {
            id: true,
            foto: true,
          },
        },
      },
    });

    if (!pegawai) {
      return null;
    }

    const oldFoto = pegawai.ta_orang?.foto || null;

    if (pegawai.orang_id) {
      await tx.ta_orang.update({
        where: { id: pegawai.orang_id },
        data: { foto: fotoPath },
      });
    }

    return {
      pegawaiId: pegawai.id,
      orangId: pegawai.orang_id,
      foto: fotoPath,
      oldFoto,
    };
  });
};














