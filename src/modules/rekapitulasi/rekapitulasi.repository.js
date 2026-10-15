import prisma from "../../config/database.js";

/**
 * Helper untuk normalisasi hasil query Raw dengan BigInt
 */
const normalizeBigInt = (rows) => {
  return rows.map((row) => {
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[key] = typeof value === "bigint" ? Number(value) : value;
    }
    return normalized;
  });
};

/**
 * Hitung total pegawai PNS aktif
 */
export const countActivePegawai = async (unorId = null) => {
  const params = [];
  let sql = `
    SELECT COUNT(p.id) as total
    FROM ta_pegawai p
    LEFT JOIN rwt_jabatan rj ON p.rwtJab_id = rj.id
    WHERE p.kedudukanPns_id IN (1, 7, 8, 10)
  `;

  if (unorId) {
    sql += ` AND rj.unorInduk_id = ?`;
    params.push(unorId);
  }

  const result = await prisma.$queryRawUnsafe(sql, ...params);
  return Number(result[0]?.total || 0);
};

/**
 * Rekap #1: Per Jenis Kelamin
 */
export const findRekapGender = async (unorId = null) => {
  const params = [];
  let sql = `
    SELECT 
      o.jkl_id,
      COUNT(p.id) as total
    FROM ta_pegawai p
    JOIN ta_orang o ON p.orang_id = o.id
    LEFT JOIN rwt_jabatan rj ON p.rwtJab_id = rj.id
    WHERE p.kedudukanPns_id IN (1, 7, 8, 10)
  `;

  if (unorId) {
    sql += ` AND rj.unorInduk_id = ?`;
    params.push(unorId);
  }

  sql += ` GROUP BY o.jkl_id`;

  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return normalizeBigInt(rows);
};

/**
 * Rekap #2: Per Golongan Ruang dan Jenis Kelamin
 */
export const findRekapGolonganGender = async (unorId = null) => {
  const params = [];
  let sql = `
    SELECT 
      rg.gol_id as kdGol,
      o.jkl_id,
      COUNT(p.id) as total
    FROM ta_pegawai p
    JOIN ta_orang o ON p.orang_id = o.id
    LEFT JOIN rwt_gol rg ON p.rwtGol_id = rg.id
    LEFT JOIN rwt_jabatan rj ON p.rwtJab_id = rj.id
    WHERE p.kedudukanPns_id IN (1, 7, 8, 10)
  `;

  if (unorId) {
    sql += ` AND rj.unorInduk_id = ?`;
    params.push(unorId);
  }

  sql += ` GROUP BY rg.gol_id, o.jkl_id`;

  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return normalizeBigInt(rows);
};

/**
 * Rekap #3: Per Pendidikan dan Jenis Kelamin
 */
export const findRekapPendidikanGender = async (unorId = null) => {
  const params = [];
  let sql = `
    SELECT 
      rp.tktPend_id,
      o.jkl_id,
      COUNT(p.id) as total
    FROM ta_pegawai p
    JOIN ta_orang o ON p.orang_id = o.id
    LEFT JOIN rwt_pend rp ON p.rwtPend_id = rp.id
    LEFT JOIN rwt_jabatan rj ON p.rwtJab_id = rj.id
    WHERE p.kedudukanPns_id IN (1, 7, 8, 10)
  `;

  if (unorId) {
    sql += ` AND rj.unorInduk_id = ?`;
    params.push(unorId);
  }

  sql += ` GROUP BY rp.tktPend_id, o.jkl_id`;

  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return normalizeBigInt(rows);
};

/**
 * Rekap #4: Jabatan Struktural (Eselon) - Formasi dan Terisi
 */
