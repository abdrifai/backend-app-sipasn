import { jest } from "@jest/globals";

const mockGetGlobalStatistics = jest.fn();
const mockFindAllJkl = jest.fn();
const mockFindAllGol = jest.fn();
const mockFindAllUnorInduk = jest.fn();
const mockFindAllJnsJab = jest.fn();
const mockFindAllTktPend = jest.fn();
const mockFindAllJenjangJab = jest.fn();

jest.unstable_mockModule("../pegawai.repository.js", () => ({
  getGlobalStatistics: mockGetGlobalStatistics,
  findAllJkl: mockFindAllJkl,
  findAllGol: mockFindAllGol,
  findAllUnorInduk: mockFindAllUnorInduk,
  findAllJnsJab: mockFindAllJnsJab,
  findAllTktPend: mockFindAllTktPend,
  findAllJenjangJab: mockFindAllJenjangJab,
}));

const { getPegawaiStatistics } = await import("../pegawai.service.js");

describe("getPegawaiStatistics - Jenjang Jabatan", () => {
  it("harus mengembalikan statistik jenjang jabatan terurut sesuai hierarki", async () => {
    mockGetGlobalStatistics.mockResolvedValue({
      total: 10,
      byGender: [],
      byGolongan: [],
      byJabatan: [],
      byJenjangJabatan: [
        { jenjangJab_id: "4", _count: { _all: 5 } },
        { jenjangJab_id: "8", _count: { _all: 2 } },
        { jenjangJab_id: "1", _count: { _all: 3 } },
      ],
      byUnit: [],
      byEducation: [],
      birthdays: [],
    });

    mockFindAllJkl.mockResolvedValue([]);
    mockFindAllGol.mockResolvedValue([]);
    mockFindAllUnorInduk.mockResolvedValue([]);
    mockFindAllJnsJab.mockResolvedValue([]);
    mockFindAllTktPend.mockResolvedValue([]);
    mockFindAllJenjangJab.mockResolvedValue([
      { id: 1, jenjangjab: "Jabatan Administrator" },
      { id: 4, jenjangjab: "JF Keahlian" },
      { id: 8, jenjangjab: "Jabatan Pimpinan Tinggi Pratama" },
    ]);

    const result = await getPegawaiStatistics();

    expect(result).toHaveProperty("byJenjangJabatan");
    expect(result.byJenjangJabatan).toHaveLength(3);
    // Hierarki urutan: JPT Pratama (8) -> Administrator (1) -> JF Keahlian (4)
    expect(result.byJenjangJabatan[0].label).toBe("Jabatan Pimpinan Tinggi Pratama");
    expect(result.byJenjangJabatan[0].count).toBe(2);
    expect(result.byJenjangJabatan[1].label).toBe("Jabatan Administrator");
    expect(result.byJenjangJabatan[1].count).toBe(3);
    expect(result.byJenjangJabatan[2].label).toBe("JF Keahlian");
    expect(result.byJenjangJabatan[2].count).toBe(5);
  });
});
