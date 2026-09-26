class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // error yang diharapkan (bukan bug)
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
export { AppError };
