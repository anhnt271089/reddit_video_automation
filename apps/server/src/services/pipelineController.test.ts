import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PipelineController } from './pipelineController';
import { DatabaseService } from './database';
import { GenerationQueue } from '../queue/generationQueue';
import { WebSocketService } from './websocket';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

// Mock the generation queue
const mockQueue = {
  start: vi.fn(),
  stop: vi.fn(),
  createJob: vi.fn(),
  cancelJob: vi.fn(),
  getQueueStats: vi.fn().mockReturnValue({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    avgProcessingTime: 0,
    successRate: 100,
  }),
  on: vi.fn(),
  emit: vi.fn(),
};

// Mock WebSocket service
const mockWsService = {
  broadcast: vi.fn(),
};

describe('PipelineController', () => {
  let db: DatabaseService;
  let pipeline: PipelineController;
  const testDbPath = join(__dirname, '../../test-pipeline.db');

  beforeEach(async () => {
    // Clean up any existing test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }

    // Initialize test database
    db = new DatabaseService({ path: testDbPath });

    // Create test schema
    await setupTestSchema();

    // Reset mocks
    vi.clearAllMocks();

    // Create pipeline instance
    pipeline = new PipelineController(
      db,
      mockQueue as any,
      mockWsService as any,
      {
        autoTrigger: false, // Disable auto-trigger for tests
        checkInterval: 100, // Short interval for tests
      }
    );
  });

  afterEach(async () => {
    await pipeline.stop();
    db.close();
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  async function setupTestSchema(): Promise<void> {
    // Create minimal schema for testing
    db.run(`
      CREATE TABLE reddit_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT,
        subreddit TEXT,
        status TEXT DEFAULT 'idea',
        updated_at TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE generation_queue (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        status TEXT NOT NULL,
        priority INTEGER DEFAULT 0,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        generation_params TEXT NOT NULL,
        progress_percentage INTEGER DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        worker_id TEXT,
        FOREIGN KEY (post_id) REFERENCES reddit_posts(id)
      )
    `);

    db.run(`
      CREATE TABLE pipeline_settings (
        id INTEGER PRIMARY KEY,
        auto_progress_to_assets BOOLEAN DEFAULT FALSE
      )
    `);

    // Insert test data
    db.run(
      'INSERT INTO reddit_posts (id, title, content, status) VALUES (?, ?, ?, ?)',
      ['post-1', 'Test Post 1', 'Content 1', 'idea']
    );
    db.run(
      'INSERT INTO reddit_posts (id, title, content, status) VALUES (?, ?, ?, ?)',
      ['post-2', 'Test Post 2', 'Content 2', 'idea_selected']
    );
    db.run(
      'INSERT INTO reddit_posts (id, title, content, status) VALUES (?, ?, ?, ?)',
      ['post-3', 'Test Post 3', 'Content 3', 'idea_selected']
    );
    db.run(
      'INSERT INTO reddit_posts (id, title, content, status) VALUES (?, ?, ?, ?)',
      ['post-4', 'Test Post 4', 'Content 4', 'script_generated']
    );

    db.run(
      'INSERT INTO pipeline_settings (id, auto_progress_to_assets) VALUES (?, ?)',
      [1, false]
    );
  }

  describe('Pipeline Lifecycle', () => {
    it('should start pipeline and queue', async () => {
      await pipeline.start();

      expect(mockQueue.start).toHaveBeenCalled();
    });

    it('should stop pipeline and queue', async () => {
      await pipeline.start();
      await pipeline.stop();

      expect(mockQueue.stop).toHaveBeenCalled();
    });

    it('should not start if already running', async () => {
      await pipeline.start();
      await pipeline.start(); // Try to start again

      expect(mockQueue.start).toHaveBeenCalledTimes(1);
    });
  });

  describe('Trigger Generation', () => {
    it('should trigger generation for a valid post', async () => {
      mockQueue.createJob.mockResolvedValue({
        id: 'job-1',
        post_id: 'post-1',
        status: 'pending',
        generation_params: {
          style: 'motivational',
          targetDuration: 60,
        },
      });

      await pipeline.start();
      const jobId = await pipeline.triggerGeneration('post-1');

      expect(jobId).toBe('job-1');
      expect(mockQueue.createJob).toHaveBeenCalledWith(
        'post-1',
        {
          style: 'motivational',
          targetDuration: 60,
        },
        0
      );
      expect(mockWsService.broadcast).toHaveBeenCalledWith({
        type: 'pipeline_generation_triggered',
        payload: {
          postId: 'post-1',
          jobId: 'job-1',
          status: 'triggered',
        },
      });
    });

    it('should use custom parameters when provided', async () => {
      mockQueue.createJob.mockResolvedValue({
        id: 'job-2',
        post_id: 'post-1',
        status: 'pending',
        generation_params: {
          style: 'educational',
          targetDuration: 90,
        },
      });

      await pipeline.start();
      await pipeline.triggerGeneration('post-1', {
        style: 'educational',
        targetDuration: 90,
        priority: 5,
      });

      expect(mockQueue.createJob).toHaveBeenCalledWith(
        'post-1',
        {
          style: 'educational',
          targetDuration: 90,
        },
        5
      );
    });

    it('should throw error for non-existent post', async () => {
      await pipeline.start();

      await expect(pipeline.triggerGeneration('non-existent')).rejects.toThrow(
        'Post not found'
      );
    });

    it('should not create duplicate jobs for same post', async () => {
      // Insert existing pending job
      db.run(
        `INSERT INTO generation_queue 
         (id, post_id, status, generation_params) 
         VALUES (?, ?, ?, ?)`,
        ['existing-job', 'post-1', 'pending', '{}']
      );

      await pipeline.start();
      const jobId = await pipeline.triggerGeneration('post-1');

      expect(jobId).toBe('existing-job');
      expect(mockQueue.createJob).not.toHaveBeenCalled();
    });
  });

  describe('Batch Generation', () => {
    it('should trigger generation for multiple posts', async () => {
      mockQueue.createJob
        .mockResolvedValueOnce({
          id: 'job-1',
          post_id: 'post-1',
          status: 'pending',
          generation_params: {},
        })
        .mockResolvedValueOnce({
          id: 'job-2',
          post_id: 'post-2',
          status: 'pending',
          generation_params: {},
        });

      await pipeline.start();
      const jobIds = await pipeline.triggerBatchGeneration([
        'post-1',
        'post-2',
      ]);

      expect(jobIds).toEqual(['job-1', 'job-2']);
      expect(mockQueue.createJob).toHaveBeenCalledTimes(2);
    });

    it('should continue batch even if some posts fail', async () => {
      mockQueue.createJob
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({
          id: 'job-2',
          post_id: 'post-2',
          status: 'pending',
          generation_params: {},
        });

      await pipeline.start();
      const jobIds = await pipeline.triggerBatchGeneration([
        'non-existent',
        'post-2',
      ]);

      expect(jobIds).toEqual(['job-2']);
    });
  });

  describe('Auto-trigger for Approved Posts', () => {
    it('should process approved posts when auto-trigger enabled', async () => {
      mockQueue.createJob.mockResolvedValue({
        id: 'auto-job',
        post_id: 'post-2',
        status: 'pending',
        generation_params: {},
      });

      const autoTriggerPipeline = new PipelineController(
        db,
        mockQueue as any,
        mockWsService as any,
        {
          autoTrigger: true,
          checkInterval: 50,
        }
      );

      await autoTriggerPipeline.start();

      // Wait for auto-check to run
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have triggered for post-2 and post-3 (both idea_selected)
      expect(mockQueue.createJob).toHaveBeenCalledTimes(2);

      await autoTriggerPipeline.stop();
    });

    it('should not trigger for posts already in queue', async () => {
      // Add post-2 to queue
      db.run(
        `INSERT INTO generation_queue 
         (id, post_id, status, generation_params) 
         VALUES (?, ?, ?, ?)`,
        ['existing', 'post-2', 'processing', '{}']
      );

      mockQueue.createJob.mockResolvedValue({
        id: 'job-3',
        post_id: 'post-3',
        status: 'pending',
        generation_params: {},
      });

      const autoTriggerPipeline = new PipelineController(
        db,
        mockQueue as any,
        mockWsService as any,
        {
          autoTrigger: true,
          checkInterval: 50,
        }
      );

      await autoTriggerPipeline.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should only trigger for post-3, not post-2
      expect(mockQueue.createJob).toHaveBeenCalledTimes(1);
      expect(mockQueue.createJob).toHaveBeenCalledWith(
        'post-3',
        expect.any(Object),
        expect.any(Number)
      );

      await autoTriggerPipeline.stop();
    });
  });

  describe('Cancel Generation', () => {
    it('should cancel active generation job', async () => {
      db.run(
        `INSERT INTO generation_queue 
         (id, post_id, status, generation_params) 
         VALUES (?, ?, ?, ?)`,
        ['job-to-cancel', 'post-1', 'pending', '{}']
      );

      mockQueue.cancelJob.mockResolvedValue(true);

      await pipeline.start();
      const cancelled = await pipeline.cancelGeneration('post-1');

      expect(cancelled).toBe(true);
      expect(mockQueue.cancelJob).toHaveBeenCalledWith('job-to-cancel');

      // Check post status reverted
      const post = db.get<any>('SELECT status FROM reddit_posts WHERE id = ?', [
        'post-1',
      ]);
      expect(post.status).toBe('idea_selected');
    });

    it('should return false if no active job', async () => {
      await pipeline.start();
      const cancelled = await pipeline.cancelGeneration('post-1');

      expect(cancelled).toBe(false);
      expect(mockQueue.cancelJob).not.toHaveBeenCalled();
    });
  });

  describe('Pipeline History', () => {
    it('should return pipeline history for a post', () => {
      // Add some history
      db.run(
        `INSERT INTO generation_queue 
         (id, post_id, status, generation_params, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        ['job-1', 'post-1', 'completed', '{}', '2025-01-01T10:00:00Z']
      );
      db.run(
        `INSERT INTO generation_queue 
         (id, post_id, status, generation_params, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        ['job-2', 'post-1', 'failed', '{}', '2025-01-01T11:00:00Z']
      );

      const history = pipeline.getPipelineHistory('post-1');

      expect(history.generations).toHaveLength(2);
      expect(history.currentStatus).toBe('idea');
      expect(history.lastActivity).toBeDefined();
    });

    it('should return empty history for post with no jobs', () => {
      const history = pipeline.getPipelineHistory('post-1');

      expect(history.generations).toHaveLength(0);
      expect(history.currentStatus).toBe('idea');
      expect(history.lastActivity).toBeNull();
    });
  });

  describe('Pipeline Metrics', () => {
    it('should return pipeline metrics', () => {
      const metrics = pipeline.getMetrics();

      expect(metrics).toHaveProperty('totalProcessed');
      expect(metrics).toHaveProperty('successCount');
      expect(metrics).toHaveProperty('failureCount');
      expect(metrics).toHaveProperty('averageProcessingTime');
    });

    it('should return pipeline status', async () => {
      await pipeline.start();
      const status = pipeline.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.autoTrigger).toBe(false);
      expect(status.queueStats).toBeDefined();
      expect(status.metrics).toBeDefined();
    });
  });

  describe('Reset Pipeline', () => {
    it('should reset pipeline for a post', async () => {
      // Add active job
      db.run(
        `INSERT INTO generation_queue 
         (id, post_id, status, generation_params) 
         VALUES (?, ?, ?, ?)`,
        ['active-job', 'post-4', 'processing', '{}']
      );

      mockQueue.cancelJob.mockResolvedValue(true);

      await pipeline.start();
      await pipeline.resetPipeline('post-4');

      // Check post status reset
      const post = db.get<any>('SELECT status FROM reddit_posts WHERE id = ?', [
        'post-4',
      ]);
      expect(post.status).toBe('idea_selected');
    });
  });

  describe('Event Emissions', () => {
    it('should emit generation:triggered event', async () => {
      const triggerSpy = vi.fn();
      pipeline.on('generation:triggered', triggerSpy);

      mockQueue.createJob.mockResolvedValue({
        id: 'job-1',
        post_id: 'post-1',
        status: 'pending',
        generation_params: {},
      });

      await pipeline.start();
      await pipeline.triggerGeneration('post-1');

      expect(triggerSpy).toHaveBeenCalledWith({
        postId: 'post-1',
        jobId: 'job-1',
      });
    });

    it('should emit pipeline:reset event', async () => {
      const resetSpy = vi.fn();
      pipeline.on('pipeline:reset', resetSpy);

      await pipeline.start();
      await pipeline.resetPipeline('post-1');

      expect(resetSpy).toHaveBeenCalledWith({
        postId: 'post-1',
      });
    });
  });
});
