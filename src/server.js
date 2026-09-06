const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { getBotReply, isValidUserMessage } = require('./bot');
const { PORT, RESPONSE_DELAY_MS, NODE_ENV } = require('./config');
const logger = require('./logger');
const { analyzeMessage, healthCheck } = require('./analyzer');

function isValidChatHistory(chatHistory) {
  return Array.isArray(chatHistory)
    && chatHistory.length > 0
    && chatHistory.length <= 1000
    && chatHistory.every((message) => (
      message
      && typeof message === 'object'
      && typeof message.text === 'string'
      && message.text.trim().length > 0
      && message.text.length <= 1000
      && ['user', 'bot'].includes(String(message.type).toLowerCase())
    ));
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false // disabled to allow inline GSAP scripts and CDNs
}));
app.use(compression());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Apply rate limiting to all routes
app.use(limiter);
app.use(express.json({ limit: '256kb' }));

app.post('/api/analyze', async (req, res, next) => {
  try {
    const { chatHistory } = req.body || {};
    if (!isValidChatHistory(chatHistory)) {
      return res.status(400).json({
        error: 'chatHistory must contain 1 to 1000 valid user or bot messages',
      });
    }

    const result = await analyzeMessage(chatHistory);
    if (!result) {
      return res.status(503).json({ error: 'Analyzer service unavailable' });
    }
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

app.use('/vendor/showdown', express.static(path.join(__dirname, '../node_modules/showdown/dist')));
app.use('/vendor/dompurify', express.static(path.join(__dirname, '../node_modules/dompurify/dist')));

app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const analyzerHealthy = await healthCheck();
    const status = analyzerHealthy ? 200 : 503;
    res.status(status).json({
      status: analyzerHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      analyzer: analyzerHealthy ? 'connected' : 'disconnected',
    });
  } catch (err) {
    logger.error('Health check failed', { error: err.message });
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error middleware
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
  });
  res.status(err.status || 500).json({
    error: NODE_ENV === 'development' ? err.message : 'Internal Server Error',
  });
});

// handle incoming socket connections
io.on('connection', (socket) => {
  logger.info('client connected', { socketId: socket.id });
  socket.emit(
    'bot message',
    'Halo! Saya ChatQuee Bot. Ada yang bisa saya bantu? 👋\n(Hello! I\'m ChatQuee Bot. How can I help you?)'
  );

  let lastMessageTime = 0;
  const pendingReplies = new Set();

  socket.on('user message', async (msg) => {
    try {
      const now = Date.now();
      if (now - lastMessageTime < 1000) {
        // Rate limit: 1 message per second
        return socket.emit('bot message', 'Terlalu cepat! Tunggu sebentar sebelum mengirim pesan lagi. ⏳');
      }
      lastMessageTime = now;

      if (!isValidUserMessage(msg)) {
        // ignore invalid payloads
        logger.debug('Invalid message received', { socketId: socket.id, msgLength: msg?.length });
        return;
      }

      // Try to analyze message with Go sidecar
      await analyzeMessage(msg);
      logger.debug('Message processed', { socketId: socket.id, msgLength: msg.length });

      const reply = getBotReply(msg);
      const replyTimer = setTimeout(() => {
        pendingReplies.delete(replyTimer);
        if (socket.connected) {
          socket.emit('bot message', reply);
        }
      }, RESPONSE_DELAY_MS);
      pendingReplies.add(replyTimer);
    } catch (err) {
      logger.error('Error processing user message', {
        socketId: socket.id,
        error: err.message,
      });
      if (socket.connected) {
        socket.emit('bot message', 'Maaf, terjadi kesalahan. Coba lagi nanti.');
      }
    }
  });

  socket.on('disconnect', (reason) => {
    pendingReplies.forEach((timer) => clearTimeout(timer));
    pendingReplies.clear();
    logger.info('client disconnected', { socketId: socket.id, reason });
  });

  socket.on('error', (err) => {
    logger.error('socket error', { socketId: socket.id, error: err.message || err });
  });
});

// graceful shutdown logic
function shutdown() {
  logger.info('shutting down server...');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.warn('force exit after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, _promise) => {
  logger.error('Unhandled rejection', { reason: reason?.message || reason });
});

server.listen(PORT, () => {
  logger.info(`ChatQuee server running at http://localhost:${PORT}`, { NODE_ENV });
});
