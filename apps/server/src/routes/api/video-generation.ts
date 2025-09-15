import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';
import {
  VIDEO_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  HTTP_STATUS,
} from '../../constants/index.js';

interface VideoGenerationRequest {
  scriptId: string;
  postId: string;
  style: 'motivational' | 'contemplative' | 'urgent';
  outputFormat?: 'mp4' | 'webm';
  quality?: 'low' | 'medium' | 'high';
}

interface VideoGenerationProgress {
  jobId: string;
  stage:
    | 'preparing'
    | 'bundling'
    | 'rendering'
    | 'encoding'
    | 'complete'
    | 'error';
  progress: number;
  currentScene?: number;
  totalScenes: number;
  message: string;
  error?: string;
  outputUrl?: string;
}

// In-memory job tracking (in production, use Redis or database)
const videoJobs = new Map<string, VideoGenerationProgress>();

export async function videoGenerationRoutes(fastify: FastifyInstance) {
  logger.info('Video generation routes being registered');

  // Start video generation
  fastify.post<{
    Body: VideoGenerationRequest;
    Reply: { jobId: string; message: string };
  }>('/video/generate', async (request, reply) => {
    try {
      const {
        scriptId,
        postId,
        style,
        outputFormat = 'mp4',
        quality = 'medium',
      } = request.body;

      const jobId = uuidv4();

      // Initialize job tracking
      videoJobs.set(jobId, {
        jobId,
        stage: 'preparing',
        progress: 0,
        totalScenes: 0,
        message: 'Preparing video generation...',
      });

      // Start generation process asynchronously
      generateVideo(jobId, {
        scriptId,
        postId,
        style,
        outputFormat,
        quality,
      }).catch(error => {
        logger.error('Video generation failed:', error);
        videoJobs.set(jobId, {
          jobId,
          stage: 'error',
          progress: 0,
          totalScenes: 0,
          message: 'Video generation failed',
          error: error.message,
        });
      });

      reply.send({
        jobId,
        message: 'Video generation started',
      });
    } catch (error) {
      logger.error('Failed to start video generation:', error);
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        error: ERROR_MESSAGES.VIDEO_GENERATION_FAILED,
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get generation progress
  fastify.get<{
    Params: { jobId: string };
    Reply: VideoGenerationProgress | { error: string };
  }>('/video/status/:jobId', async (request, reply) => {
    const { jobId } = request.params;

    const job = videoJobs.get(jobId);
    if (!job) {
      reply
        .status(HTTP_STATUS.NOT_FOUND)
        .send({ error: ERROR_MESSAGES.NOT_FOUND });
      return;
    }

    reply.send(job);
  });

  // Get composition data for Remotion
  fastify.get<{
    Params: { scriptId: string };
    Reply: any;
  }>('/scripts/:scriptId/composition-data', async (request, reply) => {
    try {
      const { scriptId } = request.params;

      // Get script data from database
      const scriptQuery = fastify.db.prepare(`
        SELECT * FROM scripts WHERE id = ?
      `);
      const script = scriptQuery.get(scriptId) as any;

      if (!script) {
        reply
          .status(HTTP_STATUS.NOT_FOUND)
          .send({ error: ERROR_MESSAGES.SCRIPT_NOT_FOUND });
        return;
      }

      // Get scenes from breakdown
      const breakdown = JSON.parse(script.script_breakdown || '{}');
      const scenes = breakdown.sceneBreakdown || [];

      // Get downloaded assets
      const assetsQuery = fastify.db.prepare(`
        SELECT scene_id, asset_type, asset_url, local_path, metadata
        FROM script_assets 
        WHERE script_id = ? AND status = 'completed'
      `);
      const assets = assetsQuery.all(scriptId) as any[];

      // Group assets by scene
      const assetsByScene: Record<number, any[]> = {};
      assets.forEach(asset => {
        if (!assetsByScene[asset.scene_id]) {
          assetsByScene[asset.scene_id] = [];
        }
        assetsByScene[asset.scene_id].push({
          id: `${asset.scene_id}-${asset.asset_type}-${Date.now()}`,
          type: asset.asset_type,
          url: asset.asset_url,
          localPath: asset.local_path,
          metadata: asset.metadata ? JSON.parse(asset.metadata) : {},
        });
      });

      reply.send({
        scenes,
        assets: assetsByScene,
      });
    } catch (error) {
      logger.error('Failed to get composition data:', error);
      reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
        error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

async function generateVideo(
  jobId: string,
  params: VideoGenerationRequest
): Promise<void> {
  const { scriptId, postId, style, outputFormat, quality } = params;

  try {
    // Update job status
    const updateJob = (update: Partial<VideoGenerationProgress>) => {
      const current = videoJobs.get(jobId);
      if (current) {
        videoJobs.set(jobId, { ...current, ...update });
      }
    };

    updateJob({
      stage: 'bundling',
      progress: 10,
      message: 'Bundling Remotion composition...',
    });

    // Bundle the Remotion project
    const remotionRoot = path.resolve(
      process.cwd(),
      '../remotion/src/index.ts'
    );
    const bundleLocation = await bundle({
      entryPoint: remotionRoot,
      // Optional: specify a custom webpack config if needed
    });

    updateJob({
      stage: 'rendering',
      progress: 30,
      message: 'Starting video render...',
    });

    // Get the composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'RedditVideo',
      inputProps: {},
    });

    updateJob({
      progress: 50,
      message: 'Rendering video frames...',
    });

    // Render the video
    const outputPath = path.resolve(
      process.cwd(),
      '../../assets/videos',
      `${jobId}.${outputFormat}`
    );

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Get quality settings
    const qualitySettings = getQualitySettings(quality);

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: outputFormat === 'webm' ? 'vp8' : 'h264',
      outputLocation: outputPath,
      inputProps: {
        composition: {
          id: scriptId,
          title: `Reddit Video - ${postId}`,
          description: 'Generated video from Reddit content',
          scenes: [], // This would be populated from your API
          style,
          dimensions: VIDEO_CONFIG.DEFAULT_DIMENSIONS,
          fps: VIDEO_CONFIG.DEFAULT_FPS,
          duration: VIDEO_CONFIG.DEFAULT_DURATION, // This would be calculated from scenes
        },
      },
      ...qualitySettings,
      onProgress: progress => {
        updateJob({
          progress: 50 + progress.progress * 40, // 50-90% for rendering
          message: `Rendering: ${Math.round(progress.progress * 100)}%`,
        });
      },
    });

    updateJob({
      stage: 'complete',
      progress: 100,
      message: 'Video generation complete!',
      outputUrl: `/assets/videos/${jobId}.${outputFormat}`,
    });

    logger.info(`Video generation completed for job ${jobId}`);
  } catch (error) {
    logger.error(`Video generation failed for job ${jobId}:`, error);

    const updateJob = (update: Partial<VideoGenerationProgress>) => {
      const current = videoJobs.get(jobId);
      if (current) {
        videoJobs.set(jobId, { ...current, ...update });
      }
    };

    updateJob({
      stage: 'error',
      progress: 0,
      message: 'Video generation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function getQualitySettings(quality: string) {
  const preset =
    VIDEO_CONFIG.QUALITY_PRESETS[
      quality as keyof typeof VIDEO_CONFIG.QUALITY_PRESETS
    ];
  return preset || VIDEO_CONFIG.QUALITY_PRESETS.medium;
}
