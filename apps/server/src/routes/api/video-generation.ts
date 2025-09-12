import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { bundle } from '@remotion/bundler';
import { renderVideo, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger.js';

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
  // Start video generation
  fastify.post<{
    Body: VideoGenerationRequest;
    Reply: { jobId: string; message: string };
  }>('/api/video/generate', async (request, reply) => {
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
      reply.status(500).send({
        error: 'Failed to start video generation',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get generation progress
  fastify.get<{
    Params: { jobId: string };
    Reply: VideoGenerationProgress | { error: string };
  }>('/api/video/status/:jobId', async (request, reply) => {
    const { jobId } = request.params;

    const job = videoJobs.get(jobId);
    if (!job) {
      reply.status(404).send({ error: 'Job not found' });
      return;
    }

    reply.send(job);
  });

  // Get composition data for Remotion
  fastify.get<{
    Params: { scriptId: string };
    Reply: any;
  }>('/api/scripts/:scriptId/composition-data', async (request, reply) => {
    try {
      const { scriptId } = request.params;

      // Get script data from database
      const scriptQuery = fastify.db.prepare(`
        SELECT * FROM scripts WHERE id = ?
      `);
      const script = scriptQuery.get(scriptId) as any;

      if (!script) {
        reply.status(404).send({ error: 'Script not found' });
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
      reply.status(500).send({
        error: 'Failed to get composition data',
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
    const compositions = await selectComposition({
      serveUrl: bundleLocation,
      id: 'RedditVideo',
    });

    if (!compositions.length) {
      throw new Error('No compositions found');
    }

    const composition = compositions[0];

    updateJob({
      progress: 50,
      message: 'Rendering video frames...',
    });

    // Render the video
    const outputPath = path.resolve(
      process.cwd(),
      'generated-videos',
      `${jobId}.${outputFormat}`
    );

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Get quality settings
    const qualitySettings = getQualitySettings(quality);

    await renderVideo({
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
          dimensions: { width: 1080, height: 1920 },
          fps: 30,
          duration: 60, // This would be calculated from scenes
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
      outputUrl: `/generated-videos/${jobId}.${outputFormat}`,
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
  switch (quality) {
    case 'low':
      return {
        scale: 0.5,
        crf: 28,
      };
    case 'high':
      return {
        scale: 1.0,
        crf: 18,
      };
    case 'medium':
    default:
      return {
        scale: 1.0,
        crf: 23,
      };
  }
}
