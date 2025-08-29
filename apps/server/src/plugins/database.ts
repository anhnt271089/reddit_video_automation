import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { DatabaseService } from '../services/database.js';
import { MigrationRunner } from '../utils/migrations.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const databasePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const db = new DatabaseService(config.database);

  // Run migrations on startup
  try {
    logger.info('Running database migrations...');
    const migrationRunner = new MigrationRunner(db);
    const result = await migrationRunner.runMigrations();

    if (result.success) {
      logger.info('Database migrations completed successfully', {
        migrationsRun: result.migrationsRun,
      });
    } else {
      logger.error('Database migrations failed', {
        errors: result.errors,
      });
      throw new Error('Failed to run database migrations');
    }
  } catch (error) {
    logger.error('Error running migrations:', error);
    throw error;
  }

  fastify.decorate('db', db);

  fastify.addHook('onClose', async instance => {
    instance.db.close();
  });
};

export default fp(databasePlugin, {
  name: 'database-plugin',
});
