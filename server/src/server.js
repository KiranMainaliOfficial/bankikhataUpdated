import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import importExportRoutes from './routes/importExportRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }
});
app.set('io', io);

app.use(helmet());
app.use(compression());
app.use(hpp());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/health', (_req, res) => res.json({ ok: true, app: 'BankiKhata API' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/sync', syncRoutes);
app.use(notFound);
app.use(errorHandler);

io.on('connection', (socket) => {
  socket.emit('connected', { message: 'BankiKhata realtime connected' });
});
// 2. The Keep-Alive Cron Job (Runs every 14 minutes)
cron.schedule('*/14 * * * *', async () => {
  try {
    console.log('Running keep-alive cron job...');
    const response = await fetch('https://bankikhata.onrender.com/health');
    if (response.ok) {
      console.log(`Cron ping successful: Status ${response.status}`);
    }
  } catch (error) {
    console.error('Cron job network error:', error.message);
  }
});

const port = process.env.PORT || 5000;
connectDB()
  .then(() => server.listen(port, () => console.log(`BankiKhata API running on port ${port}`)))
  .catch((error) => {
    console.error('BankiKhata API failed to start:', error.message);
    if (!process.env.MONGO_URI) {
      console.error('Set MONGO_URI in .env or server/.env, for example mongodb://127.0.0.1:27017/bankikhata');
    }
    process.exit(1);
  });
