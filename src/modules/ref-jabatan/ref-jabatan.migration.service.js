import prisma from "../../config/database.js";
import logger from "../../config/logger.js";

/**
 * Service untuk migrasi data dari 4 tabel master jabatan ke tabel tunggal ref_jabatan
 */
export const executeJabatanMigration = async () => {
  logger.info("Memulai proses migrasi ke tabel tunggal ref_jabatan...");

  // 1. Buat tabel fisik ref_jabatan jika belum ada
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`ref_jabatan\` (
      \`id\` CHAR(36) NOT NULL,
      \`kode\` VARCHAR(100) NULL,
      \`nama_jabatan\` VARCHAR(255) NOT NULL,
      \`kategori\` VARCHAR(50) NOT NULL DEFAULT 'PELAKSANA',
      \`jns_jab_id\` CHAR(36) NULL,
      \`jenjang_jab_id\` BIGINT UNSIGNED NULL,
      \`eselon_id\` CHAR(36) NULL,
      \`bup\` INT NULL DEFAULT 58,
      \`kelas_jabatan\` INT NULL,
      \`is_aktif\` INT NOT NULL DEFAULT 1,
      \`is_deleted\` BOOLEAN NOT NULL DEFAULT FALSE,
      \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      INDEX \`idx_ref_jabatan_kategori\` (\`kategori\`),
      INDEX \`idx_ref_jabatan_nama\` (\`nama_jabatan\`),
      INDEX \`idx_ref_jabatan_eselon\` (\`eselon_id\`),
      INDEX \`idx_ref_jabatan_jnsjab\` (\`jns_jab_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Tahap 1: Migrasi ref_jab (Struktural)
  await prisma.$executeRawUnsafe(`
    INSERT INTO ref_jabatan (id, kode, nama_jabatan, kategori, jns_jab_id, jenjang_jab_id, eselon_id, bup, is_aktif, is_deleted, created_at, updated_at)
    SELECT 
      j.id,
      NULL as kode,
      TRIM(j.nm_jab) as nama_jabatan,
      'STRUKTURAL' as kategori,
      COALESCE(j.jns_jab_id, 'cb96a38e-5d24-46a8-bc47-7f4677ff603d') as jns_jab_id,
      j.jenjang_jab_id,
      j.eselon_id,
      CASE 
        WHEN e.eselon IN ('II.a', 'II.b', 'I.a', 'I.b') THEN 60 
        ELSE 58 
      END as bup,
      1 as is_aktif,
      COALESCE(j.is_deleted, 0) as is_deleted,
      j.created_at,
      j.updated_at
    FROM ref_jab j
    LEFT JOIN ref_eselon e ON j.eselon_id = e.id
    ON DUPLICATE KEY UPDATE
      nama_jabatan = VALUES(nama_jabatan),
      kategori = VALUES(kategori),
      eselon_id = VALUES(eselon_id),
      jns_jab_id = VALUES(jns_jab_id);
  `);

  // 3. Tahap 2: Migrasi ref_jabfungsional (Fungsional)
  await prisma.$executeRawUnsafe(`
    INSERT INTO ref_jabatan (id, kode, nama_jabatan, kategori, jns_jab_id, jenjang_jab_id, eselon_id, bup, is_aktif, is_deleted, created_at, updated_at)
    SELECT 
      jf.id,
      NULL as kode,
      TRIM(jf.nmJab) as nama_jabatan,
      'FUNGSIONAL' as kategori,
      '490b8479-fd4f-4f99-992e-880a5611b890' as jns_jab_id,
      NULL as jenjang_jab_id,
      'adddcd2d-258b-4ff2-82dd-c638500a8f80' as eselon_id,
      CASE 
        WHEN jf.nmJab LIKE '%Utama%' THEN 65
        WHEN jf.nmJab LIKE '%Madya%' THEN 60
        ELSE 58 
      END as bup,
      1 as is_aktif,
      0 as is_deleted,
      jf.created_at,
      jf.updated_at
    FROM ref_jabfungsional jf
    ON DUPLICATE KEY UPDATE
      nama_jabatan = VALUES(nama_jabatan),
      kategori = VALUES(kategori);
  `);

  // 4. Tahap 3: Migrasi ref_jabpelaksana (Pelaksana)
  await prisma.$executeRawUnsafe(`
    INSERT INTO ref_jabatan (id, kode, nama_jabatan, kategori, jns_jab_id, jenjang_jab_id, eselon_id, bup, is_aktif, is_deleted, created_at, updated_at)
    SELECT 
      jp.id,
      NULL as kode,
      TRIM(jp.nmJab) as nama_jabatan,
      'PELAKSANA' as kategori,
      '4a71c9b4-e57d-439d-8ccd-e8bf3ec83de5' as jns_jab_id,
      3 as jenjang_jab_id,
      'adddcd2d-258b-4ff2-82dd-c638500a8f80' as eselon_id,
      58 as bup,
      1 as is_aktif,
      0 as is_deleted,
      jp.created_at,
      jp.updated_at
    FROM ref_jabpelaksana jp
    ON DUPLICATE KEY UPDATE
      nama_jabatan = VALUES(nama_jabatan),
      kategori = VALUES(kategori);
  `);

  // 5. Tahap 4: Migrasi ref_nmjabsimpeglama (Legacy yang belum masuk)
  await prisma.$executeRawUnsafe(`
    INSERT IGNORE INTO ref_jabatan (id, kode, nama_jabatan, kategori, jns_jab_id, jenjang_jab_id, eselon_id, bup, is_aktif, is_deleted, created_at, updated_at)
    SELECT 
      old.id,
      old.kode,
      TRIM(old.nmJab) as nama_jabatan,
      CASE 
        WHEN old.nmJab LIKE 'KEPALA %' OR old.nmJab LIKE 'CAMAT%' OR old.nmJab LIKE 'LURAH%' OR old.nmJab LIKE 'SEKRETARIS%' OR old.nmJab LIKE 'DIREKTUR%' OR old.nmJab LIKE 'INSPEKTUR%' THEN 'STRUKTURAL'
        WHEN old.nmJab LIKE '%AHLI %' OR old.nmJab LIKE '%TERAMPIL%' OR old.nmJab LIKE '%MAHIR%' OR old.nmJab LIKE '%PENYELIA%' OR old.nmJab LIKE '%DOKTER%' OR old.nmJab LIKE '%GURU%' OR old.nmJab LIKE '%PERAWAT%' OR old.nmJab LIKE '%BIDAN%' THEN 'FUNGSIONAL'
        ELSE 'PELAKSANA'
      END as kategori,
      CASE 
        WHEN old.nmJab LIKE 'KEPALA %' OR old.nmJab LIKE 'CAMAT%' OR old.nmJab LIKE 'LURAH%' OR old.nmJab LIKE 'SEKRETARIS%' OR old.nmJab LIKE 'DIREKTUR%' OR old.nmJab LIKE 'INSPEKTUR%' THEN 'cb96a38e-5d24-46a8-bc47-7f4677ff603d'
        WHEN old.nmJab LIKE '%AHLI %' OR old.nmJab LIKE '%TERAMPIL%' OR old.nmJab LIKE '%MAHIR%' OR old.nmJab LIKE '%PENYELIA%' OR old.nmJab LIKE '%DOKTER%' OR old.nmJab LIKE '%GURU%' OR old.nmJab LIKE '%PERAWAT%' OR old.nmJab LIKE '%BIDAN%' THEN '490b8479-fd4f-4f99-992e-880a5611b890'
        ELSE '4a71c9b4-e57d-439d-8ccd-e8bf3ec83de5'
      END as jns_jab_id,
      NULL as jenjang_jab_id,
      old.eselon_id,
      58 as bup,
      1 as is_aktif,
      0 as is_deleted,
      old.created_at,
      old.updated_at
    FROM ref_nmjabsimpeglama old
    WHERE old.nmJab IS NOT NULL AND TRIM(old.nmJab) <> '';
  `);

  const [totalCount, byCategory] = await Promise.all([
    prisma.$queryRawUnsafe("SELECT COUNT(*) as total FROM ref_jabatan"),
    prisma.$queryRawUnsafe("SELECT kategori, COUNT(*) as count FROM ref_jabatan GROUP BY kategori"),
  ]);

  logger.info("Migrasi ref_jabatan berhasil diselesaikan.");
  return {
    total: totalCount[0].total,
    byCategory,
  };
};

export const getJabatanStats = async () => {
  const [totalResult, byCategory] = await Promise.all([
    prisma.$queryRawUnsafe("SELECT COUNT(*) as total FROM ref_jabatan WHERE is_deleted = 0"),
    prisma.$queryRawUnsafe("SELECT kategori, COUNT(*) as count FROM ref_jabatan WHERE is_deleted = 0 GROUP BY kategori"),
  ]);

  return {
    total: Number(totalResult[0]?.total || 0),
    byCategory: byCategory.map(c => ({ kategori: c.kategori, count: Number(c.count) })),
  };
};
