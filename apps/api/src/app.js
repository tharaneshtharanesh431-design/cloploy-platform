import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { logger, stream } from './config/logger.js';
import { swaggerSpec } from './config/swagger.js';
import './services/githubOAuth.js';
import authRoutes from './routes/auth.routes.js';
import twoFactorRoutes from './routes/twofa.routes.js';
import githubRoutes from './routes/github.routes.js';
import projectRoutes from './routes/project.routes.js';
import deploymentRoutes from './routes/deployment.routes.js';
import aiRoutes from './routes/ai.routes.js';
import adminRoutes from './routes/admin.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use(passport.initialize());

app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'cloploy-api', uptime: process.uptime() });
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscription', subscriptionRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

process.on('unhandledRejection', (error) => logger.error(error));
process.on('uncaughtException', (error) => logger.error(error));
