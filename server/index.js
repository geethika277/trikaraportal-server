import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { env } from './src/config/env.js';
import { initNotificationService } from './src/services/notification.js';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: env.CLIENT_URL, credentials: true },
});

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  if (userId) {
    socket.join(`user:${userId}`);
    console.log(`Socket connected: user ${userId}`);
  }
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

initNotificationService(io);

connectDB().then(() => {
  httpServer.listen(env.PORT, () => {
    console.log(`Trikara server running on port ${env.PORT}`);
  });
});
