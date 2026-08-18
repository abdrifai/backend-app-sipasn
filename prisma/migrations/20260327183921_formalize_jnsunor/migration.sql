-- AlterTable
ALTER TABLE `ref_jnsunor` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    ADD PRIMARY KEY (`id`);
