/**
 * Pexels Download API Routes
 * Downloads assets from Pexels based on search phrases
 */

import { FastifyPluginAsync } from 'fastify';
import { PexelsService } from '../../services/pexelsService.js';
import { logger } from '../../utils/logger.js';

interface DownloadRequest {
  searchPhrase: string;
  assetType: 'photo' | 'video';
  scriptId: string;
  sentenceId: number;
}

const pexelsDownloadRoutes: FastifyPluginAsync = async function (fastify) {
  const pexelsService = new PexelsService();

  /**
   * POST /api/pexels-download/search-and-download
   * Search for an asset and download it
   */
  fastify.post<{
    Body: DownloadRequest;
  }>(
    '/search-and-download',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            searchPhrase: { type: 'string' },
            assetType: { type: 'string', enum: ['photo', 'video'] },
            scriptId: { type: 'string' },
            sentenceId: { type: 'number' },
          },
          required: ['searchPhrase', 'assetType', 'scriptId', 'sentenceId'],
        },
      },
    },
    async (request, reply) => {
      try {
        const { searchPhrase, assetType, scriptId, sentenceId } = request.body;

        logger.info(
          `Searching and downloading ${assetType} for: ${searchPhrase}`,
          {
            scriptId,
            sentenceId,
          }
        );

        // Search for the best asset with fallback support
        const searchResult = await pexelsService.searchWithFallback(
          searchPhrase,
          assetType
        );

        if (!searchResult) {
          return reply.code(404).send({
            success: false,
            error: `No ${assetType} found for search phrase: ${searchPhrase}`,
          });
        }

        const { asset, downloadUrl } = searchResult;

        // Generate logical filename
        const filename = pexelsService.generateFilename(
          scriptId,
          sentenceId,
          asset.id,
          assetType
        );

        // Get full file path with organized directory structure
        const filePath = pexelsService.getAssetPath(
          filename,
          scriptId,
          assetType
        );

        // Download the asset
        const downloadedPath = await pexelsService.downloadAsset(
          downloadUrl,
          filePath,
          assetType
        );

        logger.info(`Successfully downloaded ${assetType}:`, {
          searchPhrase,
          assetId: asset.id,
          filename,
          path: downloadedPath,
        });

        reply.send({
          success: true,
          data: {
            assetId: asset.id,
            assetType,
            searchPhrase,
            filename,
            downloadPath: downloadedPath,
            asset: {
              id: asset.id,
              url:
                assetType === 'photo' ? (asset as any).url : (asset as any).url,
              photographer:
                assetType === 'photo'
                  ? (asset as any).photographer
                  : (asset as any).user.name,
            },
          },
        });
      } catch (error) {
        logger.error('Failed to search and download asset:', error);
        reply.code(500).send({
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to download asset',
        });
      }
    }
  );

  /**
   * GET /api/pexels-download/serve/{scriptId}/{sentenceId}/{assetType}
   * Serve downloaded asset files
   */
  fastify.get<{
    Params: {
      scriptId: string;
      sentenceId: string;
      assetType: 'photo' | 'video';
    };
  }>('/serve/:scriptId/:sentenceId/:assetType', async (request, reply) => {
    try {
      const { scriptId, sentenceId, assetType } = request.params;
      const { join } = await import('path');
      const { createReadStream, existsSync } = await import('fs');

      // Generate the expected filename - using the same path as pexelsService
      const shortId = scriptId.slice(0, 8);
      const assetsDir = join(
        process.cwd(),
        '../../assets',
        shortId,
        `${assetType}s`
      );

      // Find the file matching the pattern
      const { readdirSync } = await import('fs');
      const files = readdirSync(assetsDir).filter(file =>
        file.includes(`scene_${sentenceId}_`)
      );

      if (files.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Asset file not found',
        });
      }

      const filePath = join(assetsDir, files[0]);

      if (!existsSync(filePath)) {
        return reply.code(404).send({
          success: false,
          error: 'Asset file not found',
        });
      }

      // Set appropriate headers for download
      const mimeType = assetType === 'photo' ? 'image/jpeg' : 'video/mp4';
      reply.header('Content-Type', mimeType);
      reply.header('Content-Disposition', `attachment; filename="${files[0]}"`);

      // Stream the file
      const stream = createReadStream(filePath);
      return reply.send(stream);
    } catch (error) {
      logger.error('Failed to serve asset:', error);
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to serve asset',
      });
    }
  });

  /**
   * GET /api/pexels-download/test/{searchPhrase}
   * Test search functionality
   */
  fastify.get<{
    Params: { searchPhrase: string };
    Querystring: { type?: 'photo' | 'video' };
  }>('/test/:searchPhrase', async (request, reply) => {
    try {
      const { searchPhrase } = request.params;
      const assetType = request.query.type || 'photo';

      logger.info(`Testing search for: ${searchPhrase} (${assetType})`);

      const searchResult = await pexelsService.searchAndGetBest(
        searchPhrase,
        assetType
      );

      if (!searchResult) {
        return reply.code(404).send({
          success: false,
          error: `No ${assetType} found for: ${searchPhrase}`,
        });
      }

      reply.send({
        success: true,
        data: {
          searchPhrase,
          assetType,
          asset: searchResult.asset,
          downloadUrl: searchResult.downloadUrl,
        },
      });
    } catch (error) {
      logger.error('Failed to test search:', error);
      reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Search test failed',
      });
    }
  });
};

export default pexelsDownloadRoutes;
