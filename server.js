const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const botResponses = {
  halo: 'Halo! Apa yang bisa saya bantu? 😊',
  hello: 'Hello! How can I help you? 😊',
  hi: 'Hi there! 👋',
  'apa kabar': 'Saya baik-baik saja, terima kasih sudah bertanya! Bagaimana dengan kamu?',
  'how are you': "I'm doing great, thanks for asking! How about you?",
  nama: 'Nama saya ChatQuee Bot! Senang berkenalan dengan kamu 🤖',
  name: 'My name is ChatQuee Bot! Nice to meet you 🤖',
  bantuan: 'Tentu! Anda bisa menanyakan apa saja. Saya akan berusaha menjawab dengan sebaik mungkin.',
  help: 'Sure! You can ask me anything. I will try my best to answer.',
  bye: 'Sampai jumpa! Semoga harimu menyenangkan 👋',
  'sampai jumpa': 'Sampai jumpa! Semoga harimu menyenangkan 👋',
  'terima kasih': 'Sama-sama! Senang bisa membantu 😊',
  'thank you': "You're welcome! Happy to help 😊",
  thanks: "You're welcome! 😊",
  cuaca: 'Maaf, saya tidak bisa mengecek cuaca saat ini. Coba lihat aplikasi cuaca di perangkatmu ya!',
  weather: "I can't check the weather right now. Try a weather app on your device!",
  joke: 'Kenapa programmer suka minum kopi? Karena mereka tidak suka Java yang dingin! ☕😄\n(Why do programmers prefer dark mode? Because light attracts bugs! 🐛)',
};

function getBotReply(message) {
  const lower = message.toLowerCase().trim();

  if (lower.includes('waktu') || lower.includes('time') || lower.includes('jam')) {
    const now = new Date();
    return `Sekarang pukul ${now.toLocaleTimeString('id-ID')}.\n(The current time is ${now.toLocaleTimeString('en-US')}.)`;
  }

  for (const [key, response] of Object.entries(botResponses)) {
    if (lower.includes(key)) {
      return response;
    }
  }

  return 'Maaf, saya belum mengerti maksud kamu. Coba tanyakan sesuatu yang lain! 🤔\n(Sorry, I didn\'t quite understand that. Try asking something else!)';
}

io.on('connection', (socket) => {
  socket.emit('bot message', 'Halo! Saya ChatQuee Bot. Ada yang bisa saya bantu? 👋\n(Hello! I\'m ChatQuee Bot. How can I help you?)');

  socket.on('user message', (msg) => {
    if (typeof msg !== 'string' || msg.trim() === '') return;
    const reply = getBotReply(msg);
    setTimeout(() => {
      socket.emit('bot message', reply);
    }, 400);
  });
});

server.listen(PORT, () => {
  console.log(`ChatQuee server running at http://localhost:${PORT}`);
});
