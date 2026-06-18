const { Server } = require('socket.io');

let io = null;

const init = (server, options = {}) => {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: options.corsOrigins || ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('✅ Socket connected:', socket.id);

    socket.on('join-user', (userId) => {
      if (userId) socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected:', socket.id);
    });
  });

  return io;
};

const getIo = () => io;

module.exports = { init, getIo };
