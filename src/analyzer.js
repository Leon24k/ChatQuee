// analyzer.js
// Client for communicating with the Go analyzer sidecar service

const logger = require('./logger');
const config = require('./config');

function getAnalyzerConfig() {
  return {
    ANALYZER_SERVICE_URL: config.ANALYZER_SERVICE_URL,
    ANALYZER_TOKEN: config.ANALYZER_TOKEN,
  };
}

/**
 * Call the analyzer service to process a user message
 * @param {string} message - The user's message
 * @returns {Promise<object>} - The analysis result from the Go sidecar
 */
async function analyzeMessage(message) {
  const { ANALYZER_SERVICE_URL, ANALYZER_TOKEN } = getAnalyzerConfig();

  try {
    const payload = {
      chatHistory: [
        {
          text: String(message || '').trim(),
          type: 'user',
          time: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(`${ANALYZER_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANALYZER_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logger.warn(`Analyzer returned status ${response.status}`, { message, payload });
      return null;
    }

    const data = await response.json();
    logger.debug('Analyzer response', { message, payload, result: data });
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
  const { ANALYZER_SERVICE_URL } = getAnalyzerConfig();

  try {
    const response = await fetch(`${ANALYZER_SERVICE_URL}/health`, {
      timeout: 3000,
    });
    return response.ok;
  } catch (err) {
    logger.warn('Analyzer health check failed', { error: err.message, url: ANALYZER_SERVICE_URL });
    return false;
  }
}

module.exports = {
  analyzeMessage,
  healthCheck,
};
