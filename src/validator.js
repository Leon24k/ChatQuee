// validator.js
// Centralized request validation middleware using express-validator

const { body, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
}

/**
 * Validation rules for health check endpoint
 */
const validateHealthCheck = [];

/**
 * Validation rules for future API endpoints
 * Example: POST /api/message
 */
const validateMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters')
    .escape()
    .withMessage('Message contains invalid characters'),
];

module.exports = {
  handleValidationErrors,
  validateHealthCheck,
  validateMessage,
};
