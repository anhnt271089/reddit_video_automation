/**
 * Reddit Authentication Middleware
 * Validates Reddit OAuth tokens for protected routes
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { RedditAuthService } from '../services/reddit/auth.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends FastifyRequest {
  redditAuth?: {
    accessToken: string;
    isAuthenticated: boolean;
  };
}

/**
 * Middleware factory for Reddit authentication
 */
export function createRedditAuthMiddleware(authService: RedditAuthService) {
  return async function redditAuthMiddleware(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ) {
    try {
      const isAuthenticated = await authService.isAuthenticated();

      if (!isAuthenticated) {
        return reply.status(401).send({
          success: false,
          error: 'Reddit authentication required',
          message:
            'No valid Reddit token available. Please authenticate first.',
        });
      }

      // Validate token and get fresh access token
      const accessToken = await authService.getValidAccessToken();
      const isValid = await authService.validateToken();

      if (!isValid) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid Reddit token',
          message:
            'Reddit token is invalid or expired. Please re-authenticate.',
        });
      }

      // Add auth info to request
      request.redditAuth = {
        accessToken,
        isAuthenticated: true,
      };

      // Continue to route handler
    } catch (error) {
      logger.error('Reddit auth middleware error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return reply.status(500).send({
        success: false,
        error: 'Authentication check failed',
        message: 'Unable to verify Reddit authentication',
      });
    }
  };
}

/**
 * Optional middleware - adds auth info if available but doesn't block
 */
export function createOptionalRedditAuthMiddleware(
  authService: RedditAuthService
) {
  return async function optionalRedditAuthMiddleware(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ) {
    try {
      const isAuthenticated = await authService.isAuthenticated();

      if (isAuthenticated) {
        const accessToken = await authService.getValidAccessToken();
        const isValid = await authService.validateToken();

        request.redditAuth = {
          accessToken: isValid ? accessToken : '',
          isAuthenticated: isValid,
        };
      } else {
        request.redditAuth = {
          accessToken: '',
          isAuthenticated: false,
        };
      }
    } catch (error) {
      logger.warn('Optional Reddit auth check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      request.redditAuth = {
        accessToken: '',
        isAuthenticated: false,
      };
    }
  };
}
