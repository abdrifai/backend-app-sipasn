-- AlterTable
ALTER TABLE `ref_instansi` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `ref_unorinduk` ADD COLUMN `instansi_id` CHAR(36) NULL,
    ADD COLUMN `instansi_kode` VARCHAR(255) NULL;
