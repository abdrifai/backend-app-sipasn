/*
  Warnings:

  - You are about to drop the column `jenjangJab_id` on the `ref_jab` table. All the data in the column will be lost.
  - You are about to drop the column `jnsJab_id` on the `ref_jab` table. All the data in the column will be lost.
  - You are about to drop the column `nmJab` on the `ref_jab` table. All the data in the column will be lost.
  - Added the required column `nm_jab` to the `ref_jab` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ref_eselon` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ref_jab` DROP COLUMN `jenjangJab_id`,
    DROP COLUMN `jnsJab_id`,
    DROP COLUMN `nmJab`,
    ADD COLUMN `eselon_id` CHAR(36) NULL,
    ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `jenjang_jab_id` BIGINT UNSIGNED NULL,
    ADD COLUMN `jns_jab_id` CHAR(36) NULL,
    ADD COLUMN `nm_jab` VARCHAR(255) NOT NULL,
    MODIFY `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `ref_jenjangjab` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ref_jnsjab` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `ref_jab_eselon_id_idx` ON `ref_jab`(`eselon_id`);

-- CreateIndex
CREATE INDEX `ref_jab_jns_jab_id_idx` ON `ref_jab`(`jns_jab_id`);

-- CreateIndex
CREATE INDEX `ref_jab_jenjang_jab_id_idx` ON `ref_jab`(`jenjang_jab_id`);
