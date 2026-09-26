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
  findPegawaiByUnor: jest.fn().mockResolvedValue([
    {
      id: "peg-1",
      nip: "198501012010011001",
      nama_raw: "Ahmad Fauzi",
      gd: "Drs.",
      gb: "M.Si",
      nik: "1234567890",
      golongan: "IV/a",
      pangkat: "Pembina",
      jabatan: "Kepala Bidang",
      unit_kerja: "Dinas Pendidikan",
      unor_id: "unor-1",
      is_already_in_sk: false,
    },
  ]),
  addPegawaiBatch: jest.fn().mockImplementation(async (records) => {
    return records.map((r, i) => ({
      ...r,
      id: `peg-batch-${i + 1}`,
      created_at: new Date(),
    }));
  }),
  findAllMutasiUnor: jest.fn().mockResolvedValue({
    data: [
      {
        id: "mutasi-1",
        tgl_mutasi: new Date(),
        asal_unor_id: "unor-1",
        tujuan_unor_id: "unor-tujuan-1",
        keterangan: "Penataan OPD",
        status: "APPLIED",
        total_pegawai: 1,
      },
    ],
    meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
  }),
  findMutasiUnorById: jest.fn().mockImplementation(async (id) => {
    if (id === "mutasi-1") {
      return {
        id: "mutasi-1",
        tgl_mutasi: new Date(),
        asal_unor_id: "unor-1",
        tujuan_unor_id: "unor-tujuan-1",
        keterangan: "Penataan OPD",
        status: "APPLIED",
        pegawai_list: [
          {
            id: "mp-1",
            mutasi_unor_id: "mutasi-1",
            pegawai_id: "peg-1",
            nip: "198501012010011001",
            nama: "Ahmad Fauzi",
            rwt_jab_id: "rwt-1",
            old_unorInduk_id: "unor-1",
            new_unorInduk_id: "unor-tujuan-1",
          },
        ],
      };
    }
    return null;
  }),
  createMutasiUnorTransaction: jest.fn().mockResolvedValue({
    id: "mutasi-new",
    asal_unor_id: "unor-1",
    tujuan_unor_id: "unor-tujuan-1",
    status: "APPLIED",
  }),
  restoreMutasiUnorTransaction: jest.fn().mockResolvedValue({
    id: "mutasi-1",
    status: "RESTORED",
  }),
}));

// Mock database prisma
jest.unstable_mockModule("../../../config/database.js", () => ({
  default: {
    ref_unitorganisasi: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({
        id: "unor-tujuan-1",
        nmUnor: "Dinas Kesehatan",
        jab_id: "jab-struktural-1",
        level: "induk",
        isAktif: 1,
      }),
    },
    ref_jabatan: { findMany: jest.fn().mockResolvedValue([]) },
    ref_jnsjab: { findMany: jest.fn().mockResolvedValue([]) },
    ref_jenjangjab: { findMany: jest.fn().mockResolvedValue([]) },
    ref_eselon: { findMany: jest.fn().mockResolvedValue([]) },
    ta_sk_kolektif_pegawai: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    ta_pegawai: {
      findFirst: jest.fn().mockResolvedValue({ ta_orang: { nama: "Test" } }),
      findMany: jest.fn().mockResolvedValue([
        {
          id: "peg-1",
          nipBaru: "198501012010011001",
          ta_orang: { nama: "Ahmad Fauzi" },
          rwt_pend: { gd: "Drs.", gb: "M.Si" },
          rwt_jabatan: {
            id: "rwt-1",
            unorInduk_id: "unor-1",
            unor_id: "unor-1",
            nmJab_id: "jab-1",
            ref_jabatan: { eselon_id: "eselon-1", jns_jab_id: "jns-1" },
          },
        },
      ]),
    },
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
  formatNamaGelar: jest.fn((nama, gd, gb) => {
    return [gd, nama, gb].filter(Boolean).join(" ");
  }),
}));

// Mock ref-unor/ref-unor.service.js
jest.unstable_mockModule("../../ref-unor/ref-unor.service.js", () => ({
  getAllUnorDescendantIds: jest.fn().mockResolvedValue(["unor-1", "unor-sub-1"]),
}));

// Mock ref-unor.jabatan-resolver.js
jest.unstable_mockModule("../../ref-unor/ref-unor.jabatan-resolver.js", () => ({
  resolveJabatanForUnor: jest.fn().mockResolvedValue({ jab_id: "jab-1" }),
}));

