-- AlterTable
ALTER TABLE `ref_subunor` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ref_subunorsub` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ref_unor` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ref_unorinduk` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;
