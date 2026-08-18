import prisma from "../../config/database.js";

/**
 * Mengambil daftar semua tabel dalam database saat ini
 */
export const getAllTables = async (dbName) => {
  return prisma.$queryRawUnsafe(
    `SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH 
     FROM information_schema.TABLES 
     WHERE TABLE_SCHEMA = ?`,
    dbName
  );
};

/**
 * Mengambil detail kolom untuk tabel tertentu
 */
export const getTableColumns = async (dbName, tableName) => {
  return prisma.$queryRawUnsafe(
    `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA
     FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    dbName,
    tableName
  );
};
