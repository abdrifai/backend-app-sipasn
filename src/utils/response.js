/**
 * Kirim response sukses seragam
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Deskripsi singkat
 * @param {any} data - Data hasil operasi
 * @param {object} meta - Metadata tambahan (misal: pagination)
 */
export const sendSuccess = (res, statusCode = 200, message = "Sukses", data = {}, meta = null) => {
  const response = {
    success: true,
    statusCode,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};
