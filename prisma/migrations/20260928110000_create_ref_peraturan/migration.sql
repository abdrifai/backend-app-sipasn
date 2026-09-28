-- CreateTable
CREATE TABLE `ref_peraturan` (
    `id` CHAR(36) NOT NULL,
    `nomor_peraturan` VARCHAR(150) NOT NULL,
    `judul` TEXT NOT NULL,
    `kategori` VARCHAR(100) NOT NULL,
    `jenis_peraturan` VARCHAR(50) NOT NULL,
    `tahun` INT NOT NULL,
    `tgl_penetapan` DATE NULL,
    `tgl_berlaku` DATE NULL,
    `status_berlaku` VARCHAR(30) NOT NULL DEFAULT 'BERLAKU',
    `peraturan_terkait` VARCHAR(255) NULL,
    `tentang` TEXT NULL,
    `file_path` VARCHAR(500) NULL,
    `file_nama_asli` VARCHAR(255) NULL,
    `file_size` BIGINT UNSIGNED NULL,
    `keterangan` TEXT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

    INDEX `ref_peraturan_kategori_idx`(`kategori`),
    INDEX `ref_peraturan_jenis_peraturan_idx`(`jenis_peraturan`),
    INDEX `ref_peraturan_tahun_idx`(`tahun`),
    INDEX `ref_peraturan_status_berlaku_idx`(`status_berlaku`),
    INDEX `ref_peraturan_is_deleted_idx`(`is_deleted`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
