-- AlterTable
ALTER TABLE `ref_jabatan` 
ADD COLUMN `kelompok_jabatan` VARCHAR(150) NULL,
ADD COLUMN `kategori_jf` VARCHAR(20) NULL,
ADD COLUMN `jenjang_jf` VARCHAR(50) NULL;

-- CreateIndex
CREATE INDEX `idx_ref_jabatan_kelompok` ON `ref_jabatan`(`kelompok_jabatan`);
CREATE INDEX `idx_ref_jabatan_kategori_jf` ON `ref_jabatan`(`kategori_jf`);