export const findRekapJabatanStruktural = async (unorId = null) => {
  const paramsTerisi = [];
  let sqlTerisi = `
    SELECT 
      e.id as eselon_id,
      e.eselon,
      e.kode as eselon_kode,
      COUNT(DISTINCT p.id) as terisi
    FROM ta_pegawai p
    JOIN rwt_jabatan rj ON p.rwtJab_id = rj.id
    JOIN ref_jabatan j ON rj.nmJab_id = j.id
    JOIN ref_eselon e ON j.eselon_id = e.id
    WHERE p.kedudukanPns_id IN (1, 7, 8, 10)
      AND e.is_deleted = false
      AND e.eselon != 'NON ESELON'
  `;

  if (unorId) {
    sqlTerisi += ` AND rj.unorInduk_id = ?`;
    paramsTerisi.push(unorId);
  }

  sqlTerisi += ` GROUP BY e.id, e.eselon, e.kode`;

  // Formasi dihitung dari SOTK (struktur organisasi aktif di ref_unitorganisasi)
  const paramsFormasi = [];
  let kodePrefix = null;
  if (unorId) {
    const induk = await prisma.ref_unitorganisasi.findUnique({
      where: { id: unorId },
      select: { kode: true },
    });
    if (induk) kodePrefix = induk.kode;
  }

  let sqlFormasi = `
    SELECT 
      COALESCE(e.id, ej.id) as eselon_id,
      COALESCE(e.eselon, ej.eselon) as eselon,
      COALESCE(e.kode, ej.kode) as eselon_kode,
      COUNT(u.id) as formasi
    FROM ref_unitorganisasi u
    LEFT JOIN ref_unitorganisasi p ON u.parent_id = p.id
    LEFT JOIN ref_eselon e ON u.eselon_id = e.id
    LEFT JOIN ref_jabatan j ON u.jab_id = j.id
    LEFT JOIN ref_eselon ej ON j.eselon_id = ej.id
    WHERE u.is_deleted = false 
      AND u.isAktif = 1
      AND (
        u.instansi_id = '47a536f3-8610-4492-aa81-d3a6e5b4399f' 
        OR u.kode LIKE '7209%'
      )
      AND COALESCE(e.eselon, ej.eselon) IS NOT NULL
      AND COALESCE(e.eselon, ej.eselon) != 'NON ESELON'
      AND (p.id IS NULL OR TRIM(LOWER(u.nmUnor)) != TRIM(LOWER(p.nmUnor)))
  `;

  if (unorId && kodePrefix) {
    sqlFormasi += ` AND (u.id = ? OR u.parent_id = ? OR u.kode LIKE ?)`;
    paramsFormasi.push(unorId, unorId, `${kodePrefix}%`);
  } else if (unorId) {
    sqlFormasi += ` AND (u.id = ? OR u.parent_id = ?)`;
    paramsFormasi.push(unorId, unorId);
  }

  sqlFormasi += `
    GROUP BY 
      COALESCE(e.id, ej.id),
      COALESCE(e.eselon, ej.eselon),
      COALESCE(e.kode, ej.kode)
  `;

  const [terisiRows, formasiRows] = await Promise.all([
    prisma.$queryRawUnsafe(sqlTerisi, ...paramsTerisi),
    prisma.$queryRawUnsafe(sqlFormasi, ...paramsFormasi),
  ]);

  return {
    terisi: normalizeBigInt(terisiRows),
    formasi: normalizeBigInt(formasiRows),
  };
};

/**
 * Rekap #5: Pejabat Struktural Per Jenis Kelamin (Eselon)
 */
export const findRekapStrukturalGender = async (unorId = null) => {
  const params = [];
  let sql = `
    SELECT 
      e.id as eselon_id,
      e.eselon,
      e.kode as eselon_kode,
      o.jkl_id,
      COUNT(DISTINCT p.id) as total
    FROM ta_pegawai p
    JOIN ta_orang o ON p.orang_id = o.id
    JOIN rwt_jabatan rj ON p.rwtJab_id = rj.id
    JOIN ref_jabatan j ON rj.nmJab_id = j.id
    JOIN ref_eselon e ON j.eselon_id = e.id
    WHERE p.kedudukanPns_id IN (1, 7, 8, 10)
      AND e.is_deleted = false
      AND e.eselon != 'NON ESELON'
  `;

  if (unorId) {
    sql += ` AND rj.unorInduk_id = ?`;
    params.push(unorId);
  }

  sql += ` GROUP BY e.id, e.eselon, e.kode, o.jkl_id`;

  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return normalizeBigInt(rows);
};

