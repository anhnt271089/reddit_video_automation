import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GenerationQueue } from './generationQueue';
import { DatabaseService } from '../services/database';
import { WebSocketService } from '../services/websocket';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

// Mock the Claude Code script generator
vi.mock('../services/claude-code', () => ({
  ClaudeCodeScriptGenerator: vi.fn().mockImplementation(() => ({
    generateScript: vi.fn().mockResolvedValue({
      scriptContent: 'Generated script content',
      sceneBreakdown: [
        {
          id: 1,
          narration: 'Scene 1',
          duration: 15,
          visualKeywords: ['test'],
          emotion: 'inspiring',
        },
      ],
      durationEstimate: 60,
      titles: ['Title 1', 'Title 2', 'Title 3', 'Title 4', 'Title 5'],
      description: 'Description',
      thumbnailConcepts: [],
      keywords: ['test'],
      generationParams: {
        style: 'motivational',
        targetDuration: 60,
        sceneCount: 3,
      },
    }),
  })),
}));

// Mock WebSocket service
vi.mock('../services/websocket', () => ({
  WebSocketService: vi.fn().mockImplementation(() => ({
    broadcast: vi.fn(),
  })),
}));

// Mock ScriptVersionManager
vi.mock('../services/scriptVersionManager', () => ({
  ScriptVersionManager: vi.fn().mockImplementation(() => ({
    createVersion: vi.fn().mockResolvedValue({
      id: 'version-id',
      post_id: 'test-post-1',
      version_number: 1,
      script_content: 'Generated script',
      scene_breakdown: [],
      duration_target: 60,
      titles: [],
      description: '',
      thumbnail_suggestions: [],
      generation_params: {},
      created_at: new Date(),
      is_active: true,
    }),
  })),
}));

