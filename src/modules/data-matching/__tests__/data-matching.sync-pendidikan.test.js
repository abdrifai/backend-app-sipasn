import { jest } from "@jest/globals";

// Mock repository
jest.unstable_mockModule("../data-matching.repository.js", () => ({
  cleanNip: (nip) => {
    if (!nip) return "";
    return String(nip).replace(/[^0-9]/g, "").trim();
  },
  findLocalPegawaiByNip: jest.fn(),
  findImportPnsByNip: jest.fn(),
  findAllRefTktPend: jest.fn(),
  findRefPendById: jest.fn(),
  findRefPendByKodeOrName: jest.fn(),
  searchRefPendList: jest.fn(),
  findExistingSyncPendidikan: jest.fn(),
  findExistingRiwayatPendidikan: jest.fn(),
  executeSyncPendidikanItem: jest.fn(),
  linkExistingRiwayatPendidikanToSyncQueue: jest.fn(),
  findSyncPendidikanQueue: jest.fn(),
  getSyncPendidikanStats: jest.fn(),
  findArsipAndDetailsForRwtPendIds: jest.fn(),
  findSyncPendidikanById: jest.fn(),
  saveUploadIjazahPendidikan: jest.fn(),
  softDeleteSyncPendidikan: jest.fn(),
}));

const repository = await import("../data-matching.repository.js");
const service = await import("../data-matching.service.js");