/**
 * Rekap #6: Pendidikan Pejabat Struktural (Eselon)
 */
export const findRekapStrukturalPendidikan = async (unorId = null) => {
  const params = [];
  let sql = `
    SELECT 
      e.id as eselon_id,
      e.eselon,
      e.kode as eselon_kode,
      rp.tktPend_id,
      COUNT(DISTINCT p.id) as total
    FROM ta_pegawai p
    JOIN rwt_jabatan rj ON p.rwtJab_id = rj.id
    JOIN ref_jabatan j ON rj.nmJab_id = j.id
    JOIN ref_eselon e ON j.eselon_id = e.id
    LEFT JOIN rwt_pend rp ON p.rwtPend_id = rp.id
    WHERE p.kedudukanPns_id IN (1, 7, 8, 10)
      AND e.is_deleted = false
      AND e.eselon != 'NON ESELON'
  `;

  if (unorId) {
    sql += ` AND rj.unorInduk_id = ?`;
    params.push(unorId);
  }

  sql += ` GROUP BY e.id, e.eselon, e.kode, rp.tktPend_id`;

  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return normalizeBigInt(rows);
};

/**
 * Rekap #7: Rekap Pegawai Per Jabatan dan Jenis Kelamin
 */
export const findRekapJabatanGender = async (unorId = null) => {
  const params = [];
  let sql = `
    SELECT 
      j.kategori,
      jj.jenjangjab,
      js.jnsjab,
      e.eselon,
      o.jkl_id,
      COUNT(DISTINCT p.id) as total
    FROM ta_pegawai p
    JOIN ta_orang o ON p.orang_id = o.id
    LEFT JOIN rwt_jabatan rj ON p.rwtJab_id = rj.id
    LEFT JOIN ref_jabatan j ON rj.nmJab_id = j.id
    LEFT JOIN ref_jenjangjab jj ON j.jenjang_jab_id = jj.id
    LEFT JOIN ref_jnsjab js ON j.jns_jab_id = js.id
    LEFT JOIN ref_eselon e ON j.eselon_id = e.id
    WHERE p.kedudukanPns_id IN (1, 7, 8, 10)
  `;

  if (unorId) {
    sql += ` AND rj.unorInduk_id = ?`;
    params.push(unorId);
  }

  sql += ` GROUP BY j.kategori, jj.jenjangjab, js.jnsjab, e.eselon, o.jkl_id`;

  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return normalizeBigInt(rows);
};

/**
 * Rekap #8: Rekap Jabatan Fungsional (Kelompok Jabatan & Kategori Jenjang per Gender)
 */
