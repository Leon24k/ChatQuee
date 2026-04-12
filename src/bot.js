// bot.js
// Contains the chatbot logic separate from the server setup.

// mapping of trigger words/phrases to canned responses
const botResponses = {
  halo: 'Halo! Apa yang bisa saya bantu? 😊',
  hello: 'Hello! How can I help you? 😊',
  hi: 'Hi there! 👋',
  'apa kabar': 'Saya baik-baik saja, terima kasih sudah bertanya! Bagaimana dengan kamu?',
  'how are you': "I'm doing great, thanks for asking! How about you?",
  nama: 'Nama saya **ChatQuee Bot**! Senang berkenalan dengan kamu 🤖',
  name: 'My name is **ChatQuee Bot**! Nice to meet you 🤖',
  bantuan: 'Tentu! Anda bisa menanyakan apa saja. Saya akan berusaha menjawab dengan sebaik mungkin.',
  help: 'Sure! You can ask me anything. I will try my best to answer.',
  bye: 'Sampai jumpa! Semoga harimu menyenangkan 👋',
  'sampai jumpa': 'Sampai jumpa! Semoga harimu menyenangkan 👋',
  'terima kasih': 'Sama-sama! Senang bisa membantu 😊',
  'thank you': "You're welcome! Happy to help 😊", 
  thanks: "You're welcome! 😊",
  cuaca: 'Maaf, saya tidak bisa mengecek cuaca saat ini. Coba lihat aplikasi cuaca di perangkatmu ya!',
  weather: "I can't check the weather right now. Try a weather app on your device!",
  joke: 'Kenapa programmer suka minum kopi?\nKarena mereka **tidak suka Java yang dingin!** ☕😄\n*(Why do programmers prefer dark mode? Because light attracts bugs! 🐛)*',
};

const helpMessage = [
  '**ChatQuee Bot** bisa membantu dengan topik berikut:',
  '- **Salam:** `halo`, `hello`, `hi`',
  '- **Nama bot:** `nama`, `name`',
  '- **Waktu:** `waktu`, `time`, `jam`',
  '- **Kalkulator:** `hitung 5+5`, `calc 10/2`',
  '- **Cuaca:** `cuaca`, `weather`',
  '- **Sopan santun:** `terima kasih`, `thank you`, `thanks`',
  '- **Percakapan:** `apa kabar`, `how are you`, `bye`, `sampai jumpa`',
  '- **Hiburan:** `joke`',
  '\nKamu juga bisa mengetik `/help` kapan saja untuk melihat daftar ini lagi.'
].join('\n');

// determines whether a user-supplied message is acceptable
function isValidUserMessage(msg) {
  if (typeof msg !== 'string') {
    return false;
  }
  const trimmed = msg.trim();
  if (trimmed.length === 0) {
    return false;
  }
  // arbitrary length cap to avoid abusing the service
  if (trimmed.length > 1000) {
    return false;
  }
  return true;
}

// generate the bot's response for a given message
function getBotReply(message) {
  const lower = message.toLowerCase().trim();

  if (lower === '/help' || lower === '!help' || lower === 'help') {
    return helpMessage;
  }

  if (lower.includes('waktu') || lower.includes('time') || lower.includes('jam')) {
    const now = new Date();
    return `Sekarang pukul ${now.toLocaleTimeString('id-ID')}.
(The current time is ${now.toLocaleTimeString('en-US')}).`;
  }

  if (lower.startsWith('hitung ') || lower.startsWith('calc ')) {
    const expr = lower.replace(/^(hitung|calc)\s+/i, '').trim();
    // Validate to allow only math-safe characters
    if (/^[0-9+\-*/().\s]+$/.test(expr)) {
      try {
        const result = new Function(`return ${expr}`)();
        if (Number.isFinite(result)) {
          return `Hasil dari perhitungan: ${expr} = ${result}`;
        }
      } catch {
        // Fall back to the default handler on syntax error
      }
    }
    return 'Maaf, saya hanya bisa menghitung angka dengan operator dasar (+, -, *, /). Formatnya: "hitung 5+5"';
  }

  for (const [key, response] of Object.entries(botResponses)) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(lower)) {
      return response;
    }
  }

  return 'Maaf, saya belum mengerti maksud kamu. Coba tanyakan sesuatu yang lain! 🤔\n(Sorry, I didn\'t quite understand that. Try asking something else!)';
}

module.exports = {
  botResponses,
  helpMessage,
  isValidUserMessage,
  getBotReply,
};
