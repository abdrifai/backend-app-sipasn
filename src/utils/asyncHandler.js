// Wrapper agar tidak perlu try/catch di setiap controller
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
