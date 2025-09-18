import { FastifyPluginCallback, FastifyInstance } from 'fastify';
import { DatabaseService } from '../../services/database';
import { ServiceFactory } from '../../services/ServiceFactory';
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
import { generatePrimarySearchPhrase } from '../../utils/searchPhraseGenerator';

// Helper function to create search phrase from scene content
function createOptimizedSearchPhrase(scene: any, index: number): string {
  const content = scene.content || scene.narration || '';
  const assetType = determineAssetType(scene, index);

  if (content.trim()) {
    return generatePrimarySearchPhrase(content, assetType);
  }

  // Fallback to limited keywords only if no content
  return scene.keywords?.slice(0, 2).join(' ') || `scene ${index + 1}`;
}

// Helper function to determine asset type with balanced distribution
function determineAssetType(scene: any, index: number): 'photo' | 'video' {
  // Log for debugging
  console.log(
    `Scene ${index + 1} duration:`,
    scene.duration,
    typeof scene.duration
  );

  // Primary logic: duration-based (matching SceneTimeline logic)
  if (scene.duration && typeof scene.duration === 'number') {
    const assetType = scene.duration < 4 ? 'photo' : 'video';
    console.log(`Scene ${index + 1} duration-based type:`, assetType);
    return assetType;
  }

  // Enhanced logic: ensure 50/50 mix when duration is not available
  // Use a more balanced approach - every 3rd scene is video to get roughly 33% videos
  const isVideo = index % 3 === 1; // Scenes 2, 5, 8, 11, etc. become videos
  const assetType = isVideo ? 'video' : 'photo';
  console.log(`Scene ${index + 1} fallback type:`, assetType);
  return assetType;
}

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

interface DownloadAssetsRequest {
  scenes?: Array<{
    sceneId: number;
    searchPhrase: string;
    assetType: 'photo' | 'video';
  }>;
  priority?: number;
}

const scriptsRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  options,
  done
) => {
  // Get services from fastify decorators
  const db = fastify.db as DatabaseService;
  const wsService = fastify.wsService as WebSocketService;

  // Get singleton instances from ServiceFactory
  const queue = ServiceFactory.getGenerationQueue(db, wsService);
  const assetQueue = ServiceFactory.getAssetDownloadQueue(db, wsService);
  const pipeline = ServiceFactory.getPipelineController(
    db,
    queue,
    assetQueue,
    wsService
  );
  const versionManager = new ScriptVersionManager(db);
  const validator = new ContentValidator();
  const statusService = new StatusTransitionService(db);

  // Start queues and pipeline on server start
  fastify.addHook('onReady', async () => {
    await queue.start();
    await assetQueue.start();
    await pipeline.start();
  });

  // Stop queues and pipeline on server close
  fastify.addHook('onClose', async () => {
    await pipeline.stop();
    await assetQueue.stop();
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
          rp.status as status,
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
        WHERE rp.status IN ('script_generated', 'script_approved', 'assets_downloading', 'assets_paused', 'assets_ready', 'rendering', 'completed')
           AND sv.id IS NOT NULL
        GROUP BY rp.id
        ORDER BY COALESCE(sv.created_at, rp.discovered_at) DESC
      `);

      // Enhance script data with metadata
      const enhancedScripts = scripts.map(script => {
        let duration = 0;
        let version = 1;

        // Try to get duration from scene breakdown if available
        if (script.content) {
          const scriptVersion = db.get<any>(
            'SELECT scene_breakdown, version_number FROM script_versions WHERE post_id = ? AND is_active = 1',
            [script.postId]
          );

          fastify.log.info('Script version lookup', {
            postId: script.postId,
            scriptId: script.id,
            hasScriptVersion: !!scriptVersion,
            hasSceneBreakdown: scriptVersion?.scene_breakdown ? true : false,
            versionNumber: scriptVersion?.version_number,
          });

          if (scriptVersion) {
            version = scriptVersion.version_number || 1;

            if (scriptVersion.scene_breakdown) {
              try {
                const scenes = JSON.parse(scriptVersion.scene_breakdown);
                duration = scenes.reduce((total: number, scene: any) => {
                  return total + (scene.duration_estimate || 15);
                }, 0);

                fastify.log.info('Duration calculated from scenes', {
                  postId: script.postId,
                  scenesCount: scenes.length,
                  calculatedDuration: duration,
                });
              } catch (error) {
                fastify.log.warn(
                  'Failed to parse scene breakdown, using word count fallback',
                  {
                    postId: script.postId,
                    error:
                      error instanceof Error ? error.message : 'Unknown error',
                  }
                );

                // Fallback: estimate duration from word count (rough estimate: 150 words per minute)
                const wordCount = script.content.split(/\s+/).length;
                duration = Math.max(30, Math.round((wordCount / 150) * 60));

                fastify.log.info('Duration calculated from word count', {
                  postId: script.postId,
                  wordCount,
                  estimatedDuration: duration,
                });
              }
            } else {
              // No scene breakdown available, estimate from word count
              const wordCount = script.content.split(/\s+/).length;
              duration = Math.max(30, Math.round((wordCount / 150) * 60));

              fastify.log.info(
                'Duration estimated from word count (no scenes)',
                {
                  postId: script.postId,
                  wordCount,
                  estimatedDuration: duration,
                }
              );
            }
          } else {
            fastify.log.info(
              'No script version found, using content word count',
              {
                postId: script.postId,
                hasContent: !!script.content,
              }
            );

            // No script version found, estimate from word count if content exists
            if (script.content) {
              const wordCount = script.content.split(/\s+/).length;
              duration = Math.max(30, Math.round((wordCount / 150) * 60));

              fastify.log.info('Duration estimated from content word count', {
                postId: script.postId,
                wordCount,
                estimatedDuration: duration,
              });
            }
          }
        }

        return {
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
          duration,
          version,
        };
      });

      reply.send({
        success: true,
        scripts: enhancedScripts,
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
          rp.status as status,
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

  // Start download for script
  fastify.post<{
    Params: { id: string };
  }>('/:id/download/start', async (request, reply) => {
    try {
      const { id } = request.params;

      // Update database status to assets_downloading
      const updateResult = fastify.db.run(
        'UPDATE reddit_posts SET status = ? WHERE id = ?',
        ['assets_downloading', id]
      );

      if (updateResult.changes === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Script not found',
        });
      }

      fastify.log.info('Download started and status updated', {
        scriptId: id,
        changes: updateResult.changes,
      });

      reply.send({
        success: true,
        message: 'Download started',
        status: 'assets_downloading',
      });
    } catch (error) {
      fastify.log.error(
        `Download start failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to start download',
      });
    }
  });

  // Pause download for script
  fastify.post<{
    Params: { id: string };
  }>('/:id/download/pause', async (request, reply) => {
    try {
      const { id } = request.params;

      // Update database status to assets_paused
      const updateResult = fastify.db.run(
        'UPDATE reddit_posts SET status = ? WHERE id = ?',
        ['assets_paused', id]
      );

      if (updateResult.changes === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Script not found',
        });
      }

      fastify.log.info('Download pause requested and status updated', {
        scriptId: id,
        changes: updateResult.changes,
      });

      reply.send({
        success: true,
        message: 'Download paused',
        status: 'assets_paused',
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

      // Update database status to assets_downloading
      const updateResult = fastify.db.run(
        'UPDATE reddit_posts SET status = ? WHERE id = ?',
        ['assets_downloading', id]
      );

      if (updateResult.changes === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Script not found',
        });
      }

      fastify.log.info('Download resume requested and status updated', {
        scriptId: id,
        changes: updateResult.changes,
      });

      reply.send({
        success: true,
        message: 'Download resumed',
        status: 'assets_downloading',
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

  // Download assets for script
  fastify.post<{
    Params: { id: string };
    Body: DownloadAssetsRequest;
  }>('/:id/assets/download', async (request, reply) => {
    try {
      const { id } = request.params;
      const { scenes, priority = 0 } = request.body;

      // Debug: Log what we received from frontend
      fastify.log.info('Asset download request received', {
        id,
        hasScenes: !!scenes,
        scenesLength: scenes?.length || 0,
        firstSceneExample: scenes?.[0] || null,
        requestBody: request.body,
      });

      // Find the script and get scene breakdown
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

      let sceneList: Array<{
        sceneId: number;
        searchPhrase: string;
        assetType: 'photo' | 'video';
      }> = [];

      // If scenes provided, use them directly (they already have search phrases from frontend)
      if (scenes && scenes.length > 0) {
        sceneList = scenes;
        fastify.log.info(
          'Using provided scenes with existing search phrases for bulk download',
          {
            scriptId: script.id,
            scenesCount: scenes.length,
          }
        );
      } else if (script.metadata) {
        // Use script.metadata.scenes (same as SceneTimeline component)
        try {
          const metadata =
            typeof script.metadata === 'string'
              ? JSON.parse(script.metadata)
              : script.metadata;
          const scenesFromMetadata = metadata.scenes || [];

          if (scenesFromMetadata.length > 0) {
            // ONLY generate search phrases if not provided by frontend
            // This is a fallback for when bulk download is called without frontend-generated phrases
            const searchPhrasesResponse = await fetch(
              `http://localhost:${process.env.PORT || 3001}/api/search-phrases/generate`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sentences: scenesFromMetadata.map(
                    (scene: any, index: number) => ({
                      id: scene.id || index + 1,
                      content: scene.content || scene.narration,
                      duration: scene.duration,
                      assetType: scene.duration < 4 ? 'photo' : 'video',
                    })
                  ),
                }),
              }
            );

            let searchPhrases: any[] = [];
            if (searchPhrasesResponse.ok) {
              const result = await searchPhrasesResponse.json();
              searchPhrases = result.data || [];
              fastify.log.info(
                'Generated search phrases as fallback for bulk download',
                {
                  scriptId: script.id,
                  phrasesCount: searchPhrases.length,
                }
              );
            } else {
              fastify.log.warn(
                'Failed to generate search phrases from metadata, using fallback',
                {
                  status: searchPhrasesResponse.status,
                }
              );
            }

            sceneList = scenesFromMetadata.map((scene: any, index: number) => {
              const sceneId = scene.id || index + 1;
              // Use generated search phrase if available, otherwise fallback
              const searchPhrase = searchPhrases.find(
                p => p.sentenceId === sceneId
              );
              const assetType = scene.duration < 4 ? 'photo' : 'video'; // Same logic as SceneTimeline

              return {
                sceneId,
                searchPhrase:
                  searchPhrase?.primaryPhrase ||
                  createOptimizedSearchPhrase(scene, index),
                assetType,
              };
            });
          }
        } catch (error) {
          fastify.log.warn(
            'Failed to parse script metadata for asset download',
            { error }
          );
        }
      } else if (script.scene_breakdown) {
        try {
          const sceneBreakdown = JSON.parse(script.scene_breakdown);

          // Generate search phrases using the same endpoint as SceneTimeline component
          const searchPhrasesResponse = await fetch(
            `http://localhost:${process.env.PORT || 3001}/api/search-phrases/generate`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sentences: sceneBreakdown.map((scene: any, index: number) => ({
                  id: index + 1,
                  content: scene.content || scene.narration,
                  duration: scene.duration,
                  assetType: scene.duration < 4 ? 'photo' : 'video',
                })),
              }),
            }
          );

          let searchPhrases: any[] = [];
          if (searchPhrasesResponse.ok) {
            const result = await searchPhrasesResponse.json();
            searchPhrases = result.data || [];
            fastify.log.info('Generated search phrases for bulk download', {
              scriptId: script.id,
              phrasesCount: searchPhrases.length,
            });
          } else {
            fastify.log.warn(
              'Failed to generate search phrases, using fallback',
              {
                status: searchPhrasesResponse.status,
              }
            );
          }

          sceneList = sceneBreakdown.map((scene: any, index: number) => {
            const sceneId = index + 1;
            // Use generated search phrase if available, otherwise fallback
            const searchPhrase = searchPhrases.find(
              p => p.sentenceId === sceneId
            );
            const assetType = scene.duration < 4 ? 'photo' : 'video'; // Same logic as SceneTimeline

            return {
              sceneId,
              searchPhrase:
                searchPhrase?.primaryPhrase ||
                createOptimizedSearchPhrase(scene, index),
              assetType,
            };
          });
        } catch (error) {
          fastify.log.warn(
            'Failed to parse scene breakdown for asset download',
            { error }
          );
          return reply.code(400).send({
            success: false,
            error: 'Invalid scene breakdown data',
          });
        }
      } else {
        return reply.code(400).send({
          success: false,
          error: 'No scenes provided and no scene breakdown found in script',
        });
      }

      if (sceneList.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'No scenes to download assets for',
        });
      }

      // Trigger asset download through pipeline
      const jobIds = await pipeline.triggerAssetDownload(
        script.post_id,
        script.id,
        sceneList,
        priority
      );

      fastify.log.info('Asset download started', {
        scriptId: script.id,
        postId: script.post_id,
        scenesCount: sceneList.length,
        jobIds: jobIds,
      });

      reply.send({
        success: true,
        jobIds,
        scenesCount: sceneList.length,
        message: `Started asset download for ${sceneList.length} scenes`,
      });
    } catch (error) {
      fastify.log.error(
        `Asset download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Asset download failed',
      });
    }
  });

  // Get asset download status
  fastify.get<{
    Params: { id: string };
  }>('/:id/assets/status', async (request, reply) => {
    try {
      const { id } = request.params;

      // Find the script
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

      // Get asset download jobs for this script
      const jobs = db.all<any>(
        'SELECT * FROM asset_download_queue WHERE script_id = ? ORDER BY created_at DESC',
        [script.id]
      );

      // Get queue stats
      const stats = assetQueue.getQueueStats();

      reply.send({
        success: true,
        postStatus: script.post_status,
        jobs,
        stats,
        summary: {
          total: jobs.length,
          pending: jobs.filter(j => j.status === 'pending').length,
          processing: jobs.filter(j => j.status === 'processing').length,
          completed: jobs.filter(j => j.status === 'completed').length,
          failed: jobs.filter(j => j.status === 'failed').length,
        },
      });
    } catch (error) {
      fastify.log.error(
        `Failed to get asset download status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get download status',
      });
    }
  });

  // Cancel asset download jobs
  fastify.delete<{
    Params: { id: string };
  }>('/:id/assets/cancel', async (request, reply) => {
    try {
      const { id } = request.params;

      // Find the script
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

      // Get pending/processing jobs for this script
      const jobs = db.all<any>(
        'SELECT * FROM asset_download_queue WHERE script_id = ? AND status IN (?, ?)',
        [script.id, 'pending', 'processing']
      );

      let cancelledCount = 0;
      for (const job of jobs) {
        const cancelled = await assetQueue.cancelJob(job.id);
        if (cancelled) {
          cancelledCount++;
        }
      }

      fastify.log.info('Asset download jobs cancelled', {
        scriptId: script.id,
        postId: script.post_id,
        totalJobs: jobs.length,
        cancelledCount,
      });

      reply.send({
        success: true,
        totalJobs: jobs.length,
        cancelledCount,
        message: `Cancelled ${cancelledCount} of ${jobs.length} jobs`,
      });
    } catch (error) {
      fastify.log.error(
        `Failed to cancel asset download jobs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to cancel download jobs',
      });
    }
  });

  // Resume asset download for script
  fastify.post<{
    Params: { id: string };
  }>('/:id/assets/resume', async (request, reply) => {
    try {
      const { id } = request.params;

      // Find the script
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

      // Get existing jobs for this script
      const existingJobs = await assetQueue.getJobsForScript(script.id);

      if (existingJobs.length === 0) {
        return reply.code(400).send({
          success: false,
          error:
            'No existing jobs found to resume. Please start download first.',
        });
      }

      // Reset failed jobs to pending to resume them
      const failedJobs = existingJobs.filter(job => job.status === 'failed');
      let resumedCount = 0;

      for (const job of failedJobs) {
        db.run(
          `UPDATE asset_download_queue 
           SET status = 'pending', 
               attempts = 0,
               error_message = NULL,
               started_at = NULL,
               completed_at = NULL,
               worker_id = NULL
           WHERE id = ?`,
          [job.id]
        );
        resumedCount++;
      }

      // Update post status to assets_downloading
      db.run('UPDATE reddit_posts SET status = ? WHERE id = ?', [
        'assets_downloading',
        script.post_id,
      ]);

      // Trigger processing of resumed jobs
      if (resumedCount > 0) {
        // The queue should automatically pick up pending jobs
        assetQueue.start(); // Ensure queue is running
      }

      fastify.log.info('Asset download resumed', {
        scriptId: script.id,
        postId: script.post_id,
        totalJobs: existingJobs.length,
        resumedCount,
        completedCount: existingJobs.filter(job => job.status === 'completed')
          .length,
      });

      reply.send({
        success: true,
        totalJobs: existingJobs.length,
        resumedCount,
        completedCount: existingJobs.filter(job => job.status === 'completed')
          .length,
        message: `Resumed ${resumedCount} failed jobs out of ${existingJobs.length} total jobs`,
      });
    } catch (error) {
      fastify.log.error(
        `Failed to resume asset download: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to resume download',
      });
    }
  });

  // Delete script
  fastify.delete<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      fastify.log.info('Script deletion requested', { scriptId: id });

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

      // Execute deletion in transaction for data integrity
      db.transaction(() => {
        // Delete from script_versions table
        db.run('DELETE FROM script_versions WHERE post_id = ?', [
          script.post_id,
        ]);

        // Delete from generation_queue table
        db.run('DELETE FROM generation_queue WHERE post_id = ?', [
          script.post_id,
        ]);

        // Delete from reddit_posts table
        db.run('DELETE FROM reddit_posts WHERE id = ?', [script.post_id]);
      });

      fastify.log.info('Script deleted successfully', {
        scriptId: script.id,
        postId: script.post_id,
      });

      reply.send({
        success: true,
        message: 'Script deleted successfully',
      });
    } catch (error) {
      fastify.log.error(
        `Script deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      reply.code(500).send({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete script',
      });
    }
  });

  done();
};

export default scriptsRoutes;
