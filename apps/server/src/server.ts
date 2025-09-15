import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import staticPlugin from '@fastify/static';
import path from 'path';
import { config } from './config/index.js';
import { healthRoutes } from './routes/health.js';
import { apiRoutes } from './routes/api/index.js';
import { authRoutes } from './routes/auth/index.js';
import { logger } from './utils/logger.js';
import databasePlugin from './plugins/database.js';
import { WebSocketService } from './services/websocket.js';
import './types/fastify.js';

// Create Fastify instance
const fastify = Fastify({
  logger: false, // We use Winston for logging
});

async function buildServer() {
  try {
    // Register database plugin first
    await fastify.register(databasePlugin);

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

    // Register static file serving for assets
    await fastify.register(staticPlugin, {
      root: path.resolve(process.cwd(), '../../assets'),
      prefix: '/assets/',
    });

    // Initialize and register WebSocket service
    const wsService = new WebSocketService();
    fastify.decorate('wsService', wsService);

    // Register routes
    await fastify.register(healthRoutes);
    await fastify.register(apiRoutes);
    await fastify.register(authRoutes);

    // WebSocket route (basic setup)
    fastify.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, (connection, request) => {
        logger.info('WebSocket connection established');

        // Register client with WebSocket service
        const clientId = wsService.addClient(connection.socket);

        connection.socket.on('message', (message: any) => {
          // Parse and handle message properly
          try {
            const parsedMessage = JSON.parse(message);

            // Handle ping/pong
            if (parsedMessage.event === 'ping') {
              connection.socket.send(JSON.stringify({ event: 'pong' }));
            } else {
              // Echo other messages as JSON
              connection.socket.send(
                JSON.stringify({
                  event: 'echo',
                  data: parsedMessage,
                })
              );
            }
          } catch (error) {
            // If not JSON, send as text echo
            connection.socket.send(
              JSON.stringify({
                event: 'echo',
                data: { message: message.toString() },
              })
            );
          }
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

// Start server when this file is run directly
start();

export { buildServer, start };
