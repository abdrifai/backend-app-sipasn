import prisma from "../../config/database.js";

/**
 * Resolver cerdas untuk memetakan nama jabatan yang akurat pada setiap level unit organisasi
 * Menggunakan tabel tunggal ref_jabatan
 * @param {object} params
 * @param {string} params.nmUnor
 * @param {string|null} [params.jabId]
 * @param {string|null} [params.childJabId]
 * @param {string} [params.level] - 'induk' | 'unor' | 'sub' | 'sub-sub'
 * @returns {Promise<{jab_id: string|null, nm_jab: string|null}>}
 */
export const resolveJabatanForUnor = async ({
  nmUnor,
  jabId = null,
  childJabId = null,
  level = "unor",
}) => {
  let resolvedJabId = childJabId || jabId;
  let nm_jab = null;

  if (resolvedJabId) {
    const jab = await prisma.ref_jabatan.findUnique({
      where: { id: resolvedJabId },
      select: { id: true, nama_jabatan: true },
    });
    if (jab) {
      nm_jab = jab.nama_jabatan;
      resolvedJabId = jab.id;
    }
  }

  const cleanName = (nmUnor || "").trim().toUpperCase();
  if (!cleanName) return { jab_id: resolvedJabId, nm_jab };

  // Deteksi anomali / ketidaksesuaian jabatan dengan unit:
  // Contoh: Unit SEKRETARIAT tetapi jab_id malah mengarah ke 'KEPALA SUBBAGIAN ...'
  const isMismatched = cleanName && (
    (cleanName === "SEKRETARIAT" && nm_jab && (nm_jab.includes("SUBBAGIAN") || nm_jab.includes("SUB BAGIAN") || nm_jab.includes("SEKSI") || nm_jab.includes("SUBBIDANG"))) ||
    (cleanName.startsWith("BIDANG") && nm_jab && (nm_jab.includes("SUBBIDANG") || nm_jab.includes("SUB BIDANG") || nm_jab.includes("SEKSI") || nm_jab.includes("SEKRETARIS") || nm_jab.includes("SUBBAGIAN"))) ||
    (cleanName.startsWith("BAGIAN") && nm_jab && (nm_jab.includes("SUBBAGIAN") || nm_jab.includes("SUB BAGIAN") || nm_jab.includes("SEKSI"))) ||
    (cleanName.startsWith("INSPEKTUR PEMBANTU") && nm_jab && !nm_jab.includes("INSPEKTUR PEMBANTU")) ||
    (level === "induk" && nm_jab && (nm_jab.includes("SUBBAGIAN") || nm_jab.includes("SUBBIDANG") || nm_jab.includes("SEKSI")))
  );

  if (!nm_jab || isMismatched) {
    // Bangun kandidat nama jabatan berdasarkan pola pemerintahan standar
    const candidates = [];

    if (level === "induk") {
      candidates.push(`KEPALA ${cleanName}`);
      if (cleanName.startsWith("KECAMATAN ") || cleanName.startsWith("KANTOR CAMAT ")) {
        candidates.push(`CAMAT ${cleanName.replace("KECAMATAN ", "").replace("KANTOR CAMAT ", "")}`);
      }
      if (cleanName.startsWith("KELURAHAN ") || cleanName.startsWith("KANTOR LURAH ")) {
        candidates.push(`LURAH ${cleanName.replace("KELURAHAN ", "").replace("KANTOR LURAH ", "")}`);
      }
      if (cleanName.includes("INSPEKTORAT")) {
        candidates.push(`INSPEKTUR ${cleanName.replace("INSPEKTORAT ", "")}`);
        candidates.push("INSPEKTUR");
      }
      if (cleanName.includes("SEKRETARIAT DAERAH")) candidates.push("SEKRETARIS DAERAH");
      if (cleanName.includes("SEKRETARIAT DPRD")) candidates.push("SEKRETARIS DPRD");
    } else {
      if (cleanName === "SEKRETARIAT") {
        candidates.push("SEKRETARIS");
      } else if (cleanName.startsWith("BIDANG ") || cleanName.startsWith("BAGIAN ") || cleanName.startsWith("SEKSI ")) {
        candidates.push(`KEPALA ${cleanName}`);
      } else if (cleanName.startsWith("SUBBAGIAN ") || cleanName.startsWith("SUB BAGIAN ")) {
        candidates.push(`KEPALA ${cleanName}`);
        if (cleanName.startsWith("SUB BAGIAN ")) {
          candidates.push(`KEPALA ${cleanName.replace("SUB BAGIAN ", "SUBBAGIAN ")}`);
        } else {
          candidates.push(`KEPALA ${cleanName.replace("SUBBAGIAN ", "SUB BAGIAN ")}`);
        }
      } else if (cleanName.startsWith("SUBBIDANG ") || cleanName.startsWith("SUB BIDANG ")) {
        candidates.push(`KEPALA ${cleanName}`);
        if (cleanName.startsWith("SUB BIDANG ")) {
          candidates.push(`KEPALA ${cleanName.replace("SUB BIDANG ", "SUBBIDANG ")}`);
        } else {
          candidates.push(`KEPALA ${cleanName.replace("SUBBIDANG ", "SUB BIDANG ")}`);
        }
      } else if (cleanName.startsWith("INSPEKTUR PEMBANTU")) {
        candidates.push(cleanName);
        const withRoman = cleanName
          .replace(" 1", " I")
          .replace(" 2", " II")
          .replace(" 3", " III")
          .replace(" 4", " IV");
        if (withRoman !== cleanName) candidates.push(withRoman);
      } else if (cleanName.startsWith("UPT ") || cleanName.startsWith("UNIT PELAKSANA TEKNIS ")) {
        candidates.push(`KEPALA ${cleanName}`);
      } else if (cleanName.startsWith("PUSKESMAS ")) {
        candidates.push(`KEPALA ${cleanName}`);
      } else if (cleanName.startsWith("RSUD ") || cleanName.startsWith("RUMAH SAKIT ")) {
        candidates.push(`DIREKTUR ${cleanName}`);
      } else {
        candidates.push(`KEPALA ${cleanName}`);
      }
    }

    // Cari kecocokan di ref_jabatan
    for (const cand of candidates) {
      const matched = await prisma.ref_jabatan.findFirst({
        where: { nama_jabatan: { equals: cand }, is_deleted: false },
        select: { id: true, nama_jabatan: true },
      });
      if (matched) {
        resolvedJabId = matched.id;
        nm_jab = matched.nama_jabatan;
        break;
      }
    }

    // Jika belum terdaftar di ref_jabatan, berikan default kandidat pertama sebagai preview yang dapat disimpan
    if (!nm_jab && candidates.length > 0) {
      nm_jab = candidates[0];
    }
  }

  return {
    jab_id: resolvedJabId,
    nm_jab,
  };
};
