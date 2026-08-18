import AppError from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";

/**
 * Middleware untuk verifikasi JWT dari httpOnly cookie
 * Attach req.user jika token valid
 */
export const authenticate = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return next(new AppError("Silakan login terlebih dahulu", 401));
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return next(error); // JsonWebTokenError / TokenExpiredError → ditangani Global Error Middleware
  }
};

/**
 * Middleware untuk cek role user
 * @param  {...string} roles - Daftar role yang diizinkan
 * @returns {function} Express middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Anda tidak memiliki akses ke resource ini", 403));
    }
    next();
  };
};
