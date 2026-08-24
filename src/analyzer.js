// analyzer.js
// Client for communicating with the Go analyzer sidecar service

const logger = require('./logger');
const config = require('./config');

function getAnalyzerConfig() {
  return {
    ANALYZER_SERVICE_URL: config.ANALYZER_SERVICE_URL,
    ANALYZER_TOKEN: config.ANALYZER_TOKEN,
    ANALYZER_TIMEOUT_MS: config.ANALYZER_TIMEOUT_MS,
  };
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeChatHistory(input) {
  if (Array.isArray(input)) {
    return input;
  }

  return [{
    text: String(input || '').trim(),
    type: 'user',
    time: new Date().toISOString(),
  }];
}

/**
 * Call the analyzer service to process a user message
 * @param {string} message - The user's message
 * @returns {Promise<object>} - The analysis result from the Go sidecar
 */
async function analyzeMessage(message) {
  const { ANALYZER_SERVICE_URL, ANALYZER_TOKEN, ANALYZER_TIMEOUT_MS } = getAnalyzerConfig();

  try {
    const payload = {
      chatHistory: normalizeChatHistory(message),
    };

    const response = await fetchWithTimeout(`${ANALYZER_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANALYZER_TOKEN}`,
      },
      body: JSON.stringify(payload),
    }, ANALYZER_TIMEOUT_MS);

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
  const { ANALYZER_SERVICE_URL, ANALYZER_TIMEOUT_MS } = getAnalyzerConfig();

  try {
    const response = await fetchWithTimeout(`${ANALYZER_SERVICE_URL}/health`, {}, ANALYZER_TIMEOUT_MS);
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
