import winston from 'winston';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(info => {
    const { timestamp, level, message, stack, ...meta } = info;

    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }

    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Function to create logger with config
function createLogger() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL || 'info';

  // Create transports array
  const transports: winston.transport[] = [];

  // Console transport for development
  if (nodeEnv === 'development') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), logFormat),
      })
    );
  } else {
    // Non-colorized console for production
    transports.push(
      new winston.transports.Console({
        format: logFormat,
      })
    );
  }

  // File transport for production and error logs
  if (nodeEnv === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
      })
    );
  }

  // Create logger instance
  return winston.createLogger({
    level: logLevel,
    format: logFormat,
    transports,
    exitOnError: false,
  });
}

// Create logger instance
export const logger = createLogger();

// Request logging middleware for Fastify
export function createRequestLogger() {
  return async (request: any, reply: any) => {
    const start = Date.now();

    // Log incoming request
    logger.info(`${request.method} ${request.url}`, {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    // Hook into response to log completion
    reply.raw.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = reply.raw.statusCode;

      const logLevel = statusCode >= 400 ? 'warn' : 'info';

      logger[logLevel](
        `${request.method} ${request.url} - ${statusCode} (${duration}ms)`,
        {
          method: request.method,
          url: request.url,
          statusCode,
          duration,
          ip: request.ip,
        }
      );
    });
  };
}

// Utility functions for structured logging
export const loggers = {
  // Database operations
  db: {
    query: (query: string, params?: any) => {
      logger.debug('Database query', { query, params });
    },
    error: (operation: string, error: Error) => {
      logger.error(`Database error during ${operation}`, {
        error: error.message,
        stack: error.stack,
      });
    },
  },

  // API operations
  api: {
    request: (method: string, endpoint: string, params?: any) => {
      logger.info(`API ${method} ${endpoint}`, { method, endpoint, params });
    },
    response: (
      method: string,
      endpoint: string,
      statusCode: number,
      duration: number
    ) => {
      logger.info(`API ${method} ${endpoint} - ${statusCode} (${duration}ms)`, {
        method,
        endpoint,
        statusCode,
        duration,
      });
    },
    error: (method: string, endpoint: string, error: Error) => {
      logger.error(`API ${method} ${endpoint} failed`, {
        method,
        endpoint,
        error: error.message,
        stack: error.stack,
      });
    },
  },

  // WebSocket operations
  ws: {
    connect: (clientId: string) => {
      logger.info(`WebSocket client connected: ${clientId}`);
    },
    disconnect: (clientId: string) => {
      logger.info(`WebSocket client disconnected: ${clientId}`);
    },
    broadcast: (event: string, clientCount: number) => {
      logger.debug(`WebSocket broadcast: ${event} to ${clientCount} clients`);
    },
    error: (clientId: string, error: Error) => {
      logger.error(`WebSocket error for client ${clientId}`, {
        clientId,
        error: error.message,
        stack: error.stack,
      });
    },
  },

  // System operations
  system: {
    startup: (port: number, env: string) => {
      logger.info(`Server started on port ${port} in ${env} mode`);
    },
    shutdown: (signal: string) => {
      logger.info(`Server shutting down due to ${signal}`);
    },
    error: (context: string, error: Error) => {
      logger.error(`System error in ${context}`, {
        context,
        error: error.message,
        stack: error.stack,
      });
    },
  },
};

export default logger;
