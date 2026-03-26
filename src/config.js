// config.js
// Load environment variables once (dotenv) and expose config with sensible defaults.

require('dotenv').config();

const PORT = process.env.PORT || 3000;
const RESPONSE_DELAY_MS = parseInt(process.env.RESPONSE_DELAY_MS, 10) || 400;

module.exports = {
  PORT,
  RESPONSE_DELAY_MS,
};
