-- CreateTable
CREATE TABLE `ta_rekap_snapshot` (
    `id` CHAR(36) NOT NULL,
    `period` VARCHAR(7) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `data` JSON NOT NULL,
    `unor_id` CHAR(36) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uniq_snapshot_period_type_unor`(`period`, `type`, `unor_id`),
    INDEX `ta_rekap_snapshot_period_idx`(`period`),
    INDEX `ta_rekap_snapshot_type_idx`(`type`),
    INDEX `ta_rekap_snapshot_unor_id_idx`(`unor_id`),
    INDEX `ta_rekap_snapshot_is_deleted_idx`(`is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
