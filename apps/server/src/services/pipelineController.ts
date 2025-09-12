import { EventEmitter } from 'events';
import { DatabaseService } from './database';
import { GenerationQueue } from '../queue/generationQueue';
import { AssetDownloadQueue } from '../queue/assetDownloadQueue';
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
  private assetQueue: AssetDownloadQueue;
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
    assetQueue: AssetDownloadQueue,
    wsService: WebSocketService,
    options?: PipelineOptions
  ) {
    super();
    this.db = db;
    this.queue = queue;
    this.assetQueue = assetQueue;
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

    // Start the queues
    await this.queue.start();
    await this.assetQueue.start();

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
    await this.assetQueue.stop();

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
    // Check for approved posts and get their count
    const approvedPosts = this.db.all<any>(
      `SELECT * FROM reddit_posts 
       WHERE status = ? 
       AND id NOT IN (
         SELECT post_id FROM generation_queue 
         WHERE status IN ('pending', 'processing')
       )`,
      ['idea_selected']
    );

    if (approvedPosts.length > 0) {
      logger.info('Processing pending approved posts', {
        count: approvedPosts.length,
      });
      // Process them by calling the existing method
      await this.checkForApprovedPosts();
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
    // Listen for completed script generations
    this.queue.on('job:completed', (data: any) => {
      this.handleJobCompleted(data);
    });

    // Listen for failed script generations
    this.queue.on('job:failed', (data: any) => {
      this.handleJobFailed(data);
    });

    // Listen for completed asset downloads
    this.assetQueue.on('job:completed', (data: any) => {
      this.handleAssetDownloadCompleted(data);
    });

    // Listen for failed asset downloads
    this.assetQueue.on('job:failed', (data: any) => {
      this.handleAssetDownloadFailed(data);
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
   * Trigger asset download for a script's scenes
   */
  async triggerAssetDownload(
    postId: string,
    scriptId: string,
    scenes: Array<{
      sceneId: number;
      searchPhrase: string;
      assetType: 'photo' | 'video';
    }>,
    priority = 0
  ): Promise<string[]> {
    try {
      // Create batch download jobs
      const jobs = await this.assetQueue.createBatchJobs(
        postId,
        scriptId,
        scenes,
        priority
      );

      // Update post status to assets_downloading
      this.updatePostStatus(postId, 'assets_downloading');

      // Send notification
      this.wsService.broadcast({
        type: 'asset_download_batch_triggered',
        payload: {
          postId,
          scriptId,
          jobIds: jobs.map(job => job.id),
          totalScenes: scenes.length,
        },
      });

      logger.info('Asset download batch triggered', {
        postId,
        scriptId,
        totalScenes: scenes.length,
        jobIds: jobs.map(job => job.id),
      });

      this.emit('asset_download:triggered', {
        postId,
        scriptId,
        jobIds: jobs.map(job => job.id),
      });

      return jobs.map(job => job.id);
    } catch (error) {
      logger.error('Failed to trigger asset download', {
        postId,
        scriptId,
        error: (error as Error).message,
      });

      this.emit('asset_download:failed', { postId, scriptId, error });
      throw error;
    }
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

  /**
   * Handle successful asset download completion
   */
  private async handleAssetDownloadCompleted(data: {
    jobId: string;
    postId: string;
    scriptId: string;
    sceneId: number;
    duration: number;
  }): Promise<void> {
    try {
      logger.info('Asset download completed', {
        jobId: data.jobId,
        postId: data.postId,
        scriptId: data.scriptId,
        sceneId: data.sceneId,
      });

      // Check if all assets for the script are downloaded
      const pendingJobs = this.db.all<any>(
        `SELECT id FROM asset_download_queue 
         WHERE script_id = ? AND status IN ('pending', 'processing')`,
        [data.scriptId]
      );

      // If no pending jobs, mark assets as ready
      if (pendingJobs.length === 0) {
        this.updatePostStatus(data.postId, 'assets_ready');

        // Send notification that all assets are ready
        this.wsService.broadcast({
          type: 'assets_all_downloaded',
          payload: {
            postId: data.postId,
            scriptId: data.scriptId,
            nextStage: 'video_rendering',
          },
        });

        this.emit('pipeline:stage:completed', {
          postId: data.postId,
          stage: 'asset_download',
        });

        logger.info('All assets downloaded for script', {
          postId: data.postId,
          scriptId: data.scriptId,
        });
      }
    } catch (error) {
      logger.error('Error handling asset download completion', {
        jobId: data.jobId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Handle asset download failure
   */
  private async handleAssetDownloadFailed(data: {
    jobId: string;
    postId: string;
    scriptId: string;
    sceneId: number;
    error: string;
  }): Promise<void> {
    try {
      logger.warn('Asset download failed', {
        jobId: data.jobId,
        postId: data.postId,
        scriptId: data.scriptId,
        sceneId: data.sceneId,
        error: data.error,
      });

      // Send notification about failed asset download
      this.wsService.broadcast({
        type: 'asset_download_scene_failed',
        payload: {
          postId: data.postId,
          scriptId: data.scriptId,
          sceneId: data.sceneId,
          error: data.error,
        },
      });

      this.emit('pipeline:asset:failed', {
        postId: data.postId,
        scriptId: data.scriptId,
        sceneId: data.sceneId,
        error: data.error,
      });
    } catch (error) {
      logger.error('Error handling asset download failure', {
        jobId: data.jobId,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Cancel asset download for a script
   */
  async cancelAssetDownload(scriptId: string): Promise<number> {
    try {
      const cancelledCount =
        await this.assetQueue.cancelJobsForScript(scriptId);

      logger.info('Asset download jobs cancelled', {
        scriptId,
        cancelledCount,
      });

      return cancelledCount;
    } catch (error) {
      logger.error('Failed to cancel asset download', {
        scriptId,
        error: (error as Error).message,
      });
      return 0;
    }
  }

  /**
   * Get asset download status for a script
   */
  async getAssetDownloadStatus(scriptId: string): Promise<{
    totalJobs: number;
    completed: number;
    processing: number;
    pending: number;
    failed: number;
    jobs: any[];
  }> {
    const jobs = await this.assetQueue.getJobsForScript(scriptId);

    return {
      totalJobs: jobs.length,
      completed: jobs.filter(job => job.status === 'completed').length,
      processing: jobs.filter(job => job.status === 'processing').length,
      pending: jobs.filter(job => job.status === 'pending').length,
      failed: jobs.filter(job => job.status === 'failed').length,
      jobs,
    };
  }
}
