import { SceneData, AssetData, SceneWithAssets } from '../types';
import { getTextAnimationConfig } from './StyleConfig';

export class AssetLoader {
  static async mapScenesToAssets(
    scenes: SceneData[],
    assets: Record<number, AssetData[]>, // sceneId -> assets
    style: 'motivational' | 'contemplative' | 'urgent'
  ): Promise<SceneWithAssets[]> {
    let currentTime = 0;

    return scenes.map(scene => {
      const sceneAssets = assets[scene.id] || [];
      const animationConfig = getTextAnimationConfig(style);

      const sceneWithAssets: SceneWithAssets = {
        ...scene,
        assets: sceneAssets,
        startTime: currentTime,
        endTime: currentTime + scene.duration,
        textAnimation: {
          text: scene.narration,
          style: {
            fontSize: 48,
            fontFamily: 'Inter, Arial, sans-serif',
            fontWeight: 'bold',
            color: '#ffffff',
            textAlign: 'center',
          },
          animation: animationConfig.animation,
          timing: animationConfig.timing,
        },
      };

      currentTime += scene.duration;
      return sceneWithAssets;
    });
  }

  static selectBestAssetForScene(
    scene: SceneData,
    availableAssets: AssetData[]
  ): AssetData | null {
    if (availableAssets.length === 0) {
      return null;
    }

    // Score assets based on relevance to scene keywords
    const scoredAssets = availableAssets.map(asset => {
      let score = 0;

      // Prefer videos over images for dynamic content
      if (asset.type === 'video') {
        score += 10;
      }

      // Match keywords with asset tags
      if (asset.metadata?.tags) {
        const matchingTags = scene.visualKeywords.filter(keyword =>
          asset.metadata!.tags!.some(
            tag =>
              tag.toLowerCase().includes(keyword.toLowerCase()) ||
              keyword.toLowerCase().includes(tag.toLowerCase())
          )
        );
        score += matchingTags.length * 5;
      }

      // Quality scoring based on dimensions
      if (asset.metadata?.width && asset.metadata?.height) {
        const aspectRatio = asset.metadata.width / asset.metadata.height;
        // Prefer vertical or square content for mobile-first approach
        if (aspectRatio <= 1.2) {
          score += 5;
        }
      }

      return { asset, score };
    });

    // Sort by score and return the best match
    scoredAssets.sort((a, b) => b.score - a.score);
    return scoredAssets[0]?.asset || availableAssets[0];
  }

  static async loadCompositionData(
    scriptId: string,
    postId: string
  ): Promise<{
    scenes: SceneData[];
    assets: Record<number, AssetData[]>;
  }> {
    try {
      // This would typically fetch from your API
      const response = await fetch(`/api/scripts/${scriptId}/composition-data`);
      if (!response.ok) {
        throw new Error(
          `Failed to load composition data: ${response.statusText}`
        );
      }

      const data = await response.json();
      return {
        scenes: data.scenes || [],
        assets: data.assets || {},
      };
    } catch (error) {
      console.error('Failed to load composition data:', error);
      return {
        scenes: [],
        assets: {},
      };
    }
  }

  static validateAsset(asset: AssetData): boolean {
    // Basic validation
    if (!asset.url && !asset.localPath) {
      return false;
    }
    if (!['image', 'video'].includes(asset.type)) {
      return false;
    }

    // Additional validation based on type
    if (asset.type === 'video') {
      // Check if video duration is reasonable
      if (asset.metadata?.duration && asset.metadata.duration < 1) {
        return false;
      }
    }

    return true;
  }

  static getAssetPath(asset: AssetData): string {
    if (asset.localPath) {
      // Local assets are in the public folder
      return asset.localPath.startsWith('/')
        ? asset.localPath
        : `/${asset.localPath}`;
    }
    return asset.url;
  }
}
