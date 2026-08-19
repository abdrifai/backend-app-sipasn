import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import errorMiddleware from "./middlewares/error.middleware.js";
import { globalRateLimiter } from "./middlewares/rateLimiter.middleware.js";
import AppError from "./utils/AppError.js";
import { serveStorageFile } from "./middlewares/storage.middleware.js";
import swaggerRoute from "./api-docs/swagger.js";

// Routes
import authRoute from "./modules/auth/auth.route.js";
import userRoute from "./modules/user/user.route.js";
import dbAnalysisRoute from "./modules/db-analysis/db-analysis.route.js";
import pegawaiRoute from "./modules/pegawai/pegawai.route.js";
import refPendidikanRoute from "./modules/ref-pendidikan/ref-pendidikan.route.js";
import refDiklatRoute from "./modules/ref-diklat/ref-diklat.route.js";
import refKedudukanPnsRoute from "./modules/ref-kedudukan-pns/ref-kedudukan-pns.route.js";
import refJnsMutasiRoute from "./modules/ref-jns-mutasi/ref-jns-mutasi.route.js";
import refJnsHukumanRoute from "./modules/ref-jns-hukuman/ref-jns-hukuman.route.js";
import refUnorRoute from "./modules/ref-unor/ref-unor.route.js";
import refInstansiRoute from "./modules/ref-instansi/ref-instansi.route.js";
import refJabatanRoute from "./modules/ref-jabatan/ref-jabatan.route.js";

const app = express();
app.set("trust proxy", 1);
// Add BigInt serialization support
BigInt.prototype.toJSON = function() { return this.toString() };

// 1. Security & parsing (Rule 02)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.CORS_ORIGIN_PROD
        : process.env.CORS_ORIGIN_DEV || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Serve static files (Rule 02)
app.use("/public", express.static("public"));
app.use("/storage", serveStorageFile, express.static("storage"));

// 2. Rate limiter global (Rule 07)
app.use(globalRateLimiter);

// 3. Routes (Rule 02)
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/db-analysis", dbAnalysisRoute);
app.use("/api/pegawai", pegawaiRoute);
app.use("/api/ref-pendidikan", refPendidikanRoute);
app.use("/api/ref-diklat", refDiklatRoute);
app.use("/api/ref-kedudukan-pns", refKedudukanPnsRoute);
app.use("/api/ref-jns-mutasi", refJnsMutasiRoute);
app.use("/api/ref-jns-hukuman", refJnsHukumanRoute);
app.use("/api/ref-unor", refUnorRoute);
app.use("/api/ref-instansi", refInstansiRoute);
app.use("/api/ref-jabatan", refJabatanRoute);

// Swagger API Documentation (Rule 04)
if (process.env.SWAGGER_ENABLED !== "false") {
  app.use("/api-docs", swaggerRoute);
}

// Home route
app.get("/", (req, res) => {
  res.json({ 
    message: "SIPASN Backend API is running",
    documentation: "/api-docs" 
  });
});

// 4. Handle 404 (Rule 02)
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} tidak ditemukan`, 404));
});

// 5. Global Error Middleware — HARUS PALING AKHIR (Rule 02)
app.use(errorMiddleware);

// Override console di production (Rule 08)
if (process.env.NODE_ENV === "production") {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
}

export default app;
