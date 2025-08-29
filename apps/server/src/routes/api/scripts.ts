import { FastifyPluginCallback, FastifyInstance } from 'fastify';
import { DatabaseService } from '../../services/database';
import { GenerationQueue } from '../../queue/generationQueue';
import { PipelineController } from '../../services/pipelineController';
import { ScriptVersionManager } from '../../services/scriptVersionManager';
import { ContentValidator } from '../../services/contentValidator';
import { WebSocketService } from '../../services/websocket';
import type {
  GeneratedScript,
  ScriptStyle,
} from '../../services/claude-code/types';

// Request/Response types
interface GenerateScriptRequest {
  postId: string;
  targetDuration?: number;
  style?: ScriptStyle;
  sceneCount?: number;
  priority?: number;
}

interface GetScriptParams {
  postId: string;
}

interface GetScriptVersionsParams {
  postId: string;
  versionId?: string;
}

interface RegenerateScriptRequest {
  targetDuration?: number;
  style?: ScriptStyle;
  sceneCount?: number;
  forceRegenerate?: boolean;
}

interface QueueStatusQuery {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  limit?: number;
}

const scriptsRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  options,
  done
) => {
  // Get services from fastify decorators
  const db = fastify.db as DatabaseService;
  const wsService = fastify.websocket as WebSocketService;

  // Initialize queue and pipeline (these should be singletons)
  const queue = new GenerationQueue(db, wsService);
  const pipeline = new PipelineController(db, queue, wsService);
  const versionManager = new ScriptVersionManager(db);
  const validator = new ContentValidator();

  // Start queue and pipeline on server start
  fastify.addHook('onReady', async () => {
    await queue.start();
    await pipeline.start();
  });

  // Stop queue and pipeline on server close
  fastify.addHook('onClose', async () => {
    await pipeline.stop();
    await queue.stop();
  });

  // Generate script for Reddit post
  fastify.post<{
    Body: GenerateScriptRequest;
  }>('/generate', async (request, reply) => {
    try {
      const {
        postId,
        targetDuration = 60,
        style = 'motivational',
        sceneCount,
        priority = 0,
      } = request.body;

      // Validate post exists
      const post = db.get<any>('SELECT * FROM reddit_posts WHERE id = ?', [
        postId,
      ]);

      if (!post) {
        return reply.code(404).send({
          success: false,
          error: 'Reddit post not found',
        });
      }

      // Trigger generation through pipeline
      const jobId = await pipeline.triggerGeneration(postId, {
        style,
        targetDuration,
        priority,
      });

      // Get job details
      const job = db.get<any>('SELECT * FROM generation_queue WHERE id = ?', [
        jobId,
      ]);

      reply.send({
        success: true,
        jobId,
        status: job?.status || 'pending',
        message: 'Script generation started',
      });
    } catch (error) {
      fastify.log.error(
        `Script generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : 'Script generation failed',
      });
    }
  });

  // Get script by post ID
  fastify.get<{
    Params: GetScriptParams;
  }>('/:postId', async (request, reply) => {
    try {
      const { postId } = request.params;

      // Get active script version
      const activeVersion = await versionManager.getActiveVersion(postId);

      if (!activeVersion) {
        return reply.code(404).send({
          success: false,
          error: 'No script found for this post',
        });
      }

      reply.send({
        success: true,
        script: activeVersion,
      });
    } catch (error) {
      fastify.log.error(
        `Failed to fetch script: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch script',
      });
    }
  });

  // Get all script versions
  fastify.get<{
    Params: GetScriptParams;
  }>('/:postId/versions', async (request, reply) => {
    try {
      const { postId } = request.params;

      const versions = await versionManager.listVersions(postId);

      reply.send({
        success: true,
        versions,
        total: versions.length,
      });
    } catch (error) {
      fastify.log.error(
        `Failed to fetch script versions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch versions',
      });
    }
  });

  // Regenerate script
  fastify.post<{
    Params: GetScriptParams;
    Body: RegenerateScriptRequest;
  }>('/:postId/regenerate', async (request, reply) => {
    try {
      const { postId } = request.params;
      const { targetDuration, style, sceneCount, forceRegenerate } =
        request.body;

      // Validate post exists
      const post = db.get<any>('SELECT * FROM reddit_posts WHERE id = ?', [
        postId,
      ]);

      if (!post) {
        return reply.code(404).send({
          success: false,
          error: 'Reddit post not found',
        });
      }

      // Get current active version if exists
      const currentVersion = await versionManager.getActiveVersion(postId);

      // If force regenerate or no current version, create new generation job
      if (forceRegenerate || !currentVersion) {
        const jobId = await pipeline.triggerGeneration(postId, {
          style:
            style || currentVersion?.generationParams?.style || 'motivational',
          targetDuration:
            targetDuration ||
            currentVersion?.generationParams?.targetDuration ||
            60,
          priority: 5, // Higher priority for regeneration
        });

        reply.send({
          success: true,
          jobId,
          message: 'Script regeneration started',
        });
      } else {
        // Just update parameters on existing version
        const updatedVersion = await versionManager.createVersion(postId, {
          ...currentVersion,
          generationParams: {
            ...currentVersion.generationParams,
            style: style || currentVersion.generationParams.style,
            targetDuration:
              targetDuration || currentVersion.generationParams.targetDuration,
            sceneCount:
              sceneCount || currentVersion.generationParams.sceneCount,
          },
        });

        reply.send({
          success: true,
          script: updatedVersion,
          message: 'Script parameters updated',
        });
      }
    } catch (error) {
      fastify.log.error(
        `Script regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Regeneration failed',
      });
    }
  });

  // Revert to previous version
  fastify.post<{
    Params: { postId: string; versionId: string };
  }>('/:postId/versions/:versionId/activate', async (request, reply) => {
    try {
      const { postId, versionId } = request.params;

      const success = await versionManager.revertToVersion(
        postId,
        parseInt(versionId)
      );

      if (!success) {
        return reply.code(404).send({
          success: false,
          error: 'Version not found or cannot be activated',
        });
      }

      const activeVersion = await versionManager.getActiveVersion(postId);

      reply.send({
        success: true,
        script: activeVersion,
        message: `Reverted to version ${versionId}`,
      });
    } catch (error) {
      fastify.log.error(
        `Version revert failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Revert failed',
      });
    }
  });

  // Validate script
  fastify.post<{
    Body: GeneratedScript;
  }>('/validate', async (request, reply) => {
    try {
      const script = request.body;

      const validationResult = await validator.validateScript(script);
      const shouldRegenerate = validator.shouldRegenerate(validationResult);

      reply.send({
        success: true,
        validation: {
          isValid: validationResult.isValid,
          score: validationResult.score,
          issues: validationResult.issues,
          suggestions: validationResult.suggestions,
          shouldRegenerate,
          details: validationResult.details,
        },
      });
    } catch (error) {
      fastify.log.error(
        `Script validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      });
    }
  });

  // Get generation queue status
  fastify.get<{
    Querystring: QueueStatusQuery;
  }>('/queue/status', async (request, reply) => {
    try {
      const { status, limit = 10 } = request.query;

      const stats = queue.getQueueStats();

      // Get recent jobs
      let jobQuery = 'SELECT * FROM generation_queue';
      const params: any[] = [];

      if (status) {
        jobQuery += ' WHERE status = ?';
        params.push(status);
      }

      jobQuery += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const jobs = db.all<any>(jobQuery, params);

      reply.send({
        success: true,
        stats,
        jobs,
        isRunning: queue.isRunning,
      });
    } catch (error) {
      fastify.log.error(
        `Failed to fetch queue status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch queue status',
      });
    }
  });

  // Get job status
  fastify.get<{
    Params: { jobId: string };
  }>('/queue/job/:jobId', async (request, reply) => {
    try {
      const { jobId } = request.params;

      const job = db.get<any>('SELECT * FROM generation_queue WHERE id = ?', [
        jobId,
      ]);

      if (!job) {
        return reply.code(404).send({
          success: false,
          error: 'Job not found',
        });
      }

      reply.send({
        success: true,
        job,
      });
    } catch (error) {
      fastify.log.error(
        `Failed to fetch job: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch job',
      });
    }
  });

  // Cancel generation job
  fastify.delete<{
    Params: { jobId: string };
  }>('/queue/job/:jobId', async (request, reply) => {
    try {
      const { jobId } = request.params;

      const job = db.get<any>('SELECT * FROM generation_queue WHERE id = ?', [
        jobId,
      ]);

      if (!job) {
        return reply.code(404).send({
          success: false,
          error: 'Job not found',
        });
      }

      const cancelled = await queue.cancelJob(jobId);

      reply.send({
        success: cancelled,
        message: cancelled
          ? 'Job cancelled successfully'
          : 'Job could not be cancelled',
      });
    } catch (error) {
      fastify.log.error(
        `Failed to cancel job: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel job',
      });
    }
  });

  // Trigger batch generation
  fastify.post<{
    Body: { postIds: string[]; priority?: number };
  }>('/batch/generate', async (request, reply) => {
    try {
      const { postIds, priority = 0 } = request.body;

      if (!postIds || postIds.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'No post IDs provided',
        });
      }

      const jobIds = await pipeline.triggerBatchGeneration(postIds, {
        priority,
      });

      reply.send({
        success: true,
        jobIds,
        message: `Started generation for ${jobIds.length} posts`,
      });
    } catch (error) {
      fastify.log.error(
        `Batch generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : 'Batch generation failed',
      });
    }
  });

  // Get pipeline status
  fastify.get('/pipeline/status', async (request, reply) => {
    try {
      const status = pipeline.getStatus();

      reply.send({
        success: true,
        pipeline: status,
      });
    } catch (error) {
      fastify.log.error(
        `Failed to fetch pipeline status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch pipeline status',
      });
    }
  });

  // Get pipeline history for a post
  fastify.get<{
    Params: { postId: string };
  }>('/pipeline/history/:postId', async (request, reply) => {
    try {
      const { postId } = request.params;

      const history = pipeline.getPipelineHistory(postId);

      reply.send({
        success: true,
        history,
      });
    } catch (error) {
      fastify.log.error(
        `Failed to fetch pipeline history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch pipeline history',
      });
    }
  });

  done();
};

export default scriptsRoutes;
