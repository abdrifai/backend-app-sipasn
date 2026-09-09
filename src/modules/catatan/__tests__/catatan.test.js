import { jest } from "@jest/globals";

// Mock repository
const mockFindAll = jest.fn();
const mockFindById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockSoftDelete = jest.fn();
const mockFindCategories = jest.fn();

jest.unstable_mockModule("../catatan.repository.js", () => ({
  findAll: mockFindAll,
  findById: mockFindById,
  create: mockCreate,
  update: mockUpdate,
  softDelete: mockSoftDelete,
  findCategories: mockFindCategories,
}));

const catatanService = await import("../catatan.service.js");
const AppError = (await import("../../../utils/AppError.js")).default;

describe("Catatan Service Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllCatatan", () => {
    it("harus mengembalikan daftar catatan dan categories", async () => {
      const mockResult = {
        data: [{ id: "1", judul: "Catatan Rapat", konten: "Isi catatan", is_pinned: false }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      mockFindAll.mockResolvedValue(mockResult);
      mockFindCategories.mockResolvedValue(["Umum", "Rapat"]);

      const res = await catatanService.getAllCatatan({});
      expect(res.data).toEqual(mockResult.data);
      expect(res.categories).toEqual(["Umum", "Rapat"]);
    });
  });

  describe("getCatatanById", () => {
    it("harus melempar 404 jika catatan tidak ditemukan", async () => {
      mockFindById.mockResolvedValue(null);

      await expect(catatanService.getCatatanById("non-existent")).rejects.toThrow(AppError);
    });

    it("harus mengembalikan detail catatan jika ditemukan", async () => {
      const mockData = { id: "1", judul: "Catatan Penting", konten: "Deskripsi", is_pinned: true };
      mockFindById.mockResolvedValue(mockData);

      const res = await catatanService.getCatatanById("1");
      expect(res).toEqual(mockData);
    });
  });

  describe("createCatatan", () => {
    it("harus berhasil membuat catatan baru", async () => {
      const payload = { judul: "Judul Baru", konten: "Konten Baru", kategori: "Memo" };
      const created = { id: "new-id", ...payload, is_pinned: false };
      mockCreate.mockResolvedValue(created);

      const res = await catatanService.createCatatan(payload);
      expect(res.judul).toBe(payload.judul);
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  describe("deleteCatatan", () => {
    it("harus berhasil melakukan soft delete catatan", async () => {
      mockFindById.mockResolvedValue({ id: "1", judul: "Mau dihapus" });
      mockSoftDelete.mockResolvedValue({ id: "1" });

      const res = await catatanService.deleteCatatan("1");
      expect(res).toEqual({ id: "1" });
      expect(mockSoftDelete).toHaveBeenCalledWith("1");
    });
  });

  describe("togglePinCatatan", () => {
    it("harus toggle is_pinned catatan", async () => {
      mockFindById.mockResolvedValue({ id: "1", is_pinned: false });
      mockUpdate.mockResolvedValue({ id: "1", is_pinned: true });

      const res = await catatanService.togglePinCatatan("1");
      expect(res.is_pinned).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith("1", { is_pinned: true });
    });
  });
});
