import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess } from "../../utils/response.js";
import * as authService from "./auth.service.js";

/**
 * Login user dan set JWT di httpOnly cookie
 */
export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const { token, user } = await authService.login(username, password);

  // Cek apakah request menggunakan HTTPS atau reverse proxy SSL (misal: Nginx)
  const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";

  // Set JWT di httpOnly cookie (Rule 07)
  res.cookie("token", token, {
    httpOnly: true,
    secure: isHttps, // Hanya 'true' jika koneksi menggunakan HTTPS/SSL
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 1 hari
  });

  sendSuccess(res, 200, "Login berhasil", user);
});

/**
 * Logout user — clear cookie
 */
export const logout = asyncHandler(async (req, res) => {
  const isHttps = req.secure || req.headers["x-forwarded-proto"] === "https";

  res.clearCookie("token", {
    httpOnly: true,
    secure: isHttps,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  });

  sendSuccess(res, 200, "Logout berhasil");
});

/**
 * Ambil data user yang sedang login
 */
export const me = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);
  sendSuccess(res, 200, "Data pengguna berhasil diambil", user);
});

/**
 * Update profil user
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body, req.file);
  sendSuccess(res, 200, "Profil berhasil diperbarui", user);
});
