/**
 * Wraps an async route handler and forwards any rejected promise to next()
 * so the global error handler can catch it.
 */
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
