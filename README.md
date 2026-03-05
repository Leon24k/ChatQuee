# ChatQuee

Simple chat application built with Node.js, Express and Socket.IO. It now includes a scrollable landing page with 3D GSAP animations, hero section, feature descriptions and creator info before the chat interface.

## Getting started

```bash
npm install          # install dependencies
npm test             # run unit tests (requires jest)
npm start            # start the server
```

The server listens on `$PORT` (default 3000) and serves the static front-end from `public/`.

## Development notes

- Bot logic lives in `bot.js` and is easy to test
- Configuration values are in `config.js`
- Graceful shutdown and socket error handling added for stability

Feel free to fork and extend the chatbot with new features!

