import { FastifyInstance } from 'fastify';

export async function apiRoutes(fastify: FastifyInstance) {
  // API route prefix
  fastify.register(
    async function (fastify) {
      // Placeholder API routes structure
      // Will be expanded in future stories

      fastify.get('/posts', async (request, reply) => {
        return reply.send({ message: 'Posts API endpoint - coming soon' });
      });

      fastify.get('/scripts', async (request, reply) => {
        return reply.send({ message: 'Scripts API endpoint - coming soon' });
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
