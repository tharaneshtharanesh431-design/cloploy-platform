import http from 'http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initEmailService } from './services/emailService.js';

const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  logger.info(`socket connected ${socket.id}`);
  socket.on('join:user', (userId) => socket.join(`user:${userId}`));
  socket.on('join:project', (projectId) => socket.join(`project:${projectId}`));
  socket.on('disconnect', () => logger.info(`socket disconnected ${socket.id}`));
});

connectDatabase().then(async () => {
  const emailReady = await initEmailService();
  if (!emailReady) {
    logger.warn('Email service is not operational. OTP emails will not be delivered.');
  }

  server.listen(env.PORT, () => {
    logger.info(`Cloploy API listening on port ${env.PORT}`); // reload comment v2
  });
});
