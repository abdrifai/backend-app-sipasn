import path from "path";
import fs from "fs";

/**
 * Middleware untuk menyajikan file storage secara fleksibel dan aman.
 * Mendukung pencarian fallback otomatis ke subdirektori (ijazah, kp, kgb, arsip, dsb.)
 * jika struktur folder di server berbeda dari path database.
 */
export const serveStorageFile = (req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.removeHeader("Content-Security-Policy");
  const storageRoot = path.resolve(process.cwd(), "storage");
  const rawPath = decodeURIComponent(req.path || "").replace(/^\/+/, "");
  
  if (!rawPath) return next();

  // 1. Cek path langsung yang diminta
  const directPath = path.resolve(storageRoot, rawPath);
  if (directPath.startsWith(storageRoot) && fs.existsSync(directPath)) {
    try {
      if (fs.statSync(directPath).isFile()) {
        return res.sendFile(directPath);
      }
    } catch {
      // Lanjut ke fallback jika gagal stat
    }
  }

  // 2. Pencarian fallback berdasarkan nama file (basename)
  const filename = path.basename(rawPath);
  if (!filename) return next();

  const candidateDirs = [
    "",
    "dokumen",
    "dokumen/ijazah",
    "dokumen/ijaza",
    "dokumen/kp",
    "dokumen/kgb",
    "dokumen/jabatan",
    "dokumen/sk",
    "dokumen/hukdis",
    "dokumen/diklat",
    "dokumen/transkrip",
    "dokumen/nikah",
    "dokumen/anak",
    "dokumen/profesi",
    "ijazah",
    "ijaza",
    "kp",
    "kgb",
    "jabatan",
    "sk",
    "hukdis",
    "diklat",
    "transkrip",
    "nikah",
    "anak",
    "profesi",
    "arsip",
    "arsip/ijazah",
    "arsip/ijaza",
    "arsip/kp",
    "arsip/kgb",
    "arsip/sk",
    "arsip/dokumen",
    "profile-foto",
  ];

  for (const dir of candidateDirs) {
    const candidatePath = path.resolve(storageRoot, dir, filename);
    if (fs.existsSync(candidatePath)) {
      try {
        if (fs.statSync(candidatePath).isFile()) {
          return res.sendFile(candidatePath);
        }
      } catch {
        // Lanjut ke direktori berikutnya
      }
    }
  }

  // 3. Pencarian rekursif jika belum ditemukan di folder umum
  const findRecursive = (currentDir, depth = 0) => {
    if (depth > 4) return null; // Batasi kedalaman folder
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          const match = findRecursive(fullPath, depth + 1);
          if (match) return match;
        } else if (entry.isFile() && entry.name.toLowerCase() === filename.toLowerCase()) {
          return fullPath;
        }
      }
    } catch {
      // Abaikan folder yang tidak bisa dibaca
    }
    return null;
  };

  const recursiveMatch = findRecursive(storageRoot);
  if (recursiveMatch) {
    return res.sendFile(recursiveMatch);
  }

  next();
};
