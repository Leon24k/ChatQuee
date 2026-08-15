// logger.js
// Structured logging utility with log levels

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const logLevelName = process.env.LOG_LEVEL || 'info';
const currentLogLevel = LOG_LEVELS[logLevelName] || LOG_LEVELS.info;

function formatTimestamp() {
  return new Date().toISOString();
}

function formatMessage(level, message, data = null) {
  const timestamp = formatTimestamp();
  const baseMsg = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (data) {
    return `${baseMsg} ${JSON.stringify(data)}`;
  }
  return baseMsg;
}

const logger = {
  error(message, data = null) {
    if (currentLogLevel >= LOG_LEVELS.error) {
      console.error(formatMessage('error', message, data));
    }
  },

  warn(message, data = null) {
    if (currentLogLevel >= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message, data));
    }
  },

  info(message, data = null) {
    if (currentLogLevel >= LOG_LEVELS.info) {
      console.log(formatMessage('info', message, data));
    }
  },

  debug(message, data = null) {
    if (currentLogLevel >= LOG_LEVELS.debug) {
      console.log(formatMessage('debug', message, data));
    }
  },
};

module.exports = logger;
