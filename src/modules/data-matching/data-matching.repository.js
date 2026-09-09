import prisma from "../../config/database.js";

/**
 * Helper untuk membersihkan NIP dari tanda petik atau spasi
 */
export const cleanNip = (nip) => {
  if (!nip) return "";
  return String(nip).replace(/[^0-9]/g, "").trim();
};

/**
 * Ambil seluruh data referensi master untuk mapping nama/label
 */
export const getReferenceMaps = async () => {
  const [agamaList, kawinList, kedudukanList, tktPendList, unorList] = await Promise.all([
    prisma.ref_agama.findMany({ select: { id: true, agama: true } }),
    prisma.ref_kawin.findMany({ select: { id: true, kawin: true } }),
    prisma.ref_kedudukanpns.findMany({ select: { id: true, kedudukanpns: true } }),
    prisma.ref_tktpend.findMany({ select: { id: true, tktpend: true } }),
    prisma.ref_unitorganisasi.findMany({
      where: { is_deleted: false },
      select: { id: true, nmUnor: true, level: true, kode: true }
    })
  ]);

  const agamaMap = new Map(agamaList.map(a => [String(a.id), a.agama]));
  const kawinMap = new Map(kawinList.map(k => [String(k.id), k.kawin]));
  const kedudukanMap = new Map(kedudukanList.map(k => [String(k.id), k.kedudukanpns]));
  const tktPendMap = new Map(tktPendList.map(t => [String(t.id), t.tktpend]));
  const unorMap = new Map(unorList.map(u => [u.id, (u.nmUnor || '').trim()]));

  return { agamaMap, kawinMap, kedudukanMap, tktPendMap, unorMap };
};

/**
 * Ambil seluruh pegawai lokal aktif beserta relasinya dengan select eksplisit
 */
export const findAllLocalPegawai = async () => {
  return prisma.ta_pegawai.findMany({
    where: {
      kedudukanPns_id: { in: [1, 7, 8, 10] },
    },
    select: {
      id: true,
      nipBaru: true,
      nipLama: true,
      nik: true,
      kedudukanPns_id: true,
      ta_orang: {
        select: {
          id: true,
          nama: true,
          t4Lhr: true,
          tglLhr: true,
          jkl_id: true,
          agama_id: true,
          kawin_id: true,
          alamat: true,
          no_hp: true,
          email: true,
          npwp: true,
        }
      },
      rwt_gol: {
        select: {
          id: true,
          gol_id: true,
          tmtSk: true,
          ref_gol: {
            select: {
              gol: true,
              pangkat: true,
            }
          }
        }
      },
      rwt_jabatan: {
        select: {
          id: true,
          tmtSk: true,
          nmJab_id: true,
          unorInduk_id: true,
          unor_id: true,
          subUnor_id: true,
          subUnorSub_id: true,
          ref_jabatan: {
            select: {
              id: true,
              nama_jabatan: true,
              eselon_id: true,
              jns_jab_id: true,
            }
          },
          ref_unitorganisasi: {
            select: {
              id: true,
              nmUnor: true,
            }
          }
        }
      },
      rwt_pend: {
        select: {
          id: true,
          tktPend_id: true,
          thnLulus: true,
          jurusan: true,
          nmSekolah: true,
          gd: true,
          gb: true,
        }
      }
    }
  });
};

/**
 * Ambil seluruh data import SIASN BKN yang aktif (is_deleted: false)
 */
export const findAllImportPns = async () => {
  return prisma.ta_import_pns.findMany({
    where: {
      is_deleted: false,
    },
    select: {
      id: true,
      batch_id: true,
      file_name: true,
      pns_id: true,
      nip_baru: true,
      nip_lama: true,
      nama: true,
      gelar_depan: true,
      gelar_belakang: true,
      tempat_lahir: true,
      tanggal_lahir: true,
      jenis_kelamin: true,
      agama_id: true,
      agama_nama: true,
      jenis_kawin_id: true,
      jenis_kawin_nama: true,
      nik: true,
      nomor_hp: true,
      email: true,
      alamat: true,
      npwp_nomor: true,
      bpjs: true,
      kedudukan_pns_id: true,
      kedudukan_pns_nama: true,
      status_cpns_pns: true,
      tmt_cpns: true,
      tmt_pns: true,
      gol_awal_nama: true,
      gol_akhir_id: true,
      gol_akhir_nama: true,
      tmt_golongan: true,
      mk_tahun: true,
      mk_bulan: true,
      jenis_jabatan_id: true,
      jenis_jabatan_nama: true,
      jabatan_id: true,
      jabatan_nama: true,
      tmt_jabatan: true,
      tingkat_pendidikan_nama: true,
      pendidikan_nama: true,
      tahun_lulus: true,
      unor_id: true,
      unor_nama: true,
      instansi_induk_nama: true,
      satuan_kerja_induk_nama: true,
      eselon_nama: true,
      created_at: true,
      updated_at: true,
    }
  });
};

