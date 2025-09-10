import { FastifyPluginCallback, FastifyInstance } from 'fastify';
import { DatabaseService } from '../../services/database';
import { GenerationQueue } from '../../queue/generationQueue';
import { PipelineController } from '../../services/pipelineController';
import { ScriptVersionManager } from '../../services/scriptVersionManager';
import { ContentValidator } from '../../services/contentValidator';
import { WebSocketService } from '../../services/websocket';
import { StatusTransitionService } from '../../services/StatusTransitionService.js';
import {
  PostStatusManager,
  UnifiedPostStatus,
} from '@video-automation/shared-types';
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
  generateOptimizedDescription?: boolean;
}

interface GenerateEnhancedDescriptionRequest {
  postId: string;
  targetAudience?: {
    demographics: string;
    interests: string[];
    painPoints: string[];
    motivations: string[];
  };
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
  const wsService = fastify.wsService as WebSocketService;

  // Initialize queue and pipeline (these should be singletons)
  const queue = new GenerationQueue(db, wsService);
  const pipeline = new PipelineController(db, queue, wsService);
  const versionManager = new ScriptVersionManager(db);
  const validator = new ContentValidator();
  const statusService = new StatusTransitionService(db);

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

  // Get all scripts (list endpoint)
  fastify.get('/', async (request, reply) => {
    try {
      // Get scripts with script versions AND posts that have been processed (idea_selected+)
      const scripts = db.all<any>(`
        SELECT 
          COALESCE(sv.id, rp.id) as id,
          rp.id as postId,
          rp.title,
          CASE 
            WHEN sv.is_active = 1 AND sv.script_content IS NOT NULL THEN 'script_generated'
            WHEN gq.status = 'processing' THEN 'script_generating' 
            WHEN gq.status = 'failed' THEN 'script_generation_failed'
            WHEN rp.status = 'idea_selected' AND gq.id IS NULL THEN 'script_generating'
            ELSE rp.status
          END as status,
          COALESCE(sv.script_content, '') as content,
          COALESCE(sv.created_at, rp.discovered_at) as createdAt,
          COALESCE(sv.created_at, rp.updated_at) as updatedAt,
          rp.author,
          CASE 
            WHEN INSTR(SUBSTR(rp.url, INSTR(rp.url, '/r/') + 3), '/') > 0 
            THEN SUBSTR(SUBSTR(rp.url, INSTR(rp.url, '/r/') + 3), 1, INSTR(SUBSTR(rp.url, INSTR(rp.url, '/r/') + 3), '/') - 1)
            ELSE SUBSTR(rp.url, INSTR(rp.url, '/r/') + 3)
          END as subreddit,
          gq.error_message as error
        FROM reddit_posts rp
        LEFT JOIN script_versions sv ON sv.post_id = rp.id AND sv.is_active = 1
        LEFT JOIN generation_queue gq ON gq.post_id = rp.id
        WHERE rp.status IN ('idea_selected', 'script_generating', 'script_generated', 'script_approved', 'script_generation_failed')
           OR sv.id IS NOT NULL
        GROUP BY rp.id
        ORDER BY COALESCE(sv.created_at, rp.discovered_at) DESC
      `);

      reply.send({
        success: true,
        scripts: scripts.map(script => ({
          id: script.id,
          postId: script.postId,
          title: script.title || 'Untitled',
          status: script.status,
          content: script.content,
          createdAt: script.createdAt,
          updatedAt: script.updatedAt,
          subreddit: script.subreddit || 'unknown',
          author: script.author || 'unknown',
          error: script.error || undefined,
        })),
      });
    } catch (error) {
      fastify.log.error(
        `Failed to fetch scripts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch scripts',
        scripts: [],
      });
    }
  });

  // Generate script for Reddit post
  fastify.post<{
    Body: GenerateScriptRequest & { userId?: string };
  }>('/generate', async (request, reply) => {
    try {
      const {
        postId,
        targetDuration = 60,
        style = 'motivational',
        sceneCount,
        priority = 0,
        userId,
        generateOptimizedDescription = false,
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

      // Transition post to script_generating status
      const statusResult = await statusService.transitionStatus({
        postId,
        targetStatus: 'script_generating',
        triggerEvent: 'script_generation_started',
        metadata: {
          generationParams: {
            style,
            targetDuration,
            sceneCount,
            priority,
          },
          triggeredBy: 'api_endpoint',
        },
        userId,
      });

      if (!statusResult.success) {
        return reply.code(400).send({
          success: false,
          error: `Cannot start script generation: ${statusResult.error}`,
          currentStatus: statusResult.oldStatus,
          validTransitions: await statusService.getValidTransitions(postId),
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

      fastify.log.info('Script generation started with status transition', {
        postId,
        jobId,
        statusTransition: {
          from: statusResult.oldStatus,
          to: statusResult.newStatus,
          auditLogId: statusResult.auditLogId,
        },
        generationParams: { style, targetDuration, priority },
      } as any);

      reply.send({
        success: true,
        jobId,
        status: job?.status || 'pending',
        postStatus: statusResult.newStatus,
        message: 'Script generation started',
        statusTransition: {
          from: statusResult.oldStatus,
          to: statusResult.newStatus,
          auditLogId: statusResult.auditLogId,
        },
      });
    } catch (error) {
      fastify.log.error(
        `Script generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { postId: request.body.postId } as any
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : 'Script generation failed',
      });
    }
  });

  // Get script by script ID or post ID
  fastify.get<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      // First try to find by script version ID
      let script = db.get<any>(
        `
        SELECT 
          sv.id,
          sv.post_id as postId,
          rp.title,
          CASE 
            WHEN sv.is_active = 1 AND sv.script_content IS NOT NULL THEN 'script_generated'
            WHEN gq.status = 'processing' THEN 'script_generating' 
            WHEN gq.status = 'failed' THEN 'script_generation_failed'
            ELSE rp.status
          END as status,
          COALESCE(sv.script_content, '') as content,
          sv.created_at as createdAt,
          sv.created_at as updatedAt,
          rp.author,
          CASE 
            WHEN INSTR(SUBSTR(rp.url, INSTR(rp.url, '/r/') + 3), '/') > 0 
            THEN SUBSTR(SUBSTR(rp.url, INSTR(rp.url, '/r/') + 3), 1, INSTR(SUBSTR(rp.url, INSTR(rp.url, '/r/') + 3), '/') - 1)
            ELSE SUBSTR(rp.url, INSTR(rp.url, '/r/') + 3)
          END as subreddit,
          gq.error_message as error,
          sv.scene_breakdown,
          sv.titles,
          sv.description,
          sv.thumbnail_suggestions,
          rp.content as originalContent,
          rp.url as redditUrl
        FROM script_versions sv
        LEFT JOIN reddit_posts rp ON sv.post_id = rp.id
        LEFT JOIN generation_queue gq ON gq.post_id = sv.post_id
        WHERE sv.id = ? OR sv.post_id = ?
        ORDER BY sv.created_at DESC
        LIMIT 1
      `,
        [id, id]
      );

      if (!script) {
        // If not found, try to find a post by ID (for cases where we have a post ID but no script yet)
        const post = db.get<any>('SELECT * FROM reddit_posts WHERE id = ?', [
          id,
        ]);
        if (post) {
          // Check if there's a failed generation for this post
          const failedGeneration = db.get<any>(
            'SELECT error_message FROM generation_queue WHERE post_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
            [id, 'failed']
          );

          script = {
            id: null,
            postId: post.id,
            title: post.title,
            status: failedGeneration ? 'script_generation_failed' : post.status,
            content: '',
            createdAt: post.discovered_at,
            updatedAt: post.updated_at,
            author: post.author,
            subreddit: 'unknown',
            error: failedGeneration?.error_message,
            originalContent: post.content,
            redditUrl: post.url,
          };
        }
      }

      if (!script) {
        return reply.code(404).send({
          success: false,
          error: 'No script found for this ID',
        });
      }

      // Parse metadata from database JSON fields
      let metadata = undefined;
      if (script.scene_breakdown && script.titles && script.description) {
        try {
          const sceneBreakdown = JSON.parse(script.scene_breakdown);
          const titles = JSON.parse(script.titles);
          const thumbnailSuggestions = script.thumbnail_suggestions
            ? JSON.parse(script.thumbnail_suggestions)
            : [];

          // Convert scene breakdown to frontend format
          const scenes = sceneBreakdown.map((scene: any, index: number) => ({
            id: index + 1,
            startTime: sceneBreakdown
              .slice(0, index)
              .reduce(
                (total: number, s: any) => total + (s.duration_estimate || 15),
                0
              ),
            duration: scene.duration_estimate || 15,
            content: scene.content || '',
            visualKeywords: scene.keywords || [],
            emotion: scene.emotional_tone || 'engaging',
            narration: scene.content || '',
          }));

          metadata = {
            titles,
            selectedTitleIndex: 0,
            description: script.description,
            tags: [], // Extract tags from description if needed
            scenes,
            thumbnailConcepts: thumbnailSuggestions.map((suggestion: any) => ({
              description: suggestion.description || suggestion,
              visualElements: suggestion.visualElements,
              textOverlay: suggestion.textOverlay || '',
              colorScheme: suggestion.colorScheme,
              composition: suggestion.composition,
              characters: suggestion.characters,
              objects: suggestion.objects,
              textStrategy: suggestion.textStrategy,
              psychologicalTriggers: suggestion.psychologicalTriggers,
              targetEmotion: suggestion.targetEmotion,
              ctrOptimization: suggestion.ctrOptimization,
            })),
          };
        } catch (error) {
          fastify.log.warn('Failed to parse script metadata:', error);
        }
      }

      reply.send({
        success: true,
        script: {
          id: script.id,
          postId: script.postId,
          title: script.title || 'Untitled',
          status: script.status,
          content: script.content,
          createdAt: script.createdAt,
          updatedAt: script.updatedAt,
          subreddit: script.subreddit || 'unknown',
          author: script.author || 'unknown',
          error: script.error || undefined,
          metadata,
          originalContent: script.originalContent,
          redditUrl: script.redditUrl,
        },
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

      const versions = await versionManager.getVersions(postId);

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
            style || currentVersion?.generation_params?.style || 'motivational',
          targetDuration:
            targetDuration ||
            currentVersion?.generation_params?.targetDuration ||
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
        const updatedParams = {
          ...currentVersion.generation_params,
          style: style || currentVersion.generation_params.style,
          targetDuration:
            targetDuration || currentVersion.generation_params.targetDuration,
          sceneCount: sceneCount || currentVersion.generation_params.sceneCount,
        };

        // Update the version in database
        db.run(
          `UPDATE script_versions 
           SET generation_params = ?
           WHERE post_id = ? AND is_active = 1`,
          [JSON.stringify(updatedParams), postId]
        );

        // Get the updated version
        const updatedVersion = db.get<any>(
          'SELECT * FROM script_versions WHERE post_id = ? AND is_active = 1',
          [postId]
        );

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
        isRunning: true, // TODO: Implement proper queue running status
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

  // Generate enhanced YouTube description for existing script
  fastify.post<{
    Body: GenerateEnhancedDescriptionRequest;
  }>('/description/generate', async (request, reply) => {
    try {
      const { postId, targetAudience } = request.body;

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

      // Get existing script
      const existingScript = db.get<any>(
        'SELECT * FROM generated_scripts WHERE post_id = ? ORDER BY created_at DESC LIMIT 1',
        [postId]
      );

      if (!existingScript) {
        return reply.code(404).send({
          success: false,
          error: 'No script found for this post. Generate a script first.',
        });
      }

      // Parse script data
      const scriptData: GeneratedScript = JSON.parse(
        existingScript.script_data
      );

      // Import the generator dynamically to avoid circular dependencies
      const { YouTubeDescriptionGenerator } = await import(
        '../../services/claude-code/descriptionGenerator'
      );
      const { AdvancedSEOOptimizer } = await import(
        '../../services/claude-code/seoOptimizer'
      );

      const descriptionGenerator = new YouTubeDescriptionGenerator();
      const seoOptimizer = new AdvancedSEOOptimizer();

      // Generate optimized description
      const optimizedDescription =
        await descriptionGenerator.generateOptimizedDescription(
          scriptData,
          {
            id: post.id,
            title: post.title,
            content: post.content,
            author: post.author,
            subreddit: post.subreddit,
            score: post.score,
            upvotes: post.upvotes,
            comments: post.comments_count,
            created_at: new Date(post.created_at),
            url: post.url,
            awards: post.awards ? JSON.parse(post.awards) : [],
          },
          targetAudience
        );

      // Enhance with SEO optimization
      const seoOptimization = await seoOptimizer.optimizeForSEO(
        scriptData.titles[0],
        optimizedDescription.fullDescription,
        scriptData.keywords,
        'personal-development'
      );

      // Update description with SEO-optimized version
      optimizedDescription.fullDescription =
        seoOptimization.optimizedDescription;
      optimizedDescription.seoScore = seoOptimization.seoScore.overallScore;

      // Store the enhanced description
      db.run(
        `UPDATE generated_scripts 
         SET optimized_description = ?, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE post_id = ? AND id = ?`,
        [JSON.stringify(optimizedDescription), postId, existingScript.id]
      );

      fastify.log.info('Enhanced YouTube description generated', {
        postId,
        scriptId: existingScript.id,
        seoScore: optimizedDescription.seoScore,
        engagementScore: optimizedDescription.engagementScore,
        descriptionLength: optimizedDescription.fullDescription.length,
      });

      reply.send({
        success: true,
        optimizedDescription,
        seoAnalysis: {
          overallScore: seoOptimization.seoScore.overallScore,
          keywordStrategy: seoOptimization.keywordStrategy.slice(0, 5), // Top 5 keywords
          recommendations: seoOptimization.seoScore.recommendations,
        },
        message: 'Enhanced YouTube description generated successfully',
      });
    } catch (error) {
      fastify.log.error(
        `Enhanced description generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { postId: request.body.postId, error }
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate enhanced description',
      });
    }
  });

  // Optimize existing description with SEO
  fastify.post<{
    Body: { postId: string; description: string; keywords?: string[] };
  }>('/description/optimize-seo', async (request, reply) => {
    try {
      const { postId, description, keywords = [] } = request.body;

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

      const { AdvancedSEOOptimizer } = await import(
        '../../services/claude-code/seoOptimizer'
      );
      const seoOptimizer = new AdvancedSEOOptimizer();

      const result = await seoOptimizer.optimizeForSEO(
        post.title,
        description,
        keywords,
        'personal-development'
      );

      fastify.log.info('SEO optimization completed', {
        postId,
        originalLength: description.length,
        optimizedLength: result.optimizedDescription.length,
        seoScore: result.seoScore.overallScore,
      });

      reply.send({
        success: true,
        optimizedDescription: result.optimizedDescription,
        seoScore: result.seoScore,
        keywordStrategy: result.keywordStrategy,
        lsiClusters: result.lsiClusters,
        competitorAnalysis: result.competitorAnalysis,
        message: 'SEO optimization completed successfully',
      });
    } catch (error) {
      fastify.log.error(
        `SEO optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { postId: request.body.postId, error }
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to optimize description',
      });
    }
  });

  // Approve script (status transition to script_approved)
  fastify.post<{
    Params: { id: string };
  }>('/:id/approve', async (request, reply) => {
    try {
      const { id } = request.params;

      fastify.log.info('Script approval requested', {
        requestedId: id,
        method: request.method,
        url: request.url,
      });

      // Find the script by either script version ID or post ID
      const script = db.get<any>(
        'SELECT sv.*, rp.status as post_status FROM script_versions sv LEFT JOIN reddit_posts rp ON sv.post_id = rp.id WHERE sv.id = ? OR sv.post_id = ? ORDER BY sv.created_at DESC LIMIT 1',
        [id, id]
      );

      fastify.log.info('Script lookup result', {
        requestedId: id,
        scriptFound: !!script,
        scriptData: script
          ? {
              scriptId: script.id,
              postId: script.post_id,
              postStatus: script.post_status,
            }
          : null,
      });

      if (!script) {
        return reply.code(404).send({
          success: false,
          error: 'Script not found',
        });
      }

      // Check if already approved - if so, return success
      if (script.post_status === 'script_approved') {
        fastify.log.info('Script already approved, returning success', {
          scriptId: script.id,
          postId: script.post_id,
          currentStatus: script.post_status,
        });

        return reply.send({
          success: true,
          message: 'Script is already approved',
          status: 'script_approved',
          alreadyApproved: true,
        });
      }

      // Transition post status to script_approved
      const statusResult = await statusService.transitionStatus({
        postId: script.post_id,
        targetStatus: 'script_approved',
        triggerEvent: 'user_approval',
        metadata: {
          scriptId: script.id,
          triggeredBy: 'api_endpoint',
        },
      });

      if (!statusResult.success) {
        return reply.code(400).send({
          success: false,
          error: `Cannot approve script: ${statusResult.error}`,
          currentStatus: statusResult.oldStatus,
        });
      }

      fastify.log.info('Script approved successfully', {
        scriptId: script.id,
        postId: script.post_id,
        statusTransition: {
          from: statusResult.oldStatus,
          to: statusResult.newStatus,
        },
      });

      reply.send({
        success: true,
        message: 'Script approved successfully',
        status: statusResult.newStatus,
      });
    } catch (error) {
      fastify.log.error(
        `Script approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : 'Script approval failed',
      });
    }
  });

  // Mark assets as ready (status transition to assets_ready)
  fastify.post<{
    Params: { id: string };
  }>('/:id/assets-ready', async (request, reply) => {
    try {
      const { id } = request.params;

      fastify.log.info('Assets ready transition requested', {
        requestedId: id,
      });

      // Find the script by either script version ID or post ID
      const script = db.get<any>(
        'SELECT sv.*, rp.status as post_status FROM script_versions sv LEFT JOIN reddit_posts rp ON sv.post_id = rp.id WHERE sv.id = ? OR sv.post_id = ? ORDER BY sv.created_at DESC LIMIT 1',
        [id, id]
      );

      if (!script) {
        return reply.code(404).send({
          success: false,
          error: 'Script not found',
        });
      }

      // Check if already in assets_ready status - if so, return success
      if (script.post_status === 'assets_ready') {
        fastify.log.info('Assets already marked as ready', {
          scriptId: script.id,
          postId: script.post_id,
          currentStatus: script.post_status,
        });

        return reply.send({
          success: true,
          message: 'Assets are already marked as ready',
          status: 'assets_ready',
          alreadyReady: true,
        });
      }

      // Transition post status to assets_ready
      const statusResult = await statusService.transitionStatus({
        postId: script.post_id,
        targetStatus: 'assets_ready',
        triggerEvent: 'assets_downloaded',
        metadata: {
          scriptId: script.id,
          triggeredBy: 'api_endpoint',
        },
      });

      if (!statusResult.success) {
        return reply.code(400).send({
          success: false,
          error: `Cannot mark assets as ready: ${statusResult.error}`,
          currentStatus: statusResult.oldStatus,
        });
      }

      fastify.log.info('Assets marked as ready successfully', {
        scriptId: script.id,
        postId: script.post_id,
        statusTransition: {
          from: statusResult.oldStatus,
          to: statusResult.newStatus,
        },
      });

      reply.send({
        success: true,
        message: 'Assets marked as ready successfully',
        status: statusResult.newStatus,
      });
    } catch (error) {
      fastify.log.error(
        `Assets ready transition failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Assets ready transition failed',
      });
    }
  });

  // Pause download for script
  fastify.post<{
    Params: { id: string };
  }>('/:id/download/pause', async (request, reply) => {
    try {
      const { id } = request.params;

      // Store pause state in memory or database
      // For now, we'll just return success as the frontend handles the pause logic
      fastify.log.info('Download pause requested', { scriptId: id });

      reply.send({
        success: true,
        message: 'Download paused',
        status: 'paused',
      });
    } catch (error) {
      fastify.log.error(
        `Download pause failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to pause download',
      });
    }
  });

  // Resume download for script
  fastify.post<{
    Params: { id: string };
  }>('/:id/download/resume', async (request, reply) => {
    try {
      const { id } = request.params;

      // Clear pause state
      fastify.log.info('Download resume requested', { scriptId: id });

      reply.send({
        success: true,
        message: 'Download resumed',
        status: 'downloading',
      });
    } catch (error) {
      fastify.log.error(
        `Download resume failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to resume download',
      });
    }
  });

  done();
};

export default scriptsRoutes;
