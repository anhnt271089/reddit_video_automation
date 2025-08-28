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

        // List of text-rich subreddits for content discovery
        const textRichSubreddits = [
          'selfhelp',
          'selfimprovement',
          'decidingtobebetter',
          'getdisciplined',
          'productivity',
          'zenhabits',
        ];

        // Randomly select a subreddit for variety
        const selectedSubreddit =
          textRichSubreddits[
            Math.floor(Math.random() * textRichSubreddits.length)
          ];

        logger.info('Scraping from selected subreddit', {
          subreddit: selectedSubreddit,
          availableOptions: textRichSubreddits,
        });

        // Get posts from selected subreddit
        const topPosts = await apiClient.getTopPosts(
          selectedSubreddit,
          'week',
          {
            limit: 10, // Increased limit to get more options
          }
        );

        // Filter for posts with text content (selftext)
        const textPosts = topPosts.data.children.filter(
          child =>
            child.data.selftext &&
            child.data.selftext.trim().length > 100 && // At least 100 characters
            !child.data.selftext.includes('[removed]') && // Not removed content
            !child.data.selftext.includes('[deleted]') // Not deleted content
        );

        logger.info('Reddit scraping completed successfully', {
          subreddit: selectedSubreddit,
          totalPostsFound: topPosts.data.children.length,
          textPostsFound: textPosts.length,
          textPostIds: textPosts.map(p => p.data.id),
        });

        return reply.send({
          success: true,
          message: 'Reddit scraping completed',
          data: {
            subreddit: selectedSubreddit,
            postsScraped: textPosts.length,
            posts: textPosts.map(child => ({
              id: child.data.id,
              title: child.data.title,
              selftext: child.data.selftext,
              author: child.data.author,
              subreddit: child.data.subreddit,
              score: child.data.score,
              upvote_ratio: child.data.upvote_ratio,
              num_comments: child.data.num_comments,
              created_utc: child.data.created_utc,
              permalink: child.data.permalink,
              url: child.data.url,
              domain: child.data.domain,
              is_video: child.data.is_video,
              is_self: child.data.is_self,
              thumbnail: child.data.thumbnail,
              post_hint: child.data.post_hint,
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
