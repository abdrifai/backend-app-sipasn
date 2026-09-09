-- CreateTable
CREATE TABLE IF NOT EXISTS `ta_sk_kolektif` (
  `id` CHAR(36) NOT NULL,
  `no_sk` VARCHAR(255) NOT NULL,
  `tgl_sk` DATE NOT NULL,
  `tmt_sk` DATE NOT NULL,
  `jns_mutasi_id` CHAR(36) NULL,
  `pengesahan` VARCHAR(255) NOT NULL DEFAULT '-',
  `keterangan` TEXT NULL,
  `arsip_path` VARCHAR(255) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  `processed_at` TIMESTAMP(0) NULL,
  `processed_by` BIGINT UNSIGNED NULL,
  `created_by` BIGINT UNSIGNED NULL,
  `is_deleted` BOOLEAN NOT NULL DEFAULT false,
  `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

  INDEX `ta_sk_kolektif_no_sk_idx`(`no_sk`),
  INDEX `ta_sk_kolektif_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `ta_sk_kolektif_pegawai` (
  `id` CHAR(36) NOT NULL,
  `sk_kolektif_id` CHAR(36) NOT NULL,
  `pegawai_id` CHAR(36) NOT NULL,
  `nip` VARCHAR(20) NOT NULL,
  `nama` VARCHAR(255) NULL,
  `jns_jab_id` CHAR(36) NULL,
  `unor_id` CHAR(36) NOT NULL,
  `nm_jab_id` CHAR(36) NULL,
  `eselon_id` CHAR(36) NULL,
  `rwt_jab_id` CHAR(36) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  `keterangan` TEXT NULL,
  `is_deleted` BOOLEAN NOT NULL DEFAULT false,
  `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

  INDEX `ta_sk_kolektif_pegawai_sk_kolektif_id_idx`(`sk_kolektif_id`),
  INDEX `ta_sk_kolektif_pegawai_pegawai_id_idx`(`pegawai_id`),
  INDEX `ta_sk_kolektif_pegawai_nip_idx`(`nip`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
