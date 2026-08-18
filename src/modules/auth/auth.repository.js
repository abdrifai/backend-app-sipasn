import prisma from "../../config/database.js";

/**
 * Cari user berdasarkan username untuk keperluan login
 * @param {string} username
 * @returns {object|null} Data user termasuk password hash
 */
export const findByUsername = async (username) => {
  return prisma.users.findFirst({
    where: { username, is_deleted: false },
    select: {
      id: true,
      username: true,
      nama_lengkap: true,
      email: true,
      password: true,
      nik: true,
      profile_photo_path: true,
    },
  });
};

/**
 * Cari user berdasarkan ID (tanpa password)
 * @param {BigInt} id
 * @returns {object|null} Data user
 */
export const findById = async (id) => {
  return prisma.users.findFirst({
    where: { id: BigInt(id), is_deleted: false },
    select: {
      id: true,
      username: true,
      nama_lengkap: true,
      email: true,
      nik: true,
      profile_photo_path: true,
    },
  });
};

/**
 * Cari role user melalui model_has_roles
 * @param {BigInt} userId
 * @returns {object|null} Data role
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
 * Update data user (Profil)
 * @param {string} id
 * @param {object} data
 * @returns {object} Updated user
 */
export const updateProfile = async (id, data) => {
  const user = await prisma.users.update({
    where: { id: BigInt(id) },
    data,
    select: {
      id: true,
      username: true,
      nama_lengkap: true,
      email: true,
      nik: true,
      profile_photo_path: true,
    },
  });

  return { ...user, id: user.id.toString() };
};
