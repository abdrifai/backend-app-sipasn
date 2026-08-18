import bcrypt from "bcryptjs";
import AppError from "../../utils/AppError.js";
import * as userRepository from "./user.repository.js";

/**
 * Ambil semua user dengan pagination dan search
 */
export const getAllUsers = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const search = query.search || "";
  const sortBy = query.sortBy || "created_at";
  const sortOrder = query.sortOrder || "desc";

  const result = await userRepository.findAll({ page, limit, search, sortBy, sortOrder });

  // Tambahkan role untuk setiap user
  const usersWithRoles = await Promise.all(
    result.data.map(async (user) => {
      const role = await userRepository.findUserRole(user.id);
      return { 
        ...user, 
        role: role?.name || null,
        role_id: role?.id?.toString() || null 
      };
    })
  );

  return {
    data: usersWithRoles,
    meta: result.meta,
  };
};

/**
 * Ambil user berdasarkan ID
 */
export const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) {
    throw new AppError("Pengguna tidak ditemukan", 404);
  }

  const role = await userRepository.findUserRole(user.id);
  return { ...user, role: role?.name || null, role_id: role?.id?.toString() || null };
};

/**
 * Buat user baru
 */
export const createUser = async (data) => {
  // Cek duplikasi username
  const existingUsername = await userRepository.findByUsername(data.username);
  if (existingUsername) {
    throw new AppError("Username sudah digunakan", 409);
  }

  // Cek duplikasi NIK jika diisi
  if (data.nik) {
    const existingNik = await userRepository.findByNik(data.nik);
    if (existingNik) {
      throw new AppError("NIK sudah terdaftar", 409);
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 12);

  const userData = {
    username: data.username,
    nama_lengkap: data.nama_lengkap,
    email: data.email || null,
    password: hashedPassword,
    nik: data.nik || null,
  };

  const user = await userRepository.create(userData);

  // Set role jika diberikan
  if (data.role_id) {
    await userRepository.setUserRole(user.id, data.role_id);
  }

  return user;
};

/**
 * Update data user
 */
export const updateUser = async (id, data) => {
  // Pastikan user ada
  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new AppError("Pengguna tidak ditemukan", 404);
  }

  // Cek duplikasi username (jika diubah)
  if (data.username && data.username !== existingUser.username) {
    const existingUsername = await userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new AppError("Username sudah digunakan", 409);
    }
  }

  // Cek duplikasi NIK (jika diubah)
  if (data.nik && data.nik !== existingUser.nik) {
    const existingNik = await userRepository.findByNik(data.nik);
    if (existingNik) {
      throw new AppError("NIK sudah terdaftar", 409);
    }
  }

  const updateData = {};
  if (data.username) updateData.username = data.username;
  if (data.nama_lengkap) updateData.nama_lengkap = data.nama_lengkap;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.nik !== undefined) updateData.nik = data.nik || null;

  // Hash password baru jika diubah
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 12);
  }

  const user = await userRepository.update(id, updateData);

  // Update role jika diberikan
  if (data.role_id !== undefined) {
    await userRepository.setUserRole(id, data.role_id);
  }

  return user;
};

/**
 * Soft delete user
 */
export const deleteUser = async (id) => {
  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new AppError("Pengguna tidak ditemukan", 404);
  }

  return userRepository.softDelete(id);
};

/**
 * Ambil daftar semua roles
 */
export const getAllRoles = async () => {
  return userRepository.findAllRoles();
};
