import { EventEmitter } from 'events';
import { DatabaseService } from './database';
import { GenerationQueue } from '../queue/generationQueue';
import { WebSocketService } from './websocket';
import { logger } from '../utils/logger';
import { ProcessingStatus } from '@video-automation/shared-types';

interface PipelineOptions {
  autoTrigger?: boolean;
  defaultStyle?:
    | 'motivational'
    | 'educational'
    | 'entertainment'
    | 'storytelling';
  defaultDuration?: number;
  checkInterval?: number;
}

interface PipelineMetrics {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  averageProcessingTime: number;
  lastProcessedAt?: Date;
}

export class PipelineController extends EventEmitter {
  private db: DatabaseService;
  private queue: GenerationQueue;
  private wsService: WebSocketService;
  private isRunning = false;
  private checkInterval?: NodeJS.Timeout;
  private metrics: PipelineMetrics = {
    totalProcessed: 0,
    successCount: 0,
    failureCount: 0,
    averageProcessingTime: 0,
  };

  private readonly options: Required<PipelineOptions> = {
    autoTrigger: true,
    defaultStyle: 'motivational',
    defaultDuration: 60,
    checkInterval: 5000, // Check every 5 seconds
  };

  constructor(
    db: DatabaseService,
    queue: GenerationQueue,
    wsService: WebSocketService,
    options?: PipelineOptions
  ) {
    super();
    this.db = db;
    this.queue = queue;
    this.wsService = wsService;

    if (options) {
      this.options = { ...this.options, ...options };
    }

    // Listen to queue events
    this.setupQueueListeners();
  }

  /**
   * Start the pipeline controller
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Pipeline controller already running');
      return;
    }

    this.isRunning = true;
    logger.info('Pipeline controller started', {
      autoTrigger: this.options.autoTrigger,
      checkInterval: this.options.checkInterval,
    });

    // Start the queue
    await this.queue.start();

    // Start monitoring for approved posts
    if (this.options.autoTrigger) {
      this.startMonitoring();
    }

    // Process any pending approved posts
    await this.processPendingPosts();
  }

  /**
   * Stop the pipeline controller
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }

    await this.queue.stop();

    logger.info('Pipeline controller stopped');
  }

  /**
   * Start monitoring for status changes
   */
  private startMonitoring(): void {
    this.checkInterval = setInterval(async () => {
      if (!this.isRunning) {
        return;
      }

      try {
        await this.checkForApprovedPosts();
      } catch (error) {
        logger.error('Error checking for approved posts', { error });
      }
    }, this.options.checkInterval);
  }

  /**
   * Check for posts with 'idea_selected' status
   */
  private async checkForApprovedPosts(): Promise<void> {
    const approvedPosts = this.db.all<any>(
      `SELECT * FROM reddit_posts 
       WHERE status = ? 
       AND id NOT IN (
         SELECT post_id FROM generation_queue 
         WHERE status IN ('pending', 'processing')
       )
       LIMIT 10`,
      ['idea_selected']
    );

    for (const post of approvedPosts) {
      await this.triggerGeneration(post.id);
    }
  }

  /**
   * Process any pending posts on startup
   */
  private async processPendingPosts(): Promise<void> {
    const pendingCount = await this.checkForApprovedPosts();

    if (pendingCount > 0) {
      logger.info('Processing pending approved posts', { count: pendingCount });
    }
  }

  /**
   * Manually trigger script generation for a post
   */
  async triggerGeneration(
    postId: string,
    params?: {
      style?: 'motivational' | 'educational' | 'entertainment' | 'storytelling';
      targetDuration?: number;
      priority?: number;
    }
  ): Promise<string> {
    try {
      // Verify post exists and is in correct state
      const post = this.db.get<any>('SELECT * FROM reddit_posts WHERE id = ?', [
        postId,
      ]);

      if (!post) {
        throw new Error(`Post not found: ${postId}`);
      }

      // Check if already processing
      const existingJob = this.db.get<any>(
        `SELECT * FROM generation_queue 
         WHERE post_id = ? 
         AND status IN ('pending', 'processing')`,
        [postId]
      );

      if (existingJob) {
        logger.warn('Script generation already in progress', {
          postId,
          jobId: existingJob.id,
        });
        return existingJob.id;
      }

      // Create generation job
      const job = await this.queue.createJob(
        postId,
        {
          style: params?.style || this.options.defaultStyle,
          targetDuration:
            params?.targetDuration || this.options.defaultDuration,
        },
        params?.priority || 0
      );

      // Update post status to indicate processing
      this.updatePostStatus(postId, 'idea_selected');

      // Send WebSocket notification
      this.wsService.broadcast({
        type: 'pipeline_generation_triggered',
        payload: {
          postId,
          jobId: job.id,
          status: 'triggered',
        },
      });

      logger.info('Script generation triggered', {
        postId,
        jobId: job.id,
        style: job.generation_params.style,
      });

      this.emit('generation:triggered', { postId, jobId: job.id });

      return job.id;
    } catch (error) {
      logger.error('Failed to trigger script generation', {
        postId,
        error: (error as Error).message,
      });

      this.emit('generation:failed', { postId, error });
      throw error;
    }
  }

  /**
   * Update post processing status
   */
  private updatePostStatus(postId: string, status: ProcessingStatus): void {
    this.db.run(
      'UPDATE reddit_posts SET status = ?, updated_at = ? WHERE id = ?',
      [status, new Date().toISOString(), postId]
    );
  }

  /**
   * Setup queue event listeners
   */
  private setupQueueListeners(): void {
    // Listen for completed generations
    this.queue.on('job:completed', (data: any) => {
      this.handleJobCompleted(data);
    });

    // Listen for failed generations
    this.queue.on('job:failed', (data: any) => {
      this.handleJobFailed(data);
    });
  }

