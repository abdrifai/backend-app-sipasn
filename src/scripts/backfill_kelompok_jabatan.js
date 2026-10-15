import prisma from "../config/database.js";
import logger from "../config/logger.js";

/**
 * Script untuk mengklasifikasikan nama jabatan fungsional ke dalam:
 * 1. kelompok_jabatan (misal: "Perawat", "Guru", "Dokter", "Bidan", dsb)
 * 2. kategori_jf ("AHLI" atau "TERAMPIL")
 * 3. jenjang_jf ("Ahli Pertama", "Ahli Muda", "Terampil", "Mahir", dsb)
 */
export function parseJabatanFungsional(namaJabatan, kategori = "") {
  if (!namaJabatan) return null;
  const raw = namaJabatan.trim();
  const upper = raw.toUpperCase();

  // Abaikan jabatan struktural staf ahli
  if (upper.includes("STAF AHLI") || upper.includes("KEPALA ") || upper.includes("CAMAT") || upper.includes("LURAH")) {
    return null;
  }

  // Pola Jenjang Ahli
  const isAhliUtama = /AHLI\s+UTAMA|\bUTAMA\b/i.test(upper);
  const isAhliMadya = /AHLI\s+MADYA|\bMADYA\b|\bPEMBINA\b/i.test(upper);
  const isAhliMuda = /AHLI\s+MUDA|\bMUDA\b/i.test(upper);
  const isAhliPertama =
    /AHLI\s+PERTAMA|\bPERTAMA\b|\bPRATAMA\b/i.test(upper) ||
    /CALON\s+GURU|CALON\s+DOKTER|CALON\s+APOTEKER/i.test(upper) ||
    /^GURU\s+(SD|SMP|SMA|SMK|PENJASKES|KELAS)$/i.test(upper);

  // Pola Jenjang Terampil
  const isPenyelia = /\bPENYELIA\b/i.test(upper);
  const isMahir = /\bMAHIR\b/i.test(upper) || /PELAKSANA\s+LANJUTAN/i.test(upper);
  const isPemula = /\bPEMULA\b/i.test(upper) || /PELAKSANA\s+PEMULA/i.test(upper);
  const isTerampil =
    /\bTERAMPIL\b/i.test(upper) ||
    (/\bPELAKSANA\b/i.test(upper) && !/PELAKSANA\s+TUGAS/i.test(upper) && !/JABATAN\s+PELAKSANA/i.test(upper)) ||
    /CALON\s+PERAWAT|CALON\s+BIDAN/i.test(upper);

  let kategori_jf = null;
  let jenjang_jf = null;
  let cleanName = raw;

  if (isAhliUtama) {
    kategori_jf = "AHLI";
    jenjang_jf = "Ahli Utama";
    cleanName = cleanName.replace(/AHLI\s+UTAMA|\bUTAMA\b/gi, "");
  } else if (isAhliMadya) {
    kategori_jf = "AHLI";
    jenjang_jf = "Ahli Madya";
    cleanName = cleanName.replace(/AHLI\s+MADYA|\bMADYA(\s+TINGKAT\s+I)?\b|\bPEMBINA\b/gi, "");
  } else if (isAhliMuda) {
    kategori_jf = "AHLI";
    jenjang_jf = "Ahli Muda";
    cleanName = cleanName.replace(/AHLI\s+MUDA|\bMUDA(\s+TINGKAT\s+I)?\b/gi, "");
  } else if (isAhliPertama) {
    kategori_jf = "AHLI";
    jenjang_jf = "Ahli Pertama";
    cleanName = cleanName.replace(/AHLI\s+PERTAMA|\bPERTAMA\b|\bPRATAMA(\s+TINGKAT\s+I)?\b/gi, "");
    cleanName = cleanName.replace(/\b(SD|SMP|SMA|SMK|PENJASKES|KELAS)\b/gi, "");
  } else if (isPenyelia) {
    kategori_jf = "TERAMPIL";
    jenjang_jf = "Penyelia";
    cleanName = cleanName.replace(/\bPENYELIA\b/gi, "");
  } else if (isMahir) {
    kategori_jf = "TERAMPIL";
    jenjang_jf = "Mahir";
    cleanName = cleanName.replace(/\bMAHIR\b|PELAKSANA\s+LANJUTAN/gi, "");
  } else if (isPemula) {
    kategori_jf = "TERAMPIL";
    jenjang_jf = "Pemula";
    cleanName = cleanName.replace(/\bPEMULA\b|PELAKSANA\s+PEMULA/gi, "");
  } else if (isTerampil) {
    kategori_jf = "TERAMPIL";
    jenjang_jf = "Terampil";
    cleanName = cleanName.replace(/\bTERAMPIL\b|\bPELAKSANA\b/gi, "");
  }

  // Jika masuk kategori FUNGSIONAL tapi tidak punya kata jenjang, jadikan default sesuai konteks
  if (!kategori_jf && kategori.toUpperCase().includes("FUNGSIONAL")) {
    if (upper.includes("GURU") || upper.includes("DOKTER") || upper.includes("APOTEKER") || upper.includes("AUDITOR")) {
      kategori_jf = "AHLI";
      jenjang_jf = "Ahli Pertama";
    }
  }

  if (kategori_jf) {
    cleanName = cleanName
      .replace(/\bCALON\b/gi, "")
      .replace(/^[\s\-_,]+|[\s\-_,]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Normalisasi Title Case
    const kelompok = cleanName
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    return {
      kelompok_jabatan: kelompok || raw,
      kategori_jf,
      jenjang_jf,
    };
  }

  return null;
}

export async function runBackfill() {
  logger.info("Memulai backfill kelompok_jabatan, kategori_jf, dan jenjang_jf di ref_jabatan...");

  const allJabatan = await prisma.ref_jabatan.findMany({
    where: { is_deleted: false },
    select: { id: true, nama_jabatan: true, kategori: true },
  });

  let updatedCount = 0;

  for (const j of allJabatan) {
    const parsed = parseJabatanFungsional(j.nama_jabatan, j.kategori);
    if (parsed) {
      await prisma.ref_jabatan.update({
        where: { id: j.id },
        data: {
          kelompok_jabatan: parsed.kelompok_jabatan,
          kategori_jf: parsed.kategori_jf,
          jenjang_jf: parsed.jenjang_jf,
        },
      });
      updatedCount++;
    }
  }

  logger.info(`Selesai backfill. Total jabatan diperbarui: ${updatedCount} dari ${allJabatan.length}`);
}

// Eksekusi langsung jika dipanggil via node
if (process.argv[1]?.endsWith("backfill_kelompok_jabatan.js")) {
  runBackfill()
    .then(() => {
      console.log("Backfill berhasil dijalankan.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Backfill gagal:", err);
      process.exit(1);
    });
}
