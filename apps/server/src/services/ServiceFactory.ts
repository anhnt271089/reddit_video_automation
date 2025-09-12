import { DatabaseService } from './database';
import { WebSocketService } from './websocket';
import { GenerationQueue } from '../queue/generationQueue';
import { AssetDownloadQueue } from '../queue/assetDownloadQueue';
import { PipelineController } from './pipelineController';

/**
 * Service Factory to ensure singleton instances of services
 * This prevents multiple instances of queues and controllers
 */
export class ServiceFactory {
  private static instances: Map<string, any> = new Map();

  static getGenerationQueue(
    db: DatabaseService,
    wsService: WebSocketService
  ): GenerationQueue {
    const key = 'GenerationQueue';
    if (!this.instances.has(key)) {
      this.instances.set(key, new GenerationQueue(db, wsService));
    }
    return this.instances.get(key);
  }

  static getAssetDownloadQueue(
    db: DatabaseService,
    wsService: WebSocketService
  ): AssetDownloadQueue {
    const key = 'AssetDownloadQueue';
    if (!this.instances.has(key)) {
      this.instances.set(key, new AssetDownloadQueue(db, wsService));
    }
    return this.instances.get(key);
  }

  static getPipelineController(
    db: DatabaseService,
    queue: GenerationQueue,
    assetQueue: AssetDownloadQueue,
    wsService: WebSocketService
  ): PipelineController {
    const key = 'PipelineController';
    if (!this.instances.has(key)) {
      this.instances.set(
        key,
        new PipelineController(db, queue, assetQueue, wsService)
      );
    }
    return this.instances.get(key);
  }

  /**
   * Clear all instances (useful for testing)
   */
  static clearAll(): void {
    this.instances.clear();
  }

  /**
   * Get all service instances for lifecycle management
   */
  static getAllServices(): {
    queue?: GenerationQueue;
    assetQueue?: AssetDownloadQueue;
    pipeline?: PipelineController;
  } {
    return {
      queue: this.instances.get('GenerationQueue'),
      assetQueue: this.instances.get('AssetDownloadQueue'),
      pipeline: this.instances.get('PipelineController'),
    };
  }
}
