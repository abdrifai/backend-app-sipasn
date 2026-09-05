/**
 * Middleware untuk validasi request body menggunakan Joi schema
 * @param {object} schema - Joi validation schema
 * @returns {function} Express middleware
 */
export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return next(error);
  next();
};

/**
 * Middleware untuk validasi query parameters menggunakan Joi schema
 * @param {object} schema - Joi validation schema
 * @returns {function} Express middleware
 */
export const validateQuery = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.query, { abortEarly: false });
  if (error) return next(error);
  next();
};
