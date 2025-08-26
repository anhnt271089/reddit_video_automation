/**
 * Reddit API Routes
 * Provides endpoints for Reddit integration and monitoring
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../../utils/logger.js';
import { RedditApiClient } from '../../services/reddit/client.js';
import { RedditAuthService } from '../../services/reddit/auth.js';
import { redditRateLimiter } from '../../utils/rateLimiter.js';

export async function redditRoutes(fastify: FastifyInstance) {
  // Initialize services
  const authService = new RedditAuthService(fastify.db, logger);
  const apiClient = new RedditApiClient(authService, logger);

  /**
   * Manual trigger for Reddit scraping
   */
  fastify.post(
    '/scrape',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        logger.info('Manual Reddit scraping triggered');

        // For now, just test the connection
        const connectionTest = await apiClient.testConnection();

        if (!connectionTest) {
          return reply.status(503).send({
            success: false,
            message: 'Reddit API connection failed - check authentication',
          });
        }

        // Get some sample data
        const topPosts = await apiClient.getTopPosts('getmotivated', 'week', {
          limit: 5,
        });

        logger.info('Reddit scraping completed successfully', {
          postsFound: topPosts.data.children.length,
        });

        return reply.send({
          success: true,
          message: 'Reddit scraping completed',
          data: {
            postsScraped: topPosts.data.children.length,
            posts: topPosts.data.children.map(child => ({
              id: child.data.id,
              title: child.data.title,
              score: child.data.score,
              author: child.data.author,
              created_utc: child.data.created_utc,
            })),
          },
        });
      } catch (error) {
        logger.error('Reddit scraping failed', {
          error: error instanceof Error ? error.message : String(error),
        });

        return reply.status(500).send({
          success: false,
          message: 'Reddit scraping failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * Get stored Reddit posts
   */
  fastify.get(
    '/posts',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // For now, return empty array - database storage will be implemented in Task 5
        return reply.send({
          success: true,
          posts: [],
          message: 'Database storage coming in Task 5',
        });
      } catch (error) {
        logger.error('Failed to retrieve Reddit posts', {
          error: error instanceof Error ? error.message : String(error),
        });

        return reply.status(500).send({
          success: false,
          message: 'Failed to retrieve posts',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * Get Reddit API health status
   */
  fastify.get(
    '/status',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const connectionTest = await apiClient.testConnection();
        const rateLimitStats = apiClient.getRateLimiterStats();

        return reply.send({
          success: true,
          status: {
            apiConnection: connectionTest ? 'healthy' : 'failed',
            authentication: connectionTest ? 'valid' : 'invalid',
            rateLimit: {
              tokensRemaining: rateLimitStats.tokensRemaining,
              maxTokens: rateLimitStats.maxTokens,
              queueSize: rateLimitStats.queueSize,
              totalRequests: rateLimitStats.totalRequests,
              throttledRequests: rateLimitStats.throttledRequests,
              averageWaitTime: Math.round(rateLimitStats.averageWaitTime),
              lastRefill: new Date(rateLimitStats.lastRefill).toISOString(),
            },
          },
        });
      } catch (error) {
        logger.error('Failed to get Reddit API status', {
          error: error instanceof Error ? error.message : String(error),
        });

        return reply.status(500).send({
          success: false,
          message: 'Failed to get API status',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  /**
   * Get detailed rate limiter statistics
   */
  fastify.get(
    '/rate-limit',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const stats = redditRateLimiter.getStats();

        return reply.send({
          success: true,
          rateLimiter: {
            tokensRemaining: stats.tokensRemaining,
            maxTokens: stats.maxTokens,
            queueSize: stats.queueSize,
            totalRequests: stats.totalRequests,
            throttledRequests: stats.throttledRequests,
            throttleRate:
              stats.totalRequests > 0
                ? Math.round(
                    (stats.throttledRequests / stats.totalRequests) * 100
                  )
                : 0,
            averageWaitTime: Math.round(stats.averageWaitTime),
            lastRefill: new Date(stats.lastRefill).toISOString(),
          },
        });
      } catch (error) {
        logger.error('Failed to get rate limiter stats', {
          error: error instanceof Error ? error.message : String(error),
        });

        return reply.status(500).send({
          success: false,
          message: 'Failed to get rate limiter statistics',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );
}
