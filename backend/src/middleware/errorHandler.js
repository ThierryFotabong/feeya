/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error response
  let status = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
    details = err.details || err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message = 'Not Found';
  } else if (err.name === 'ConflictError') {
    status = 409;
    message = 'Conflict';
  } else if (err.name === 'RateLimitError') {
    status = 429;
    message = 'Too Many Requests';
  } else if (err.type === 'StripeCardError') {
    status = 400;
    message = 'Payment Error';
    details = err.message;
  } else if (err.type === 'StripeInvalidRequestError') {
    status = 400;
    message = 'Invalid Payment Request';
    details = err.message;
  } else if (err.type === 'StripeAPIError') {
    status = 502;
    message = 'Payment Service Error';
  } else if (err.type === 'StripeConnectionError') {
    status = 503;
    message = 'Payment Service Unavailable';
  } else if (err.code === 'P2002') {
    // Prisma unique constraint error
    status = 409;
    message = 'Resource already exists';
    details = 'A record with this information already exists';
  } else if (err.code === 'P2025') {
    // Prisma record not found error
    status = 404;
    message = 'Resource not found';
  } else if (err.code === 'P2003') {
    // Prisma foreign key constraint error
    status = 400;
    message = 'Invalid reference';
    details = 'Referenced resource does not exist';
  }

  // Prepare error response
  const errorResponse = {
    error: {
      message,
      status,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };

  // Add details if available
  if (details) {
    errorResponse.error.details = details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Add request ID if available
  if (req.id) {
    errorResponse.error.requestId = req.id;
  }

  res.status(status).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom error
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {Object} details - Additional error details
 * @returns {Error} Custom error object
 */
function createError(message, status = 500, details = null) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

/**
 * Validation error creator
 * @param {string} message - Validation error message
 * @param {Object} details - Validation details
 * @returns {Error} Validation error
 */
function createValidationError(message, details = null) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.status = 400;
  error.details = details;
  return error;
}

/**
 * Not found error creator
 * @param {string} resource - Resource name
 * @returns {Error} Not found error
 */
function createNotFoundError(resource = 'Resource') {
  const error = new Error(`${resource} not found`);
  error.name = 'NotFoundError';
  error.status = 404;
  return error;
}

/**
 * Unauthorized error creator
 * @param {string} message - Error message
 * @returns {Error} Unauthorized error
 */
function createUnauthorizedError(message = 'Unauthorized') {
  const error = new Error(message);
  error.name = 'UnauthorizedError';
  error.status = 401;
  return error;
}

/**
 * Forbidden error creator
 * @param {string} message - Error message
 * @returns {Error} Forbidden error
 */
function createForbiddenError(message = 'Forbidden') {
  const error = new Error(message);
  error.name = 'ForbiddenError';
  error.status = 403;
  return error;
}

/**
 * Conflict error creator
 * @param {string} message - Error message
 * @returns {Error} Conflict error
 */
function createConflictError(message = 'Conflict') {
  const error = new Error(message);
  error.name = 'ConflictError';
  error.status = 409;
  return error;
}

module.exports = {
  errorHandler,
  asyncHandler,
  createError,
  createValidationError,
  createNotFoundError,
  createUnauthorizedError,
  createForbiddenError,
  createConflictError
};
