import { jest } from "@jest/globals";

// Mock repository
const mockCountActivePegawai = jest.fn();
const mockFindRekapGender = jest.fn();
const mockFindRekapGolonganGender = jest.fn();
const mockFindRekapPendidikanGender = jest.fn();
const mockFindRekapJabatanStruktural = jest.fn();
const mockFindRekapStrukturalGender = jest.fn();
const mockFindRekapStrukturalPendidikan = jest.fn();
const mockFindRekapJabatanGender = jest.fn();
const mockFindRekapJabatanFungsional = jest.fn();
const mockFindAllJkl = jest.fn();
const mockFindAllGol = jest.fn();
const mockFindAllTktPend = jest.fn();
const mockFindAllEselon = jest.fn();
const mockFindUnorById = jest.fn();
const mockFindSnapshot = jest.fn();
const mockSaveSnapshot = jest.fn();
const mockListAvailableSnapshots = jest.fn();

jest.unstable_mockModule("../rekapitulasi.repository.js", () => ({
  countActivePegawai: mockCountActivePegawai,
  findRekapGender: mockFindRekapGender,
  findRekapGolonganGender: mockFindRekapGolonganGender,
  findRekapPendidikanGender: mockFindRekapPendidikanGender,
  findRekapJabatanStruktural: mockFindRekapJabatanStruktural,
  findRekapStrukturalGender: mockFindRekapStrukturalGender,
  findRekapStrukturalPendidikan: mockFindRekapStrukturalPendidikan,
  findRekapJabatanGender: mockFindRekapJabatanGender,
  findRekapJabatanFungsional: mockFindRekapJabatanFungsional,
  findAllJkl: mockFindAllJkl,
  findAllGol: mockFindAllGol,
  findAllTktPend: mockFindAllTktPend,
  findAllEselon: mockFindAllEselon,
  findUnorById: mockFindUnorById,
  findSnapshot: mockFindSnapshot,
  saveSnapshot: mockSaveSnapshot,
  listAvailableSnapshots: mockListAvailableSnapshots,
}));

const rekapService = await import("../rekapitulasi.service.js");

