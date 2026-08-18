import { PrismaClient } from "@prisma/client";
import logger from "./logger.js";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

// Test koneksi saat startup
try {
  await prisma.$connect();
  logger.info("Database terhubung via Prisma");
} catch (error) {
  logger.error("Gagal koneksi ke database:", error);
  process.exit(1);
}

export default prisma;
