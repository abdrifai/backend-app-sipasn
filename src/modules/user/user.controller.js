import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as userService from "./user.service.js";

/**
 * Ambil semua user dengan pagination & search
 */
export const getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "Data pengguna berhasil diambil",
    data: result.data,
    meta: result.meta,
  });
});

/**
 * Ambil user berdasarkan ID
 */
export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  sendSuccess(res, 200, "Data pengguna berhasil diambil", user);
});

/**
 * Buat user baru
 */
export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  sendSuccess(res, 201, "Pengguna berhasil dibuat", user);
});

/**
 * Update data user
 */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  sendSuccess(res, 200, "Pengguna berhasil diperbarui", user);
});

/**
 * Soft delete user
 */
export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  sendSuccess(res, 200, "Pengguna berhasil dihapus");
});

/**
 * Ambil daftar roles
 */
export const getRoles = asyncHandler(async (req, res) => {
  const roles = await userService.getAllRoles();
  sendSuccess(res, 200, "Data roles berhasil diambil", roles);
});
