// Backend Node.js + socket.io + Redis pour messagerie et signalisation WebRTC
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const redis = new Redis();

// Stockage des messages dans Redis
function saveMessage(from, to, content) {
  const key = `messages:${from}:${to}`;
  redis.rpush(key, JSON.stringify({ from, to, content, timestamp: Date.now() }));
}

function getMessages(from, to) {
  const key = `messages:${from}:${to}`;
  return redis.lrange(key, 0, -1).then(list => list.map(JSON.parse));
}

io.on('connection', (socket) => {
  const { userId, role } = socket.handshake.query;
  socket.join(userId);

  // Messagerie
  socket.on('send_message', async ({ toUserId, message }) => {
    saveMessage(userId, toUserId, message);
    io.to(toUserId).emit('receive_message', { sender: userId, content: message });
  });

  socket.on('get_history', async ({ toUserId }) => {
    const history = await getMessages(userId, toUserId);
    socket.emit('history', history);
  });

  // Signalisation WebRTC
  socket.on('call_offer', ({ toUserId, offer }) => {
    io.to(toUserId).emit('call_offer', { fromUserId: userId, offer });
  });
  socket.on('call_answer', ({ toUserId, answer }) => {
    io.to(toUserId).emit('call_answer', { fromUserId: userId, answer });
  });
  socket.on('ice_candidate', ({ toUserId, candidate }) => {
    io.to(toUserId).emit('ice_candidate', { fromUserId: userId, candidate });
  });

  socket.on('disconnect', () => {
    socket.leave(userId);
  });
});

server.listen(3000, () => {
  console.log('Serveur socket.io + Redis lancé sur http://localhost:3000');
});
