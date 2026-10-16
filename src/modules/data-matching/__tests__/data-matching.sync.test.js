import { jest } from "@jest/globals";

// Mock repository
jest.unstable_mockModule("../data-matching.repository.js", () => ({
  cleanNip: (nip) => {
    if (!nip) return "";
    return String(nip).replace(/[^0-9]/g, "").trim();
  },
  findPegawaiForSyncGolongan: jest.fn(),
  findImportPnsForSyncGolongan: jest.fn(),
  findAllRefGol: jest.fn(),
  findExistingRiwayatGolongan: jest.fn(),
  findExistingSyncGolongan: jest.fn(),
  executeSyncGolonganItem: jest.fn(),
  linkExistingRiwayatToSyncQueue: jest.fn(),
  findSyncGolonganQueue: jest.fn(),
  getSyncGolonganStats: jest.fn(),
  findSyncGolonganById: jest.fn(),
  findArsipAndSkForRwtGolIds: jest.fn(),
  saveUploadSkGolongan: jest.fn(),
  softDeleteSyncGolongan: jest.fn(),
}));

const repository = await import("../data-matching.repository.js");
const service = await import("../data-matching.service.js");

describe("Data Matching - Sync Golongan & SK Queue", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("parseFlexibleDate", () => {
    it("harus mem-parse format DD-MM-YYYY dengan benar", () => {
      const parsed = service.parseFlexibleDate("01-06-2024");
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getUTCDate()).toBe(1);
      expect(parsed.getUTCMonth()).toBe(5); // June is index 5
      expect(parsed.getUTCFullYear()).toBe(2024);
    });

    it("harus mem-parse format YYYY-MM-DD dengan benar", () => {
      const parsed = service.parseFlexibleDate("2024-04-15");
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getUTCDate()).toBe(15);
      expect(parsed.getUTCMonth()).toBe(3); // April is index 3
      expect(parsed.getUTCFullYear()).toBe(2024);
    });

    it("harus mengembalikan null untuk input kosong atau tidak valid", () => {
      expect(service.parseFlexibleDate(null)).toBeNull();
      expect(service.parseFlexibleDate("")).toBeNull();
      expect(service.parseFlexibleDate("invalid-date-string")).toBeNull();
    });
  });

  describe("formatDokumenUrl", () => {
    it("harus memformat URL dokumen arsip", () => {
      expect(service.formatDokumenUrl(null)).toBeNull();
      expect(service.formatDokumenUrl("sk-123.pdf")).toBe("/storage/dokumen/sk-123.pdf");
      expect(service.formatDokumenUrl("storage/dokumen/sk-123.pdf")).toBe("/storage/dokumen/sk-123.pdf");
      expect(service.formatDokumenUrl("/storage/sk-123.pdf")).toBe("/storage/sk-123.pdf");
      expect(service.formatDokumenUrl("https://example.com/sk.pdf")).toBe("https://example.com/sk.pdf");
    });
  });

  describe("syncGolonganFromSiasn", () => {
    it("harus melempar error jika daftar NIP kosong", async () => {
      await expect(service.syncGolonganFromSiasn({ nips: [] })).rejects.toThrow();
      await expect(service.syncGolonganFromSiasn({ nips: null })).rejects.toThrow();
    });

    it("harus berhasil melakukan sinkronisasi golongan dan memasukkan ke antrean", async () => {
      repository.findPegawaiForSyncGolongan.mockResolvedValue([
        {
          id: "peg-1",
          nipBaru: "198501012010011001",
          ta_orang: { nama: "Ahmad Fauzi" },
          rwt_gol: { gol_id: "31", ref_gol: { gol: "III/a", pangkat: "Penata Muda" } },
        },
      ]);

      repository.findImportPnsForSyncGolongan.mockResolvedValue([
        {
          id: "import-1",
          nip_baru: "'198501012010011001",
          nama: "Ahmad Fauzi",
          gol_akhir_id: "33",
          gol_akhir_nama: "III/c",
          tmt_golongan: "01-04-2024",
          nomor_sk_pns: "821.2/100/BKD/2024",
          tanggal_sk_pns: "25-03-2024",
          mk_tahun: "8",
          mk_bulan: "2",
        },
      ]);

      repository.findAllRefGol.mockResolvedValue([
        { kdGol: "31", gol: "III/a", pangkat: "Penata Muda" },
        { kdGol: "32", gol: "III/b", pangkat: "Penata Muda Tingkat I" },
        { kdGol: "33", gol: "III/c", pangkat: "Penata" },
      ]);

      repository.findExistingSyncGolongan.mockResolvedValue(null);
      repository.findExistingRiwayatGolongan.mockResolvedValue(null);
      repository.executeSyncGolonganItem.mockResolvedValue({
        newRwtGol: { id: "rwt-new-1" },
        newSync: { id: "sync-1" },
      });

      const result = await service.syncGolonganFromSiasn({
        nips: ["198501012010011001"],
        userId: 1,
      });

      expect(result.successCount).toBe(1);
      expect(result.skippedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.results.success[0].gol_lama).toBe("III/a");
      expect(result.results.success[0].gol_baru).toBe("III/c");
      expect(repository.executeSyncGolonganItem).toHaveBeenCalled();
    });

    it("harus menandai skipped jika golongan sudah pernah disinkronkan ke antrean", async () => {
      repository.findPegawaiForSyncGolongan.mockResolvedValue([
        {
          id: "peg-1",
          nipBaru: "198501012010011001",
          ta_orang: { nama: "Ahmad Fauzi" },
          rwt_gol: { gol_id: "31", ref_gol: { gol: "III/a" } },
        },
      ]);

      repository.findImportPnsForSyncGolongan.mockResolvedValue([
        {
          id: "import-1",
          nip_baru: "198501012010011001",
          nama: "Ahmad Fauzi",
          gol_akhir_id: "33",
          gol_akhir_nama: "III/c",
          tmt_golongan: "01-04-2024",
        },
      ]);

      repository.findAllRefGol.mockResolvedValue([
        { kdGol: "33", gol: "III/c", pangkat: "Penata" },
      ]);

      repository.findExistingSyncGolongan.mockResolvedValue({ id: "sync-existing-1" });

      const result = await service.syncGolonganFromSiasn({
        nips: ["198501012010011001"],
        userId: 1,
      });

      expect(result.successCount).toBe(0);
      expect(result.skippedCount).toBe(1);
      expect(result.results.skipped[0].alasan).toContain("Sudah berada di antrean");
      expect(repository.executeSyncGolonganItem).not.toHaveBeenCalled();
    });
  });

  describe("getSyncGolonganQueue", () => {
    it("harus mengembalikan daftar antrean upload SK dengan metadata", async () => {
      repository.findSyncGolonganQueue.mockResolvedValue({
        items: [
          {
            id: "sync-1",
            rwt_gol_id: "rwt-1",
            nip: "198501012010011001",
            nama: "Ahmad Fauzi",
            gol_lama: "III/a",
            gol_baru: "III/c",
            status_sk: "PENDING",
            tmt_golongan: new Date("2024-04-01"),
          },
        ],
        total: 1,
      });

      repository.getSyncGolonganStats.mockResolvedValue({
        total: 1,
        pending: 1,
        uploaded: 0,
      });

      repository.findArsipAndSkForRwtGolIds.mockResolvedValue({
        arsipList: [{ from: "rwt-1", arsip: "sk-gol-123.pdf" }],
        rwtGolList: [{ id: "rwt-1", sk: "821/SK/2024", tglSk: new Date("2024-03-25") }],
      });

      const res = await service.getSyncGolonganQueue({ page: 1, limit: 15 });

      expect(res.items.length).toBe(1);
      expect(res.items[0].sk).toBe("821/SK/2024");
      expect(res.items[0].dokumen_url).toBe("/storage/dokumen/sk-gol-123.pdf");
      expect(res.stats.total).toBe(1);
      expect(res.meta.total).toBe(1);
    });
  });

  describe("uploadSkGolongan", () => {
    it("harus melempar 404 jika antrean tidak ditemukan", async () => {
      repository.findSyncGolonganById.mockResolvedValue(null);
      await expect(
        service.uploadSkGolongan({ syncId: "unknown", file: { filename: "sk.pdf" } })
      ).rejects.toThrow();
    });

    it("harus melempar 400 jika file tidak disertakan", async () => {
      repository.findSyncGolonganById.mockResolvedValue({ id: "sync-1" });
      await expect(
        service.uploadSkGolongan({ syncId: "sync-1", file: null })
      ).rejects.toThrow();
    });

    it("harus berhasil menyimpan upload SK fisik dan memperbarui status", async () => {
      repository.findSyncGolonganById.mockResolvedValue({
        id: "sync-1",
        rwt_gol_id: "rwt-1",
        pegawai_id: "peg-1",
      });

      repository.saveUploadSkGolongan.mockResolvedValue({
        id: "sync-1",
        status_sk: "UPLOADED",
        rwt_gol_id: "rwt-1",
      });

      const res = await service.uploadSkGolongan({
        syncId: "sync-1",
        file: { filename: "sk-gol-peg-1.pdf" },
        sk: "821.2/100/BKD/2024",
        tglSk: "25-03-2024",
      });

      expect(res.status_sk).toBe("UPLOADED");
      expect(res.dokumen_url).toBe("/storage/dokumen/sk-gol-peg-1.pdf");
      expect(repository.saveUploadSkGolongan).toHaveBeenCalled();
    });
  });

  describe("deleteSyncGolongan", () => {
    it("harus melempar 404 jika antrean tidak ada", async () => {
      repository.findSyncGolonganById.mockResolvedValue(null);
      await expect(service.deleteSyncGolongan("unknown")).rejects.toThrow();
    });

    it("harus memanggil softDeleteSyncGolongan", async () => {
      repository.findSyncGolonganById.mockResolvedValue({ id: "sync-1" });
      repository.softDeleteSyncGolongan.mockResolvedValue({ id: "sync-1", is_deleted: true });

      const res = await service.deleteSyncGolongan("sync-1");
      expect(res.id).toBe("sync-1");
      expect(repository.softDeleteSyncGolongan).toHaveBeenCalledWith("sync-1");
    });
  });
});
