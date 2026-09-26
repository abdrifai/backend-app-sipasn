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

      const result = await pensiunService.getAllPensiun({});

      expect(result.data[0].pegawai.jabatan).toBe("Pelaksana");
      expect(result.data[0].nama_kedudukan).toBe("PEMBERHENTIAN");
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
