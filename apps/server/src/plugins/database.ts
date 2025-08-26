import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { DatabaseService } from '../services/database.js';
import { config } from '../config/index.js';

const databasePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const db = new DatabaseService(config.database);

  fastify.decorate('db', db);

  fastify.addHook('onClose', async instance => {
    instance.db.close();
  });
};

export default fp(databasePlugin, {
  name: 'database-plugin',
});
