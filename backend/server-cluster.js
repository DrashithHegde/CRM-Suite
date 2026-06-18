const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');
const { apiLimiter } = require('./middleware/rateLimiter');
const loadBalancer = require('./config/loadBalancer');

dotenv.config();

const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(compression());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api', apiLimiter);
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/leads', require('./routes/leadRoutes'));
  app.get('/health', (req, res) =>
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      pid: process.pid,
      uptime: process.uptime(),
    })
  );
  app.get('/stats', (req, res) => {
    const remote = req.ip || req.connection.remoteAddress || '';
    const allowed = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
    if (!allowed.includes(remote)) return res.status(404).json({ error: 'Not found' });
    const healthStatus = loadBalancer.getHealthStatus();
    res.json(healthStatus);
  });
  app.get('/', (req, res) =>
    res.json({ name: 'CRM API (Clustered)', version: '1.0.0', worker: process.pid })
  );
  app.use((err, req, res, next) => {
    console.error(`Worker ${process.pid} error:`, err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
  });
  return app;
};
const startClusteredServer = () => {
  loadBalancer.setupCluster(null, async () => {
    try {
      await connectDB();
      const app = createApp();
      const PORT = process.env.PORT || 5000;
      const http = require('http');
      const server = http.createServer(app);
      const { init } = require('./socket');
      init(server);
      server.listen(PORT, () => {
        console.log(`Worker ${process.pid} started on port ${PORT}`);
      });
      setInterval(() => {
        if (process.send) process.send({ type: 'health', pid: process.pid });
      }, 30000);
    } catch (error) {
      console.error(`Worker ${process.pid} failed to start:`, error);
      process.exit(1);
    }
  });
};

const shouldCluster = process.env.USE_CLUSTER === 'true';
if (shouldCluster) startClusteredServer();
else {
  const app = createApp();
  const startServer = async () => {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    const http = require('http');
    const server = http.createServer(app);
    const { init } = require('./socket');
    init(server);
    server.listen(PORT, () => {
      console.log(`Single instance server running on port ${PORT}`);
    });
  };
  startServer();
}
