-- Rename legacy rwt tables to standardized rwt_ tables
RENAME TABLE `rwtanak` TO `rwt_anak`;
RENAME TABLE `rwtdiklat` TO `rwt_diklat`;
RENAME TABLE `rwtgol` TO `rwt_gol`;
RENAME TABLE `rwthukdis` TO `rwt_hukdis`;
RENAME TABLE `rwtjabatan` TO `rwt_jabatan`;
RENAME TABLE `rwtkgb` TO `rwt_kgb`;
RENAME TABLE `rwtortu` TO `rwt_ortu`;
RENAME TABLE `rwtpend` TO `rwt_pend`;
RENAME TABLE `rwtskp` TO `rwt_skp`;
RENAME TABLE `rwtsuis` TO `rwt_suis`;

-- CreateTable ref_unitorganisasi
CREATE TABLE IF NOT EXISTS `ref_unitorganisasi` (
    `id` CHAR(36) NOT NULL,
    `parent_id` CHAR(36) NULL,
    `instansi_id` CHAR(36) NULL,
    `kode` VARCHAR(255) NOT NULL,
    `nmUnor` VARCHAR(255) NOT NULL,
    `level` VARCHAR(50) NOT NULL,
    `jab_id` CHAR(36) NULL,
    `jnsUnor_id` CHAR(36) NULL,
    `eselon_id` CHAR(36) NULL,
    `is_pimpinan` BOOLEAN NOT NULL DEFAULT false,
    `isAktif` INTEGER NOT NULL DEFAULT 1,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `ref_unitorganisasi_parent_id_idx`(`parent_id`),
    INDEX `ref_unitorganisasi_instansi_id_idx`(`instansi_id`),
    INDEX `ref_unitorganisasi_kode_idx`(`kode`),
    INDEX `ref_unitorganisasi_jab_id_idx`(`jab_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable ref_jabatan
CREATE TABLE IF NOT EXISTS `ref_jabatan` (
    `id` CHAR(36) NOT NULL,
    `kode` VARCHAR(100) NULL,
    `nama_jabatan` VARCHAR(255) NOT NULL,
    `kategori` VARCHAR(50) NOT NULL DEFAULT 'PELAKSANA',
    `jns_jab_id` CHAR(36) NULL,
    `jenjang_jab_id` BIGINT UNSIGNED NULL,
    `eselon_id` CHAR(36) NULL,
    `bup` INT NULL DEFAULT 58,
    `kelas_jabatan` INT NULL,
    `is_aktif` INT NOT NULL DEFAULT 1,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_ref_jabatan_kategori` (`kategori`),
    INDEX `idx_ref_jabatan_nama` (`nama_jabatan`),
    INDEX `idx_ref_jabatan_eselon` (`eselon_id`),
    INDEX `idx_ref_jabatan_jnsjab` (`jns_jab_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
