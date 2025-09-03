/**
 * Reddit API Routes
 * Provides endpoints for Reddit integration and monitoring
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../../utils/logger.js';
import { RedditApiClient } from '../../services/reddit/client.js';
import { RedditAuthService } from '../../services/reddit/auth.js';
import { redditRateLimiter } from '../../utils/rateLimiter.js';
import { StatusTransitionService } from '../../services/StatusTransitionService.js';
import {
  PostStatusManager,
  UnifiedPostStatus,
} from '@video-automation/shared-types';

export async function redditRoutes(fastify: FastifyInstance) {
  // Initialize services
  const authService = new RedditAuthService(fastify.db, logger);
  const apiClient = new RedditApiClient(authService, logger);
  const statusService = new StatusTransitionService(fastify.db);

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

        // Store posts in database
        const storedPosts = [];
        for (const child of textPosts) {
          try {
            // Check if post already exists
            const existingPost = fastify.db.get(
              'SELECT id FROM reddit_posts WHERE id = ?',
              [child.data.id]
            );

            if (!existingPost) {
              // Insert new post (mapping to existing schema)
              fastify.db.run(
                `INSERT INTO reddit_posts (
                  id, reddit_id, title, content, url, author,
                  upvotes, comments, created_date, score, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime(?, 'unixepoch'), ?, ?)`,
                [
                  child.data.id,
                  child.data.id, // reddit_id same as id
                  child.data.title,
                  child.data.selftext || '', // content field
                  child.data.url || child.data.permalink || '',
                  child.data.author,
                  child.data.score || 0, // upvotes field
                  child.data.num_comments || 0, // comments field
                  child.data.created_utc, // created_date field
                  child.data.score || 0, // score field
                  'discovered', // Default unified status
                ]
              );
              storedPosts.push(child.data.id);
            }
          } catch (error) {
            logger.error('Failed to store post', {
              postId: child.data.id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        logger.info('Reddit scraping completed successfully', {
          subreddit: selectedSubreddit,
          totalPostsFound: topPosts.data.children.length,
          textPostsFound: textPosts.length,
          textPostIds: textPosts.map(p => p.data.id),
          storedPostsCount: storedPosts.length,
        });

        return reply.send({
          success: true,
          message: 'Reddit scraping completed',
          data: {
            subreddit: selectedSubreddit,
            postsScraped: textPosts.length,
            storedPosts: storedPosts.length,
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
              status: 'pending',
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
        // Get posts from database
        const posts = fastify.db.all(`
          SELECT * FROM reddit_posts 
          ORDER BY discovered_at DESC 
          LIMIT 100
        `);

        return reply.send({
          success: true,
          posts: posts || [],
          count: posts?.length || 0,
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
   * Update post status (Approve/Reject) - Using StatusTransitionService
   */
  fastify.put<{
    Params: { id: string };
    Body: { status: string; userId?: string };
  }>('/posts/:id/status', async (request, reply) => {
    try {
      const { id } = request.params;
      const { status, userId } = request.body;

      // Map frontend status values to unified status
      let targetStatus: UnifiedPostStatus;
      let triggerEvent = 'api_call';

      if (status === 'approved') {
        targetStatus = 'idea_selected';
        triggerEvent = 'user_approval';
      } else if (status === 'rejected') {
        targetStatus = 'rejected';
        triggerEvent = 'user_rejection';
      } else {
        // Try to normalize the status directly
        targetStatus = PostStatusManager.normalizeStatus(status);
      }

      // Perform status transition with validation
      const result = await statusService.transitionStatus({
        postId: id,
        targetStatus,
        triggerEvent,
        metadata: {
          requestedStatus: status,
          userAgent: request.headers['user-agent'],
          timestamp: new Date().toISOString(),
        },
        userId,
      });

      if (!result.success) {
        // Check if it's a validation error or not found error
        if (result.error?.includes('not found')) {
          return reply.status(404).send({
            success: false,
            error: result.error,
          });
        }

        return reply.status(400).send({
          success: false,
          error: result.error,
          validationErrors: result.validationErrors,
        });
      }

      // Get updated post
      const updatedPost = fastify.db.get(
        'SELECT * FROM reddit_posts WHERE id = ?',
        [id]
      );

      logger.info('Post status transitioned successfully', {
        postId: id,
        oldStatus: result.oldStatus,
        newStatus: result.newStatus,
        auditLogId: result.auditLogId,
        triggerEvent,
        userId,
      });

      return reply.send({
        success: true,
        message: `Post status updated from ${result.oldStatus} to ${result.newStatus}`,
        post: updatedPost,
        transition: {
          oldStatus: result.oldStatus,
          newStatus: result.newStatus,
          auditLogId: result.auditLogId,
        },
      });
    } catch (error) {
      logger.error('Failed to update post status', {
        error: error instanceof Error ? error.message : String(error),
        postId: request.params.id,
        requestedStatus: request.body.status,
      });

      return reply.status(500).send({
        success: false,
        message: 'Failed to update post status',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Batch approve posts - Using StatusTransitionService
   */
  fastify.post<{
    Body: { postIds: string[]; userId?: string };
  }>('/posts/batch/approve', async (request, reply) => {
    try {
      const { postIds, userId } = request.body;

      if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'postIds array is required and cannot be empty',
        });
      }

      // Validate posts exist first
      const validation = await statusService.validatePostsExist(postIds);
      if (validation.invalid.length > 0) {
        return reply.status(400).send({
          success: false,
          error: `Posts not found: ${validation.invalid.join(', ')}`,
          invalidPostIds: validation.invalid,
        });
      }

      // Create batch transition requests
      const transitionRequests = postIds.map(postId => ({
        postId,
        targetStatus: 'idea_selected' as UnifiedPostStatus,
        triggerEvent: 'batch_approval',
        metadata: {
          batchOperation: true,
          batchSize: postIds.length,
          timestamp: new Date().toISOString(),
        },
        userId,
      }));

      // Execute batch transition
      const results =
        await statusService.batchTransitionStatus(transitionRequests);

      const successCount = results.filter(r => r.success).length;
      const failedResults = results.filter(r => !r.success);

      logger.info('Batch approve completed', {
        postIds,
        requestedCount: postIds.length,
        successCount,
        failedCount: failedResults.length,
        failedResults: failedResults.map(r => ({ error: r.error })),
      });

      return reply.send({
        success: failedResults.length === 0,
        message: `${successCount} posts approved`,
        results: {
          successCount,
          failedCount: failedResults.length,
          requestedCount: postIds.length,
          failures:
            failedResults.length > 0
              ? failedResults.map(r => r.error)
              : undefined,
        },
      });
    } catch (error) {
      logger.error('Failed to batch approve posts', {
        error: error instanceof Error ? error.message : String(error),
        postIds: request.body.postIds,
      });

      return reply.status(500).send({
        success: false,
        message: 'Failed to batch approve posts',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Batch reject posts - Using StatusTransitionService
   */
  fastify.post<{
    Body: { postIds: string[]; userId?: string };
  }>('/posts/batch/reject', async (request, reply) => {
    try {
      const { postIds, userId } = request.body;

      if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'postIds array is required and cannot be empty',
        });
      }

      // Validate posts exist first
      const validation = await statusService.validatePostsExist(postIds);
      if (validation.invalid.length > 0) {
        return reply.status(400).send({
          success: false,
          error: `Posts not found: ${validation.invalid.join(', ')}`,
          invalidPostIds: validation.invalid,
        });
      }

      // Create batch transition requests
      const transitionRequests = postIds.map(postId => ({
        postId,
        targetStatus: 'rejected' as UnifiedPostStatus,
        triggerEvent: 'batch_rejection',
        metadata: {
          batchOperation: true,
          batchSize: postIds.length,
          timestamp: new Date().toISOString(),
        },
        userId,
      }));

      // Execute batch transition
      const results =
        await statusService.batchTransitionStatus(transitionRequests);

      const successCount = results.filter(r => r.success).length;
      const failedResults = results.filter(r => !r.success);

      logger.info('Batch reject completed', {
        postIds,
        requestedCount: postIds.length,
        successCount,
        failedCount: failedResults.length,
        failedResults: failedResults.map(r => ({ error: r.error })),
      });

      return reply.send({
        success: failedResults.length === 0,
        message: `${successCount} posts rejected`,
        results: {
          successCount,
          failedCount: failedResults.length,
          requestedCount: postIds.length,
          failures:
            failedResults.length > 0
              ? failedResults.map(r => r.error)
              : undefined,
        },
      });
    } catch (error) {
      logger.error('Failed to batch reject posts', {
        error: error instanceof Error ? error.message : String(error),
        postIds: request.body.postIds,
      });

      return reply.status(500).send({
        success: false,
        message: 'Failed to batch reject posts',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Get status statistics and distribution
   */
  fastify.get('/posts/status/stats', async (request, reply) => {
    try {
      const stats = await statusService.getStatusStatistics();

      return reply.send({
        success: true,
        statistics: stats,
        total: Object.values(stats).reduce((sum, count) => sum + count, 0),
      });
    } catch (error) {
      logger.error('Failed to get status statistics', {
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        success: false,
        message: 'Failed to get status statistics',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Get posts by status with pagination
   */
  fastify.get<{
    Params: { status: string };
    Querystring: { page?: number; limit?: number };
  }>('/posts/status/:status', async (request, reply) => {
    try {
      const { status } = request.params;
      const { page = 1, limit = 50 } = request.query;

      // Validate status
      const normalizedStatus = PostStatusManager.normalizeStatus(status);

      const result = await statusService.getPostsByStatus(
        normalizedStatus,
        page,
        limit
      );

      return reply.send({
        success: true,
        status: normalizedStatus,
        ...result,
      });
    } catch (error) {
      logger.error('Failed to get posts by status', {
        error: error instanceof Error ? error.message : String(error),
        status: request.params.status,
      });

      return reply.status(500).send({
        success: false,
        message: 'Failed to get posts by status',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Get status history for a post
   */
  fastify.get<{
    Params: { id: string };
    Querystring: { limit?: number };
  }>('/posts/:id/status/history', async (request, reply) => {
    try {
      const { id } = request.params;
      const { limit = 50 } = request.query;

      const history = await statusService.getStatusHistory(id, limit);

      return reply.send({
        success: true,
        postId: id,
        history,
        count: history.length,
      });
    } catch (error) {
      logger.error('Failed to get status history', {
        error: error instanceof Error ? error.message : String(error),
        postId: request.params.id,
      });

      return reply.status(500).send({
        success: false,
        message: 'Failed to get status history',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Get valid transitions for a post
   */
  fastify.get<{
    Params: { id: string };
  }>('/posts/:id/status/transitions', async (request, reply) => {
    try {
      const { id } = request.params;

      const validTransitions = await statusService.getValidTransitions(id);

      if (validTransitions.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Post not found or no valid transitions available',
        });
      }

      return reply.send({
        success: true,
        postId: id,
        validTransitions,
        count: validTransitions.length,
      });
    } catch (error) {
      logger.error('Failed to get valid transitions', {
        error: error instanceof Error ? error.message : String(error),
        postId: request.params.id,
      });

      return reply.status(500).send({
        success: false,
        message: 'Failed to get valid transitions',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Get stuck posts (posts in processing states for too long)
   */
  fastify.get<{
    Querystring: { hours?: number };
  }>('/posts/stuck', async (request, reply) => {
    try {
      const { hours = 24 } = request.query;

      const stuckPosts = await statusService.getStuckPosts(hours);

      return reply.send({
        success: true,
        stuckPosts,
        count: stuckPosts.length,
        stuckThresholdHours: hours,
      });
    } catch (error) {
      logger.error('Failed to get stuck posts', {
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        success: false,
        message: 'Failed to get stuck posts',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

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
