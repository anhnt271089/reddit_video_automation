import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { config } from './config/index.js';
import { healthRoutes } from './routes/health.js';
import { apiRoutes } from './routes/api/index.js';
import { logger } from './utils/logger.js';

// Create Fastify instance
const fastify = Fastify({
  logger: false, // We use Winston for logging
});

async function buildServer() {
  try {
    // Register CORS plugin
    await fastify.register(cors, {
      origin: true, // Allow all origins in development
      credentials: true,
    });

    // Register WebSocket plugin
    await fastify.register(websocket, {
      options: {
        maxPayload: 1048576, // 1MB
      },
    });

    // Register routes
    await fastify.register(healthRoutes);
    await fastify.register(apiRoutes);

    // WebSocket route (basic setup)
    fastify.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, (connection, request) => {
        logger.info('WebSocket connection established');
        
        connection.socket.on('message', (message: any) => {
          // Echo message back for now
          connection.socket.send(`Echo: ${message}`);
        });

        connection.socket.on('close', () => {
          logger.info('WebSocket connection closed');
        });
      });
    });

    return fastify;
  } catch (error) {
    logger.error('Error building server:', error);
    throw error;
  }
}

async function start() {
  try {
    const server = await buildServer();
    
    const address = await server.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    logger.info(`Server listening on ${address}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Database path: ${config.database.path}`);
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (typeof require !== 'undefined' && require.main === module) {
  start();
}

export { buildServer, start };