describe("Rekapitulasi Service Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getRekapGender", () => {
    it("harus menghitung rekapitulasi gender dan persentase dengan benar", async () => {
      mockFindRekapGender.mockResolvedValue([
        { jkl_id: "1", total: 40 },
        { jkl_id: "2", total: 60 },
      ]);
      mockFindAllJkl.mockResolvedValue([
        { id: 1, jkl: "Laki-Laki" },
        { id: 2, jkl: "Perempuan" },
      ]);

      const result = await rekapService.getRekapGender();
      expect(result.total).toBe(100);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].persentase).toBe(40);
      expect(result.items[1].persentase).toBe(60);
    });
  });

  describe("getRekapGolonganGender", () => {
    it("harus menghitung rekapitulasi golongan dan gender beserta summary", async () => {
      mockFindRekapGolonganGender.mockResolvedValue([
        { kdGol: "11", jkl_id: "1", total: 10 },
        { kdGol: "11", jkl_id: "2", total: 5 },
      ]);
      mockFindAllGol.mockResolvedValue([
        { kdGol: "11", gol: "I/a", pangkat: "Juru Muda" },
      ]);

      const result = await rekapService.getRekapGolonganGender();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].total).toBe(15);
      expect(result.summary.total_laki).toBe(10);
      expect(result.summary.total_perempuan).toBe(5);
      expect(result.summary.total_keseluruhan).toBe(15);
    });
  });

  describe("getRekapPendidikanGender", () => {
    it("harus menghitung rekapitulasi pendidikan dan gender", async () => {
      mockFindRekapPendidikanGender.mockResolvedValue([
        { tktPend_id: 1, jkl_id: "1", total: 8 },
        { tktPend_id: 1, jkl_id: "2", total: 12 },
      ]);
      mockFindAllTktPend.mockResolvedValue([
        { id: 1, tktpend: "SD" },
      ]);

      const result = await rekapService.getRekapPendidikanGender();
      expect(result.items[0].total).toBe(20);
      expect(result.summary.total_keseluruhan).toBe(20);
    });
  });

  describe("getRekapJabatanStruktural", () => {
    it("harus menghitung formasi, terisi, dan kosong jabatan struktural", async () => {
      mockFindRekapJabatanStruktural.mockResolvedValue({
        terisi: [{ eselon: "II.a", terisi: 5 }],
        formasi: [{ eselon: "II.a", formasi: 10 }],
      });
      mockFindAllEselon.mockResolvedValue([
        { id: "e1", eselon: "II.a", kode: "10" },
      ]);

      const result = await rekapService.getRekapJabatanStruktural();
      expect(result.items[0].formasi).toBe(10);
      expect(result.items[0].terisi).toBe(5);
      expect(result.items[0].kosong).toBe(5);
      expect(result.items[0].persen_terisi).toBe(50);
    });
  });

  describe("getRekapJabatanFungsional", () => {
    it("harus merekapitulasi kelompok jabatan dan kategori jenjang per gender", async () => {
      mockFindRekapJabatanFungsional.mockResolvedValue([
        {
          kelompok_jabatan: "Perawat",
          ahli_l: 7,
          ahli_p: 15,
          ahli_total: 22,
          terampil_l: 53,
          terampil_p: 126,
          terampil_total: 179,
          total_l: 60,
          total_p: 141,
          total_semua: 201,
        },
        {
          kelompok_jabatan: "Guru",
          ahli_l: 371,
          ahli_p: 931,
          ahli_total: 1302,
          terampil_l: 0,
          terampil_p: 0,
          terampil_total: 0,
          total_l: 371,
          total_p: 931,
          total_semua: 1302,
        },
      ]);

      const result = await rekapService.getRekapJabatanFungsional();
      expect(result.items.length).toBe(2);
      expect(result.items[0].kelompok_jabatan).toBe("Perawat");
      expect(result.items[0].ahli.total).toBe(22);
      expect(result.items[0].terampil.total).toBe(179);
      expect(result.summary.total_semua).toBe(1503);
    });
  });

  describe("getAllRekapitulasi", () => {
    it("harus mengembalikan semua rekapitulasi gabungan", async () => {
      mockCountActivePegawai.mockResolvedValue(100);
      mockFindUnorById.mockResolvedValue({ id: "u1", nmUnor: "BKPSDM" });
      mockFindRekapGender.mockResolvedValue([]);
      mockFindAllJkl.mockResolvedValue([]);
      mockFindRekapGolonganGender.mockResolvedValue([]);
      mockFindAllGol.mockResolvedValue([]);
      mockFindRekapPendidikanGender.mockResolvedValue([]);
      mockFindAllTktPend.mockResolvedValue([]);
      mockFindRekapJabatanStruktural.mockResolvedValue({ terisi: [], formasi: [] });
      mockFindRekapStrukturalGender.mockResolvedValue([]);
      mockFindRekapStrukturalPendidikan.mockResolvedValue([]);
      mockFindAllEselon.mockResolvedValue([]);
      mockFindRekapJabatanGender.mockResolvedValue([]);
      mockFindRekapJabatanFungsional.mockResolvedValue([]);
      mockListAvailableSnapshots.mockResolvedValue(["2026-09"]);

      const result = await rekapService.getAllRekapitulasi("u1");
      expect(result.total_pegawai).toBe(100);
      expect(result.filter.unor_nama).toBe("BKPSDM");
      expect(result).toHaveProperty("rekap_gender");
      expect(result).toHaveProperty("rekap_golongan_gender");
      expect(result).toHaveProperty("rekap_jabatan_fungsional");
    });
  });

  describe("createSnapshot", () => {
    it("harus memanggil saveSnapshot pada repository", async () => {
      mockCountActivePegawai.mockResolvedValue(50);
      mockFindUnorById.mockResolvedValue(null);
      mockFindRekapGender.mockResolvedValue([]);
      mockFindAllJkl.mockResolvedValue([]);
      mockFindRekapGolonganGender.mockResolvedValue([]);
      mockFindAllGol.mockResolvedValue([]);
      mockFindRekapPendidikanGender.mockResolvedValue([]);
      mockFindAllTktPend.mockResolvedValue([]);
      mockFindRekapJabatanStruktural.mockResolvedValue({ terisi: [], formasi: [] });
      mockFindRekapStrukturalGender.mockResolvedValue([]);
      mockFindRekapStrukturalPendidikan.mockResolvedValue([]);
      mockFindAllEselon.mockResolvedValue([]);
      mockFindRekapJabatanGender.mockResolvedValue([]);
      mockFindRekapJabatanFungsional.mockResolvedValue([]);
      mockListAvailableSnapshots.mockResolvedValue([]);
      mockSaveSnapshot.mockResolvedValue({ id: "snap-1", period: "2026-10" });

      const res = await rekapService.createSnapshot("2026-10");
      expect(mockSaveSnapshot).toHaveBeenCalledWith("2026-10", "all", null, expect.any(Object));
      expect(res.id).toBe("snap-1");
    });
  });

  describe("generateExcel", () => {
    it("harus menghasilkan buffer XLSX", async () => {
      mockCountActivePegawai.mockResolvedValue(10);
      mockFindUnorById.mockResolvedValue(null);
      mockFindRekapGender.mockResolvedValue([]);
      mockFindAllJkl.mockResolvedValue([]);
      mockFindRekapGolonganGender.mockResolvedValue([]);
      mockFindAllGol.mockResolvedValue([]);
      mockFindRekapPendidikanGender.mockResolvedValue([]);
      mockFindAllTktPend.mockResolvedValue([]);
      mockFindRekapJabatanStruktural.mockResolvedValue({ terisi: [], formasi: [] });
      mockFindRekapStrukturalGender.mockResolvedValue([]);
      mockFindRekapStrukturalPendidikan.mockResolvedValue([]);
      mockFindAllEselon.mockResolvedValue([]);
      mockFindRekapJabatanGender.mockResolvedValue([]);
      mockFindRekapJabatanFungsional.mockResolvedValue([]);
      mockListAvailableSnapshots.mockResolvedValue([]);

      const buffer = await rekapService.generateExcel(null, "all");
      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer) || buffer instanceof Uint8Array || buffer.byteLength > 0).toBe(true);
    });
  });
});
