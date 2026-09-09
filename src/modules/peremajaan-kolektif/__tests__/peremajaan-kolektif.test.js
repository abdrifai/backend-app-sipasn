import { jest } from "@jest/globals";

// Mock repository
jest.unstable_mockModule("../peremajaan-kolektif.repository.js", () => ({
  findAllSkKolektif: jest.fn().mockResolvedValue({
    data: [
      {
        id: "sk-1",
        no_sk: "800/123/2026",
        tgl_sk: new Date("2026-09-01"),
        tmt_sk: new Date("2026-09-01"),
        status: "DRAFT",
        total_pegawai: 2,
      },
    ],
    meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
  }),
  findSkKolektifById: jest.fn().mockImplementation(async (id) => {
    if (id === "sk-1") {
      return {
        id: "sk-1",
        no_sk: "800/123/2026",
        tgl_sk: new Date("2026-09-01"),
        tmt_sk: new Date("2026-09-01"),
        pengesahan: "Bupati",
        keterangan: "Pelantikan Massal",
        arsip_path: "storage/dokumen/sk-test.pdf",
        status: "DRAFT",
        pegawai_list: [
          {
            id: "peg-item-1",
            sk_kolektif_id: "sk-1",
            pegawai_id: "peg-1",
            nip: "198501012010011001",
            nama: "Ahmad Fauzi",
            jns_jab_id: "jns-1",
            unor_id: "unor-1",
            nm_jab_id: "jab-1",
            status: "DRAFT",
          },
        ],
      };
    }
    return null;
  }),
  createSkKolektif: jest.fn().mockResolvedValue({
    id: "sk-new",
    no_sk: "800/999/2026",
    status: "DRAFT",
  }),
  updateSkKolektif: jest.fn().mockResolvedValue({
    id: "sk-1",
    no_sk: "800/123/2026-REV",
    status: "DRAFT",
  }),
  softDeleteSkKolektif: jest.fn().mockResolvedValue({ id: "sk-1", is_deleted: true }),
  addPegawaiToSkKolektif: jest.fn().mockResolvedValue({
    id: "peg-item-new",
    sk_kolektif_id: "sk-1",
    pegawai_id: "peg-2",
    nip: "199001012015011002",
    nama: "Budi Santoso",
  }),
  findPegawaiInSkKolektif: jest.fn().mockResolvedValue(null),
  findSkKolektifPegawaiById: jest.fn().mockResolvedValue({
    id: "peg-item-1",
    sk_kolektif_id: "sk-1",
    pegawai_id: "peg-1",
  }),
  softDeletePegawaiFromSkKolektif: jest.fn().mockResolvedValue({ id: "peg-item-1", is_deleted: true }),
  getReferensiOptions: jest.fn().mockResolvedValue({
    jnsMutasi: [],
    jnsJab: [],
    eselon: [],
  }),
  searchPegawai: jest.fn().mockResolvedValue([]),
  searchJabatan: jest.fn().mockResolvedValue([]),
  searchUnor: jest.fn().mockResolvedValue([]),
}));

// Mock database prisma
jest.unstable_mockModule("../../../config/database.js", () => ({
  default: {
    ref_unitorganisasi: { findMany: jest.fn().mockResolvedValue([]) },
    ref_jabatan: { findMany: jest.fn().mockResolvedValue([]) },
    ref_jnsjab: { findMany: jest.fn().mockResolvedValue([]) },
    ref_eselon: { findMany: jest.fn().mockResolvedValue([]) },
    ta_pegawai: { findFirst: jest.fn().mockResolvedValue({ ta_orang: { nama: "Test" } }) },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      const mockTx = {
        rwt_jabatan: {
          create: jest.fn().mockResolvedValue({ id: "rwt-new" }),
          findFirst: jest.fn().mockResolvedValue({ id: "rwt-new" }),
        },
        ta_arsip: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: "arsip-new" }),
          update: jest.fn().mockResolvedValue({ id: "arsip-new" }),
        },
        ta_pegawai: {
          update: jest.fn().mockResolvedValue({ id: "peg-1" }),
        },
        ta_sk_kolektif_pegawai: {
          update: jest.fn().mockResolvedValue({ id: "peg-item-1" }),
        },
        ta_sk_kolektif: {
          update: jest.fn().mockResolvedValue({ id: "sk-1" }),
        },
      };
      return callback(mockTx);
    }),
  },
}));

// Mock pegawai.service.js
jest.unstable_mockModule("../../pegawai/pegawai.service.js", () => ({
  resolveUnorHierarchy: jest.fn().mockResolvedValue({
    instansi_id: "1",
    jnsUnor_id: "1",
    unorInduk_id: "unor-1",
    deepestUnor: { nmUnor: "Dinas Kesehatan", jab_id: "jab-1", level: "induk" },
  }),
}));

// Mock ref-unor.jabatan-resolver.js
jest.unstable_mockModule("../../ref-unor/ref-unor.jabatan-resolver.js", () => ({
  resolveJabatanForUnor: jest.fn().mockResolvedValue({ jab_id: "jab-1" }),
}));

describe("Peremajaan Kolektif Service", () => {
  let peremajaanService;

  beforeAll(async () => {
    peremajaanService = await import("../peremajaan-kolektif.service.js");
  });

  it("harus mengembalikan daftar SK Kolektif", async () => {
    const result = await peremajaanService.getAllSkKolektif();
    expect(result.data).toBeDefined();
    expect(result.data.length).toBe(1);
    expect(result.data[0].no_sk).toBe("800/123/2026");
  });

  it("harus mengembalikan rincian SK Kolektif berdasarkan ID", async () => {
    const result = await peremajaanService.getSkKolektifById("sk-1");
    expect(result).toBeDefined();
    expect(result.id).toBe("sk-1");
    expect(result.pegawai_list.length).toBe(1);
  });

  it("harus membuat SK Kolektif baru", async () => {
    const payload = {
      no_sk: "800/999/2026",
      tgl_sk: "2026-09-01",
      tmt_sk: "2026-09-01",
      pengesahan: "Bupati",
    };
    const result = await peremajaanService.createSkKolektif(payload, { path: "storage/test.pdf" });
    expect(result).toBeDefined();
    expect(result.id).toBe("sk-new");
  });

  it("harus menambahkan pegawai ke dalam SK Kolektif", async () => {
    const payload = {
      pegawai_id: "peg-2",
      nip: "199001012015011002",
      nama: "Budi Santoso",
      jns_jab_id: "jns-1",
      unor_id: "unor-1",
    };
    const result = await peremajaanService.addPegawaiToSkKolektif("sk-1", payload);
    expect(result).toBeDefined();
    expect(result.nip).toBe("199001012015011002");
  });

  it("harus berhasil memproses SK Kolektif ke Riwayat Jabatan", async () => {
    const result = await peremajaanService.processSkKolektif("sk-1", 1);
    expect(result).toBeDefined();
    expect(result.total_processed).toBe(1);
  });
});
