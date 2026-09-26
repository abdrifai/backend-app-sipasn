-- AlterTable ta_mutasi_unor_pegawai
ALTER TABLE `ta_mutasi_unor_pegawai` 
  ADD COLUMN `old_nm_jab_id` CHAR(36) NULL,
  ADD COLUMN `new_nm_jab_id` CHAR(36) NULL,
  ADD INDEX `ta_mutasi_unor_pegawai_old_nm_jab_id_idx` (`old_nm_jab_id`),
  ADD INDEX `ta_mutasi_unor_pegawai_new_nm_jab_id_idx` (`new_nm_jab_id`);
