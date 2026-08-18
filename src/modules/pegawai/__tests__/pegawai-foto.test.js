import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockFindById = jest.fn();
const mockUpdateFoto = jest.fn();

jest.unstable_mockModule("../pegawai.repository.js", () => ({
  findById: mockFindById,
  updateFoto: mockUpdateFoto,
}));

const { updateFotoPegawai, deleteFotoPegawai } = await import("../pegawai.service.js");
const { updateFotoPegawai: controllerUpdateFoto, deleteFotoPegawai: controllerDeleteFoto } = await import("../pegawai.controller.js");
const AppError = (await import("../../../utils/AppError.js")).default;

describe("Pegawai Foto Service & Controller", () => {
  beforeEach(() => {
    mockFindById.mockReset();
    mockUpdateFoto.mockReset();
  });

  describe("pegawaiService.updateFotoPegawai", () => {
    it("harus melempar AppError 400 jika file foto tidak disertakan", async () => {
      await expect(
        updateFotoPegawai("peg-123", null)
      ).rejects.toThrow(AppError);
    });

    it("harus melempar AppError 404 jika data pegawai tidak ditemukan", async () => {
      mockFindById.mockResolvedValue(null);

      const mockFile = {
        path: "storage/profile-foto/temp.jpg",
        originalname: "test.jpg",
      };

      await expect(
        updateFotoPegawai("peg-999", mockFile)
      ).rejects.toThrow(AppError);
    });

    it("harus berhasil update foto dan mengembalikan path foto", async () => {
      const mockPegawai = {
        id: "peg-123",
        nipBaru: "199001012020011001",
        ta_orang: { id: "orang-123", foto: null },
      };
      mockFindById.mockResolvedValue(mockPegawai);
      mockUpdateFoto.mockResolvedValue({
        pegawaiId: "peg-123",
        orangId: "orang-123",
        foto: "storage/profile-foto/foto-pegawai-peg-123-12345.jpg",
        oldFoto: null,
      });

      const mockFile = {
        path: "storage/profile-foto/foto-pegawai-peg-123-12345.jpg",
        originalname: "foto.jpg",
      };

      const result = await updateFotoPegawai("peg-123", mockFile);
      expect(result).toHaveProperty("pegawaiId", "peg-123");
      expect(result).toHaveProperty("foto", "storage/profile-foto/foto-pegawai-peg-123-12345.jpg");
    });
  });

  describe("pegawaiService.deleteFotoPegawai", () => {
    it("harus melempar AppError 404 jika pegawai tidak ada", async () => {
      mockFindById.mockResolvedValue(null);

      await expect(
        deleteFotoPegawai("peg-999")
      ).rejects.toThrow(AppError);
    });

    it("harus berhasil menghapus foto dan mengembalikan foto: null", async () => {
      const mockPegawai = {
        id: "peg-123",
        ta_orang: { id: "orang-123", foto: "storage/profile-foto/old.jpg" },
      };
      mockFindById.mockResolvedValue(mockPegawai);
      mockUpdateFoto.mockResolvedValue({
        pegawaiId: "peg-123",
        orangId: "orang-123",
        foto: null,
        oldFoto: "storage/profile-foto/old.jpg",
      });

      const result = await deleteFotoPegawai("peg-123");
      expect(result).toHaveProperty("pegawaiId", "peg-123");
      expect(result).toHaveProperty("foto", null);
    });
  });

  describe("pegawaiController.updateFotoPegawai", () => {
    it("harus mengembalikan response sukses 200", async () => {
      const mockPegawai = {
        id: "peg-123",
        ta_orang: { id: "orang-123", foto: null },
      };
      mockFindById.mockResolvedValue(mockPegawai);
      mockUpdateFoto.mockResolvedValue({
        pegawaiId: "peg-123",
        orangId: "orang-123",
        foto: "storage/profile-foto/foto.jpg",
        oldFoto: null,
      });

      const mockFile = { path: "storage/profile-foto/foto.jpg" };
      const req = {
        params: { id: "peg-123" },
        file: mockFile,
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      controllerUpdateFoto(req, res, next);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statusCode: 200,
          message: "Foto pegawai berhasil diperbarui",
          data: {
            pegawaiId: "peg-123",
            foto: "storage/profile-foto/foto.jpg",
          },
        })
      );
    });
  });

  describe("pegawaiController.deleteFotoPegawai", () => {
    it("harus mengembalikan response sukses 200 saat hapus foto", async () => {
      const mockPegawai = {
        id: "peg-123",
        ta_orang: { id: "orang-123", foto: "storage/profile-foto/old.jpg" },
      };
      mockFindById.mockResolvedValue(mockPegawai);
      mockUpdateFoto.mockResolvedValue({
        pegawaiId: "peg-123",
        orangId: "orang-123",
        foto: null,
        oldFoto: "storage/profile-foto/old.jpg",
      });

      const req = {
        params: { id: "peg-123" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      controllerDeleteFoto(req, res, next);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statusCode: 200,
          message: "Foto pegawai berhasil dihapus",
          data: {
            pegawaiId: "peg-123",
            foto: null,
          },
        })
      );
    });
  });
});
