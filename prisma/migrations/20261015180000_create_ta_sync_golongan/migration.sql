-- CreateTable
CREATE TABLE `ta_sync_golongan` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `rwt_gol_id` CHAR(36) NOT NULL,
    `nip` VARCHAR(30) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `gol_lama` VARCHAR(10) NULL,
    `gol_baru` VARCHAR(10) NOT NULL,
    `kd_gol_baru` VARCHAR(2) NOT NULL,
    `tmt_golongan` DATE NOT NULL,
    `status_sk` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `batch_id` CHAR(36) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

    INDEX `ta_sync_golongan_pegawai_id_idx`(`pegawai_id`),
    INDEX `ta_sync_golongan_rwt_gol_id_idx`(`rwt_gol_id`),
    INDEX `ta_sync_golongan_nip_idx`(`nip`),
    INDEX `ta_sync_golongan_status_sk_idx`(`status_sk`),
    INDEX `ta_sync_golongan_is_deleted_idx`(`is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