describe("Peremajaan Kolektif Service", () => {
  let peremajaanService;
  let prisma;

  beforeAll(async () => {
    peremajaanService = await import("../peremajaan-kolektif.service.js");
    prisma = (await import("../../../config/database.js")).default;
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

  it("harus mengembalikan daftar pegawai berdasarkan unit organisasi (getPegawaiByUnor)", async () => {
    const result = await peremajaanService.getPegawaiByUnor({
      unor_id: "unor-1",
      include_sub: true,
    });
    expect(result).toBeDefined();
    expect(result.length).toBe(1);
    expect(result[0].nama).toBe("Drs. Ahmad Fauzi M.Si");
  });

  it("harus menambahkan mutasi masal pegawai ke dalam SK Kolektif (addPegawaiBatchToSkKolektif)", async () => {
    const payload = {
      target_unor_id: "unor-tujuan-1",
      target_nm_jab_id: "jab-tujuan-1",
      keterangan: "Mutasi Masal OPD",
      pegawai_list: [
        {
          pegawai_id: "peg-1",
          nip: "198501012010011001",
          nama: "Ahmad Fauzi",
        },
      ],
    };
    const result = await peremajaanService.addPegawaiBatchToSkKolektif("sk-1", payload);
    expect(result).toBeDefined();
    expect(result.total_added).toBe(1);
    expect(result.items.length).toBe(1);
    expect(result.items[0].unor_id).toBe("unor-tujuan-1");
  });

  it("harus berhasil memproses SK Kolektif ke Riwayat Jabatan", async () => {
    const result = await peremajaanService.processSkKolektif("sk-1", 1);
    expect(result).toBeDefined();
    expect(result.total_processed).toBe(1);
  });

  it("harus mengembalikan daftar riwayat mutasi unor (getAllMutasiUnor)", async () => {
    const result = await peremajaanService.getAllMutasiUnor();
    expect(result.data).toBeDefined();
    expect(result.data.length).toBe(1);
    expect(result.data[0].id).toBe("mutasi-1");
  });

  it("harus mengembalikan rincian mutasi unor (getMutasiUnorById)", async () => {
    const result = await peremajaanService.getMutasiUnorById("mutasi-1");
    expect(result).toBeDefined();
    expect(result.id).toBe("mutasi-1");
    expect(result.pegawai_list.length).toBe(1);
  });

  it("harus menerapkan mutasi unor langsung tanpa SK (createMutasiUnor)", async () => {
    const payload = {
      asal_unor_id: "unor-1",
      tujuan_unor_id: "unor-tujuan-1",
      keterangan: "Penataan OPD",
      pegawai_ids: ["peg-1"],
    };
    const result = await peremajaanService.createMutasiUnor(payload, 1);
    expect(result).toBeDefined();
    expect(result.id).toBe("mutasi-new");
    expect(result.total_pegawai).toBe(1);
  });

  it("harus menerapkan mutasi unor sekaligus memperbarui jabatan struktural baru", async () => {
    const payload = {
      asal_unor_id: "unor-1",
      tujuan_unor_id: "unor-tujuan-1",
      keterangan: "Rotasi Jabatan Struktural",
      pegawai_list: [
        {
          pegawai_id: "peg-1",
          nm_jab_id: "jab-struktural-baru",
        },
      ],
    };
    const result = await peremajaanService.createMutasiUnor(payload, 1);
    expect(result).toBeDefined();
    expect(result.id).toBe("mutasi-new");
    expect(result.total_pegawai).toBe(1);
  });

  it("harus mengembalikan posisi pegawai ke unit asal (restoreMutasiUnor)", async () => {
    const result = await peremajaanService.restoreMutasiUnor("mutasi-1", 1);
    expect(result).toBeDefined();
    expect(result.status).toBe("RESTORED");
    expect(result.total_restored).toBe(1);
  });

  it("harus menolak restore jika unit organisasi asal berstatus Non-Aktif", async () => {
    prisma.ref_unitorganisasi.findFirst.mockResolvedValueOnce({
      id: "unor-asal-1",
      nmUnor: "Dinas Pertanian Lama",
      isAktif: 0,
    });

    await expect(peremajaanService.restoreMutasiUnor("mutasi-1", 1)).rejects.toThrow(
      /berstatus Non-Aktif/
    );
  });
});


