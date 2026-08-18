import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import AppError from "../../utils/AppError.js";
import { signAccessToken } from "../../utils/jwt.js";
import * as authRepository from "./auth.repository.js";

/**
 * Proses login: validasi username & password, kembalikan token + user data
 * @param {string} username
 * @param {string} password
 * @returns {object} { token, user }
 */
export const login = async (username, password) => {
  // Cari user berdasarkan username
  const user = await authRepository.findByUsername(username);
  if (!user) {
    throw new AppError("Username atau password salah", 401);
  }

  // Verifikasi password (kompatibel dengan hash bcrypt Laravel)
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Username atau password salah", 401);
  }

  // Ambil role user
  const role = await authRepository.findUserRole(user.id);

  // Generate access token
  const tokenPayload = {
    id: user.id.toString(),
    username: user.username,
    nama_lengkap: user.nama_lengkap,
    role: role?.name || "user",
  };

  const token = signAccessToken(tokenPayload);

  // Data user tanpa password untuk response
  const userData = {
    id: user.id.toString(),
    username: user.username,
    nama_lengkap: user.nama_lengkap,
    email: user.email,
    nik: user.nik,
    profile_photo_path: user.profile_photo_path,
    role: role?.name || "user",
  };

  return { token, user: userData };
};

/**
 * Ambil data current user berdasarkan ID
 * @param {string} id - User ID dari token
 * @returns {object} Data user
 */
export const getCurrentUser = async (id) => {
  const user = await authRepository.findById(id);
  if (!user) {
    throw new AppError("Pengguna tidak ditemukan", 404);
  }

  // Ambil role user
  const role = await authRepository.findUserRole(user.id);

  return {
    id: user.id.toString(),
    username: user.username,
    nama_lengkap: user.nama_lengkap,
    email: user.email,
    nik: user.nik,
    profile_photo_path: user.profile_photo_path,
    role: role?.name || "user",
  };
};

/**
 * Update profil user
 * @param {string} id - User ID dari token
 * @param {object} data - Data baru
 * @param {object} file - File upload (optional)
 * @returns {object} Updated user data
 */
export const updateProfile = async (id, data, file) => {
  const user = await authRepository.findById(id);
  if (!user) {
    throw new AppError("Pengguna tidak ditemukan", 404);
  }

  const updateData = {};
  if (data.nama_lengkap) updateData.nama_lengkap = data.nama_lengkap;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.nik !== undefined) updateData.nik = data.nik || null;

  // Handle upload foto
  if (file) {
    // Multer destination is "storage/profile-foto"
    // file.path will be "storage/profile-foto/filename.ext"
    updateData.profile_photo_path = file.path.replace(/\\/g, "/");

    // Hapus foto lama jika ada
    if (user.profile_photo_path) {
      try {
        // user.profile_photo_path di DB tersimpan sebagai "storage/profile-foto/filename.ext"
        // atau mungkin path lama "public/uploads/..."
        await fs.unlink(path.resolve(user.profile_photo_path));
      } catch (err) {
        // Abaikan jika file tidak ada
        console.warn(`Gagal menghapus file lama: ${user.profile_photo_path}`);
      }
    }
  }

  // Hash password jika diubah
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 12);
  }

  const updatedUser = await authRepository.updateProfile(id, updateData);
  const role = await authRepository.findUserRole(id);

  return {
    ...updatedUser,
    role: role?.name || "user",
  };
};
