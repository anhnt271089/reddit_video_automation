/**
 * Reddit OAuth2 Authentication Routes
 * Handles OAuth2 flow for Reddit API access
 */

import { FastifyInstance } from 'fastify';
import { RedditAuthService } from '../../services/reddit/auth.js';
import { logger } from '../../utils/logger.js';

export async function redditAuthRoutes(fastify: FastifyInstance) {
  const authService = new RedditAuthService(fastify.db, logger);

  /**
   * GET /auth/reddit
   * Initiate Reddit OAuth2 flow
   */
  fastify.get('/auth/reddit', async (request, reply) => {
    try {
      const scopes = ['read']; // Can be expanded later
      const { url, state } = authService.generateAuthUrl(scopes);

      // Store state in session/memory for validation
      // For now, we'll trust the callback validation

      return reply.redirect(url);
    } catch (error) {
      logger.error('Failed to generate Reddit auth URL', {
        error: error instanceof Error ? error.message : String(error),
      });
      return reply.status(500).send({
        success: false,
        error: 'Failed to initiate Reddit authentication',
      });
    }
  });

  /**
   * GET /auth/reddit/callback
   * Handle Reddit OAuth2 callback
   */
  fastify.get<{
    Querystring: {
      code?: string;
      state?: string;
      error?: string;
    };
  }>('/auth/reddit/callback', async (request, reply) => {
    const { code, state, error } = request.query;

    if (error) {
      logger.error('Reddit OAuth error', { error });
      return reply.status(400).send({
        success: false,
        error: 'Reddit authentication failed',
        message: error,
      });
    }

    if (!code || !state) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required parameters',
        message: 'Authorization code and state are required',
      });
    }

    try {
      const token = await authService.exchangeCodeForToken(code, state);

      logger.info('Reddit authentication successful', {
        tokenId: token.id,
        expiresAt: token.expires_at,
      });

      // Return success page or redirect to dashboard
      return reply.send({
        success: true,
        message: 'Reddit authentication successful',
        data: {
          authenticated: true,
          expiresAt: token.expires_at,
          scope: token.scope,
        },
      });
    } catch (error) {
      logger.error('Failed to exchange Reddit auth code', {
        error: error instanceof Error ? error.message : String(error),
      });
      return reply.status(500).send({
        success: false,
        error: 'Failed to complete Reddit authentication',
      });
    }
  });

  /**
   * GET /auth/reddit/status
   * Check current Reddit authentication status
   */
  fastify.get('/auth/reddit/status', async (request, reply) => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      const isValid = isAuthenticated
        ? await authService.validateToken()
        : false;

      return {
        success: true,
        data: {
          authenticated: isAuthenticated,
          valid: isValid,
        },
      };
    } catch (error) {
      logger.error('Failed to check Reddit auth status', {
        error: error instanceof Error ? error.message : String(error),
      });
      return reply.status(500).send({
        success: false,
        error: 'Failed to check authentication status',
      });
    }
  });

  /**
   * POST /auth/reddit/refresh
   * Manually refresh Reddit token
   */
  fastify.post('/auth/reddit/refresh', async (request, reply) => {
    try {
      const accessToken = await authService.getValidAccessToken();

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          authenticated: true,
        },
      };
    } catch (error) {
      logger.error('Failed to refresh Reddit token', {
        error: error instanceof Error ? error.message : String(error),
      });
      return reply.status(500).send({
        success: false,
        error: 'Failed to refresh token',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * DELETE /auth/reddit
   * Revoke Reddit authentication
   */
  fastify.delete('/auth/reddit', async (request, reply) => {
    try {
      await authService.revokeToken();

      return {
        success: true,
        message: 'Reddit authentication revoked successfully',
      };
    } catch (error) {
      logger.error('Failed to revoke Reddit token', {
        error: error instanceof Error ? error.message : String(error),
      });
      return reply.status(500).send({
        success: false,
        error: 'Failed to revoke authentication',
      });
    }
  });
}
