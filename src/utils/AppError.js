class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // error yang diharapkan (bukan bug)
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
