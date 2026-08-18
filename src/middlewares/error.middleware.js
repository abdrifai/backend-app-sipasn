import logger from "../config/logger.js";

const errorMiddleware = (err, req, res, next) => {
  // Prisma errors
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: "Data sudah ada (Unique constraint failed)",
      errors: null,
    });
  }
  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: "Data tidak ditemukan",
      errors: null,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Token tidak valid atau kadaluarsa",
      errors: null,
    });
  }

  // Joi errors
  if (err.isJoi) {
    const errors = err.details.map((d) => ({
      field: d.context.key,
      message: d.message,
    }));
    return res.status(422).json({
      success: false,
      statusCode: 422,
      message: "Validasi gagal",
      errors,
    });
  }

  // AppError (operational)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: null,
    });
  }

  // Unknown error
  logger.error(err.stack);
  const message =
    process.env.NODE_ENV === "production"
      ? "Terjadi kesalahan pada server"
      : err.message;
  return res
    .status(500)
    .json({ success: false, statusCode: 500, message, errors: null });
};

export default errorMiddleware;