export const findRekapJabatanFungsional = async (unorId = null) => {
  const params = [];
  let sql = `
    SELECT 
      j.kelompok_jabatan,
      SUM(CASE WHEN j.kategori_jf = 'AHLI' AND (jkl.jkl = 'Laki-Laki' OR o.jkl_id = 1) THEN 1 ELSE 0 END) AS ahli_l,
      SUM(CASE WHEN j.kategori_jf = 'AHLI' AND (jkl.jkl = 'Perempuan' OR o.jkl_id = 2) THEN 1 ELSE 0 END) AS ahli_p,
      SUM(CASE WHEN j.kategori_jf = 'AHLI' THEN 1 ELSE 0 END) AS ahli_total,
      SUM(CASE WHEN j.kategori_jf = 'TERAMPIL' AND (jkl.jkl = 'Laki-Laki' OR o.jkl_id = 1) THEN 1 ELSE 0 END) AS terampil_l,
      SUM(CASE WHEN j.kategori_jf = 'TERAMPIL' AND (jkl.jkl = 'Perempuan' OR o.jkl_id = 2) THEN 1 ELSE 0 END) AS terampil_p,
      SUM(CASE WHEN j.kategori_jf = 'TERAMPIL' THEN 1 ELSE 0 END) AS terampil_total,
      SUM(CASE WHEN (jkl.jkl = 'Laki-Laki' OR o.jkl_id = 1) THEN 1 ELSE 0 END) AS total_l,
      SUM(CASE WHEN (jkl.jkl = 'Perempuan' OR o.jkl_id = 2) THEN 1 ELSE 0 END) AS total_p,
      COUNT(p.id) AS total_semua
    FROM ta_pegawai p
    JOIN ta_orang o ON p.orang_id = o.id
    LEFT JOIN ref_jkl jkl ON o.jkl_id = jkl.id
    JOIN rwt_jabatan rj ON p.rwtJab_id = rj.id
    JOIN ref_jabatan j ON rj.nmJab_id = j.id
    WHERE p.kedudukanPns_id IN (1, 7, 8, 10)
      AND j.kelompok_jabatan IS NOT NULL
      AND j.kelompok_jabatan != ''
  `;

  if (unorId) {
    sql += ` AND rj.unorInduk_id = ?`;
    params.push(unorId);
  }

  sql += `
    GROUP BY j.kelompok_jabatan
    ORDER BY total_semua DESC, j.kelompok_jabatan ASC
  `;

  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return normalizeBigInt(rows);
};

/**
 * Query Master Referensi
 */
export const findAllJkl = async () => {
  return prisma.ref_jkl.findMany({
    select: { id: true, jkl: true },
  });
};

export const findAllGol = async () => {
  return prisma.ref_gol.findMany({
    select: { kdGol: true, gol: true, pangkat: true },
    orderBy: { kdGol: "asc" },
  });
};

export const findAllTktPend = async () => {
  return prisma.ref_tktpend.findMany({
    select: { id: true, tktpend: true },
    orderBy: { id: "asc" },
  });
};

export const findAllEselon = async () => {
  return prisma.ref_eselon.findMany({
    where: { is_deleted: false },
    select: { id: true, eselon: true, kode: true, eselon_kode: true },
    orderBy: { eselon_kode: "asc" },
  });
};

export const findUnorById = async (id) => {
  if (!id) return null;
  return prisma.ref_unitorganisasi.findFirst({
    where: { id, is_deleted: false },
    select: { id: true, nmUnor: true },
  });
};

/**
 * Snapshot Rekapitulasi (ta_rekap_snapshot)
 */
export const findSnapshot = async (period, type, unorId = null) => {
  return prisma.ta_rekap_snapshot.findFirst({
    where: {
      period,
      type,
      unor_id: unorId || null,
      is_deleted: false,
    },
    select: {
      id: true,
      period: true,
      type: true,
      data: true,
      unor_id: true,
      created_at: true,
    },
  });
};

export const saveSnapshot = async (period, type, unorId, data) => {
  const existing = await prisma.ta_rekap_snapshot.findFirst({
    where: {
      period,
      type,
      unor_id: unorId || null,
      is_deleted: false,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.ta_rekap_snapshot.update({
      where: { id: existing.id },
      data: {
        data,
        updated_at: new Date(),
      },
      select: {
        id: true,
        period: true,
        type: true,
        unor_id: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  return prisma.ta_rekap_snapshot.create({
    data: {
      period,
      type,
      unor_id: unorId || null,
      data,
    },
    select: {
      id: true,
      period: true,
      type: true,
      unor_id: true,
      created_at: true,
      updated_at: true,
    },
  });
};

export const listAvailableSnapshots = async () => {
  const rows = await prisma.ta_rekap_snapshot.findMany({
    where: { is_deleted: false },
    select: {
      period: true,
    },
    distinct: ["period"],
    orderBy: { period: "desc" },
  });
  return rows.map((r) => r.period);
};
