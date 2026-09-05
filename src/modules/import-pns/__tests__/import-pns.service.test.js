import { jest } from "@jest/globals";

// Mock repository
jest.unstable_mockModule("../import-pns.repository.js", () => ({
  createMany: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getSummary: jest.fn(),
  softDeleteBatch: jest.fn(),
  softDeleteById: jest.fn(),
}));

const importPnsRepository = await import("../import-pns.repository.js");
const { processCsvImport, getImportedPnsList, getImportedPnsById, deleteBatch, getCsvTemplate } = await import("../import-pns.service.js");

describe("Import PNS Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("processCsvImport", () => {
    it("harus berhasil memproses buffer CSV berpemisah koma dan menyimpan ke database", async () => {
      const csvData = Buffer.from(
        "NIP BARU,NAMA,NIK,UNOR NAMA\n198501012010011001,Ahmad Fauzi,3171010101850001,Dinas Kominfo\n"
      );
      importPnsRepository.createMany.mockResolvedValue({ count: 1 });

      const result = await processCsvImport(csvData, "test.csv");

      expect(result).toHaveProperty("batchId");
      expect(result.fileName).toBe("test.csv");
      expect(result.insertedCount).toBe(1);
      expect(importPnsRepository.createMany).toHaveBeenCalledTimes(1);
    });

    it("harus berhasil memproses buffer CSV berpemisah pipa (|) dan menyimpan ke database", async () => {
      const pipeCsvData = Buffer.from(
        "PNS ID|NIP BARU|NIP LAMA|NAMA|GELAR DEPAN|GELAR BELAKANG|TEMPAT LAHIR ID|TEMPAT LAHIR NAMA|TANGGAL LAHIR\n" +
        "A84B|198501012010011001||AHMAD FAUZI|Dr.|S.Kom.|3171|JAKARTA|1985-01-01\n"
      );
      importPnsRepository.createMany.mockResolvedValue({ count: 1 });

      const result = await processCsvImport(pipeCsvData, "test_pipe.csv");

      expect(result).toHaveProperty("batchId");
      expect(result.fileName).toBe("test_pipe.csv");
      expect(result.insertedCount).toBe(1);
      expect(importPnsRepository.createMany).toHaveBeenCalledTimes(1);
    });

    it("harus melempar error jika buffer CSV kosong", async () => {
      await expect(processCsvImport(Buffer.from(""), "empty.csv")).rejects.toThrow("File CSV kosong atau tidak valid");
    });
  });

  describe("getImportedPnsList", () => {
    it("harus mengembalikan list data pns terimport", async () => {
      const mockResult = {
        data: [{ id: "uuid-1", nama: "Ahmad Fauzi", nip_baru: "198501012010011001" }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      importPnsRepository.findAll.mockResolvedValue(mockResult);

      const result = await getImportedPnsList({ page: 1, limit: 10 });
      expect(result).toEqual(mockResult);
    });
  });

  describe("getImportedPnsById", () => {
    it("harus melempar 404 jika record tidak ditemukan", async () => {
      importPnsRepository.findById.mockResolvedValue(null);
      await expect(getImportedPnsById("invalid-id")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("getCsvTemplate", () => {
    it("harus mengembalikan header CSV yang valid", () => {
      const template = getCsvTemplate();
      expect(template).toContain("PNS ID");
      expect(template).toContain("NIP BARU");
      expect(template).toContain("NAMA");
    });
  });
});
