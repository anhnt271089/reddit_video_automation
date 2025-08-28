import { FastifyInstance } from 'fastify';
import { redditRoutes } from './reddit.js';
import scriptsRoutes from './scripts.js';

export async function apiRoutes(fastify: FastifyInstance) {
  // API route prefix
  fastify.register(
    async function (fastify) {
      // Register Reddit API routes
      fastify.register(redditRoutes, { prefix: '/reddit' });
      
      // Register Scripts API routes
      fastify.register(scriptsRoutes, { prefix: '/scripts' });

      // Placeholder API routes structure
      // Will be expanded in future stories

      fastify.get('/posts', async (request, reply) => {
        return reply.send({ message: 'Posts API endpoint - coming soon' });
      });

      fastify.get('/assets', async (request, reply) => {
        return reply.send({ message: 'Assets API endpoint - coming soon' });
      });

      fastify.get('/videos', async (request, reply) => {
        return reply.send({ message: 'Videos API endpoint - coming soon' });
      });
    },
    { prefix: '/api' }
  );
}
