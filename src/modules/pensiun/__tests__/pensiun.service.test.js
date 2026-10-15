import { jest } from "@jest/globals";

const mockPrisma = {
  ref_kedudukanpns: {
    findMany: jest.fn(),
  },
  rwt_perubahan_data_induk: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  ta_pegawai: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  ta_arsip: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
  $queryRaw: jest.fn(),
};

jest.unstable_mockModule("../../../config/database.js", () => ({
  default: mockPrisma,
}));

describe("pensiun.service", () => {
  let pensiunService;
  let AppError;

  beforeAll(async () => {
    pensiunService = await import("../pensiun.service.js");
    AppError = (await import("../../../utils/AppError.js")).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getKedudukanPensiunOptions", () => {
    it("harus mengembalikan daftar kedudukan pensiun", async () => {
      const mockOptions = [
        { id: 2, kedudukanpns: "PENSIUN MASA WAKTU" },
        { id: 3, kedudukanpns: "JANDA / DUDA" },
      ];
      mockPrisma.ref_kedudukanpns.findMany.mockResolvedValue(mockOptions);

      const result = await pensiunService.getKedudukanPensiunOptions();

      expect(mockPrisma.ref_kedudukanpns.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ is_deleted: false }),
        })
      );
      expect(result).toEqual(mockOptions);
    });
  });

  describe("getAllPensiun", () => {
    it("harus mengembalikan list riwayat pensiun dari rwt_perubahan_data_induk", async () => {
      const mockRawPensiun = [
        {
          id: "pensiun-1",
          pegawai_id: "fc0ecbb0-8edf-42e6-8373-cc9e5e3b118b",
          kedudukanpns_id: 2,
          sk: "800/123/2026",
          tglSk: new Date("2026-01-01"),
          tmtSk: new Date("2026-02-01"),
          pengesahan: "BUPATI TOJO UNA-UNA",
          file_sk: null,
          ket: "Pensiun BUP",
          created_at: new Date("2026-01-01"),
        },
      ];

      const mockPegawaiList = [
        {
          id: "fc0ecbb0-8edf-42e6-8373-cc9e5e3b118b",
          nipBaru: "197001011995031001",
          ta_orang: {
            nama: "Budi Santoso",
            foto: "/uploads/foto/budi.jpg",
          },
          rwt_jabatan: {
            ref_jabatan: {
              nama_jabatan: "Analis Kepegawaian",
              ref_jnsjab: {
                jnsjab: "Fungsional",
              },
            },
            ref_unitorganisasi: {
              nmUnor: "BKPSDM",
            },
          },
        },
      ];

      const mockKedudukanList = [
        { id: 2, kedudukanpns: "PENSIUN MASA WAKTU" },
      ];

      mockPrisma.rwt_perubahan_data_induk.findMany.mockResolvedValue(mockRawPensiun);
      mockPrisma.rwt_perubahan_data_induk.count.mockResolvedValue(1);
      mockPrisma.ta_pegawai.findMany.mockResolvedValue(mockPegawaiList);
      mockPrisma.ref_kedudukanpns.findMany.mockResolvedValue(mockKedudukanList);
      mockPrisma.ta_arsip.findMany.mockResolvedValue([]);

      const result = await pensiunService.getAllPensiun({ page: 1, limit: 10 });

      expect(mockPrisma.ta_pegawai.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: ["fc0ecbb0-8edf-42e6-8373-cc9e5e3b118b"] } },
        })
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].no_sk).toBe("800/123/2026");
      expect(result.data[0].pegawai).toEqual({
        id: "fc0ecbb0-8edf-42e6-8373-cc9e5e3b118b",
        nipBaru: "197001011995031001",
        nama: "Budi Santoso",
        foto: "/uploads/foto/budi.jpg",
        jabatan: "Analis Kepegawaian",
        unor: "BKPSDM",
      });
      expect(result.data[0].nama_kedudukan).toBe("PENSIUN MASA WAKTU");
      expect(result.meta.total).toBe(1);
    });

    it("harus fallback ke ref_jnsjab jika nama_jabatan tidak ada", async () => {
      const mockRawPensiun = [
        {
          id: "pensiun-2",
          pegawai_id: "pegawai-2",
          kedudukanpns_id: 3,
          sk: "SK/002",
          tglSk: null,
          tmtSk: null,
        },
      ];

      const mockPegawaiList = [
        {
          id: "pegawai-2",
          nipBaru: "198001012000031002",
          ta_orang: { nama: "Siti Aminah", foto: null },
          rwt_jabatan: {
            ref_jabatan: {
              nama_jabatan: null,
              ref_jnsjab: { jnsjab: "Pelaksana" },
            },
            ref_unitorganisasi: { nmUnor: "Inspektorat" },
          },
        },
      ];

      mockPrisma.rwt_perubahan_data_induk.findMany.mockResolvedValue(mockRawPensiun);
      mockPrisma.rwt_perubahan_data_induk.count.mockResolvedValue(1);
      mockPrisma.ta_pegawai.findMany.mockResolvedValue(mockPegawaiList);
      mockPrisma.ref_kedudukanpns.findMany.mockResolvedValue([]);
      mockPrisma.ta_arsip.findMany.mockResolvedValue([]);

      const result = await pensiunService.getAllPensiun({});

      expect(result.data[0].pegawai.jabatan).toBe("Pelaksana");
      expect(result.data[0].nama_kedudukan).toBe("PEMBERHENTIAN");
    });

    it("harus mengambil arsip dari ta_arsip jika file_sk pada rwt_perubahan_data_induk bernilai null", async () => {
      const mockRawPensiun = [
        {
          id: "6b4aaf07-52d0-4a64-90d7-d1ad70e9c913",
          pegawai_id: "5d311a45-e98b-455a-bba3-c42883a41629",
          kedudukanpns_id: 3,
          sk: "800.1.6.6/139.4/BKPSDMD-B.TU/2023",
          tglSk: new Date("2023-01-01"),
          tmtSk: new Date("2022-08-01"),
          pengesahan: "BUPATI TOJO UNA-UNA",
          file_sk: null,
          ket: "Pengabdian, Pemberhentian dan Pemberian Pensiun Janda/Duda",
          created_at: new Date("2023-01-01"),
        },
      ];

      mockPrisma.rwt_perubahan_data_induk.findMany.mockResolvedValue(mockRawPensiun);
      mockPrisma.rwt_perubahan_data_induk.count.mockResolvedValue(1);
      mockPrisma.ta_pegawai.findMany.mockResolvedValue([
        {
          id: "5d311a45-e98b-455a-bba3-c42883a41629",
          nipBaru: "197509132000031004",
          ta_orang: { nama: "MARIANTO", foto: null },
          rwt_jabatan: {
            ref_jabatan: { nama_jabatan: "Guru Madya", ref_jnsjab: { jnsjab: "Fungsional" } },
            ref_unitorganisasi: { nmUnor: "Dinas Pendidikan" },
          },
        },
      ]);
      mockPrisma.ref_kedudukanpns.findMany.mockResolvedValue([
        { id: 3, kedudukanpns: "PNS NON AKTIF PENSIUN JANDA/DUDA" },
      ]);
      mockPrisma.ta_arsip.findMany.mockResolvedValue([
        {
          from: "6b4aaf07-52d0-4a64-90d7-d1ad70e9c913",
          arsip: "Kgt3gwCNeZY04HR8bRojArHyNHZEZra0bE9yOtBK.pdf",
        },
      ]);

      const result = await pensiunService.getAllPensiun({});

      expect(mockPrisma.ta_arsip.findMany).toHaveBeenCalledWith({
        where: { from: { in: ["6b4aaf07-52d0-4a64-90d7-d1ad70e9c913"] } },
        select: { from: true, arsip: true },
      });
      expect(result.data[0].file_sk).toBe("/storage/dokumen/Kgt3gwCNeZY04HR8bRojArHyNHZEZra0bE9yOtBK.pdf");
    });
  });

  describe("createPensiun", () => {
    it("harus melempar 404 jika pegawai tidak ditemukan", async () => {
      mockPrisma.ta_pegawai.findUnique.mockResolvedValue(null);

      await expect(
        pensiunService.createPensiun({ pegawai_id: "non-existent" }, null)
      ).rejects.toThrow(AppError);
    });

    it("harus membuat riwayat pensiun di rwt_perubahan_data_induk dan mengupdate status pegawai", async () => {
      mockPrisma.ta_pegawai.findUnique.mockResolvedValue({ id: "p1", nipBaru: "123" });
      mockPrisma.rwt_perubahan_data_induk.create.mockResolvedValue({ id: "pen-1", pegawai_id: "p1" });
      mockPrisma.ta_pegawai.update.mockResolvedValue({ id: "p1", kedudukanPns_id: 2 });

      const result = await pensiunService.createPensiun(
        {
          pegawai_id: "p1",
          kedudukanpns_id: 2,
          no_sk: "SK/123",
          tgl_sk: "2026-01-01",
          tmt_pensiun: "2026-02-01",
          ket: "Pensiun",
        },
        null
      );

      expect(mockPrisma.rwt_perubahan_data_induk.create).toHaveBeenCalled();
      expect(mockPrisma.ta_pegawai.update).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { kedudukanPns_id: 2 },
      });
      expect(result).toEqual(expect.objectContaining({ id: "pen-1" }));
    });

    it("harus menyimpan referensi ke ta_arsip jika file fisik diunggah", async () => {
      mockPrisma.ta_pegawai.findUnique.mockResolvedValue({ id: "p1", nipBaru: "123" });
      mockPrisma.rwt_perubahan_data_induk.create.mockResolvedValue({ id: "pen-1", pegawai_id: "p1" });
      mockPrisma.ta_pegawai.update.mockResolvedValue({ id: "p1", kedudukanPns_id: 2 });
      mockPrisma.ta_arsip.create.mockResolvedValue({ id: "ars-1" });

      const mockFile = { path: "storage/dokumen/sk-upload.pdf" };
      await pensiunService.createPensiun(
        {
          pegawai_id: "p1",
          kedudukanpns_id: 2,
          no_sk: "SK/123",
        },
        mockFile
      );

      expect(mockPrisma.ta_arsip.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pegawai_id: "p1",
            jnsarsip_id: 8,
            arsip: "storage/dokumen/sk-upload.pdf",
          }),
        })
      );
    });
  });

  describe("deletePensiun", () => {
    it("harus melempar 404 jika data pensiun tidak ditemukan", async () => {
      mockPrisma.rwt_perubahan_data_induk.findFirst.mockResolvedValue(null);

      await expect(pensiunService.deletePensiun("pen-999")).rejects.toThrow(
        AppError
      );
    });

    it("harus soft delete data pensiun di rwt_perubahan_data_induk dan revert kedudukan jika tidak ada riwayat lain", async () => {
      mockPrisma.rwt_perubahan_data_induk.findFirst.mockResolvedValue({
        id: "pen-1",
        pegawai_id: "p1",
      });
      mockPrisma.rwt_perubahan_data_induk.update.mockResolvedValue({ id: "pen-1", is_deleted: true });
      mockPrisma.rwt_perubahan_data_induk.count.mockResolvedValue(0);
      mockPrisma.ta_pegawai.update.mockResolvedValue({ id: "p1", kedudukanPns_id: 1 });

      const result = await pensiunService.deletePensiun("pen-1");

      expect(mockPrisma.rwt_perubahan_data_induk.update).toHaveBeenCalledWith({
        where: { id: "pen-1" },
        data: { is_deleted: true },
      });
      expect(mockPrisma.ta_pegawai.update).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { kedudukanPns_id: 1 },
      });
      expect(result.message).toBe("Data pensiun berhasil dihapus");
    });
  });

  describe("getPensiunById", () => {
    it("harus melempar 404 jika data pensiun tidak ditemukan", async () => {
      mockPrisma.rwt_perubahan_data_induk.findFirst.mockResolvedValue(null);

      await expect(pensiunService.getPensiunById("non-existent")).rejects.toThrow(AppError);
    });

    it("harus mengembalikan detail data pensiun lengkap dengan pegawai dan nama kedudukan", async () => {
      mockPrisma.rwt_perubahan_data_induk.findFirst.mockResolvedValue({
        id: "pen-1",
        pegawai_id: "p1",
        kedudukanpns_id: 2,
        sk: "SK/123",
        tglSk: new Date("2026-01-01"),
        tmtSk: new Date("2026-02-01"),
        pengesahan: "BUPATI",
        ket: "Keterangan",
        file_sk: "uploads/sk.pdf",
        created_at: new Date("2026-01-01"),
      });
      mockPrisma.ta_pegawai.findUnique.mockResolvedValue({
        id: "p1",
        nipBaru: "19750101",
        ta_orang: { nama: "Ahmad", foto: null },
        rwt_jabatan: {
          ref_jabatan: { nama_jabatan: "Pranata Komputer" },
          ref_unitorganisasi: { nmUnor: "Diskominfo" },
        },
      });
      mockPrisma.ref_kedudukanpns.findFirst = jest.fn().mockResolvedValue({
        id: 2,
        kedudukanpns: "PENSIUN MASA WAKTU",
      });

      const result = await pensiunService.getPensiunById("pen-1");

      expect(result.id).toBe("pen-1");
      expect(result.no_sk).toBe("SK/123");
      expect(result.pegawai.nama).toBe("Ahmad");
      expect(result.nama_kedudukan).toBe("PENSIUN MASA WAKTU");
    });

    it("harus fallback ke ta_arsip jika file_sk pada rwt_perubahan_data_induk bernilai null", async () => {
      mockPrisma.rwt_perubahan_data_induk.findFirst.mockResolvedValue({
        id: "pen-legacy",
        pegawai_id: "p1",
        kedudukanpns_id: 3,
        sk: "SK/LEGACY",
        tglSk: new Date("2023-01-01"),
        tmtSk: new Date("2023-02-01"),
        pengesahan: "BUPATI",
        ket: "Pensiun Legacy",
        file_sk: null,
        created_at: new Date("2023-01-01"),
      });
      mockPrisma.ta_arsip.findFirst.mockResolvedValue({
        arsip: "Kgt3gwCNeZY04HR8bRojArHyNHZEZra0bE9yOtBK.pdf",
      });
      mockPrisma.ta_pegawai.findUnique.mockResolvedValue({
        id: "p1",
        nipBaru: "197509132000031004",
        ta_orang: { nama: "MARIANTO", foto: null },
        rwt_jabatan: {
          ref_jabatan: { nama_jabatan: "Guru" },
          ref_unitorganisasi: { nmUnor: "Disdik" },
        },
      });
      mockPrisma.ref_kedudukanpns.findFirst = jest.fn().mockResolvedValue({
        id: 3,
        kedudukanpns: "PNS NON AKTIF PENSIUN JANDA/DUDA",
      });

      const result = await pensiunService.getPensiunById("pen-legacy");

      expect(mockPrisma.ta_arsip.findFirst).toHaveBeenCalledWith({
        where: { from: "pen-legacy" },
        select: { arsip: true },
      });
      expect(result.file_sk).toBe("/storage/dokumen/Kgt3gwCNeZY04HR8bRojArHyNHZEZra0bE9yOtBK.pdf");
    });
  });

  describe("updatePensiun", () => {
    it("harus melempar 404 jika data pensiun tidak ditemukan", async () => {
      mockPrisma.rwt_perubahan_data_induk.findFirst.mockResolvedValue(null);

      await expect(
        pensiunService.updatePensiun("pen-non-existent", { no_sk: "SK/NEW" }, null)
      ).rejects.toThrow(AppError);
    });

    it("harus mengupdate data pensiun dan mengubah status pegawai jika kedudukan berubah", async () => {
      const existingRecord = {
        id: "pen-1",
        pegawai_id: "p1",
        kedudukanpns_id: 2,
        sk: "SK/OLD",
        tglSk: new Date("2026-01-01"),
        tmtSk: new Date("2026-02-01"),
        pengesahan: "BUPATI",
        ket: "Ket Lama",
        file_sk: "old_sk.pdf",
      };
      mockPrisma.rwt_perubahan_data_induk.findFirst.mockResolvedValue(existingRecord);
      mockPrisma.rwt_perubahan_data_induk.update.mockResolvedValue({
        ...existingRecord,
        kedudukanpns_id: 4,
        sk: "SK/NEW",
        file_sk: "new_path/sk.pdf",
      });
      mockPrisma.ta_pegawai.update.mockResolvedValue({ id: "p1", kedudukanPns_id: 4 });
      mockPrisma.ta_arsip.findFirst.mockResolvedValue({ id: "ars-1" });
      mockPrisma.ta_arsip.update.mockResolvedValue({ id: "ars-1", arsip: "new_path/sk.pdf" });

      const result = await pensiunService.updatePensiun(
        "pen-1",
        {
          kedudukanpns_id: 4,
          no_sk: "SK/NEW",
          ket: "Pemberhentian Baru",
        },
        { path: "new_path/sk.pdf" }
      );

      expect(mockPrisma.rwt_perubahan_data_induk.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "pen-1" },
          data: expect.objectContaining({
            kedudukanpns_id: 4,
            sk: "SK/NEW",
            file_sk: "new_path/sk.pdf",
          }),
        })
      );
      expect(mockPrisma.ta_pegawai.update).toHaveBeenCalledWith({
        where: { id: "p1" },
        data: { kedudukanPns_id: 4 },
      });
      expect(mockPrisma.ta_arsip.update).toHaveBeenCalledWith({
        where: { id: "ars-1" },
        data: { arsip: "new_path/sk.pdf" },
      });
      expect(result.sk).toBe("SK/NEW");
    });
  });

  describe("getRekapTahunanReport", () => {
    it("harus mengembalikan ringkasan rekapitulasi tahunan", async () => {
      const mockQueryRawResult = [
        {
          tahun: "2026",
          pensiun_bup: 35,
          pensiun_janda_duda_dini: 2,
          pindah_keluar: 0,
          pemberhentian_hukuman: 1,
          perubahan_identitas_gelar: 0,
          total_kejadian: 38,
        },
      ];
      mockPrisma.$queryRaw.mockResolvedValue(mockQueryRawResult);

      const result = await pensiunService.getRekapTahunanReport();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].tahun).toBe("2026");
      expect(result.data[0].pensiun_bup).toBe(35);
      expect(result.summary.total_pensiun_bup).toBe(35);
      expect(result.summary.grand_total).toBe(38);
    });
  });
});
