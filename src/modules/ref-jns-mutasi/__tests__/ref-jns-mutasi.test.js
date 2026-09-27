import { jest } from "@jest/globals";

const mockRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

jest.unstable_mockModule("../ref-jns-mutasi.repository.js", () => mockRepository);

describe("ref-jns-mutasi.service", () => {
  let service;
  let AppError;

  beforeAll(async () => {
    service = await import("../ref-jns-mutasi.service.js");
    AppError = (await import("../../../utils/AppError.js")).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("harus mengembalikan daftar jenis mutasi", async () => {
      const mockResult = {
        data: [{ id: "1", kode: 1, jnsMutasi: "Kenaikan Pangkat", is_aktif: 1 }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      mockRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.getAll({ page: 1 });
      expect(mockRepository.findAll).toHaveBeenCalledWith({ page: 1 });
      expect(result).toEqual(mockResult);
    });
  });

  describe("getById", () => {
    it("harus melempar 404 jika jenis mutasi tidak ditemukan", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getById("999")).rejects.toThrow(AppError);
    });

    it("harus mengembalikan jenis mutasi jika ditemukan", async () => {
      const mockItem = { id: "1", kode: 1, jnsMutasi: "Kenaikan Pangkat", is_aktif: 1 };
      mockRepository.findById.mockResolvedValue(mockItem);

      const result = await service.getById("1");
      expect(result).toEqual(mockItem);
    });
  });

  describe("create", () => {
    it("harus membuat jenis mutasi baru dengan UUID", async () => {
      const payload = { kode: 2, jnsMutasi: "Pindah Instansi", is_aktif: 1 };
      mockRepository.create.mockImplementation((data) => Promise.resolve(data));

      const result = await service.create(payload);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          kode: 2,
          jnsMutasi: "Pindah Instansi",
          is_aktif: 1,
        })
      );
      expect(result.id).toBeDefined();
    });
  });

  describe("update", () => {
    it("harus melempar 404 jika data yang akan diupdate tidak ditemukan", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update("999", { kode: 1, jnsMutasi: "Mutasi", is_aktif: 0 })
      ).rejects.toThrow(AppError);
    });

    it("harus mengupdate jenis mutasi termasuk status is_aktif", async () => {
      mockRepository.findById.mockResolvedValue({ id: "1", kode: 1, jnsMutasi: "Mutasi", is_aktif: 1 });
      mockRepository.update.mockResolvedValue({ id: "1", kode: 1, jnsMutasi: "Mutasi Baru", is_aktif: 0 });

      const result = await service.update("1", { jnsMutasi: "Mutasi Baru", is_aktif: 0 });
      expect(mockRepository.update).toHaveBeenCalledWith("1", { jnsMutasi: "Mutasi Baru", is_aktif: 0 });
      expect(result.is_aktif).toBe(0);
    });
  });

  describe("deleteById", () => {
    it("harus melempar 404 jika data yang akan dihapus tidak ditemukan", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteById("999")).rejects.toThrow(AppError);
    });

    it("harus melakukan soft delete data", async () => {
      mockRepository.findById.mockResolvedValue({ id: "1", kode: 1 });
      mockRepository.softDelete.mockResolvedValue({ id: "1" });

      const result = await service.deleteById("1");
      expect(mockRepository.softDelete).toHaveBeenCalledWith("1");
      expect(result).toEqual({ id: "1" });
    });
  });
});
