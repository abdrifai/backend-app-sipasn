import * as service from "../ref-unor.service.js";
import * as treeService from "../ref-unor.tree.service.js";

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

  it("harus dapat memanggil getAllUnorInduk dengan opsi includeInactive", async () => {
    const res = await service.getAllUnorInduk({ limit: 5, includeInactive: true });
    expect(res).toHaveProperty("data");
    expect(Array.isArray(res.data)).toBe(true);
  });

  it("harus dapat memanggil getUnorTree dengan opsi includeInactive", async () => {
    const res = await treeService.getUnorTree({ kode: 7209, includeInactive: true });
    expect(Array.isArray(res)).toBe(true);
  });
});

