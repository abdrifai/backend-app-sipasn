import jwt from "jsonwebtoken";

/**
 * Generate access token JWT
 * @param {object} payload - Data yang akan disimpan di token
 * @returns {string} JWT access token
 */
export const signAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

/**
 * Generate refresh token JWT
 * @param {object} payload - Data yang akan disimpan di token
 * @returns {string} JWT refresh token
 */
export const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
};

/**
 * Verifikasi access token JWT
 * @param {string} token - JWT access token
 * @returns {object} Decoded payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verifikasi refresh token JWT
 * @param {string} token - JWT refresh token
 * @returns {object} Decoded payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
