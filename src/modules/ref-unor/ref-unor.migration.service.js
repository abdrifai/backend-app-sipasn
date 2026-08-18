import prisma from "../../config/database.js";
import logger from "../../config/logger.js";
import * as unitorgRepository from "./ref-unitorganisasi.repository.js";

/**
 * Cek statistik perbandingan antara 4 tabel lama dan tabel baru ref_unitorganisasi
 */
export const getMigrationComparison = async () => {
  const [
    indukRows,
    unorRows,
    subRows,
    subSubRows,
    currentUnifiedStats
  ] = await Promise.all([
    prisma.$queryRawUnsafe("SELECT COUNT(*) as c FROM ref_unorinduk WHERE is_deleted = 0"),
    prisma.$queryRawUnsafe("SELECT COUNT(*) as c FROM ref_unor WHERE is_deleted = 0"),
    prisma.$queryRawUnsafe("SELECT COUNT(*) as c FROM ref_subunor WHERE is_deleted = 0"),
    prisma.$queryRawUnsafe("SELECT COUNT(*) as c FROM ref_subunorsub WHERE is_deleted = 0"),
    unitorgRepository.getStats()
  ]);

  const countInduk = Number(indukRows[0]?.c || 0);
  const countUnor = Number(unorRows[0]?.c || 0);
  const countSub = Number(subRows[0]?.c || 0);
  const countSubSub = Number(subSubRows[0]?.c || 0);

  const totalSource = countInduk + countUnor + countSub + countSubSub;
  const isMigrated = currentUnifiedStats.total >= totalSource && totalSource > 0;

  return {
    source: {
      induk: countInduk,
      unor: countUnor,
      sub: countSub,
      subSub: countSubSub,
      total: totalSource,
    },
    target: currentUnifiedStats,
    isMigrated,
    percentage: totalSource > 0 ? ((currentUnifiedStats.total / totalSource) * 100).toFixed(1) : "0",
  };
};

/**
 * Eksekusi migrasi otomatis dari 4 tabel ke ref_unitorganisasi secara atomic
 */
