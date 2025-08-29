import { EventEmitter } from 'events';
import { DatabaseService } from '../services/database';
import { ClaudeCodeScriptGenerator } from '../services/claude-code';
import { ScriptVersionManager } from '../services/scriptVersionManager';
import { ContentValidator } from '../services/contentValidator';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import {
  GenerationQueueJob,
  QueueStatus,
  RedditPost,
} from '@video-automation/shared-types';
import { WebSocketService } from '../services/websocket';

interface QueueOptions {
  maxConcurrent?: number;
  maxRetries?: number;
  retryDelay?: number;
  processingTimeout?: number;
}

interface JobContext {
  job: GenerationQueueJob;
  post: RedditPost;
  startTime: number;
  progressUpdateInterval?: NodeJS.Timeout;
}

export class GenerationQueue extends EventEmitter {
  private db: DatabaseService;
  private scriptGenerator: ClaudeCodeScriptGenerator;
  private versionManager: ScriptVersionManager;
  private contentValidator: ContentValidator;
  private wsService: WebSocketService;
  private isProcessing = false;
  private activeJobs = new Map<string, JobContext>();
  private processingPromises = new Set<Promise<void>>();

  private readonly options: Required<QueueOptions> = {
    maxConcurrent: 3,
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    processingTimeout: 300000, // 5 minutes
  };

