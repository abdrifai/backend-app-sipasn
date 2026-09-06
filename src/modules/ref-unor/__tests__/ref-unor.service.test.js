import * as service from "../ref-unor.service.js";

describe("Ref Unor Service - Reorder & Ordering", () => {
  it("harus mengekspor reorderUnorNodes fungsi", () => {
    expect(typeof service.reorderUnorNodes).toBe("function");
  });

  it("harus menolak payload reorder kosong", async () => {
    await expect(service.reorderUnorNodes({ items: [] })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("harus mengekspor getActivePegawaiInUnor dan validateCanDeactivateUnor", () => {
    expect(typeof service.getActivePegawaiInUnor).toBe("function");
    expect(typeof service.validateCanDeactivateUnor).toBe("function");
  });

  it("harus dapat mengecek pegawai aktif pada unor", async () => {
    const res = await service.getActivePegawaiInUnor("non-existent-id");
    expect(res).toHaveProperty("count", 0);
    expect(res).toHaveProperty("pegawai");
  });
});