/**
 * Cari satu data pegawai lokal berdasarkan NIP
 */
export const findLocalPegawaiByNip = async (nip) => {
  const clean = cleanNip(nip);
  return prisma.ta_pegawai.findFirst({
    where: {
      nipBaru: clean,
    },
    select: {
      id: true,
      nipBaru: true,
      nipLama: true,
      nik: true,
      kedudukanPns_id: true,
      ta_orang: {
        select: {
          id: true,
          nama: true,
          t4Lhr: true,
          tglLhr: true,
          jkl_id: true,
          agama_id: true,
          kawin_id: true,
          alamat: true,
          no_hp: true,
          email: true,
          npwp: true,
        }
      },
      rwt_gol: {
        select: {
          id: true,
          gol_id: true,
          tmtSk: true,
          ref_gol: {
            select: {
              gol: true,
              pangkat: true,
            }
          }
        }
      },
      rwt_jabatan: {
        select: {
          id: true,
          sk: true,
          tglSk: true,
          tmtSk: true,
          nmJab_id: true,
          unorInduk_id: true,
          unor_id: true,
          subUnor_id: true,
          subUnorSub_id: true,
          pengesahan: true,
          ref_jabatan: {
            select: {
              id: true,
              nama_jabatan: true,
              eselon_id: true,
              jns_jab_id: true,
            }
          },
          ref_unitorganisasi: {
            select: {
              id: true,
              nmUnor: true,
            }
          }
        }
      },
      rwt_pend: {
        select: {
          id: true,
          tktPend_id: true,
          thnLulus: true,
          jurusan: true,
          nmSekolah: true,
          gd: true,
          gb: true,
          noIjazah: true,
          tglIjazah: true,
        }
      }
    }
  });
};

/**
 * Cari satu data SIASN berdasarkan NIP
 */
export const findImportPnsByNip = async (nip) => {
  const clean = cleanNip(nip);
  return prisma.ta_import_pns.findFirst({
    where: {
      is_deleted: false,
      OR: [
        { nip_baru: clean },
        { nip_baru: `'${clean}` }
      ]
    },
    select: {
      id: true,
      batch_id: true,
      file_name: true,
      pns_id: true,
      nip_baru: true,
      nip_lama: true,
      nama: true,
      gelar_depan: true,
      gelar_belakang: true,
      tempat_lahir: true,
      tanggal_lahir: true,
      jenis_kelamin: true,
      agama_id: true,
      agama_nama: true,
      jenis_kawin_id: true,
      jenis_kawin_nama: true,
      nik: true,
      nomor_hp: true,
      email: true,
      alamat: true,
      npwp_nomor: true,
      bpjs: true,
      kedudukan_pns_id: true,
      kedudukan_pns_nama: true,
      status_cpns_pns: true,
      nomor_sk_cpns: true,
      tanggal_sk_cpns: true,
      tmt_cpns: true,
      nomor_sk_pns: true,
      tanggal_sk_pns: true,
      tmt_pns: true,
      gol_awal_nama: true,
      gol_akhir_id: true,
      gol_akhir_nama: true,
      tmt_golongan: true,
      mk_tahun: true,
      mk_bulan: true,
      jenis_jabatan_id: true,
      jenis_jabatan_nama: true,
      jabatan_id: true,
      jabatan_nama: true,
      tmt_jabatan: true,
      tingkat_pendidikan_nama: true,
      pendidikan_nama: true,
      tahun_lulus: true,
      unor_id: true,
      unor_nama: true,
      instansi_induk_nama: true,
      satuan_kerja_induk_nama: true,
      eselon_nama: true,
      created_at: true,
      updated_at: true,
    }
  });
};
