import * as dbRepository from "./db-analysis.repository.js";

/**
 * Melakukan analisis struktur database
 */
export const analyzeDatabase = async () => {
  // Ambil nama database dari connection string (via parse atau env)
  const dbUrl = process.env.DATABASE_URL || "";
  const dbName = dbUrl.split("/").pop().split("?")[0];

  if (!dbName) {
    throw new Error("Gagal mendapatkan nama database dari DATABASE_URL");
  }

  const tables = await dbRepository.getAllTables(dbName);
  const analysisResults = [];

  for (const table of tables) {
    const tableName = table.TABLE_NAME;
    const columns = await dbRepository.getTableColumns(dbName, tableName);
    
    const columnNames = columns.map(c => c.COLUMN_NAME.toLowerCase());
    
    // Check standard fields (Rule 05)
    const missingFields = [];
    if (!columnNames.includes("id")) missingFields.push("id");
    if (!columnNames.includes("is_deleted")) missingFields.push("is_deleted (soft-delete)");
    if (!columnNames.includes("created_at")) missingFields.push("created_at");
    if (!columnNames.includes("updated_at")) missingFields.push("updated_at");

    // Check potential optimizations
    const optimizations = [];
    columns.forEach(col => {
      if (col.DATA_TYPE === "float" || col.DATA_TYPE === "double") {
        optimizations.push(`Kolom '${col.COLUMN_NAME}' menggunakan ${col.DATA_TYPE}. Disarankan menggunakan Decimal untuk data presisi.`);
      }
    });

    analysisResults.push({
      tableName,
      rowCount: table.TABLE_ROWS,
      sizeMB: ((parseInt(table.DATA_LENGTH) + parseInt(table.INDEX_LENGTH)) / 1024 / 1024).toFixed(2),
      status: missingFields.length === 0 ? "Standar" : "Perlu Perhatian",
      missingStandardFields: missingFields,
      optimizations: optimizations,
      isRedundantCandidate: table.TABLE_ROWS === 0 && !tableName.startsWith("_") 
    });
  }

  return {
    database: dbName,
    totalTables: tables.length,
    results: analysisResults,
    summary: {
      redundantCandidates: analysisResults.filter(r => r.isRedundantCandidate).length,
      nonStandardTables: analysisResults.filter(r => r.missingStandardFields.length > 0).length
    }
  };
};
