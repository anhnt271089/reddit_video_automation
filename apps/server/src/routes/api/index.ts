import { FastifyInstance } from 'fastify';
import { redditRoutes } from './reddit.js';
import scriptsRoutes from './scripts.js';
import testScriptsRoutes from '../test-scripts.js';
import searchPhraseRoutes from './search-phrases.js';
import pexelsDownloadRoutes from './pexels-download.js';
import { videoGenerationRoutes } from './video-generation.js';

export async function apiRoutes(fastify: FastifyInstance) {
  // API route prefix
  fastify.register(
    async function (fastify) {
      // Register Reddit API routes
      fastify.register(redditRoutes, { prefix: '/reddit' });

      // Register Scripts API routes
      fastify.register(scriptsRoutes, { prefix: '/scripts' });

      // Register Search Phrases API routes
      fastify.register(searchPhraseRoutes, { prefix: '/search-phrases' });

      // Register Pexels Download API routes
      fastify.register(pexelsDownloadRoutes, { prefix: '/pexels-download' });

      // Register Video Generation API routes
      // fastify.register(videoGenerationRoutes); // Temporarily disabled due to database dependency

      // Register Test Scripts routes (for development/testing)
      // fastify.register(testScriptsRoutes); // Temporarily disabled due to database dependency

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
