import express, { json, urlencoded } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';

// Config & Utils
import connectDB from './config/db.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Socket
import { initializeSocket } from './sockets/socketHandler.js';

/** Origins allowed for CORS + Socket.io (browser sends e.g. http://localhost:3000, no trailing slash). */
function getAllowedOrigins() {
  const raw = [process.env.CLIENT_URLS, process.env.CLIENT_URL].filter(Boolean).join(',');
  const fromEnv = raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const localDev = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];
  return [...new Set([...fromEnv, ...localDev])];
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  return getAllowedOrigins().includes(origin);
}

// Initialize Express
const app = express();
const server = createServer(app);


// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, isOriginAllowed(origin));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// Connect Database
connectDB();

// Middleware — default CORP is "same-origin" and blocks cross-origin XHR (Socket.io polling).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cors({
  origin: (origin, callback) => {
    callback(null, isOriginAllowed(origin));
  },
  credentials: true,
}));
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

if (process.env.NODE_ENV === 'production') {
  const primaryClient =
    process.env.CLIENT_URL?.split(',')[0]?.trim()?.replace(/\/$/, '') || '';
  if (primaryClient) {
    setInterval(() => {
      fetch(`${primaryClient}/health`).catch(() => {});
    }, 14 * 60 * 1000); // 14 minutes
  }
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use(errorHandler);

// Initialize Socket Handlers
initializeSocket(io);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Allowed CORS origins: ${getAllowedOrigins().join(', ')}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

export default { app, server, io };