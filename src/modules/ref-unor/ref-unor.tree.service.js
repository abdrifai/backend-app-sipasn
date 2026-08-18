import prisma from "../../config/database.js";

/**
 * Helper untuk normalisasi string nama unor
 */
const normalize = (str) => (str || "").trim().toLowerCase();

/**
 * Build hierarchical tree of Unit Organisasi from single table ref_unitorganisasi
 * Menghilangkan node dummy yang namanya sama persis dengan parent-nya sehingga hierarki murni parent -> child nyata
 */
export const getUnorTree = async (params = {}) => {
  const { kode, level, parentId } = params;

  // Level 1: Instansi (Root)
  if (!level) {
    const instansi = await prisma.ref_instansi.findMany({
      where: {
        is_deleted: false,
        ...(kode ? { kode: parseInt(kode) } : {}),
      },
      orderBy: { kode: "asc" },
    });

    return instansi.map((ins) => ({
      id: ins.id,
      kode: ins.kode,
      instansi: ins.instansi,
      nmUnor: ins.instansi,
      level: "instansi",
      is_pimpinan: false,
      children: [],
      expanded: false,
      hasChildren: true,
    }));
  }

  // Ambil data parent untuk komparasi nama (apakah anak memiliki nama yang sama dengan parent)
  let parentName = "";
  if (parentId) {
    const parentNode = await prisma.ref_unitorganisasi.findUnique({
      where: { id: parentId },
      select: { nmUnor: true },
    });
    if (parentNode) {
      parentName = normalize(parentNode.nmUnor);
    }
  }

  // Level 2+: Children under Instansi (Level 'induk' / Top OPD)
  let rawData = [];
  if (level === "instansi") {
    rawData = await prisma.ref_unitorganisasi.findMany({
      where: {
        instansi_id: parentId,
        parent_id: null,
        is_deleted: false,
        isAktif: 1,
      },
      select: {
        id: true,
        parent_id: true,
        instansi_id: true,
        kode: true,
        nmUnor: true,
        level: true,
        jab_id: true,
        is_pimpinan: true,
        children: {
          where: { is_deleted: false, isAktif: 1 },
          select: { id: true, nmUnor: true },
        },
      },
      orderBy: { kode: "asc" },
    });
  } else {
    // Generic Parent-Child Level (Induk -> Unor -> Sub -> SubSub)
    rawData = await prisma.ref_unitorganisasi.findMany({
      where: {
        parent_id: parentId,
        is_deleted: false,
        isAktif: 1,
      },
      select: {
        id: true,
        parent_id: true,
        instansi_id: true,
        kode: true,
        nmUnor: true,
        level: true,
        jab_id: true,
        is_pimpinan: true,
        children: {
          where: { is_deleted: false, isAktif: 1 },
          select: { id: true, nmUnor: true },
        },
      },
      orderBy: { kode: "asc" },
    });
  }

  // Filter out dummy child nodes yang namanya sama persis dengan parent-nya
  const cleanData = parentName
    ? rawData.filter((item) => normalize(item.nmUnor) !== parentName)
    : rawData;

  return cleanData.map((item) => {
    const currentName = normalize(item.nmUnor);
    // Hitung anak nyata yang tidak sama namanya dengan node ini
    const realDistinctChildren = item.children.filter(
      (c) => normalize(c.nmUnor) !== currentName
    );

    return {
      id: item.id,
      parent_id: item.parent_id,
      kode: item.kode,
      nmUnor: item.nmUnor,
      level: item.level,
      is_pimpinan: item.is_pimpinan,
      jab_id: item.jab_id,
      children: [],
      expanded: false,
      hasChildren: realDistinctChildren.length > 0,
      childrenCount: realDistinctChildren.length,
    };
  });
};
