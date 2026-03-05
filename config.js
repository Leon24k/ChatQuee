// config.js
// Configuration values pulled from the environment with sensible defaults.

const PORT = process.env.PORT || 3000;
const RESPONSE_DELAY_MS = parseInt(process.env.RESPONSE_DELAY_MS, 10) || 400;

module.exports = {
  PORT,
  RESPONSE_DELAY_MS,
};
