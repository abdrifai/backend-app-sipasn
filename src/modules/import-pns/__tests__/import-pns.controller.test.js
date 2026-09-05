import { jest } from "@jest/globals";

jest.unstable_mockModule("../import-pns.service.js", () => ({
  processCsvImport: jest.fn(),
  getImportedPnsList: jest.fn(),
  getImportedPnsById: jest.fn(),
  getImportSummary: jest.fn(),
  deleteBatch: jest.fn(),
  deleteSingleRecord: jest.fn(),
  getCsvTemplate: jest.fn(),
}));

const importPnsService = await import("../import-pns.service.js");
const importPnsController = await import("../import-pns.controller.js");

describe("Import PNS Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("uploadCsv", () => {
    it("harus mengembalikan 201 jika upload berhasil", async () => {
      req.file = {
        buffer: Buffer.from("header\nvalue"),
        originalname: "data.csv",
      };
      const mockResult = { batchId: "b-1", fileName: "data.csv", insertedCount: 1 };
      importPnsService.processCsvImport.mockResolvedValue(mockResult);

      await importPnsController.uploadCsv(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          statusCode: 201,
          data: mockResult,
        })
      );
    });
  });

  describe("getList", () => {
    it("harus mengembalikan list data import", async () => {
      req.query = { page: "1", limit: "10" };
      const mockData = {
        data: [{ id: "1", nama: "Budi" }],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      importPnsService.getImportedPnsList.mockResolvedValue(mockData);

      await importPnsController.getList(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockData.data,
          meta: mockData.meta,
        })
      );
    });
  });
});