describe('GenerationQueue', () => {
  let db: DatabaseService;
  let wsService: WebSocketService;
  let queue: GenerationQueue;
  const testDbPath = join(__dirname, '../../test-queue.db');

  beforeEach(async () => {
    // Clean up any existing test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }

    // Initialize test database
    db = new DatabaseService({ path: testDbPath });
    wsService = new WebSocketService() as any;

    // Create test schema
    await setupTestSchema();

    // Create queue instance
    queue = new GenerationQueue(db, wsService, {
      maxConcurrent: 2,
      maxRetries: 2,
      retryDelay: 100, // Short delay for tests
    });
  });

  afterEach(async () => {
    await queue.stop();
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
        status TEXT DEFAULT 'idea'
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
      CREATE TABLE video_scripts (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES reddit_posts(id),
        script_content TEXT NOT NULL,
        scene_breakdown TEXT NOT NULL,
        duration_target INTEGER NOT NULL DEFAULT 60,
        titles TEXT NOT NULL,
        description TEXT NOT NULL,
        thumbnail_suggestions TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        approved BOOLEAN NOT NULL DEFAULT FALSE,
        generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE script_versions (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        script_content TEXT NOT NULL,
        scene_breakdown TEXT NOT NULL,
        duration_target INTEGER NOT NULL DEFAULT 60,
        titles TEXT NOT NULL,
        description TEXT NOT NULL,
        thumbnail_suggestions TEXT NOT NULL,
        generation_params TEXT NOT NULL,
        quality_score INTEGER,
        claude_model TEXT,
        prompt_version TEXT,
        generation_duration INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT FALSE,
        UNIQUE(post_id, version_number)
      )
    `);

    // Insert test posts
    db.run(
      'INSERT INTO reddit_posts (id, title, content, author, subreddit) VALUES (?, ?, ?, ?, ?)',
      ['test-post-1', 'Test Post 1', 'Test content 1', 'author1', 'test']
    );
    db.run(
      'INSERT INTO reddit_posts (id, title, content, author, subreddit) VALUES (?, ?, ?, ?, ?)',
      ['test-post-2', 'Test Post 2', 'Test content 2', 'author2', 'test']
    );
    db.run(
      'INSERT INTO reddit_posts (id, title, content, author, subreddit) VALUES (?, ?, ?, ?, ?)',
      ['test-post-3', 'Test Post 3', 'Test content 3', 'author3', 'test']
    );
  }

  describe('createJob', () => {
    it('should create a new job with pending status', async () => {
      const job = await queue.createJob(
        'test-post-1',
        {
          style: 'motivational',
          targetDuration: 60,
          sceneCount: 3,
        },
        5 // priority
      );

      expect(job).toBeDefined();
      expect(job.post_id).toBe('test-post-1');
      expect(job.status).toBe('pending');
      expect(job.priority).toBe(5);
      expect(job.attempts).toBe(0);
      expect(job.generation_params.style).toBe('motivational');

      // Verify database insertion
      const dbJob = db.get<any>('SELECT * FROM generation_queue WHERE id = ?', [
        job.id,
      ]);
      expect(dbJob).toBeDefined();
      expect(dbJob.status).toBe('pending');
    });

    it('should broadcast WebSocket notification on job creation', async () => {
      const job = await queue.createJob('test-post-1', {
        style: 'educational',
        targetDuration: 90,
      });

      expect(wsService.broadcast).toHaveBeenCalledWith({
        type: 'generation_queue_job_created',
        payload: expect.objectContaining({
          jobId: job.id,
          postId: 'test-post-1',
          status: 'pending',
        }),
      });
    });
  });

  describe('Queue Processing', () => {
    it('should process jobs in FIFO order with priority', async () => {
      // Create jobs with different priorities
      const job1 = await queue.createJob(
        'test-post-1',
        {
          style: 'motivational',
          targetDuration: 60,
        },
        0
      ); // Low priority

      const job2 = await queue.createJob(
        'test-post-2',
        {
          style: 'educational',
          targetDuration: 60,
        },
        10
      ); // High priority

      const job3 = await queue.createJob(
        'test-post-3',
        {
          style: 'entertainment',
          targetDuration: 60,
        },
        5
      ); // Medium priority

      // Start processing
      await queue.start();

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check processing order - should be job2 (priority 10), job3 (priority 5), job1 (priority 0)
      const completedJobs = db.all<any>(
        'SELECT * FROM generation_queue WHERE status = ? ORDER BY completed_at',
        ['completed']
      );

      expect(completedJobs).toHaveLength(3);
      expect(completedJobs[0].id).toBe(job2.id); // Highest priority
      expect(completedJobs[1].id).toBe(job3.id); // Medium priority
      expect(completedJobs[2].id).toBe(job1.id); // Lowest priority
    });

    it('should respect max concurrent limit', async () => {
      // Create 4 jobs
      for (let i = 1; i <= 4; i++) {
        await queue.createJob(`test-post-${i}`, {
          style: 'motivational',
          targetDuration: 60,
        });
      }

      // Start processing (max concurrent = 2)
      await queue.start();

      // Check immediately - should have 2 processing
      await new Promise(resolve => setTimeout(resolve, 50));

      const processing = db.all<any>(
        'SELECT * FROM generation_queue WHERE status = ?',
        ['processing']
      );

      expect(processing.length).toBeLessThanOrEqual(2);
    });

    it('should update post status to script_generated on completion', async () => {
      await queue.createJob('test-post-1', {
        style: 'motivational',
        targetDuration: 60,
      });

      await queue.start();
      await new Promise(resolve => setTimeout(resolve, 300));

      const post = db.get<any>('SELECT status FROM reddit_posts WHERE id = ?', [
        'test-post-1',
      ]);

      expect(post.status).toBe('script_generated');
    });
  });

  describe('Error Handling', () => {
    it('should retry failed jobs up to max attempts', async () => {
      // Mock a failure on first attempt
      const mockGenerator = {
        generateScript: vi
          .fn()
          .mockRejectedValueOnce(new Error('Generation failed'))
          .mockResolvedValueOnce({
            scriptContent: 'Generated script',
            sceneBreakdown: [],
            durationEstimate: 60,
            titles: [],
            description: '',
            thumbnailConcepts: [],
            keywords: [],
            generationParams: {},
          }),
      };

      // Replace the mock for this test
      (queue as any).scriptGenerator = mockGenerator;

      const job = await queue.createJob('test-post-1', {
        style: 'motivational',
        targetDuration: 60,
      });

      await queue.start();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check that job was retried and eventually completed
      const finalJob = db.get<any>(
        'SELECT * FROM generation_queue WHERE id = ?',
        [job.id]
      );

      expect(mockGenerator.generateScript).toHaveBeenCalledTimes(2);
      expect(finalJob.status).toBe('completed');
      expect(finalJob.attempts).toBe(1); // One retry
    });

    it('should mark job as failed after max retries', async () => {
      // Mock continuous failures
      const mockGenerator = {
        generateScript: vi
          .fn()
          .mockRejectedValue(new Error('Persistent failure')),
      };

      (queue as any).scriptGenerator = mockGenerator;

      const job = await queue.createJob('test-post-1', {
        style: 'motivational',
        targetDuration: 60,
      });

      await queue.start();
      await new Promise(resolve => setTimeout(resolve, 600));

      const finalJob = db.get<any>(
        'SELECT * FROM generation_queue WHERE id = ?',
        [job.id]
      );

      expect(finalJob.status).toBe('failed');
      expect(finalJob.attempts).toBe(2); // Max retries
      expect(finalJob.error_message).toContain('Persistent failure');
    });
  });

  describe('Queue Statistics', () => {
    it('should return accurate queue statistics', async () => {
      // Create jobs with different statuses
      await queue.createJob('test-post-1', {
        style: 'motivational',
        targetDuration: 60,
      });

      await queue.createJob('test-post-2', {
        style: 'educational',
        targetDuration: 60,
      });

      // Start processing one job
      await queue.start();
      await new Promise(resolve => setTimeout(resolve, 300));
      await queue.stop();

      const stats = await queue.getQueueStats();

      expect(stats.pending).toBeGreaterThanOrEqual(0);
      expect(stats.completed).toBeGreaterThanOrEqual(1);
      expect(stats.successRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Queue Management', () => {
    it('should cancel pending jobs', async () => {
      const job = await queue.createJob('test-post-1', {
        style: 'motivational',
        targetDuration: 60,
      });

      const cancelled = await queue.cancelJob(job.id);
      expect(cancelled).toBe(true);

      const dbJob = db.get<any>('SELECT * FROM generation_queue WHERE id = ?', [
        job.id,
      ]);

      expect(dbJob.status).toBe('failed');
      expect(dbJob.error_message).toBe('Cancelled by user');
    });

    it('should not cancel processing jobs', async () => {
      const job = await queue.createJob('test-post-1', {
        style: 'motivational',
        targetDuration: 60,
      });

      // Mark as processing
      db.run('UPDATE generation_queue SET status = ? WHERE id = ?', [
        'processing',
        job.id,
      ]);

      const cancelled = await queue.cancelJob(job.id);
      expect(cancelled).toBe(false);
    });

    it('should clean up old completed and failed jobs', async () => {
      // Create old jobs
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      db.run(
        `INSERT INTO generation_queue (
          id, post_id, status, generation_params, created_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'old-job-1',
          'test-post-1',
          'completed',
          '{}',
          oldDate.toISOString(),
          oldDate.toISOString(),
        ]
      );

      db.run(
        `INSERT INTO generation_queue (
          id, post_id, status, generation_params, created_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'old-job-2',
          'test-post-2',
          'failed',
          '{}',
          oldDate.toISOString(),
          oldDate.toISOString(),
        ]
      );

      // Create recent job
      await queue.createJob('test-post-3', {
        style: 'motivational',
        targetDuration: 60,
      });

      const deleted = await queue.cleanupOldJobs(7);
      expect(deleted).toBe(2);

      const remainingJobs = db.all<any>('SELECT * FROM generation_queue');
      expect(remainingJobs).toHaveLength(1);
    });
  });

  describe('Queue Position', () => {
    it('should calculate correct queue position', async () => {
      const job1 = await queue.createJob(
        'test-post-1',
        {
          style: 'motivational',
          targetDuration: 60,
        },
        0
      );

      const job2 = await queue.createJob(
        'test-post-2',
        {
          style: 'educational',
          targetDuration: 60,
        },
        5
      );

      const job3 = await queue.createJob(
        'test-post-3',
        {
          style: 'entertainment',
          targetDuration: 60,
        },
        5
      );

      // job2 should be first (higher priority)
      const pos2 = await queue.getQueuePosition(job2.id);
      expect(pos2).toBe(1);

      // job3 should be second (same priority as job2, but created later)
      const pos3 = await queue.getQueuePosition(job3.id);
      expect(pos3).toBe(2);

      // job1 should be last (lowest priority)
      const pos1 = await queue.getQueuePosition(job1.id);
      expect(pos1).toBe(3);
    });
  });

  describe('Progress Updates', () => {
    it('should send progress updates during generation', async () => {
      // Mock slow generation
      const mockGenerator = {
        generateScript: vi.fn().mockImplementation(
          () =>
            new Promise(resolve =>
              setTimeout(
                () =>
                  resolve({
                    scriptContent: 'Generated',
                    sceneBreakdown: [],
                    durationEstimate: 60,
                    titles: [],
                    description: '',
                    thumbnailConcepts: [],
                    keywords: [],
                    generationParams: {},
                  }),
                200
              )
            )
        ),
      };

      (queue as any).scriptGenerator = mockGenerator;

      await queue.createJob('test-post-1', {
        style: 'motivational',
        targetDuration: 60,
      });

      await queue.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check for progress broadcast
      const progressCalls = (wsService.broadcast as any).mock.calls.filter(
        (call: any) => call[0].type === 'generation_progress'
      );

      expect(progressCalls.length).toBeGreaterThan(0);
    });
  });
});
