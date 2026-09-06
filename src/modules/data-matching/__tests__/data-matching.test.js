import { jest } from "@jest/globals";

// Mock repository
jest.unstable_mockModule("../data-matching.repository.js", () => ({
  cleanNip: (nip) => {
    if (!nip) return "";
    return String(nip).replace(/[^0-9]/g, "").trim();
  },
  getReferenceMaps: jest.fn().mockResolvedValue({
    agamaMap: new Map([["1", "Islam"]]),
    kawinMap: new Map([["1", "Menikah"]]),
    kedudukanMap: new Map([["1", "Aktif"]]),
    tktPendMap: new Map([["6", "S-1/Sarjana"]]),
    unorMap: new Map([["unor-1", "Dinas Kesehatan"]]),
  }),
  findAllLocalPegawai: jest.fn().mockResolvedValue([
    {
      id: "local-1",
      nipBaru: "198501012010011001",
      ta_orang: { nama: "Ahmad Fauzi", t4Lhr: "Ampana", tglLhr: new Date("1985-01-01"), agama_id: "1", kawin_id: "1" },
      rwt_gol: { gol_id: "33", ref_gol: { gol: "III/c", pangkat: "Penata" }, tmtSk: new Date("2020-04-01") },
      rwt_jabatan: { unorInduk_id: "unor-1", ref_jabatan: { nama_jabatan: "Pranata Komputer Ahli Muda" }, ref_unitorganisasi: { nmUnor: "Dinas Kesehatan" } },
      rwt_pend: { tktPend_id: 6, jurusan: "Teknik Informatika", gd: "", gb: "S.Kom." },
      kedudukanPns_id: 1,
    }
  ]),
  findAllImportPns: jest.fn().mockResolvedValue([
    {
      id: "siasn-1",
      nip_baru: "'198501012010011001",
      nama: "Ahmad Fauzi",
      gelar_depan: "",
      gelar_belakang: "S.Kom.",
      gol_akhir_nama: "III/c",
      jabatan_nama: "Pranata Komputer Ahli Muda",
      unor_nama: "Dinas Kesehatan",
      kedudukan_pns_nama: "Aktif",
    }
  ]),
  findLocalPegawaiByNip: jest.fn().mockResolvedValue({
    id: "local-1",
    nipBaru: "198001012005011001",
    ta_orang: { nama: "Ahmad Fauzi", t4Lhr: "Ampana", tglLhr: new Date("1980-01-01"), agama_id: "1", kawin_id: "1" },
    rwt_gol: { gol_id: "33", ref_gol: { gol: "III/c", pangkat: "Penata" }, tmtSk: new Date("2020-04-01") },
    rwt_jabatan: { unorInduk_id: "unor-1", ref_jabatan: { nama_jabatan: "Pranata Komputer Ahli Muda" }, ref_unitorganisasi: { nmUnor: "Dinas Kesehatan" } },
    rwt_pend: { tktPend_id: 6, jurusan: "Teknik Informatika", gd: "", gb: "S.Kom." },
    kedudukanPns_id: 1,
  }),
  findImportPnsByNip: jest.fn().mockResolvedValue({
    id: "siasn-1",
    nip_baru: "'198001012005011001",
    nama: "Ahmad Fauzi",
    gelar_depan: "",
    gelar_belakang: "S.Kom.",
    gol_akhir_nama: "III/c",
    jabatan_nama: "Pranata Komputer Ahli Muda",
    unor_nama: "Dinas Kesehatan",
    kedudukan_pns_nama: "Aktif",
  }),
}));

const repository = await import("../data-matching.repository.js");
const service = await import("../data-matching.service.js");

describe("Data Matching Module", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("cleanNip should remove non-digits and trim strings", () => {
    expect(repository.cleanNip("'197810282007012010")).toBe("197810282007012010");
    expect(repository.cleanNip(" 19850101 201001 1 001 ")).toBe("198501012010011001");
    expect(repository.cleanNip(null)).toBe("");
    expect(repository.cleanNip("")).toBe("");
  });

  it("getMatchingStats should return statistics structure", async () => {
    const stats = await service.getMatchingStats();
    expect(stats).toHaveProperty("total_lokal");
    expect(stats).toHaveProperty("total_siasn");
    expect(stats).toHaveProperty("total_all");
    expect(stats).toHaveProperty("match_count");
    expect(stats).toHaveProperty("mismatch_count");
    expect(stats).toHaveProperty("only_local_count");
    expect(stats).toHaveProperty("only_siasn_count");
    expect(stats).toHaveProperty("mismatch_breakdown");
    expect(stats.mismatch_breakdown).toHaveProperty("golongan");
    expect(stats.mismatch_breakdown).toHaveProperty("jabatan");
    expect(stats.mismatch_breakdown).toHaveProperty("unor");
    expect(stats.mismatch_breakdown).toHaveProperty("nama");
    expect(stats.mismatch_breakdown).toHaveProperty("kedudukan");
  });

  it("getMatchingList should return paginated list and meta", async () => {
    const result = await service.getMatchingList({ page: 1, limit: 10 });
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("meta");
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
  });

  it("getMatchingDetail should return 19 comparison fields", async () => {
    const detail = await service.getMatchingDetail("198001012005011001");
    expect(detail).toHaveProperty("nip", "198001012005011001");
    expect(detail).toHaveProperty("fields");
    expect(detail.fields.length).toBe(19);
    expect(detail.fields[0].label).toBe("NIP");
  });

  it("generateMatchingExcel should return a valid Excel buffer", async () => {
    const buffer = await service.generateMatchingExcel({ limit: 10 });
    expect(buffer).toBeDefined();
    expect(Buffer.isBuffer(Buffer.from(buffer))).toBe(true);
  });
});
