import { jest } from "@jest/globals";

const mockPrisma = {
  ref_perubahan_data_induk: {
    findMany: jest.fn(),
  },
  rwt_perubahan_data_induk: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
  },
  ta_pegawai: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  ta_orang: {
    update: jest.fn(),
  },
  rwt_pend: {
    update: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

jest.unstable_mockModule("../../../config/database.js", () => ({
  default: mockPrisma,
}));

describe("peremajaan-data-induk.service", () => {
  let peremajaanService;

  beforeAll(async () => {
    peremajaanService = await import("../peremajaan-data-induk.service.js");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getJenisOptions", () => {
    it("harus mengembalikan daftar jenis perubahan non-kedudukan", async () => {
      mockPrisma.ref_perubahan_data_induk.findMany.mockResolvedValue([
        { id: 2n, jns_perubahan: "Perubahan Nama PNS" },
        { id: 5n, jns_perubahan: "Pencantuman Gelar Akademik" },
      ]);

      const result = await peremajaanService.getJenisOptions();

      expect(result).toEqual([
        { id: 2, jns_perubahan: "Perubahan Nama PNS" },
        { id: 5, jns_perubahan: "Pencantuman Gelar Akademik" },
      ]);
    });
  });

  describe("getStats", () => {
    it("harus mengembalikan statistik peremajaan", async () => {
      mockPrisma.rwt_perubahan_data_induk.groupBy.mockResolvedValue([
        { jns_perubahan_id: 2, _count: 10 },
        { jns_perubahan_id: 5, _count: 15 },
      ]);
      mockPrisma.ref_perubahan_data_induk.findMany.mockResolvedValue([
        { id: 2n, jns_perubahan: "Perubahan Nama PNS" },
        { id: 5n, jns_perubahan: "Pencantuman Gelar Akademik" },
      ]);

      const result = await peremajaanService.getStats();

      expect(result.total).toBe(25);
      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown[0].count).toBe(10);
      expect(result.breakdown[1].count).toBe(15);
    });
  });

  describe("getAllPeremajaan", () => {
    it("harus mengembalikan data riwayat perubahan data induk beserta info pegawai", async () => {
      const mockRawList = [
        {
          id: "uuid-1",
          pegawai_id: "peg-1",
          jns_perubahan_id: 5,
          sk: "800/123/2026",
          tglSk: new Date("2026-01-01"),
          tmtSk: new Date("2026-02-01"),
          pengesahan: "BKN",
          ket: "Gelar S.Kom",
          file_sk: null,
          created_at: new Date(),
        },
      ];

      mockPrisma.rwt_perubahan_data_induk.findMany.mockResolvedValue(mockRawList);
      mockPrisma.rwt_perubahan_data_induk.count.mockResolvedValue(1);
      mockPrisma.ta_pegawai.findMany.mockResolvedValue([
        {
          id: "peg-1",
          nipBaru: "198001012005011001",
          orang_id: "org-1",
          rwtPend_id: "pend-1",
          ta_orang: {
            nama: "Ahmad Dahlan",
            foto: null,
          },
          rwt_pend: {
            gd: "Drs.",
            gb: "M.Si",
          },
          rwt_jabatan: {
            ref_jabatan: {
              nama_jabatan: "Pranata Komputer",
              ref_jnsjab: { jnsjab: "Fungsional" },
            },
            ref_unitorganisasi: { nmUnor: "Diskominfo" },
          },
        },
      ]);
      mockPrisma.ref_perubahan_data_induk.findMany.mockResolvedValue([
        { id: 5n, jns_perubahan: "Pencantuman Gelar Akademik" },
      ]);

      const result = await peremajaanService.getAllPeremajaan({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].nama_jenis_perubahan).toBe("Pencantuman Gelar Akademik");
      expect(result.data[0].pegawai.nama).toBe("Ahmad Dahlan");
      expect(result.data[0].pegawai.glrDpn).toBe("Drs.");
      expect(result.data[0].pegawai.glrBlk).toBe("M.Si");
      expect(result.meta.total).toBe(1);
    });
  });

  describe("createPeremajaan", () => {
    it("harus membuat data peremajaan dan sinkronisasi gelar ke rwt_pend jika diminta", async () => {
      mockPrisma.ta_pegawai.findUnique.mockResolvedValue({
        id: "peg-1",
        nipBaru: "198001012005011001",
        orang_id: "org-1",
        rwtPend_id: "pend-1",
      });

      mockPrisma.rwt_perubahan_data_induk.create.mockResolvedValue({
        id: "new-uuid",
        pegawai_id: "peg-1",
        jns_perubahan_id: 5,
        sk: "800/999/2026",
      });

      const result = await peremajaanService.createPeremajaan({
        pegawai_id: "peg-1",
        jns_perubahan_id: 5,
        sk: "800/999/2026",
        sync_pegawai: true,
        glr_blk_baru: "S.Kom",
      });

      expect(mockPrisma.rwt_perubahan_data_induk.create).toHaveBeenCalled();
      expect(mockPrisma.rwt_pend.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "pend-1" },
          data: expect.objectContaining({ gb: "S.Kom" }),
        })
      );
      expect(result).toHaveProperty("id");
    });
  });
});
