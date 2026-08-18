import "dotenv/config";
import app from "./src/app.js";
import logger from "./src/config/logger.js";

const PORT = process.env.PORT || 3000;

/**
 * Validasi environment variables saat startup (Rule 07)
 */
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];
const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  logger.error(`Environment variable tidak lengkap: ${missing.join(", ")}`);
  // Jangan exit jika hanya DATABASE_URL masi kosong saat setup awal, 
  // namun untuk production ini wajib.
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

app.listen(PORT, () => {
  logger.info(`Server berjalan di port ${PORT} dalam mode ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Dokumentasi API: http://localhost:${PORT}/api-docs (jika diaktifkan)`);
});

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! Mematikan server...");
  logger.error(err.name, err.message);
  process.exit(1);
});
