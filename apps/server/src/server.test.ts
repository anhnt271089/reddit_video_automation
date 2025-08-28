import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from './server.js';
import { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

describe('Fastify Server', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('Health endpoint', () => {
    it('should return health status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        status: 'ok',
        environment: expect.any(String),
        version: '1.0.0',
      });
      expect(body.timestamp).toBeDefined();
      expect(body.uptime).toBeGreaterThan(0);
    });
  });

  describe('API endpoints', () => {
    it('should respond to /api/posts', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/posts',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.message).toBe('Posts API endpoint - coming soon');
    });

    it('should respond to /api/scripts', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/scripts',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.message).toBe('Scripts API endpoint - coming soon');
    });

    it('should respond to /api/assets', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/assets',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.message).toBe('Assets API endpoint - coming soon');
    });

    it('should respond to /api/videos', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/videos',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.message).toBe('Videos API endpoint - coming soon');
    });
  });
});
