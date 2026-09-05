import prisma from "../config/database.js";

async function createTable() {
  const sql = `
  CREATE TABLE IF NOT EXISTS \`ta_import_pns\` (
    \`id\` CHAR(36) NOT NULL,
    \`batch_id\` CHAR(36) NULL,
    \`file_name\` VARCHAR(255) NULL,
    \`pns_id\` VARCHAR(50) NULL,
    \`nip_baru\` VARCHAR(50) NULL,
    \`nip_lama\` VARCHAR(50) NULL,
    \`nama\` VARCHAR(255) NULL,
    \`gelar_depan\` VARCHAR(50) NULL,
    \`gelar_belakang\` VARCHAR(50) NULL,
    \`tempat_lahir\` VARCHAR(255) NULL,
    \`tempat_lahir_id\` VARCHAR(50) NULL,
    \`tanggal_lahir\` VARCHAR(50) NULL,
    \`jenis_kelamin\` VARCHAR(20) NULL,
    \`agama_id\` VARCHAR(50) NULL,
    \`agama_nama\` VARCHAR(100) NULL,
    \`jenis_kawin_id\` VARCHAR(50) NULL,
    \`jenis_kawin_nama\` VARCHAR(100) NULL,
    \`nik\` VARCHAR(50) NULL,
    \`nomor_hp\` VARCHAR(50) NULL,
    \`email\` VARCHAR(255) NULL,
    \`email_gov\` VARCHAR(255) NULL,
    \`alamat\` TEXT NULL,
    \`npwp_nomor\` VARCHAR(50) NULL,
    \`bpjs\` VARCHAR(50) NULL,
    \`jenis_pegawai_id\` VARCHAR(50) NULL,
    \`jenis_pegawai_nama\` VARCHAR(100) NULL,
    \`kedudukan_pns_id\` VARCHAR(50) NULL,
    \`kedudukan_pns_nama\` VARCHAR(100) NULL,
    \`status_cpns_pns\` VARCHAR(50) NULL,
    \`kartu_asn_virtual\` VARCHAR(100) NULL,
    \`nomor_sk_cpns\` VARCHAR(255) NULL,
    \`tanggal_sk_cpns\` VARCHAR(50) NULL,
    \`tmt_cpns\` VARCHAR(50) NULL,
    \`nomor_sk_pns\` VARCHAR(255) NULL,
    \`tanggal_sk_pns\` VARCHAR(50) NULL,
    \`tmt_pns\` VARCHAR(50) NULL,
    \`gol_awal_id\` VARCHAR(50) NULL,
    \`gol_awal_nama\` VARCHAR(50) NULL,
    \`gol_akhir_id\` VARCHAR(50) NULL,
    \`gol_akhir_nama\` VARCHAR(50) NULL,
    \`tmt_golongan\` VARCHAR(50) NULL,
    \`mk_tahun\` VARCHAR(10) NULL,
    \`mk_bulan\` VARCHAR(10) NULL,
    \`jenis_jabatan_id\` VARCHAR(50) NULL,
    \`jenis_jabatan_nama\` VARCHAR(100) NULL,
    \`jabatan_id\` VARCHAR(50) NULL,
    \`jabatan_nama\` VARCHAR(255) NULL,
    \`tmt_jabatan\` VARCHAR(50) NULL,
    \`tingkat_pendidikan_id\` VARCHAR(50) NULL,
    \`tingkat_pendidikan_nama\` VARCHAR(100) NULL,
    \`pendidikan_id\` VARCHAR(50) NULL,
    \`pendidikan_nama\` VARCHAR(255) NULL,
    \`tahun_lulus\` VARCHAR(20) NULL,
    \`kpkn_id\` VARCHAR(50) NULL,
    \`kpkn_nama\` VARCHAR(100) NULL,
    \`lokasi_kerja_id\` VARCHAR(50) NULL,
    \`lokasi_kerja_nama\` VARCHAR(255) NULL,
    \`unor_id\` VARCHAR(50) NULL,
    \`unor_nama\` VARCHAR(255) NULL,
    \`instansi_induk_id\` VARCHAR(50) NULL,
    \`instansi_induk_nama\` VARCHAR(255) NULL,
    \`instansi_kerja_id\` VARCHAR(50) NULL,
    \`instansi_kerja_nama\` VARCHAR(255) NULL,
    \`satuan_kerja_induk_id\` VARCHAR(50) NULL,
    \`satuan_kerja_induk_nama\` VARCHAR(255) NULL,
    \`satuan_kerja_kerja_id\` VARCHAR(50) NULL,
    \`satuan_kerja_kerja_nama\` VARCHAR(255) NULL,
    \`is_valid_nik\` VARCHAR(50) NULL,
    \`nama_sekolah\` VARCHAR(255) NULL,
    \`flag_ikd\` VARCHAR(50) NULL,
    \`csv_created_at\` VARCHAR(50) NULL,
    \`csv_updated_at\` VARCHAR(50) NULL,
    \`eselon_id\` VARCHAR(50) NULL,
    \`eselon_nama\` VARCHAR(100) NULL,
    \`is_deleted\` TINYINT(1) NOT NULL DEFAULT 0,
    \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    INDEX \`idx_ta_import_pns_nip_baru\` (\`nip_baru\`),
    INDEX \`idx_ta_import_pns_pns_id\` (\`pns_id\`),
    INDEX \`idx_ta_import_pns_nik\` (\`nik\`),
    INDEX \`idx_ta_import_pns_batch_id\` (\`batch_id\`),
    INDEX \`idx_ta_import_pns_unor_id\` (\`unor_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await prisma.$executeRawUnsafe(sql);
    console.log("Table ta_import_pns created or already exists.");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTable();
