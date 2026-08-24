// config.js
// Load environment variables once (dotenv) and expose config with sensible defaults.

require('dotenv').config();

const PORT = process.env.PORT || 3000;
const RESPONSE_DELAY_MS = parseInt(process.env.RESPONSE_DELAY_MS, 10) || 400;
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const ANALYZER_SERVICE_URL = process.env.ANALYZER_SERVICE_URL || 'http://analyzer:8081';
const ANALYZER_TOKEN = process.env.ANALYZER_TOKEN || 'dev-token-please-change';
const ANALYZER_TIMEOUT_MS = parseInt(process.env.ANALYZER_TIMEOUT_MS, 10) || 5000;

// Validate required environment variables
function validateConfig() {
  const errors = [];

  if (!PORT || isNaN(PORT)) {
    errors.push('PORT must be a valid number');
  }

  if (RESPONSE_DELAY_MS < 0) {
    errors.push('RESPONSE_DELAY_MS must be non-negative');
  }

  if (ANALYZER_TIMEOUT_MS <= 0) {
    errors.push('ANALYZER_TIMEOUT_MS must be positive');
  }

  if (!['development', 'production', 'test'].includes(NODE_ENV)) {
    errors.push(`NODE_ENV must be one of: development, production, test. Got: ${NODE_ENV}`);
  }

  if (!['error', 'warn', 'info', 'debug'].includes(LOG_LEVEL)) {
    errors.push(`LOG_LEVEL must be one of: error, warn, info, debug. Got: ${LOG_LEVEL}`);
  }

  if (!ANALYZER_SERVICE_URL) {
    errors.push('ANALYZER_SERVICE_URL is required');
  }

  if (!ANALYZER_TOKEN) {
    errors.push('ANALYZER_TOKEN is required (use .env or environment variables)');
  }

  if (errors.length > 0) {
    const errorMsg = 'Configuration validation failed:\n' + errors.map(e => `  - ${e}`).join('\n');
    throw new Error(errorMsg);
  }
}

// Validate on module load
validateConfig();

module.exports = {
  PORT,
  RESPONSE_DELAY_MS,
  NODE_ENV,
  LOG_LEVEL,
  ANALYZER_SERVICE_URL,
  ANALYZER_TOKEN,
  ANALYZER_TIMEOUT_MS,
  isDevelopment: NODE_ENV === 'development',
  isProduction: NODE_ENV === 'production',
};