describe("Data Matching - Sync Pendidikan & Ijazah Queue", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("deriveSuggestedTktPendId", () => {
    it("harus memetakan tingkat pendidikan SIASN dengan benar", () => {
      expect(service.deriveSuggestedTktPendId("05", "Sekolah Dasar", "")).toBe("1");
      expect(service.deriveSuggestedTktPendId("10", "SLTP", "")).toBe("2");
      expect(service.deriveSuggestedTktPendId("15", "SLTA", "")).toBe("3");
      expect(service.deriveSuggestedTktPendId("30", "Diploma III", "")).toBe("6");
      expect(service.deriveSuggestedTktPendId("40", "S-1/Sarjana", "")).toBe("8");
      expect(service.deriveSuggestedTktPendId("42", "Profesi", "")).toBe("8");
      expect(service.deriveSuggestedTktPendId("45", "S-2", "")).toBe("9");
      expect(service.deriveSuggestedTktPendId("50", "S-3/Doktor", "")).toBe("10");
    });

    it("harus fallback ke prefix nama jika kode tingkat tidak tersedia", () => {
      expect(service.deriveSuggestedTktPendId("", "", "S-1 ILMU HUKUM")).toBe("8");
      expect(service.deriveSuggestedTktPendId("", "", "D-III KEBIDANAN")).toBe("6");
      expect(service.deriveSuggestedTktPendId("", "", "S-2 MANAJEMEN")).toBe("9");
    });
  });

  describe("checkEducationSync", () => {
    it("harus melempar error jika NIP kosong", async () => {
      await expect(service.checkEducationSync("")).rejects.toThrow();
    });

    it("harus mengembalikan detail matching dan status jika referensi ditemukan", async () => {
      repository.findLocalPegawaiByNip.mockResolvedValue({
        id: "peg-1",
        nipBaru: "199201292017042004",
        ta_orang: { nama: "SITI AMINAH" },
        rwt_pend: {
          pend_id: "pend-old",
          jurusan: "D-III KEBIDANAN",
          thnLulus: "2014",
        },
      });

      repository.findImportPnsByNip.mockResolvedValue({
        nip_baru: "199201292017042004",
        nama: "SITI AMINAH",
        pendidikan_id: "KODE-S1-BIDAN",
        pendidikan_nama: "S-1 KEBIDANAN",
        tingkat_pendidikan_id: "40",
        tingkat_pendidikan_nama: "S-1/Sarjana",
        tahun_lulus: "2024",
      });

      repository.findAllRefTktPend.mockResolvedValue([
        { id: "8", tktpend: "S-1" },
        { id: "6", tktpend: "D-III" },
      ]);

      repository.findRefPendById.mockResolvedValue({
        id: "pend-old",
        pend: "D-III KEBIDANAN",
      });

      repository.findRefPendByKodeOrName.mockResolvedValue({
        id: "ref-s1-bidan",
        pend: "S-1 KEBIDANAN",
        kode: "KODE-S1-BIDAN",
        tktpend_id: "8",
        ref_tktpend: { tktpend: "S-1" },
      });

      const res = await service.checkEducationSync("199201292017042004");
      expect(res.nip).toBe("199201292017042004");
      expect(res.matched_ref).not.toBeNull();
      expect(res.matched_ref.id).toBe("ref-s1-bidan");
      expect(res.suggestion.tktpend_id).toBe("8");
    });

    it("harus mengembalikan matched_ref null jika belum ada di master referensi", async () => {
      repository.findLocalPegawaiByNip.mockResolvedValue({
        id: "peg-1",
        nipBaru: "199201292017042004",
        ta_orang: { nama: "SITI AMINAH" },
        rwt_pend: null,
      });

      repository.findImportPnsByNip.mockResolvedValue({
        nip_baru: "199201292017042004",
        nama: "SITI AMINAH",
        pendidikan_id: "KODE-NEW",
        pendidikan_nama: "S-1 TEKNOLOGI REKAYASA",
        tingkat_pendidikan_id: "40",
        tingkat_pendidikan_nama: "S-1/Sarjana",
        tahun_lulus: "2024",
      });

      repository.findAllRefTktPend.mockResolvedValue([
        { id: "8", tktpend: "S-1" },
      ]);

      repository.findRefPendByKodeOrName.mockResolvedValue(null);
      repository.searchRefPendList.mockResolvedValue([]);

      const res = await service.checkEducationSync("199201292017042004");
      expect(res.matched_ref).toBeNull();
      expect(res.suggestion.pend).toBe("S-1 TEKNOLOGI REKAYASA");
      expect(res.suggestion.tktpend_id).toBe("8");
    });
  });

  describe("syncEducationFromSiasn", () => {
    it("harus berhasil membuat referensi baru dan riwayat saat mode new", async () => {
      repository.findLocalPegawaiByNip.mockResolvedValue({
        id: "peg-1",
        nipBaru: "199201292017042004",
        ta_orang: { nama: "SITI AMINAH" },
        rwt_pend: null,
      });

      repository.findImportPnsByNip.mockResolvedValue({
        nip_baru: "199201292017042004",
        nama: "SITI AMINAH",
        tahun_lulus: "2024",
      });

      repository.findAllRefTktPend.mockResolvedValue([
        { id: "8", tktpend: "S-1" },
      ]);

      repository.findRefPendByKodeOrName.mockResolvedValue(null);
      repository.findExistingSyncPendidikan.mockResolvedValue(null);
      repository.findExistingRiwayatPendidikan.mockResolvedValue(null);

      repository.executeSyncPendidikanItem.mockResolvedValue({
        newRwtPend: { id: "rwt-new" },
        newSync: { id: "sync-pend-1" },
      });

      const res = await service.syncEducationFromSiasn({
        nip: "199201292017042004",
        mode: "new",
        new_ref: {
          tktpend_id: 8,
          pend: "S-1 TEKNOLOGI REKAYASA",
          kode: "KODE-NEW",
        },
      });

      expect(res.status).toBe("created");
      expect(res.sync_id).toBe("sync-pend-1");
      expect(repository.executeSyncPendidikanItem).toHaveBeenCalled();
    });

    it("harus menggunakan referensi yang dipilih saat mode existing", async () => {
      repository.findLocalPegawaiByNip.mockResolvedValue({
        id: "peg-1",
        nipBaru: "199201292017042004",
        ta_orang: { nama: "SITI AMINAH" },
        rwt_pend: null,
      });

      repository.findImportPnsByNip.mockResolvedValue({
        nip_baru: "199201292017042004",
        nama: "SITI AMINAH",
        tahun_lulus: "2024",
      });

      repository.findRefPendById.mockResolvedValue({
        id: "ref-existing",
        pend: "S-1 ILMU HUKUM",
        tktpend_id: 8,
        ref_tktpend: { tktpend: "S-1" },
      });

      repository.findExistingSyncPendidikan.mockResolvedValue(null);
      repository.findExistingRiwayatPendidikan.mockResolvedValue(null);

      repository.executeSyncPendidikanItem.mockResolvedValue({
        newRwtPend: { id: "rwt-new" },
        newSync: { id: "sync-pend-2" },
      });

      const res = await service.syncEducationFromSiasn({
        nip: "199201292017042004",
        mode: "existing",
        selected_pend_id: "ref-existing",
      });

      expect(res.status).toBe("created");
      expect(res.sync_id).toBe("sync-pend-2");
    });
  });

  describe("uploadIjazahPendidikan & deleteSyncPendidikan", () => {
    it("harus berhasil mengunggah file ijazah", async () => {
      repository.findSyncPendidikanById.mockResolvedValue({
        id: "sync-1",
        rwt_pend_id: "rwt-1",
        pegawai_id: "peg-1",
      });

      repository.saveUploadIjazahPendidikan.mockResolvedValue({
        id: "sync-1",
        status_ijazah: "UPLOADED",
      });

      const res = await service.uploadIjazahPendidikan({
        syncId: "sync-1",
        file: { filename: "ijazah.pdf" },
        noIjazah: "123/UNAIR/2024",
      });

      expect(res.status_ijazah).toBe("UPLOADED");
      expect(res.dokumen_url).toBe("/storage/dokumen/ijazah.pdf");
    });

    it("harus berhasil soft delete antrean ijazah", async () => {
      repository.findSyncPendidikanById.mockResolvedValue({ id: "sync-1" });
      repository.softDeleteSyncPendidikan.mockResolvedValue({ id: "sync-1", is_deleted: true });

      const res = await service.deleteSyncPendidikan("sync-1");
      expect(res.id).toBe("sync-1");
      expect(repository.softDeleteSyncPendidikan).toHaveBeenCalledWith("sync-1");
    });
  });
});
