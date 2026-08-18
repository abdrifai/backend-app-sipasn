-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(255) NOT NULL,
    `nik` VARCHAR(255) NULL,
    `nama_lengkap` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `email_verified_at` TIMESTAMP(0) NULL,
    `password` VARCHAR(255) NOT NULL,
    `remember_token` VARCHAR(100) NULL,
    `current_team_id` BIGINT UNSIGNED NULL,
    `profile_photo_path` TEXT NULL,
    `unorinduk_id` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `status_edit` TINYINT NULL,
    `is_deleted` BOOLEAN NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `migrations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `migration` VARCHAR(255) NOT NULL,
    `batch` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_has_roles` (
    `role_id` BIGINT UNSIGNED NOT NULL,
    `model_type` VARCHAR(255) NOT NULL,
    `model_id` BIGINT UNSIGNED NOT NULL,
    `is_deleted` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `model_has_roles_model_id_model_type_index`(`model_id`, `model_type`),
    PRIMARY KEY (`role_id`, `model_id`, `model_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mysapk_aktivasi` (
    `NIP` BIGINT NULL,
    `NAMA` VARCHAR(36) NULL,
    `INSTANSI` VARCHAR(28) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `guard_name` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_agama` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `agama` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_eselon` (
    `id` CHAR(36) NOT NULL,
    `kode` VARCHAR(255) NOT NULL,
    `eselon` VARCHAR(10) NOT NULL,
    `eselon_kode` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_gol` (
    `kdGol` VARCHAR(2) NOT NULL,
    `gol` VARCHAR(5) NOT NULL,
    `pangkat` VARCHAR(25) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`kdGol`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_hidup` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `hidup` VARCHAR(10) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_hukdis` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `tktHukuman_id` CHAR(36) NOT NULL,
    `jnsHukuman_id` CHAR(36) NOT NULL,
    `gol_id` INTEGER NOT NULL,
    `sk` VARCHAR(255) NOT NULL,
    `tglSk` DATE NOT NULL,
    `tmtHD` DATE NOT NULL,
    `hukumanThn` CHAR(3) NOT NULL,
    `hukumanBln` CHAR(3) NOT NULL,
    `akhirHukuman` DATE NOT NULL,
    `noPP` VARCHAR(255) NOT NULL,
    `alasan` TEXT NOT NULL,
    `ket` TEXT NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_instansi` (
    `id` CHAR(36) NOT NULL,
    `kode` INTEGER NOT NULL,
    `instansi` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jab` (
    `id` CHAR(36) NOT NULL,
    `jnsJab_id` INTEGER NOT NULL,
    `jenjangJab_id` INTEGER NOT NULL,
    `nmJab` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jab_nonasn` (
    `id` CHAR(36) NOT NULL,
    `nm_jab` VARCHAR(200) NOT NULL,
    `kelompok` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jkl` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `jkl` VARCHAR(10) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jns_profesi` (
    `id` CHAR(36) NOT NULL,
    `jns_profesi` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jnskp` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `jnskp` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_kawin` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `kawin` VARCHAR(20) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_pend` (
    `id` CHAR(36) NOT NULL,
    `tktpend_id` CHAR(36) NOT NULL,
    `pend` VARCHAR(255) NOT NULL,
    `kode` VARCHAR(255) NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_penghargaan` (
    `id` CHAR(36) NOT NULL,
    `jnsPenghargaan_id` CHAR(36) NOT NULL,
    `penghargaan` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_perubahan_data_induk` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `jns_perubahan` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_pindah_instansi` (
    `id` CHAR(36) NOT NULL,
    `kode` INTEGER NULL,
    `jnsPi` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_spns` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `spns` VARCHAR(10) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_unor` (
    `id` CHAR(36) NOT NULL,
    `kode` VARCHAR(255) NOT NULL,
    `unorinduk_id` CHAR(36) NOT NULL,
    `unorinduk_kode` VARCHAR(255) NOT NULL,
    `nmUnor` VARCHAR(255) NOT NULL,
    `jab_id` CHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_has_permissions` (
    `permission_id` BIGINT UNSIGNED NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,

    INDEX `role_has_permissions_role_id_foreign`(`role_id`),
    PRIMARY KEY (`permission_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `guard_name` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `is_deleted` BOOLEAN NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_penghargaan` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `jnsPenghargaan_id` CHAR(36) NOT NULL,
    `penghargaan_id` CHAR(36) NOT NULL,
    `nomor` VARCHAR(255) NOT NULL,
    `tanggal` DATE NOT NULL,
    `ket` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_perubahan_data_induk` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `jns_perubahan_id` INTEGER NOT NULL,
    `kedudukanpns_id` INTEGER NULL,
    `sk` VARCHAR(255) NOT NULL,
    `tglSk` DATE NOT NULL,
    `tmtSk` DATE NOT NULL,
    `pengesahan` VARCHAR(255) NOT NULL,
    `ket` TEXT NOT NULL,
    `user_create` INTEGER NULL,
    `user_update` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_pindah_instansi` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `sk` VARCHAR(255) NOT NULL,
    `tglsk` DATE NOT NULL,
    `tmtsk` DATE NOT NULL,
    `jnsPI` CHAR(36) NOT NULL,
    `pengesahan` VARCHAR(255) NOT NULL,
    `jnsJab_lama` CHAR(36) NOT NULL,
    `rumpunaJab_lama` CHAR(36) NOT NULL,
    `jab_lama` CHAR(36) NOT NULL,
    `instansi_lama` CHAR(36) NOT NULL,
    `jnsunor_lama` CHAR(36) NOT NULL,
    `unorinduk_lama` CHAR(36) NOT NULL,
    `unor_lama` CHAR(36) NOT NULL,
    `subunor_lama` CHAR(36) NOT NULL,
    `subunorsub_lama` CHAR(36) NOT NULL,
    `jnsJab_baru` CHAR(36) NOT NULL,
    `rumpunaJab_baru` CHAR(36) NOT NULL,
    `jab_baru` CHAR(36) NOT NULL,
    `instansi_baru` CHAR(36) NOT NULL,
    `jnsunor_baru` CHAR(36) NOT NULL,
    `unorinduk_baru` CHAR(36) NOT NULL,
    `unor_baru` CHAR(36) NOT NULL,
    `subunor_baru` CHAR(36) NOT NULL,
    `subunorsub_baru` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_profesi` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `jns_profesi_id` CHAR(36) NOT NULL,
    `no_sertifikat` VARCHAR(200) NOT NULL,
    `ket` VARCHAR(255) NOT NULL,
    `tgl_lulus` DATE NOT NULL,
    `berlaku` VARCHAR(5) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_anak` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `ortu_id` CHAR(36) NOT NULL,
    `sAnak` VARCHAR(255) NOT NULL,
    `orang_id` CHAR(255) NOT NULL,
    `pns` BOOLEAN NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_diklat` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(255) NOT NULL,
    `nipBaru` VARCHAR(18) NOT NULL,
    `jnsDiklat_id` CHAR(36) NULL,
    `jenjangDiklat_id` CHAR(36) NULL,
    `noSertifikat` VARCHAR(255) NULL,
    `tglSertifikat` DATE NULL,
    `nmDiklat` VARCHAR(255) NULL,
    `penyelenggara` VARCHAR(255) NULL,
    `angkatan` VARCHAR(255) NULL,
    `t4pelaksanaan` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `user_created` INTEGER NULL,
    `user_updated` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_gol` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `gol_id` CHAR(2) NOT NULL,
    `sk` VARCHAR(255) NULL,
    `tglSk` DATE NOT NULL,
    `tmtSk` DATE NOT NULL,
    `maskerThn` VARCHAR(255) NULL,
    `maskerBln` VARCHAR(255) NULL,
    `pertekBkn` VARCHAR(255) NULL,
    `tglPertek` DATE NULL,
    `jnsKp_id` INTEGER NULL,
    `gapok` INTEGER NULL,
    `pengesahan` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `user_created` INTEGER NULL,
    `user_updated` INTEGER NULL,

    INDEX `pegawai_id`(`pegawai_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_hukdis` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `tktHukuman_id` CHAR(36) NOT NULL,
    `jnsHukuman_id` CHAR(36) NOT NULL,
    `skHd` VARCHAR(255) NOT NULL,
    `tglSkHd` DATE NOT NULL,
    `tmtSkHd` DATE NOT NULL,
    `masaHukumanThn` CHAR(2) NOT NULL,
    `masaHukumanBln` CHAR(2) NOT NULL,
    `tglAkhirHukuman` DATE NOT NULL,
    `gol_id` INTEGER NOT NULL,
    `noPP` VARCHAR(255) NOT NULL,
    `alasanHukuman` TEXT NOT NULL,
    `ket` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_jabatan` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `nipBaru` VARCHAR(19) NOT NULL,
    `sk` VARCHAR(255) NULL,
    `tglSk` DATE NOT NULL,
    `tmtSk` DATE NOT NULL,
    `jnsMutasi_id` CHAR(36) NULL,
    `jnsMutasi_kode` VARCHAR(255) NULL,
    `instansi_id` CHAR(36) NOT NULL,
    `instansi_kode` VARCHAR(255) NULL,
    `jnsUnor_id` CHAR(36) NOT NULL,
    `jnsUnor_kode` VARCHAR(255) NULL,
    `unorInduk_id` CHAR(36) NOT NULL,
    `unorInduk_kode` VARCHAR(255) NULL,
    `unor_id` CHAR(36) NULL,
    `unor_kode` VARCHAR(255) NULL,
    `subUnor_id` CHAR(36) NULL,
    `subUnor_kode` VARCHAR(255) NULL,
    `subUnorSub_id` CHAR(255) NULL,
    `subUnorSub_kode` VARCHAR(255) NULL,
    `jnsJab_id` CHAR(36) NULL,
    `jnsJab_kode` VARCHAR(255) NULL,
    `rumpunJab_id` CHAR(36) NULL,
    `rumpunJab_kode` VARCHAR(255) NULL,
    `nmJab_id` CHAR(36) NULL,
    `nmJab_kode` VARCHAR(255) NULL,
    `eselon_id` CHAR(36) NULL,
    `eselon_kode` VARCHAR(255) NULL,
    `jnsKepegawaian_id` CHAR(36) NULL,
    `jnsKepegawaian_kode` VARCHAR(255) NULL,
    `pengesahan` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `user_created` INTEGER NULL,
    `user_updated` INTEGER NULL,

    INDEX `pegawai_id`(`pegawai_id`),
    INDEX `unorInduk_id`(`unorInduk_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_kgb` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `nipBaru` VARCHAR(18) NOT NULL,
    `sk` VARCHAR(255) NULL,
    `tglSk` DATE NOT NULL,
    `tmtSk` DATE NULL,
    `gol_id` VARCHAR(255) NULL,
    `maskerThn` CHAR(2) NULL,
    `maskerBln` CHAR(2) NULL,
    `gapok` INTEGER NULL,
    `pengesahan` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `user_created` INTEGER NULL,
    `user_updated` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_ortu` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `hubungan` VARCHAR(255) NOT NULL,
    `orang_id` CHAR(36) NOT NULL,
    `pns` BOOLEAN NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_pend` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `nipBaru` VARCHAR(19) NOT NULL,
    `tktPend_id` INTEGER NOT NULL,
    `pend_id` CHAR(36) NOT NULL,
    `noIjazah` VARCHAR(255) NULL,
    `tglIjazah` DATE NULL,
    `thnLulus` VARCHAR(255) NULL,
    `nmSekolah` VARCHAR(255) NULL,
    `jurusan` VARCHAR(255) NULL,
    `gd` VARCHAR(10) NULL,
    `gb` VARCHAR(20) NULL,
    `pengesahan` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `user_created` INTEGER NULL,
    `user_updated` INTEGER NULL,

    INDEX `pegawai_id`(`pegawai_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_skp` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `jnsjab_id` CHAR(36) NOT NULL,
    `atasan_pj_penilai_id` CHAR(36) NULL,
    `pj_penilai_id` CHAR(36) NULL,
    `tahun` INTEGER NOT NULL,
    `nilai_skp` DOUBLE NOT NULL,
    `op` DOUBLE NOT NULL,
    `integritas` DOUBLE NOT NULL,
    `komitmen` DOUBLE NOT NULL,
    `disiplin` DOUBLE NOT NULL,
    `kerjasama` DOUBLE NOT NULL,
    `kepemimpinan` DOUBLE NOT NULL,
    `nilai_prestasi` DOUBLE NOT NULL,
    `sebutan_prestasi` VARCHAR(255) NOT NULL,
    `user_create` BIGINT NULL,
    `user_update` BIGINT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `pp_kinerja` VARCHAR(200) NOT NULL,
    `inisiatif_kerja` DOUBLE NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `payload` TEXT NOT NULL,
    `last_activity` INTEGER NOT NULL,

    INDEX `sessions_last_activity_index`(`last_activity`),
    INDEX `sessions_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ta_arsip` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `from` CHAR(36) NOT NULL,
    `jnsarsip_id` INTEGER NOT NULL,
    `arsip` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `cek` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ta_arsip_keluarga` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `from` VARCHAR(255) NOT NULL,
    `jns_arsip` VARCHAR(255) NOT NULL,
    `arsip` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ta_orang` (
    `id` CHAR(36) NOT NULL,
    `nik` VARCHAR(19) NULL,
    `kk` VARCHAR(25) NULL,
    `npwp` VARCHAR(25) NULL,
    `nama` VARCHAR(200) NOT NULL,
    `t4Lhr` VARCHAR(200) NOT NULL,
    `tglLhr` DATE NOT NULL,
    `jkl_id` CHAR(36) NOT NULL,
    `agama_id` CHAR(36) NULL,
    `kawin_id` CHAR(36) NULL,
    `golDarah` VARCHAR(2) NULL,
    `alamat` VARCHAR(255) NULL,
    `foto` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `hidup_id` CHAR(36) NULL,
    `email` VARCHAR(200) NULL,
    `no_hp` VARCHAR(15) NULL,
    `akte_kelahiran` VARCHAR(200) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ta_pegawai` (
    `id` CHAR(36) NOT NULL,
    `orang_id` CHAR(36) NOT NULL,
    `nik` VARCHAR(19) NULL,
    `nipBaru` VARCHAR(18) NOT NULL,
    `nipLama` VARCHAR(9) NULL,
    `kedudukanPns_id` INTEGER NULL,
    `spns_id` INTEGER NULL,
    `karpeg` VARCHAR(100) NULL,
    `taspen` VARCHAR(100) NULL,
    `bpjs` VARCHAR(100) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `rwtJab_id` CHAR(36) NULL,
    `rwtGol_id` CHAR(36) NULL,
    `rwtPend_id` CHAR(36) NULL,
    `rwtDiklat_id` CHAR(36) NULL,
    `spmt` VARCHAR(100) NULL,
    `pns_id_sapk` CHAR(36) NULL,

    UNIQUE INDEX `ta_pegawai_orang_id_key`(`orang_id`),
    UNIQUE INDEX `ta_pegawai_rwtJab_id_key`(`rwtJab_id`),
    UNIQUE INDEX `ta_pegawai_rwtGol_id_key`(`rwtGol_id`),
    UNIQUE INDEX `ta_pegawai_rwtPend_id_key`(`rwtPend_id`),
    UNIQUE INDEX `ta_pegawai_rwtDiklat_id_key`(`rwtDiklat_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ta_sinkron_sapk` (
    `id` CHAR(36) NOT NULL,
    `pns_id_sapk` CHAR(36) NOT NULL,
    `nip` CHAR(36) NOT NULL,
    `nama` BOOLEAN NOT NULL,
    `tgl_lhr` BOOLEAN NOT NULL,
    `gol` BOOLEAN NOT NULL,
    `jab` BOOLEAN NOT NULL,
    `unorinduk` BOOLEAN NOT NULL,
    `unor` BOOLEAN NOT NULL,
    `status` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jabfungsional` (
    `id` CHAR(36) NOT NULL,
    `jenjangJab_id` CHAR(36) NOT NULL,
    `nmJab` VARCHAR(255) NOT NULL,
    `ket` TEXT NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `kelompok` ENUM('Teknis', 'Kesehatan', 'Guru', '') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jabpelaksana` (
    `id` CHAR(36) NOT NULL,
    `urusan_id` INTEGER NOT NULL,
    `suburusan_id` INTEGER NOT NULL,
    `nmJab` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jabpelaksana_suburusan` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `urusan_id` INTEGER NOT NULL,
    `suburusan` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jabpelaksana_urusan` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `urusan` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jenjangdiklat` (
    `id` CHAR(36) NOT NULL,
    `jnsDiklat_id` CHAR(36) NOT NULL,
    `kode` VARCHAR(5) NOT NULL,
    `jenjangDiklat` VARCHAR(255) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jenjangjab` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `jnsjab_id` INTEGER NOT NULL,
    `jenjangjab` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jnsdiklat` (
    `id` CHAR(36) NOT NULL,
    `kode` VARCHAR(5) NOT NULL,
    `jnsDiklat` VARCHAR(255) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jnshukuman` (
    `id` CHAR(36) NOT NULL,
    `kode` INTEGER NOT NULL,
    `tktHukuman_id` CHAR(36) NOT NULL,
    `jnsHukuman` VARCHAR(255) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `ref_jnshukuman_kode_unique`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jnsjab` (
    `id` CHAR(36) NOT NULL,
    `kode` VARCHAR(10) NOT NULL,
    `jnsjab` VARCHAR(255) NOT NULL,
    `kode_sapk` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jnskepegawaian` (
    `id` CHAR(36) NOT NULL,
    `kode` VARCHAR(255) NOT NULL,
    `jnskepegawaian` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jnsmutasi` (
    `id` CHAR(36) NOT NULL,
    `kode` INTEGER NOT NULL,
    `jnsMutasi` VARCHAR(255) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jnspenghargaan` (
    `id` CHAR(36) NOT NULL,
    `jnsPenghargaan` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jnsrumpunjab` (
    `id` CHAR(36) NOT NULL,
    `kode` VARCHAR(255) NOT NULL,
    `jnsRumpunJab` VARCHAR(255) NOT NULL,
    `rumpunJab_id` CHAR(36) NOT NULL,
    `rumpunJab_kode` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_jnsunor` (
    `id` CHAR(36) NOT NULL,
    `instansi_id` CHAR(36) NOT NULL,
    `kode` INTEGER NOT NULL,
    `jnsunor` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_kedudukanpns` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `kedudukanpns` VARCHAR(255) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_nmjabsimpeglama` (
    `id` CHAR(36) NOT NULL,
    `kode` VARCHAR(255) NULL,
    `nmJab` VARCHAR(255) NOT NULL,
    `jnsRumpunJab_id` CHAR(36) NOT NULL,
    `jnsRumpunJab_kode` VARCHAR(255) NULL,
    `rumpunJab_id` CHAR(36) NULL,
    `eselon_id` CHAR(36) NOT NULL,
    `eselon_kode` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_rumpunjab` (
    `id` CHAR(36) NOT NULL,
    `kode` VARCHAR(10) NULL,
    `rumpunJab` VARCHAR(255) NOT NULL,
    `jnsJab_id` CHAR(36) NOT NULL,
    `jnsJab_kode` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_subunor` (
    `id` CHAR(36) NOT NULL,
    `kode` VARCHAR(255) NOT NULL,
    `unor_id` CHAR(36) NOT NULL,
    `unor_kode` VARCHAR(255) NOT NULL,
    `nmUnor` VARCHAR(255) NOT NULL,
    `jab_id` CHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_subunorsub` (
    `id` CHAR(36) NOT NULL,
    `kode` VARCHAR(255) NOT NULL,
    `subUnor_id` CHAR(36) NOT NULL,
    `subUnor_kode` VARCHAR(255) NOT NULL,
    `nmUnor` VARCHAR(255) NOT NULL,
    `jab_id` CHAR(36) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_tkthukuman` (
    `id` CHAR(36) NOT NULL,
    `kode` INTEGER NOT NULL,
    `tktHukuman` VARCHAR(255) NOT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `ref_tkthukuman_kode_unique`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_tktpend` (
    `id` CHAR(36) NOT NULL,
    `tktpend` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_unorinduk` (
    `id` CHAR(36) NOT NULL,
    `kode` VARCHAR(255) NOT NULL,
    `nmUnor` VARCHAR(255) NOT NULL,
    `jab_id` CHAR(36) NULL,
    `jnsUnor_id` CHAR(36) NOT NULL,
    `jnsUnor_kode` VARCHAR(255) NOT NULL,
    `peraturan` VARCHAR(255) NULL,
    `tglPeraturan` DATE NULL,
    `tahun` INTEGER NULL,
    `ket` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `isAktif` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rwt_suis` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `hubungan` VARCHAR(255) NOT NULL,
    `orang_id` CHAR(255) NOT NULL,
    `pns` BOOLEAN NULL,
    `aktaMenikah` VARCHAR(255) NULL,
    `tglMenikah` DATE NULL,
    `aktaMeninggal` VARCHAR(255) NULL,
    `tglMeninggal` DATE NULL,
    `aktaCerai` VARCHAR(255) NULL,
    `tglCerai` DATE NULL,
    `karisKarsu` VARCHAR(200) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ta_arsipskp` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `rwtskp_id` CHAR(36) NOT NULL,
    `arsip` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ta_cpnspns` (
    `id` CHAR(36) NOT NULL,
    `pegawai_id` CHAR(36) NOT NULL,
    `sk` VARCHAR(255) NULL,
    `tglsk` DATE NULL,
    `tmtsk` DATE NULL,
    `gol_id` INTEGER NULL,
    `maskerThn` CHAR(2) NULL,
    `maskerBln` CHAR(2) NULL,
    `pertekBkn` VARCHAR(255) NULL,
    `tglPertekBkn` DATE NULL,
    `sttpl` VARCHAR(255) NULL,
    `tglsttpl` DATE NULL,
    `spns_id` VARCHAR(255) NOT NULL,
    `noKarpeg` VARCHAR(255) NULL,
    `tglKarpeg` DATE NULL,
    `penanda_tangan` VARCHAR(200) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ta_nonasn` (
    `id` CHAR(36) NOT NULL,
    `orang_id` CHAR(36) NOT NULL,
    `jab_id` CHAR(36) NOT NULL,
    `masker_thn` CHAR(2) NOT NULL,
    `masker_bln` CHAR(2) NOT NULL,
    `unorinduk_id` CHAR(36) NOT NULL,
    `unor_id` CHAR(36) NOT NULL,
    `subunor_id` CHAR(36) NOT NULL,
    `subunorsub_id` CHAR(36) NOT NULL,
    `pend_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `orang_id`(`orang_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

