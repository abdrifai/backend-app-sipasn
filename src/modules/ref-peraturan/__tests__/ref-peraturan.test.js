import { jest } from "@jest/globals";

const mockRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByNomor: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  getKategoriList: jest.fn(),
  getJenisList: jest.fn(),
  searchLookup: jest.fn(),
  getAllForHierarchy: jest.fn(),
};

jest.unstable_mockModule("../ref-peraturan.repository.js", () => mockRepository);

describe("ref-peraturan.service", () => {
  let service;
  let AppError;

  beforeAll(async () => {
    service = await import("../ref-peraturan.service.js");
    AppError = (await import("../../../utils/AppError.js")).default;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllPeraturan", () => {
    it("harus mengembalikan daftar peraturan beserta metadata pagination", async () => {
      const mockResult = {
        data: [
          {
            id: "uuid-1",
            nomor_peraturan: "Perbup No. 12 Tahun 2023",
            judul: "SOTK Dinas Kesehatan",
            kategori: "SOTK",
            jenis_peraturan: "PERBUP",
            tahun: 2023,
          },
        ],
        total: 1,
      };
      mockRepository.findAll.mockResolvedValue(mockResult);

      const result = await service.getAllPeraturan({ page: 1, limit: 10, kategori: "SOTK" });
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10, kategori: "SOTK" })
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe("getPeraturanById", () => {
    it("harus melempar 404 jika peraturan tidak ditemukan", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getPeraturanById("not-found")).rejects.toThrow(AppError);
    });

    it("harus mengembalikan detail peraturan jika ditemukan", async () => {
      const mockPeraturan = {
        id: "uuid-1",
        nomor_peraturan: "Perbup No. 12 Tahun 2023",
        judul: "SOTK Dinas Kesehatan",
      };
      mockRepository.findById.mockResolvedValue(mockPeraturan);

      const result = await service.getPeraturanById("uuid-1");
      expect(result).toEqual(mockPeraturan);
    });
  });

  describe("createPeraturan", () => {
    it("harus melempar 409 jika nomor peraturan sudah ada", async () => {
      mockRepository.findByNomor.mockResolvedValue({ id: "exist-1" });

      await expect(
        service.createPeraturan({ nomor_peraturan: "Perbup No. 12", judul: "Judul", kategori: "SOTK", jenis_peraturan: "PERBUP", tahun: 2023 })
      ).rejects.toThrow(AppError);
    });

    it("harus berhasil membuat arsip peraturan baru", async () => {
      mockRepository.findByNomor.mockResolvedValue(null);
      mockRepository.create.mockImplementation((payload) => Promise.resolve({ id: "new-id", ...payload }));

      const body = {
        nomor_peraturan: "Perbup No. 12 Tahun 2023",
        judul: "SOTK Dinkes",
        kategori: "SOTK",
        jenis_peraturan: "PERBUP",
        tahun: "2023",
      };
      const result = await service.createPeraturan(body, null, "1");

      expect(mockRepository.create).toHaveBeenCalled();
      expect(result.id).toBe("new-id");
      expect(result.nomor_peraturan).toBe("Perbup No. 12 Tahun 2023");
    });

    it("harus otomatis mengubah status peraturan target menjadi DIUBAH_OLEH jika tipe_relasi adalah MENGUBAH", async () => {
      mockRepository.findByNomor.mockResolvedValue(null);
      mockRepository.create.mockImplementation((payload) => Promise.resolve({ id: "new-peraturan", ...payload }));
      mockRepository.update.mockResolvedValue({ id: "target-old", status_berlaku: "DIUBAH_OLEH" });

      const body = {
        nomor_peraturan: "Perbup No. 2 Tahun 2024",
        judul: "Perubahan SOTK",
        kategori: "SOTK",
        jenis_peraturan: "PERBUP",
        tahun: "2024",
        peraturan_terkait_id: "target-old",
        tipe_relasi: "MENGUBAH",
      };

      await service.createPeraturan(body, null, "1");

      expect(mockRepository.update).toHaveBeenCalledWith("target-old", { status_berlaku: "DIUBAH_OLEH" });
    });
  });

  describe("updatePeraturan", () => {
    it("harus melempar 404 jika peraturan yang diupdate tidak ada", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updatePeraturan("uuid-x", { judul: "New Title" })).rejects.toThrow(AppError);
    });

    it("harus berhasil memperbarui data peraturan dan menyinkronkan status target menjadi DIUBAH_OLEH", async () => {
      mockRepository.findById.mockResolvedValue({
        id: "uuid-1",
        nomor_peraturan: "Perbup No. 12",
        peraturan_terkait_id: null,
        tipe_relasi: null,
      });
      mockRepository.update.mockResolvedValue({ id: "uuid-1", judul: "Updated Title" });

      const result = await service.updatePeraturan("uuid-1", {
        judul: "Updated Title",
        peraturan_terkait_id: "target-old-2",
        tipe_relasi: "MENGUBAH",
      });

      expect(result.judul).toBe("Updated Title");
      expect(mockRepository.update).toHaveBeenCalledWith("target-old-2", { status_berlaku: "DIUBAH_OLEH" });
    });
  });

  describe("deletePeraturan", () => {
    it("harus melempar 404 jika id tidak ditemukan saat delete", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deletePeraturan("uuid-999")).rejects.toThrow(AppError);
    });

    it("harus melakukan soft delete peraturan", async () => {
      mockRepository.findById.mockResolvedValue({ id: "uuid-1" });
      mockRepository.softDelete.mockResolvedValue({ id: "uuid-1" });

      const result = await service.deletePeraturan("uuid-1");
      expect(mockRepository.softDelete).toHaveBeenCalledWith("uuid-1");
      expect(result.id).toBe("uuid-1");
    });
  });

  describe("searchLookup", () => {
    it("harus memanggil searchLookup pada repository", async () => {
      const mockList = [{ id: "1", nomor_peraturan: "UU 20/2023", judul: "ASN" }];
      mockRepository.searchLookup.mockResolvedValue(mockList);

      const result = await service.searchLookup("20/2023");
      expect(mockRepository.searchLookup).toHaveBeenCalledWith("20/2023", null);
      expect(result).toEqual(mockList);
    });
  });

  describe("getHierarchyTree", () => {
    it("harus menyusun pohon hierarki berdasarkan tingkat perundang-undangan", async () => {
      const mockItems = [
        { id: "1", nomor_peraturan: "UU 20/2023", jenis_peraturan: "UU", judul: "UU ASN", tahun: 2023 },
        { id: "2", nomor_peraturan: "PP 11/2017", jenis_peraturan: "PP", judul: "PP Manajemen PNS", tahun: 2017, parent_id: "1", parent: { id: "1" } },
      ];
      mockRepository.getAllForHierarchy.mockResolvedValue(mockItems);

      const result = await service.getHierarchyTree();
      expect(result.levels).toBeDefined();
      expect(result.totalPeraturan).toBe(2);
      expect(result.links).toHaveLength(1);
    });
  });

  describe("getFilterOptions", () => {
    it("harus mengembalikan daftar kategori dan jenis peraturan", async () => {
      mockRepository.getKategoriList.mockResolvedValue([{ kategori: "SOTK", count: 5 }]);
      mockRepository.getJenisList.mockResolvedValue([{ jenis_peraturan: "PERBUP", count: 5 }]);

      const result = await service.getFilterOptions();
      expect(result.kategoriList).toHaveLength(1);
      expect(result.jenisList).toHaveLength(1);
    });
  });
});
