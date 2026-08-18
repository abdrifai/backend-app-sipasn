import multer from "multer";
import path from "path";
import fs from "fs";
import AppError from "../utils/AppError.js";

// Konfigurasi storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "storage/profile-foto";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Format: user-id-timestamp.ext
    const userId = req.user?.id || "temp";
    const ext = path.extname(file.originalname);
    cb(null, `profile-${userId}-${Date.now()}${ext}`);
  },
});

// Filter file (hanya gambar)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Format file tidak didukung. Gunakan JPG, PNG, atau WEBP", 400), false);
  }
};

export const uploadProfilePhoto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

// Konfigurasi storage foto pegawai
const fotoPegawaiStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "storage/profile-foto";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const pegawaiId = req.params?.id || "pegawai";
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `foto-pegawai-${pegawaiId}-${Date.now()}${ext}`);
  },
});

export const uploadFotoPegawai = multer({
  storage: fotoPegawaiStorage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

// Konfigurasi storage dokumen
const dokumenStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "storage/dokumen";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const pegawaiId = req.params?.id || "pegawai";
    const ext = path.extname(file.originalname);
    
    let prefix = "sk";
    const url = (req.originalUrl || req.baseUrl || "").toLowerCase();
    if (file.fieldname === "dokumen_transkrip" || file.fieldname === "transkrip") {
      prefix = "transkrip";
    } else if (file.fieldname === "dokumen_ijazah" || file.fieldname === "ijazah") {
      prefix = "ijazah";
    } else if (file.fieldname === "dokumen_diklat" || file.fieldname === "sertifikat" || file.fieldname === "sttpl") {
      prefix = "sttpl";
    } else if (file.fieldname === "dokumen_profesi" || file.fieldname === "str") {
      prefix = "profesi";
    } else if (file.fieldname === "dokumen_nikah" || file.fieldname === "buku_nikah" || file.fieldname === "dokumen_buku_nikah") {
      prefix = "buku-nikah";
    } else if (file.fieldname === "dokumen_anak" || file.fieldname === "akta_kelahiran") {
      prefix = "akta-kelahiran";
    } else if (url.includes("kgb")) {
      prefix = "sk-kgb";
    } else if (url.includes("golongan")) {
      prefix = "sk-gol";
    } else if (url.includes("jabatan")) {
      prefix = "sk-jab";
    } else if (url.includes("hukdis") || url.includes("hukuman")) {
      prefix = "sk-hukdis";
    } else if (url.includes("diklat") || url.includes("sertifikat") || url.includes("sttpl")) {
      prefix = "sttpl";
    } else if (url.includes("pendidikan")) {
      prefix = "ijazah";
    } else if (url.includes("profesi")) {
      prefix = "profesi";
    } else if (url.includes("pasangan") || url.includes("suis") || url.includes("nikah")) {
      prefix = "buku-nikah";
    } else if (url.includes("anak")) {
      prefix = "akta-kelahiran";
    } else if (url.includes("cpns") || url.includes("pns")) {
      prefix = "sk-cpnspns";
    }
    
    cb(null, `${prefix}-${pegawaiId}-${Date.now()}${ext}`);
  },
});

// Filter file dokumen (Hanya PDF)
const dokumenFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new AppError("Format file tidak didukung. Hanya file PDF yang diperbolehkan", 400), false);
  }
};

export const uploadDokumenSK = multer({
  storage: dokumenStorage,
  fileFilter: dokumenFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const uploadDokumenPendidikan = multer({
  storage: dokumenStorage,
  fileFilter: dokumenFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
}).fields([
  { name: "dokumen_ijazah", maxCount: 1 },
  { name: "dokumen_transkrip", maxCount: 1 },
]);


