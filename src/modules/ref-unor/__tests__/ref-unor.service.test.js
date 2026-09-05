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
});
