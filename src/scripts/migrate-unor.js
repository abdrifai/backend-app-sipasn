import { executeUnorMigration, getMigrationComparison } from "../modules/ref-unor/ref-unor.migration.service.js";
import logger from "../config/logger.js";

async function main() {
  console.log("==================================================");
  console.log("   SIPASN - MIGRASI TABEL TUNGGAL UNIT ORGANISASI  ");
  console.log("==================================================");

  console.log("\n1. Memeriksa status data...");
  const beforeStats = await getMigrationComparison();
  console.log("Data Sumber (4 Tabel Lama):", beforeStats.source);
  console.log("Data Target (ref_unitorganisasi):", beforeStats.target);

  console.log("\n2. Menjalankan proses ETL migrasi...");
  const result = await executeUnorMigration();
  console.log("\n✅", result.message);
  console.log("Detail:", result.data);

  console.log("\n3. Memverifikasi hasil akhir...");
  const afterStats = await getMigrationComparison();
  console.log("Status Akhir ref_unitorganisasi:", afterStats.target);
  console.log(`Persentase Selesai: ${afterStats.percentage}%`);
  console.log("\n==================================================");
  console.log("   MIGRASI SELESAI DENGAN SUKSES                  ");
  console.log("==================================================");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Terjadi kesalahan saat migrasi:", err);
  process.exit(1);
});
