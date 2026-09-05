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
  const { kode, level, parentId, exclude_id } = params;

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
  const treeNodeSelect = {
    id: true,
    parent_id: true,
    instansi_id: true,
    kode: true,
    nmUnor: true,
    level: true,
    no_urut: true,
    jab_id: true,
    is_pimpinan: true,
    isAktif: true,
    ref_jabatan: {
      select: {
        id: true,
        nama_jabatan: true,
        kategori: true,
        ref_eselon: { select: { eselon: true } },
        ref_jnsjab: { select: { jnsjab: true } },
        ref_jenjangjab: { select: { jenjangjab: true } },
      },
    },
    children: {
      where: {
        is_deleted: false,
        isAktif: 1,
        ...(exclude_id ? { id: { not: exclude_id } } : {}),
      },
      select: { id: true, nmUnor: true },
    },
  };

  const excludeFilter = exclude_id ? { id: { not: exclude_id } } : {};

  if (level === "instansi") {
    rawData = await prisma.ref_unitorganisasi.findMany({
      where: {
        instansi_id: parentId,
        parent_id: null,
        is_deleted: false,
        isAktif: 1,
        ...excludeFilter,
      },
      select: treeNodeSelect,
      orderBy: [{ no_urut: "asc" }, { nmUnor: "asc" }, { kode: "asc" }],
    });
  } else {
    // Generic Parent-Child Level (Induk -> Unor -> Sub -> SubSub)
    rawData = await prisma.ref_unitorganisasi.findMany({
      where: {
        parent_id: parentId,
        is_deleted: false,
        isAktif: 1,
        ...excludeFilter,
      },
      select: treeNodeSelect,
      orderBy: [{ no_urut: "asc" }, { nmUnor: "asc" }, { kode: "asc" }],
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
      no_urut: item.no_urut ?? 1,
      is_pimpinan: item.is_pimpinan,
      isAktif: item.isAktif,
      jab_id: item.jab_id,
      nm_jab: item.ref_jabatan?.nama_jabatan || null,
      kategori_jab: item.ref_jabatan?.kategori || null,
      eselon: item.ref_jabatan?.ref_eselon?.eselon || null,
      jns_jab: item.ref_jabatan?.ref_jnsjab?.jnsjab || null,
      jenjang_jab: item.ref_jabatan?.ref_jenjangjab?.jenjangjab || null,
      children: [],
      expanded: false,
      hasChildren: realDistinctChildren.length > 0,
      childrenCount: realDistinctChildren.length,
    };
  });
};