  /**
   * Handle successful job completion
   */
  private async handleJobCompleted(data: {
    jobId: string;
    postId: string;
    duration: number;
  }): Promise<void> {
    try {
      // Update post status
      this.updatePostStatus(data.postId, 'script_generated');

      // Update metrics
      this.metrics.totalProcessed++;
      this.metrics.successCount++;
      this.metrics.lastProcessedAt = new Date();
      this.updateAverageProcessingTime(data.duration);

      // Check if we should trigger next pipeline step (asset generation)
      const autoProgressToAssets = this.db.get<any>(
        'SELECT auto_progress_to_assets FROM pipeline_settings WHERE id = 1'
      );

      if (autoProgressToAssets?.auto_progress_to_assets) {
        // TODO: Trigger asset generation when implemented
        logger.info('Ready for asset generation', { postId: data.postId });
      }

      // Send notification
      this.wsService.broadcast({
        type: 'pipeline_stage_completed',
        payload: {
          postId: data.postId,
          stage: 'script_generation',
          nextStage: 'asset_generation',
        },
      });

      this.emit('pipeline:stage:completed', {
        postId: data.postId,
        stage: 'script_generation',
      });
    } catch (error) {
      logger.error('Error handling job completion', {
        jobId: data.jobId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Handle job failure
   */
  private async handleJobFailed(data: {
    jobId: string;
    postId: string;
    error: string;
  }): Promise<void> {
    try {
      // Update metrics
      this.metrics.totalProcessed++;
      this.metrics.failureCount++;

      // Revert post status
      this.updatePostStatus(data.postId, 'idea_selected');

      // Send notification
      this.wsService.broadcast({
        type: 'pipeline_stage_failed',
        payload: {
          postId: data.postId,
          stage: 'script_generation',
          error: data.error,
        },
      });

      this.emit('pipeline:stage:failed', {
        postId: data.postId,
        stage: 'script_generation',
        error: data.error,
      });
    } catch (error) {
      logger.error('Error handling job failure', {
        jobId: data.jobId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Update average processing time
   */
  private updateAverageProcessingTime(duration: number): void {
    const currentAvg = this.metrics.averageProcessingTime;
    const totalCount = this.metrics.successCount;

    this.metrics.averageProcessingTime =
      (currentAvg * (totalCount - 1) + duration) / totalCount;
  }

  /**
   * Get pipeline metrics
   */
  getMetrics(): PipelineMetrics {
    return { ...this.metrics };
  }

  /**
   * Get pipeline status
   */
  getStatus(): {
    isRunning: boolean;
    autoTrigger: boolean;
    queueStats: any;
    metrics: PipelineMetrics;
  } {
    return {
      isRunning: this.isRunning,
      autoTrigger: this.options.autoTrigger,
      queueStats: this.queue.getQueueStats(),
      metrics: this.getMetrics(),
    };
  }

  /**
   * Manually trigger batch generation for multiple posts
   */
  async triggerBatchGeneration(
    postIds: string[],
    params?: {
      style?: 'motivational' | 'educational' | 'entertainment' | 'storytelling';
      targetDuration?: number;
      priority?: number;
    }
  ): Promise<string[]> {
    const jobIds: string[] = [];

    for (const postId of postIds) {
      try {
        const jobId = await this.triggerGeneration(postId, params);
        jobIds.push(jobId);
      } catch (error) {
        logger.error('Failed to trigger generation for post', {
          postId,
          error: (error as Error).message,
        });
      }
    }

    logger.info('Batch generation triggered', {
      totalRequested: postIds.length,
      successfullyQueued: jobIds.length,
    });

    return jobIds;
  }

  /**
   * Cancel a generation job
   */
  async cancelGeneration(postId: string): Promise<boolean> {
    try {
      const job = this.db.get<any>(
        `SELECT id FROM generation_queue 
         WHERE post_id = ? 
         AND status IN ('pending', 'processing')
         ORDER BY created_at DESC 
         LIMIT 1`,
        [postId]
      );

      if (!job) {
        logger.warn('No active generation job found', { postId });
        return false;
      }

      const cancelled = await this.queue.cancelJob(job.id);

      if (cancelled) {
        // Revert post status
        this.updatePostStatus(postId, 'idea_selected');

        logger.info('Generation cancelled', {
          postId,
          jobId: job.id,
        });
      }

      return cancelled;
    } catch (error) {
      logger.error('Failed to cancel generation', {
        postId,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Get pipeline history for a post
   */
  getPipelineHistory(postId: string): {
    generations: any[];
    currentStatus: string;
    lastActivity: Date | null;
  } {
    const generations = this.db.all<any>(
      `SELECT * FROM generation_queue 
       WHERE post_id = ? 
       ORDER BY created_at DESC`,
      [postId]
    );

    const post = this.db.get<any>(
      'SELECT status FROM reddit_posts WHERE id = ?',
      [postId]
    );

    const lastActivity =
      generations.length > 0 ? new Date(generations[0].created_at) : null;

    return {
      generations,
      currentStatus: post?.status || 'unknown',
      lastActivity,
    };
  }

  /**
   * Reset pipeline for a post (allow regeneration)
   */
  async resetPipeline(postId: string): Promise<void> {
    try {
      // Cancel any active jobs
      await this.cancelGeneration(postId);

      // Reset post status
      this.updatePostStatus(postId, 'idea_selected');

      logger.info('Pipeline reset for post', { postId });

      this.emit('pipeline:reset', { postId });
    } catch (error) {
      logger.error('Failed to reset pipeline', {
        postId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
