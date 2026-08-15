// analyzer.js
// Client for communicating with the Go analyzer sidecar service

const logger = require('./logger');
const { ANALYZER_SERVICE_URL, ANALYZER_TOKEN } = require('./config');

/**
 * Call the analyzer service to process a user message
 * @param {string} message - The user's message
 * @returns {Promise<object>} - The analysis result from the Go sidecar
 */
async function analyzeMessage(message) {
  try {
    const response = await fetch(`${ANALYZER_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANALYZER_TOKEN}`,
      },
      body: JSON.stringify({ message }),
      timeout: 5000,
    });

    if (!response.ok) {
      logger.warn(`Analyzer returned status ${response.status}`, { message });
      return null;
    }

    const data = await response.json();
    logger.debug('Analyzer response', { message, result: data });
    return data;
  } catch (err) {
    logger.error('Failed to call analyzer service', {
      error: err.message,
      url: ANALYZER_SERVICE_URL,
      message,
    });
    return null;
  }
}

/**
 * Health check for the analyzer service
 * @returns {Promise<boolean>} - true if healthy, false otherwise
 */
async function healthCheck() {
  try {
    const response = await fetch(`${ANALYZER_SERVICE_URL}/health`, {
      timeout: 3000,
    });
    return response.ok;
  } catch (err) {
    logger.warn('Analyzer health check failed', { error: err.message });
    return false;
  }
}

module.exports = {
  analyzeMessage,
  healthCheck,
};
