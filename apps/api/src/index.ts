import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { pool, closePool } from './db';

// Routes
import { wardsRoutes } from './routes/wards';
import { signalsRoutes } from './routes/signals';
import { eventsRoutes } from './routes/events';
import { sourcesRoutes } from './routes/sources';
import { dailyRoutes } from './routes/daily';
import { searchRoutes } from './routes/search';
import { sentimentRoutes } from './routes/sentiment';
import { themesRoutes } from './routes/themes';
import { hotspotsRoutes } from './routes/hotspots';

const fastify = Fastify({
  logger: {
    level: config.NODE_ENV === 'development' ? 'info' : 'warn',
  },
});

// Register plugins
fastify.register(cors, {
  origin: config.NODE_ENV === 'development' ? true : /\.dc-listener\./,
  credentials: true,
});

// Health check
fastify.get('/health', async (request, reply) => {
  try {
    await pool.query('SELECT 1');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    };
  } catch (error) {
    reply.code(503);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Register routes
fastify.register(wardsRoutes, { prefix: '/api' });
fastify.register(signalsRoutes, { prefix: '/api' });
fastify.register(eventsRoutes, { prefix: '/api' });
fastify.register(sourcesRoutes, { prefix: '/api' });
fastify.register(dailyRoutes, { prefix: '/api' });
fastify.register(searchRoutes, { prefix: '/api' });
fastify.register(sentimentRoutes, { prefix: '/api' });
fastify.register(themesRoutes, { prefix: '/api' });
fastify.register(hotspotsRoutes, { prefix: '/api' });

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  reply.status(error.statusCode || 500).send({
    error: error.message || 'Internal Server Error',
    statusCode: error.statusCode || 500,
  });
});

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, closing server...`);
    await fastify.close();
    await closePool();
    process.exit(0);
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: parseInt(config.PORT),
      host: config.HOST,
    });

    fastify.log.info(`DC Internet Listener API running on ${config.HOST}:${config.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
