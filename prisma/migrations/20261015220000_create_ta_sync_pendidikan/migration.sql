-- CreateTable
CREATE TABLE `ta_sync_pendidikan` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `rwt_pend_id` CHAR(36) NOT NULL,
    `pend_id` CHAR(36) NOT NULL,
    `nip` VARCHAR(30) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `pend_lama` VARCHAR(255) NULL,
    `pend_baru` VARCHAR(255) NOT NULL,
    `tkt_pend_baru` VARCHAR(50) NULL,
    `thn_lulus` VARCHAR(10) NULL,
    `status_ijazah` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `batch_id` CHAR(36) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

    INDEX `ta_sync_pendidikan_pegawai_id_idx`(`pegawai_id`),
    INDEX `ta_sync_pendidikan_rwt_pend_id_idx`(`rwt_pend_id`),
    INDEX `ta_sync_pendidikan_pend_id_idx`(`pend_id`),
    INDEX `ta_sync_pendidikan_nip_idx`(`nip`),
    INDEX `ta_sync_pendidikan_status_ijazah_idx`(`status_ijazah`),
    INDEX `ta_sync_pendidikan_is_deleted_idx`(`is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
