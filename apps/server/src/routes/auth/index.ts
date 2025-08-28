import { FastifyInstance } from 'fastify';
import { redditAuthRoutes } from './reddit.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Register Reddit OAuth2 routes
  await fastify.register(redditAuthRoutes);
}