import prisma from "../../config/database.js";

/**
 * Ambil semua user dengan pagination, search, dan filter
 */
export const findAll = async ({ page = 1, limit = 10, search = "", sortBy = "created_at", sortOrder = "desc" }) => {
  const skip = (page - 1) * limit;

  const where = {
    is_deleted: false,
    ...(search && {
      OR: [
        { nama_lengkap: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
        { nik: { contains: search } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.users.findMany({
      where,
      select: {
        id: true,
        username: true,
        nama_lengkap: true,
        email: true,
        nik: true,
        profile_photo_path: true,
        status_edit: true,
        created_at: true,
        updated_at: true,
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.users.count({ where }),
  ]);

  return {
    data: data.map((u) => ({ ...u, id: u.id.toString() })),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Cari user berdasarkan ID
 */
export const findById = async (id) => {
  const user = await prisma.users.findFirst({
    where: { id: BigInt(id), is_deleted: false },
    select: {
      id: true,
      username: true,
      nama_lengkap: true,
      email: true,
      nik: true,
      profile_photo_path: true,
      unorinduk_id: true,
      status_edit: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!user) return null;
  return { ...user, id: user.id.toString() };
};

/**
 * Cari user berdasarkan username (untuk cek duplikasi)
 */
export const findByUsername = async (username) => {
  return prisma.users.findFirst({
    where: { username, is_deleted: false },
    select: { id: true },
  });
};

/**
 * Cari user berdasarkan NIK (untuk cek duplikasi)
 */
export const findByNik = async (nik) => {
  return prisma.users.findFirst({
    where: { nik, is_deleted: false },
    select: { id: true },
  });
};

/**
 * Buat user baru
 */
export const create = async (data) => {
  const user = await prisma.users.create({
    data,
    select: {
      id: true,
      username: true,
      nama_lengkap: true,
      email: true,
      nik: true,
      created_at: true,
    },
  });

  return { ...user, id: user.id.toString() };
};

/**
 * Update data user
 */
export const update = async (id, data) => {
  const user = await prisma.users.update({
    where: { id: BigInt(id) },
    data,
    select: {
      id: true,
      username: true,
      nama_lengkap: true,
      email: true,
      nik: true,
      updated_at: true,
    },
  });

  return { ...user, id: user.id.toString() };
};

/**
 * Soft delete user
 */
export const softDelete = async (id) => {
  const user = await prisma.users.update({
    where: { id: BigInt(id) },
    data: { is_deleted: true },
    select: { id: true },
  });

  return { ...user, id: user.id.toString() };
};

/**
 * Ambil role user melalui model_has_roles
 */
export const findUserRole = async (userId) => {
  const modelHasRole = await prisma.model_has_roles.findFirst({
    where: {
      model_id: BigInt(userId),
      model_type: "App\\Models\\User",
      is_deleted: false,
    },
    select: {
      roles: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return modelHasRole?.roles || null;
};

/**
 * Set role user (hapus role lama, set role baru)
 */
export const setUserRole = async (userId, roleId) => {
  // Hapus role lama (jika ada)
  await prisma.model_has_roles.deleteMany({
    where: {
      model_id: BigInt(userId),
      model_type: "App\\Models\\User",
    },
  });

  // Set role baru
  return prisma.model_has_roles.create({
    data: {
      model_id: BigInt(userId),
      model_type: "App\\Models\\User",
      role_id: BigInt(roleId),
    },
  });
};

/**
 * Ambil daftar semua roles
 */
export const findAllRoles = async () => {
  const roles = await prisma.roles.findMany({
    where: { is_deleted: false },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return roles.map((r) => ({ ...r, id: r.id.toString() }));
};
