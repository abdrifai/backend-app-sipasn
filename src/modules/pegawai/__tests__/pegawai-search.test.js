import { jest } from "@jest/globals";

const mockFindMany = jest.fn();
const mockCount = jest.fn();

jest.unstable_mockModule("../../../config/database.js", () => ({
  default: {
    ta_pegawai: {
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

const { findAll } = await import("../pegawai.repository.js");

describe("Pegawai Repository - findAll (Aturan Pencarian NIP vs Nama)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
  });

  it("harus memfilter hanya pegawai aktif jika pencarian menggunakan Nama pada status='semua'", async () => {
    await findAll({
      page: 1,
      limit: 10,
      search: "Ahmad Fauzi",
      status: "semua",
    });

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const callArgs = mockFindMany.mock.calls[0][0];
    const andConditions = callArgs.where.AND;

    // Harus ada filter kedudukan aktif [1, 7, 8, 10]
    expect(andConditions).toContainEqual({
      kedudukanPns_id: { in: [1, 7, 8, 10] },
    });

    // Harus mencari berdasarkan nama
    expect(andConditions).toContainEqual({
      ta_orang: { nama: { contains: "Ahmad Fauzi" } },
    });
  });

  it("harus memperbolehkan pencarian semua status (aktif & non-aktif) jika menggunakan NIP", async () => {
    await findAll({
      page: 1,
      limit: 10,
      search: "198501012010011001",
      status: "semua",
    });

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const callArgs = mockFindMany.mock.calls[0][0];
    const andConditions = callArgs.where.AND;

    // Tidak boleh ada pembatasan kedudukan aktif [1, 7, 8, 10] karena status 'semua' & pencarian NIP
    expect(andConditions).not.toContainEqual({
      kedudukanPns_id: { in: [1, 7, 8, 10] },
    });

    // Harus mencari berdasarkan NIP
    expect(andConditions).toContainEqual({
      nipBaru: { contains: "198501012010011001" },
    });
  });

  it("harus memproses NIP yang mengandung spasi atau tanda hubung", async () => {
    await findAll({
      page: 1,
      limit: 10,
      search: "19850101 201001 1 001",
      status: "semua",
    });

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const callArgs = mockFindMany.mock.calls[0][0];
    const andConditions = callArgs.where.AND;

    // Harus mendeteksi sebagai NIP dan membersihkan format spasi
    expect(andConditions).toContainEqual({
      nipBaru: { contains: "198501012010011001" },
    });
  });

  it("harus tetap menerapkan status='aktif' jika eksplisit diminta", async () => {
    await findAll({
      page: 1,
      limit: 10,
      search: "Budi",
      status: "aktif",
    });

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const callArgs = mockFindMany.mock.calls[0][0];
    const andConditions = callArgs.where.AND;

    expect(andConditions).toContainEqual({
      kedudukanPns_id: { in: [1, 7, 8, 10] },
    });
    expect(andConditions).toContainEqual({
      ta_orang: { nama: { contains: "Budi" } },
    });
  });
});