export const executeUnorMigration = async () => {
  logger.info("Memulai proses migrasi Unit Organisasi ke ref_unitorganisasi...");

  const startTime = Date.now();

  // Pastikan instansi_id terisi pada ref_unorinduk terlebih dahulu
  await prisma.$executeRawUnsafe(`
    UPDATE ref_unorinduk u
    JOIN ref_instansi i ON i.kode = CAST(SUBSTRING(u.kode, 1, 4) AS UNSIGNED)
    SET u.instansi_id = i.id, u.instansi_kode = CAST(i.kode AS CHAR)
    WHERE u.instansi_id IS NULL
  `);

  // 1. Bersihkan tabel ref_unitorganisasi terlebih dahulu
  await prisma.ref_unitorganisasi.deleteMany({});

  // 2. Ambil seluruh data dari 4 tabel sumber
  const [allInduk, allUnor, allSub, allSubSub] = await Promise.all([
    prisma.$queryRawUnsafe("SELECT * FROM ref_unorinduk WHERE is_deleted = 0"),
    prisma.$queryRawUnsafe("SELECT * FROM ref_unor WHERE is_deleted = 0"),
    prisma.$queryRawUnsafe("SELECT * FROM ref_subunor WHERE is_deleted = 0"),
    prisma.$queryRawUnsafe("SELECT * FROM ref_subunorsub WHERE is_deleted = 0"),
  ]);

  // Map untuk lookup nama induk dan instansi_id
  const indukMap = new Map();
  const recordsToInsert = [];

  // Step 1: Mapping ref_unorinduk (Level: induk)
  for (const item of allInduk) {
    indukMap.set(item.id, {
      nmUnor: item.nmUnor,
      instansi_id: item.instansi_id,
      kode: item.kode,
    });

    recordsToInsert.push({
      id: item.id,
      parent_id: null,
      instansi_id: item.instansi_id || null,
      kode: item.kode,
      nmUnor: item.nmUnor,
      level: "induk",
      jab_id: item.jab_id || null,
      jnsUnor_id: item.jnsUnor_id || null,
      eselon_id: null,
      is_pimpinan: false,
      isAktif: item.isAktif ?? 1,
      is_deleted: false,
      created_at: item.created_at || new Date(),
      updated_at: item.updated_at || new Date(),
    });
  }

  // Step 2: Mapping ref_unor (Level: unor)
  const unorMap = new Map();
  for (const item of allUnor) {
    const parentInduk = indukMap.get(item.unorinduk_id);
    const isPimpinan = Boolean(
      item.kode?.endsWith("1001") ||
      item.kode?.endsWith("001") ||
      (parentInduk && item.nmUnor?.trim().toLowerCase() === parentInduk.nmUnor?.trim().toLowerCase())
    );

    unorMap.set(item.id, {
      nmUnor: item.nmUnor,
      instansi_id: parentInduk?.instansi_id || null,
      indukName: parentInduk?.nmUnor || "",
    });

    recordsToInsert.push({
      id: item.id,
      parent_id: item.unorinduk_id,
      instansi_id: parentInduk?.instansi_id || null,
      kode: item.kode,
      nmUnor: item.nmUnor,
      level: "unor",
      jab_id: item.jab_id || null,
      jnsUnor_id: null,
      eselon_id: null,
      is_pimpinan: isPimpinan,
      isAktif: 1,
      is_deleted: false,
      created_at: item.created_at || new Date(),
      updated_at: item.updated_at || new Date(),
    });
  }

  // Step 3: Mapping ref_subunor (Level: sub)
  const subMap = new Map();
  for (const item of allSub) {
    const parentUnor = unorMap.get(item.unor_id);
    const isPimpinan = Boolean(
      item.kode?.endsWith("10011001") ||
      (parentUnor && (
        item.nmUnor?.trim().toLowerCase() === parentUnor.nmUnor?.trim().toLowerCase() ||
        item.nmUnor?.trim().toLowerCase() === parentUnor.indukName?.trim().toLowerCase()
      ))
    );

    subMap.set(item.id, {
      nmUnor: item.nmUnor,
      instansi_id: parentUnor?.instansi_id || null,
    });

    recordsToInsert.push({
      id: item.id,
      parent_id: item.unor_id,
      instansi_id: parentUnor?.instansi_id || null,
      kode: item.kode,
      nmUnor: item.nmUnor,
      level: "sub",
      jab_id: item.jab_id || null,
      jnsUnor_id: null,
      eselon_id: null,
      is_pimpinan: isPimpinan,
      isAktif: 1,
      is_deleted: false,
      created_at: item.created_at || new Date(),
      updated_at: item.updated_at || new Date(),
    });
  }

  // Step 4: Mapping ref_subunorsub (Level: sub-sub)
  for (const item of allSubSub) {
    const parentSub = subMap.get(item.subUnor_id);

    recordsToInsert.push({
      id: item.id,
      parent_id: item.subUnor_id,
      instansi_id: parentSub?.instansi_id || null,
      kode: item.kode,
      nmUnor: item.nmUnor,
      level: "sub-sub",
      jab_id: item.jab_id || null,
      jnsUnor_id: null,
      eselon_id: null,
      is_pimpinan: false,
      isAktif: 1,
      is_deleted: false,
      created_at: item.created_at || new Date(),
      updated_at: item.updated_at || new Date(),
    });
  }

  // Insert data secara bertahap / chunk agar optimal
  const CHUNK_SIZE = 1000;
  let totalInserted = 0;
  for (let i = 0; i < recordsToInsert.length; i += CHUNK_SIZE) {
    const chunk = recordsToInsert.slice(i, i + CHUNK_SIZE);
    const inserted = await prisma.ref_unitorganisasi.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    totalInserted += inserted.count;
  }

  const result = {
    totalRecords: totalInserted,
    counts: {
      induk: allInduk.length,
      unor: allUnor.length,
      sub: allSub.length,
      subSub: allSubSub.length,
    },
  };

  const durationMs = Date.now() - startTime;
  logger.info(`Migrasi Unit Organisasi selesai dalam ${durationMs}ms. Total: ${result.totalRecords} record.`);

  return {
    success: true,
    message: `Migrasi berhasil. Total ${result.totalRecords} unit organisasi telah dipindahkan ke ref_unitorganisasi.`,
    data: {
      ...result,
      durationMs,
    },
  };
};
