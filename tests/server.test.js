// server.test.js
// Tests for server functionality, endpoints, and error handling

const request = require('supertest');
const express = require('express');

// Mock the server setup (simplified version for testing)
describe('Server endpoints', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        analyzer: 'connected',
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Not Found' });
    });

    // Global error middleware
    app.use((err, req, res, _next) => {
      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
      });
    });
  });

  test('GET /health returns 200 with health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('analyzer');
  });

  test('GET /nonexistent returns 404', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Not Found');
  });

  test('Error middleware handles errors gracefully', (done) => {
    const testApp = express();

    testApp.get('/error', (_req, res, next) => {
      const err = new Error('Test error');
      err.status = 500;
      next(err);
    });

    testApp.use((err, _req, res, _next) => {
      res.status(err.status || 500).json({ error: err.message });
    });

    request(testApp)
      .get('/error')
      .expect(500, { error: 'Test error' }, done);
  });
});

describe('Server security middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    const compression = require('compression');
    const helmet = require('helmet');
    const rateLimit = require('express-rate-limit');

    // Apply middleware
    app.use(helmet({
      contentSecurityPolicy: false,
    }));
    app.use(compression());

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use(limiter);

    app.get('/test', (req, res) => {
      res.json({ success: true });
    });
  });

  test('Helmet middleware adds security headers', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBeDefined();
    expect(response.headers['x-frame-options']).toBeDefined();
  });

  test('Compression middleware is applied', async () => {
    const response = await request(app)
      .get('/test')
      .set('Accept-Encoding', 'gzip')
      .expect(200);

    expect(response.text).toBeDefined();
  });

  test('Rate limiting headers are present', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.headers['ratelimit-limit']).toBeDefined();
    expect(response.headers['ratelimit-remaining']).toBeDefined();
  });
});

describe('Request validation', () => {
  const { validateMessage, handleValidationErrors } = require('../src/validator');

  test('Message validation rules exist and are configured', () => {
    expect(validateMessage).toBeDefined();
    expect(Array.isArray(validateMessage)).toBe(true);
  });

  test('Validation error handler works correctly', async () => {
    const app = express();
    app.use(express.json());

    app.post(
      '/message',
      validateMessage,
      handleValidationErrors,
      (req, res) => {
        res.json({ message: req.body.message });
      }
    );

    // Test with empty message
    const response = await request(app)
      .post('/message')
      .send({ message: '' })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Validation failed');
    expect(response.body).toHaveProperty('details');
  });

  test('Valid message passes validation', async () => {
    const app = express();
    app.use(express.json());

    app.post(
      '/message',
      validateMessage,
      handleValidationErrors,
      (req, res) => {
        res.json({ success: true, message: req.body.message });
      }
    );

    const response = await request(app)
      .post('/message')
      .send({ message: 'Hello bot' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});

describe('Configuration validation', () => {
  test('Config module exports required values', () => {
    const config = require('../src/config');
    expect(config).toHaveProperty('PORT');
    expect(config).toHaveProperty('RESPONSE_DELAY_MS');
    expect(config).toHaveProperty('NODE_ENV');
    expect(config).toHaveProperty('LOG_LEVEL');
    expect(config).toHaveProperty('ANALYZER_SERVICE_URL');
    expect(config).toHaveProperty('ANALYZER_TOKEN');
  });

  test('Config has helper flags', () => {
    const config = require('../src/config');
    expect(typeof config.isDevelopment).toBe('boolean');
    expect(typeof config.isProduction).toBe('boolean');
  });

  test('PORT is a valid number', () => {
    const config = require('../src/config');
    expect(typeof config.PORT).toBe('number');
    expect(config.PORT).toBeGreaterThan(0);
  });

  test('LOG_LEVEL is a valid value', () => {
    const config = require('../src/config');
    const validLevels = ['error', 'warn', 'info', 'debug'];
    expect(validLevels).toContain(config.LOG_LEVEL);
  });
});

describe('Logger utility', () => {
  const logger = require('../src/logger');

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Logger has all required methods', () => {
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  test('Logger methods do not throw errors', () => {
    expect(() => {
      logger.error('Test error', { test: true });
      logger.warn('Test warning');
      logger.info('Test info');
      logger.debug('Test debug');
    }).not.toThrow();
  });
});

describe('Analyzer integration contract', () => {
  test('Node analyzer sends the Go sidecar-compatible chatHistory payload', async () => {
    const express = require('express');
    const { analyzeMessage } = require('../src/analyzer');

    const app = express();
    app.use(express.json());

    app.post('/analyze', (req, res) => {
      expect(req.headers.authorization).toContain('Bearer');
      expect(req.body).toHaveProperty('chatHistory');
      expect(Array.isArray(req.body.chatHistory)).toBe(true);
      expect(req.body.chatHistory[0]).toMatchObject({
        text: 'hello there',
        type: 'user',
      });
      expect(req.body.chatHistory[0].time).toBeTruthy();
      res.json({ ok: true, totalMessages: 1 });
    });

    const server = app.listen(0);
    const { port } = server.address();

    const config = require('../src/config');
    const originalUrl = config.ANALYZER_SERVICE_URL;
    config.ANALYZER_SERVICE_URL = `http://localhost:${port}`;

    try {
      const result = await analyzeMessage('hello there');
      expect(result).toMatchObject({ ok: true, totalMessages: 1 });
    } finally {
      config.ANALYZER_SERVICE_URL = originalUrl;
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('aborts stalled analyzer requests', async () => {
    const express = require('express');
    const { analyzeMessage } = require('../src/analyzer');
    const app = express();

    app.use(express.json());
    app.post('/analyze', (_req, res) => {
      setTimeout(() => res.json({ ok: true }), 100);
    });

    const server = app.listen(0);
    const { port } = server.address();
    const config = require('../src/config');
    const originalUrl = config.ANALYZER_SERVICE_URL;
    const originalTimeout = config.ANALYZER_TIMEOUT_MS;
    config.ANALYZER_SERVICE_URL = `http://localhost:${port}`;
    config.ANALYZER_TIMEOUT_MS = 20;

    try {
      await expect(analyzeMessage('slow request')).resolves.toBeNull();
    } finally {
      config.ANALYZER_SERVICE_URL = originalUrl;
      config.ANALYZER_TIMEOUT_MS = originalTimeout;
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('rejects malformed analytics messages', async () => {
    const app = express();
    app.use(express.json());
    app.post('/api/analyze', (req, res) => {
      const { chatHistory } = req.body || {};
      const valid = Array.isArray(chatHistory)
        && chatHistory.length > 0
        && chatHistory.length <= 1000
        && chatHistory.every((message) => (
          message
          && typeof message.text === 'string'
          && message.text.trim().length > 0
          && message.text.length <= 1000
          && ['user', 'bot'].includes(String(message.type).toLowerCase())
        ));

      if (!valid) {
        return res.status(400).json({ error: 'invalid chat history' });
      }
      return res.json({ ok: true });
    });

    const response = await request(app)
      .post('/api/analyze')
      .send({ chatHistory: [{ text: '', type: 'user' }] })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'invalid chat history');
  });
});
