import prisma from "../../config/database.js";

/**
 * Ambil data proyeksi estimasi pensiun pegawai aktif beserta statistik.
 * BUP diambil langsung dari ref_jabatan.bup — tanpa fallback kalkulasi.
 * Jika ref_jabatan.bup null berarti data jabatan perlu diperbaiki.
 */
export const findEstimasiPensiun = async ({
  tahun = "",
  bulan = "",
  rentang = "",
  unorInduk_id = "",
  jns_jab_id = "",
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
              jns_jab_id: true,
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

    // Hitung usia terlebih dahulu untuk kebutuhan fallback
    const birthYear = tglLhr.getFullYear();
    const birthMonth = tglLhr.getMonth(); // 0-indexed
    const birthDay = tglLhr.getDate();

    let ageYears = now.getFullYear() - birthYear;
    let ageMonths = now.getMonth() - birthMonth;
    if (now.getDate() < birthDay) ageMonths -= 1;
    if (ageMonths < 0) { ageYears -= 1; ageMonths += 12; }

    // BUP diambil murni dari ref_jabatan.bup
    // Jika null tapi usia sudah >= 60 tahun → tetap tampilkan dengan status SUDAH_BUP
    // Jika null dan usia < 60 → skip, data jabatan perlu diperbaiki
    const bup = jab?.bup ?? null;
    if (bup === null && ageYears < 60) return null;

    // Jika BUP null (usia >= 60), tampilkan sebagai sudah melewati batas
    if (bup === null) {
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
        bup: null,
        tmt_pensiun: null,
        tmt_pensiun_date: new Date(0), // past date agar masuk pastBupRetirements
        pensiun_tahun: null,
        pensiun_bulan: null,
        diff_days: -1,
        sisa_waktu: 'BUP tidak terdaftar',
        status_pensiun: 'SUDAH_BUP',
        status_badge: 'rose',
        jabatan: jab?.nama_jabatan || 'Staf',
        kategori: itemKategori,
        eselon: jab?.ref_eselon?.eselon || '-',
        jenjang: jab?.ref_jenjangjab?.jenjangjab || '-',
        pangkat_gol: p.rwt_gol?.ref_gol ? `${p.rwt_gol.ref_gol.pangkat} (${p.rwt_gol.ref_gol.gol})` : '-',
        unit_kerja: p.rwt_jabatan?.ref_unitorganisasi?.nmUnor || '-',
      };
    }

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
      jns_jab_id: jab?.jns_jab_id || p.rwt_jabatan?.jnsJab_id || null,
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

  if (jns_jab_id && jns_jab_id !== 'all') {
    filtered = filtered.filter(p => p.jns_jab_id === jns_jab_id);
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
