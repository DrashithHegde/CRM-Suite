const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client'); // 👈 Import Prisma
const { connectDB } = require('./config/database');
const { apiLimiter } = require('./middleware/rateLimiter');

dotenv.config();

const app = express();
const http = require('http');
const server = http.createServer(app);

// Initialize Prisma Client
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);

// ---------- ROUTES ----------
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// ---------- HEALTH CHECK (with Prisma DB verification) ----------
app.get('/api/health', async (req, res) => {
  try {
    // Count users to verify DB connection (adjust model name if needed)
    const userCount = await prisma.user.count();
    res.status(200).json({
      success: true,
      status: 'healthy',
      database: 'connected',
      userCount,
      timestamp: new Date().toISOString(),
      pid: process.pid,
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ---------- EXISTING HEALTH ROUTE (if you still need it) ----------
app.get('/health', (req, res) =>
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    pid: process.pid,
    uptime: process.uptime(),
  })
);

// ---------- ROOT ----------
app.get('/', (req, res) =>
  res.status(200).json({
    success: true,
    name: 'CRM API',
    version: '1.0.0',
    status: 'running',
    server: `http://localhost:${process.env.PORT || 5000}`,
  })
);

// ---------- GLOBAL ERROR HANDLER ----------
app.use((err, req, res, _next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// ---------- START SERVER ----------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // If you still use a separate DB connection (e.g., MongoDB), keep it
    await connectDB();

    // Initialize Socket.IO
    const { init } = require('./socket');
    init(server);

    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
