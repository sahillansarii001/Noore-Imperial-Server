import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { initDb } from './config/db.js';
import jwt from 'jsonwebtoken';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true
  }
});

const consultationNamespace = io.of('/consultation');

consultationNamespace.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

consultationNamespace.on('connection', (socket) => {
  console.log(`User connected to consultation: ${socket.user.id}`);

  socket.on('join_room', (consultationId) => {
    socket.join(consultationId);
    console.log(`User ${socket.user.id} joined consultation room ${consultationId}`);
  });

  socket.on('send_message', ({ consultationId, message }) => {
    io.of('/consultation').to(consultationId).emit('new_message', {
      message,
      sender: socket.user,
      timestamp: new Date()
    });
  });

  socket.on('stylist_note', ({ consultationId, note }) => {
    io.of('/consultation').to(consultationId).emit('note_added', {
      note,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected from consultation: ${socket.user.id}`);
  });
});

server.listen(env.PORT, async () => {
  console.log(`Server running on port ${env.PORT}`);
  await initDb();
});
