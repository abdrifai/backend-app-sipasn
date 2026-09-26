-- AlterTable rwt_perubahan_data_induk
ALTER TABLE `rwt_perubahan_data_induk` 
  ADD COLUMN `file_sk` VARCHAR(255) NULL,
  ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
  ADD INDEX `rwt_perubahan_data_induk_pegawai_id_idx` (`pegawai_id`),
  ADD INDEX `rwt_perubahan_data_induk_kedudukanpns_id_idx` (`kedudukanpns_id`),
  ADD INDEX `rwt_perubahan_data_induk_jns_perubahan_id_idx` (`jns_perubahan_id`);
