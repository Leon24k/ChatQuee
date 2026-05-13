const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

const { getBotReply, isValidUserMessage } = require('./bot');
const { PORT, RESPONSE_DELAY_MS } = require('./config');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: false // disabled to allow inline GSAP scripts and CDNs
}));
app.use(compression());

app.use('/vendor/showdown', express.static(path.join(__dirname, '../node_modules/showdown/dist')));
app.use('/vendor/dompurify', express.static(path.join(__dirname, '../node_modules/dompurify/dist')));

app.use(express.static(path.join(__dirname, '../public')));

// handle incoming socket connections
io.on('connection', (socket) => {
  console.log('client connected', socket.id);
  socket.emit(
    'bot message',
    'Halo! Saya ChatQuee Bot. Ada yang bisa saya bantu? 👋\n(Hello! I\'m ChatQuee Bot. How can I help you?)'
  );

  let lastMessageTime = 0;

  socket.on('user message', (msg) => {
    const now = Date.now();
    if (now - lastMessageTime < 1000) {
      // Rate limit: 1 message per second
      return socket.emit('bot message', 'Terlalu cepat! Tunggu sebentar sebelum mengirim pesan lagi. ⏳');
    }
    lastMessageTime = now;

    if (!isValidUserMessage(msg)) {
      // ignore invalid payloads
      return;
    }
    const reply = getBotReply(msg);
    setTimeout(() => {
      // Ensure socket is still connected to avoid memory leaks or useless emits
      if (socket.connected) {
        socket.emit('bot message', reply);
      }
    }, RESPONSE_DELAY_MS);
  });

  socket.on('disconnect', (reason) => {
    console.log('client disconnected', socket.id, reason);
  });

  socket.on('error', (err) => {
    console.error('socket error', socket.id, err);
  });
});

// graceful shutdown logic
function shutdown() {
  console.log('shutting down server...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.warn('force exit after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, () => {
  console.log(`ChatQuee server running at http://localhost:${PORT}`);
});