  constructor(
    db: DatabaseService,
    wsService: WebSocketService,
    options?: QueueOptions
  ) {
    super();
    this.db = db;
    this.wsService = wsService;
    this.scriptGenerator = new ClaudeCodeScriptGenerator();
    this.versionManager = new ScriptVersionManager(db);
    this.contentValidator = new ContentValidator();

    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  /**
   * Start processing the queue
   */
  async start(): Promise<void> {
    if (this.isProcessing) {
      logger.warn('Generation queue already running');
      return;
    }

    this.isProcessing = true;
    logger.info('Generation queue started', {
      maxConcurrent: this.options.maxConcurrent,
    });

    // Start processing loop
    this.processNextJobs();
  }

  /**
   * Stop processing the queue
   */
  async stop(): Promise<void> {
    this.isProcessing = false;
    logger.info('Stopping generation queue...');

    // Wait for active jobs to complete
    await Promise.all(this.processingPromises);

    // Clear any progress intervals
    for (const context of this.activeJobs.values()) {
      if (context.progressUpdateInterval) {
        clearInterval(context.progressUpdateInterval);
      }
    }

    this.activeJobs.clear();
    logger.info('Generation queue stopped');
  }

  /**
   * Add a new job to the queue
   */
  async createJob(
    postId: string,
    params: GenerationQueueJob['generation_params'],
    priority = 0
  ): Promise<GenerationQueueJob> {
    const jobId = uuidv4();

    const job: GenerationQueueJob = {
      id: jobId,
      post_id: postId,
      status: 'pending',
      priority,
      attempts: 0,
      max_attempts: this.options.maxRetries,
      generation_params: params,
      progress_percentage: 0,
      created_at: new Date(),
    };

    // Insert job into database
    this.db.run(
      `INSERT INTO generation_queue (
        id, post_id, status, priority, attempts, max_attempts,
        generation_params, progress_percentage, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        job.id,
        job.post_id,
        job.status,
        job.priority,
        job.attempts,
        job.max_attempts,
        JSON.stringify(job.generation_params),
        job.progress_percentage,
        job.created_at.toISOString(),
      ]
    );

    // Send WebSocket notification
    this.wsService.broadcast({
      type: 'generation_queue_job_created',
      payload: {
        jobId: job.id,
        postId: job.post_id,
        status: job.status,
        queuePosition: await this.getQueuePosition(job.id),
      },
    });

    logger.info('Generation job created', {
      jobId: job.id,
      postId: job.post_id,
      priority: job.priority,
    });

    // Trigger processing if queue is running
    if (this.isProcessing) {
      this.processNextJobs();
    }

    return job;
  }

  /**
   * Get queue position for a job
   */
  async getQueuePosition(jobId: string): Promise<number> {
    const result = this.db.get<{ position: number }>(
      `SELECT COUNT(*) + 1 as position
       FROM generation_queue 
       WHERE status = 'pending' 
       AND (priority > (SELECT priority FROM generation_queue WHERE id = ?)
            OR (priority = (SELECT priority FROM generation_queue WHERE id = ?)
                AND created_at < (SELECT created_at FROM generation_queue WHERE id = ?)))`,
      [jobId, jobId, jobId]
    );

    return result?.position || 0;
  }

  /**
   * Process next available jobs
   */
  private async processNextJobs(): Promise<void> {
    if (!this.isProcessing) {
      return;
    }

    while (
      this.activeJobs.size < this.options.maxConcurrent &&
      this.isProcessing
    ) {
      const job = await this.getNextJob();
      if (!job) {
        // No more jobs, check again after delay
        if (this.isProcessing && this.activeJobs.size === 0) {
          setTimeout(() => this.processNextJobs(), 1000);
        }
        break;
      }

      // Start processing job (don't await, process concurrently)
      const promise = this.processJob(job);
      this.processingPromises.add(promise);

      promise.finally(() => {
        this.processingPromises.delete(promise);
        // Check for more jobs after one completes
        if (this.isProcessing) {
          this.processNextJobs();
        }
      });
    }
  }

  /**
   * Get next job from queue (FIFO with priority)
   */
  private async getNextJob(): Promise<GenerationQueueJob | null> {
    const row = this.db.get<any>(
      `SELECT * FROM generation_queue 
       WHERE status = 'pending' 
       ORDER BY priority DESC, created_at ASC 
       LIMIT 1`
    );

    if (!row) {
      return null;
    }

    // Mark as processing
    this.db.run(
      `UPDATE generation_queue 
       SET status = 'processing', started_at = ?, worker_id = ?
       WHERE id = ?`,
      [new Date().toISOString(), process.pid.toString(), row.id]
    );

    return this.mapRowToJob(row);
  }

  /**
   * Process a single job
   */
  private async processJob(job: GenerationQueueJob): Promise<void> {
    const startTime = Date.now();

    try {
      // Get Reddit post
      const post = this.db.get<RedditPost>(
        'SELECT * FROM reddit_posts WHERE id = ?',
        [job.post_id]
      );

      if (!post) {
        throw new Error(`Post not found: ${job.post_id}`);
      }

      // Setup job context
      const context: JobContext = {
        job,
        post,
        startTime,
      };

      this.activeJobs.set(job.id, context);

      // Start progress updates
      context.progressUpdateInterval = setInterval(() => {
        this.updateProgress(job.id);
      }, 2000); // Update every 2 seconds

      logger.info('Starting script generation', {
        jobId: job.id,
        postId: job.post_id,
        attempt: job.attempts + 1,
      });

      // Notify job started
      this.wsService.broadcast({
        type: 'generation_started',
        payload: {
          jobId: job.id,
          postId: job.post_id,
          startedAt: new Date(),
        },
      });

      // Generate script
      let generatedScript = await this.scriptGenerator.generateScript({
        redditPost: {
          id: post.id,
          title: post.title,
          content: post.content,
          author: post.author,
          subreddit: post.subreddit,
          score: post.score || 0,
          upvotes: post.upvotes || 0,
          comments: post.comments || 0,
          createdUtc: post.created_date
            ? Math.floor(new Date(post.created_date).getTime() / 1000)
            : 0,
          url: post.url || '',
        },
        targetDuration: job.generation_params.targetDuration,
        style: job.generation_params.style,
        sceneCount: job.generation_params.sceneCount,
      });

      // Validate generated script
      const validationResult =
        await this.contentValidator.validateScript(generatedScript);

      // Log validation report
      logger.info('Script validation result', {
        jobId: job.id,
        score: validationResult.score,
        isValid: validationResult.isValid,
      });

      // Check if we need to regenerate due to quality issues
      if (
        this.contentValidator.shouldRegenerate(validationResult) &&
        job.attempts < 2
      ) {
        logger.warn('Script quality below threshold, attempting regeneration', {
          jobId: job.id,
          score: validationResult.score,
          attempt: job.attempts + 1,
        });

        // Get regeneration hints
        const hints =
          this.contentValidator.getRegenerationHints(validationResult);

        // Send notification about quality check
        this.wsService.broadcast({
          type: 'generation_quality_check',
          payload: {
            jobId: job.id,
            postId: job.post_id,
            score: validationResult.score,
            regenerating: true,
            focusAreas: hints.focusAreas,
          },
        });

        // Regenerate with improved parameters
        generatedScript = await this.scriptGenerator.regenerateScript(
          {
            redditPost: {
              id: post.id,
              title: post.title,
              content: post.content,
              author: post.author,
              subreddit: post.subreddit,
              score: post.score || 0,
              upvotes: post.upvotes || 0,
              comments: post.comments || 0,
              createdUtc: post.created_date
                ? Math.floor(new Date(post.created_date).getTime() / 1000)
                : 0,
              url: post.url || '',
            },
            targetDuration: job.generation_params.targetDuration,
            style: job.generation_params.style,
            sceneCount: job.generation_params.sceneCount,
          },
          hints.parameters
        );

        // Re-validate
        const revalidationResult =
          await this.contentValidator.validateScript(generatedScript);

        logger.info('Regenerated script validation', {
          jobId: job.id,
          originalScore: validationResult.score,
          newScore: revalidationResult.score,
          improved: revalidationResult.score > validationResult.score,
        });
      }

      // Create version with quality score
      const generationDuration = Date.now() - startTime;
      const version = await this.versionManager.createVersion(
        job.post_id,
        generatedScript,
        generationDuration
      );

      // Update quality score
      const finalValidation =
        await this.contentValidator.validateScript(generatedScript);
      await this.versionManager.updateQualityScore(
        version.id,
        finalValidation.score
      );

      // Mark job as completed
      this.db.run(
        `UPDATE generation_queue 
         SET status = 'completed', 
             completed_at = ?,
             progress_percentage = 100
         WHERE id = ?`,
        [new Date().toISOString(), job.id]
      );

      // Update post status
      this.db.run(
        `UPDATE reddit_posts 
         SET status = 'script_generated' 
         WHERE id = ?`,
        [job.post_id]
      );

      // Send completion notification
      this.wsService.broadcast({
        type: 'script_generated',
        payload: {
          jobId: job.id,
          postId: job.post_id,
          scriptId: version.id,
          versionNumber: version.version_number,
          duration: generationDuration,
          qualityScore: finalValidation.score,
          validationSummary: {
            score: finalValidation.score,
            isValid: finalValidation.isValid,
            issueCount: finalValidation.issues.length,
            suggestions: finalValidation.suggestions.slice(0, 3), // Top 3 suggestions
          },
        },
      });

      logger.info('Script generation completed', {
        jobId: job.id,
        postId: job.post_id,
        duration: generationDuration,
        versionNumber: version.version_number,
      });
    } catch (error) {
      await this.handleJobError(job, error as Error);
    } finally {
      // Cleanup
      const context = this.activeJobs.get(job.id);
      if (context?.progressUpdateInterval) {
        clearInterval(context.progressUpdateInterval);
      }
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Handle job processing error
   */
  private async handleJobError(
    job: GenerationQueueJob,
    error: Error
  ): Promise<void> {
    logger.error('Script generation failed', {
      jobId: job.id,
      postId: job.post_id,
      attempt: job.attempts + 1,
      error: error.message,
    });

    const attempts = job.attempts + 1;

    if (attempts < job.max_attempts) {
      // Retry job
      this.db.run(
        `UPDATE generation_queue 
         SET status = 'pending',
             attempts = ?,
             error_message = ?,
             started_at = NULL,
             worker_id = NULL
         WHERE id = ?`,
        [attempts, error.message, job.id]
      );

      // Schedule retry with delay
      setTimeout(() => {
        if (this.isProcessing) {
          this.processNextJobs();
        }
      }, this.options.retryDelay);

      logger.info('Job scheduled for retry', {
        jobId: job.id,
        attempt: attempts,
        retryDelay: this.options.retryDelay,
      });
    } else {
      // Mark as failed
      this.db.run(
        `UPDATE generation_queue 
         SET status = 'failed',
             attempts = ?,
             error_message = ?,
             completed_at = ?
         WHERE id = ?`,
        [attempts, error.message, new Date().toISOString(), job.id]
      );

      // Send failure notification
      this.wsService.broadcast({
        type: 'generation_failed',
        payload: {
          jobId: job.id,
          postId: job.post_id,
          error: error.message,
          attempts,
        },
      });
    }
  }

  /**
   * Update job progress
   */
  private updateProgress(jobId: string): void {
    const context = this.activeJobs.get(jobId);
    if (!context) {
      return;
    }

    // Calculate estimated progress based on time
    const elapsed = Date.now() - context.startTime;
    const estimatedDuration = 30000; // 30 seconds average
    const progress = Math.min(
      90,
      Math.floor((elapsed / estimatedDuration) * 100)
    );

    // Update database
    this.db.run(
      'UPDATE generation_queue SET progress_percentage = ? WHERE id = ?',
      [progress, jobId]
    );

    // Send progress update
    this.wsService.broadcast({
      type: 'generation_progress',
      payload: {
        jobId,
        postId: context.post.id,
        progress,
      },
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    avgProcessingTime: number;
    successRate: number;
  }> {
    const stats = this.db.get<any>(
      `SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        AVG(CASE 
          WHEN status = 'completed' AND started_at IS NOT NULL AND completed_at IS NOT NULL
          THEN (julianday(completed_at) - julianday(started_at)) * 86400000
          ELSE NULL
        END) as avgProcessingTime
       FROM generation_queue`
    );

    const total = (stats?.completed || 0) + (stats?.failed || 0);
    const successRate = total > 0 ? (stats?.completed || 0) / total : 0;

    return {
      pending: stats?.pending || 0,
      processing: stats?.processing || 0,
      completed: stats?.completed || 0,
      failed: stats?.failed || 0,
      avgProcessingTime: Math.round(stats?.avgProcessingTime || 0),
      successRate: Math.round(successRate * 100),
    };
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(
    status: QueueStatus,
    limit = 10
  ): Promise<GenerationQueueJob[]> {
    const rows = this.db.all<any>(
      `SELECT * FROM generation_queue 
       WHERE status = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [status, limit]
    );

    return rows.map(this.mapRowToJob);
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.db.get<any>(
      'SELECT status FROM generation_queue WHERE id = ?',
      [jobId]
    );

    if (!job || job.status !== 'pending') {
      return false;
    }

    this.db.run(
      `UPDATE generation_queue 
       SET status = 'failed',
           error_message = 'Cancelled by user',
           completed_at = ?
       WHERE id = ?`,
      [new Date().toISOString(), jobId]
    );

    logger.info('Job cancelled', { jobId });
    return true;
  }

  /**
   * Clear completed and failed jobs older than specified days
   */
  async cleanupOldJobs(daysOld = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = this.db.run(
      `DELETE FROM generation_queue 
       WHERE status IN ('completed', 'failed') 
       AND created_at < ?`,
      [cutoffDate.toISOString()]
    );

    logger.info('Cleaned up old jobs', {
      deleted: result.changes,
      daysOld,
    });

    return result.changes;
  }

  /**
   * Map database row to GenerationQueueJob
   */
  private mapRowToJob(row: any): GenerationQueueJob {
    return {
      id: row.id,
      post_id: row.post_id,
      status: row.status as QueueStatus,
      priority: row.priority,
      attempts: row.attempts,
      max_attempts: row.max_attempts,
      generation_params: JSON.parse(row.generation_params),
      progress_percentage: row.progress_percentage,
      error_message: row.error_message,
      created_at: new Date(row.created_at),
      started_at: row.started_at ? new Date(row.started_at) : undefined,
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      worker_id: row.worker_id,
    };
  }
}
