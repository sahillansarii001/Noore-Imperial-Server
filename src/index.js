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

// Auto-seed admin user
const seedAdminUser = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('Skipping admin seed: ADMIN_EMAIL or ADMIN_PASSWORD not provided');
    return;
  }

  try {
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.default.hash(password, 10);
    await (await import('./config/db.js')).pool.query(`
      INSERT INTO users (id, name, email, password_hash, role, is_verified)
      VALUES (gen_random_uuid(), 'System Admin', $1, $2, 'admin', true)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
    `, [email, hashedPassword]);
    console.log('Admin user verified/seeded. Password updated if necessary.');
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
};

server.listen(env.PORT, async () => {
  console.log(`Server running on port ${env.PORT}`);
  await initDb();
  await seedAdminUser();
});
