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
                  'idea', // Default status per schema
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
   * Update post status (Approve/Reject)
   */
  fastify.put<{
    Params: { id: string };
    Body: { status: string };
  }>('/posts/:id/status', async (request, reply) => {
    try {
      const { id } = request.params;
      const { status } = request.body;

      // Validate status and map frontend values to database values
      let dbStatus = status;
      if (status === 'approved') {
        dbStatus = 'idea_selected';
      } else if (status === 'rejected') {
        dbStatus = 'script_rejected';
      }

      const validStatuses = [
        'idea',
        'idea_selected',
        'script_generated',
        'script_approved',
        'script_rejected',
        'assets_ready',
        'rendering',
        'completed',
        'failed',
      ];
      if (!validStatuses.includes(dbStatus)) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid status. Valid statuses: ' + validStatuses.join(', '),
        });
      }

      // Check if post exists
      const existingPost = fastify.db.get(
        'SELECT * FROM reddit_posts WHERE id = ?',
        [id]
      ) as any;

      if (!existingPost) {
        return reply.status(404).send({
          success: false,
          error: 'Post not found',
        });
      }

      // Update post status
      const result = fastify.db.run(
        `UPDATE reddit_posts 
           SET status = ?, updated_at = datetime('now')
           WHERE id = ?`,
        [dbStatus, id]
      );

      if (result.changes === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Post not found or no changes made',
        });
      }

      // Get updated post
      const updatedPost = fastify.db.get(
        'SELECT * FROM reddit_posts WHERE id = ?',
        [id]
      );

      logger.info('Post status updated', {
        postId: id,
        newStatus: status,
        oldStatus: existingPost.status,
      });

      return reply.send({
        success: true,
        message: `Post status updated to ${status}`,
        post: updatedPost,
      });
    } catch (error) {
      logger.error('Failed to update post status', {
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        success: false,
        message: 'Failed to update post status',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Batch approve posts
   */
  fastify.post<{
    Body: { postIds: string[] };
  }>('/posts/batch/approve', async (request, reply) => {
    try {
      const { postIds } = request.body;

      if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'postIds array is required and cannot be empty',
        });
      }

      // Update all posts to approved status (mapped to idea_selected)
      const placeholders = postIds.map(() => '?').join(',');
      const result = fastify.db.run(
        `UPDATE reddit_posts 
           SET status = 'idea_selected', updated_at = datetime('now')
           WHERE id IN (${placeholders})`,
        postIds
      );

      logger.info('Batch approve completed', {
        postIds,
        updatedCount: result.changes,
      });

      return reply.send({
        success: true,
        message: `${result.changes} posts approved`,
        updatedCount: result.changes,
        requestedCount: postIds.length,
      });
    } catch (error) {
      logger.error('Failed to batch approve posts', {
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        success: false,
        message: 'Failed to batch approve posts',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * Batch reject posts
   */
  fastify.post<{
    Body: { postIds: string[] };
  }>('/posts/batch/reject', async (request, reply) => {
    try {
      const { postIds } = request.body;

      if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'postIds array is required and cannot be empty',
        });
      }

      // Update all posts to rejected status (mapped to script_rejected)
      const placeholders = postIds.map(() => '?').join(',');
      const result = fastify.db.run(
        `UPDATE reddit_posts 
           SET status = 'script_rejected', updated_at = datetime('now')
           WHERE id IN (${placeholders})`,
        postIds
      );

      logger.info('Batch reject completed', {
        postIds,
        updatedCount: result.changes,
      });

      return reply.send({
        success: true,
        message: `${result.changes} posts rejected`,
        updatedCount: result.changes,
        requestedCount: postIds.length,
      });
    } catch (error) {
      logger.error('Failed to batch reject posts', {
        error: error instanceof Error ? error.message : String(error),
      });

      return reply.status(500).send({
        success: false,
        message: 'Failed to batch reject posts',
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
