import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../server';
import { DatabaseService } from '../../services/database';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

// Mock WebSocket service
vi.mock('../../services/websocket', () => ({
  WebSocketService: vi.fn().mockImplementation(() => ({
    broadcast: vi.fn(),
    broadcastToUser: vi.fn(),
  })),
}));

// Mock Claude Code service
vi.mock('../../services/claude-code', () => ({
  ClaudeCodeScriptGenerator: vi.fn().mockImplementation(() => ({
    generateScript: vi.fn().mockResolvedValue({
      scriptContent: 'Test script content',
      sceneBreakdown: [
        {
          id: 1,
          narration: 'Test scene',
          duration: 15,
          visualKeywords: ['test'],
          emotion: 'inspiring',
        },
      ],
      durationEstimate: 60,
      titles: ['Test Title'],
      description: 'Test description',
      thumbnailConcepts: [],
      keywords: ['test'],
      generationParams: {
        style: 'motivational',
        targetDuration: 60,
        sceneCount: 4,
      },
    }),
  })),
}));

describe('Scripts API Routes', () => {
  let fastify: FastifyInstance;
  let db: DatabaseService;
  const testDbPath = join(__dirname, '../../../test-scripts-api.db');

  beforeEach(async () => {
    // Clean up any existing test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }

    // Build server
    fastify = await buildServer();

    // Get database service
    db = fastify.db as DatabaseService;

    // Setup test schema
    await setupTestSchema();

    // Wait for server to be ready
    await fastify.ready();
  });

  afterEach(async () => {
    await fastify.close();
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }
  });

  async function setupTestSchema(): Promise<void> {
    // Create necessary tables
    db.run(`
      CREATE TABLE IF NOT EXISTS reddit_posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT,
        subreddit TEXT,
        status TEXT DEFAULT 'idea',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS generation_queue (
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
      CREATE TABLE IF NOT EXISTS script_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        script_content TEXT NOT NULL,
        scene_breakdown TEXT NOT NULL,
        duration_estimate INTEGER NOT NULL,
        titles TEXT NOT NULL,
        description TEXT NOT NULL,
        thumbnail_concepts TEXT,
        keywords TEXT,
        generation_params TEXT NOT NULL,
        quality_score INTEGER,
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES reddit_posts(id),
        UNIQUE(post_id, version_number)
      )
    `);

    // Insert test data
    db.run(
      'INSERT INTO reddit_posts (id, title, content, status) VALUES (?, ?, ?, ?)',
      ['test-post-1', 'Test Post 1', 'Test content 1', 'idea_selected']
    );
    db.run(
      'INSERT INTO reddit_posts (id, title, content, status) VALUES (?, ?, ?, ?)',
      ['test-post-2', 'Test Post 2', 'Test content 2', 'idea_selected']
    );
  }

  describe('POST /api/scripts/generate', () => {
    it('should generate script for valid post', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/scripts/generate',
        payload: {
          postId: 'test-post-1',
          targetDuration: 60,
          style: 'motivational',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.jobId).toBeDefined();
      expect(body.message).toContain('generation started');
    });

    it('should return 404 for non-existent post', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/scripts/generate',
        payload: {
          postId: 'non-existent',
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('not found');
    });

    it('should accept priority parameter', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/scripts/generate',
        payload: {
          postId: 'test-post-1',
          priority: 10,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Check that job was created with priority
      const job = db.get<any>('SELECT * FROM generation_queue WHERE id = ?', [
        body.jobId,
      ]);
      expect(job?.priority).toBe(10);
    });
  });

  describe('GET /api/scripts/:postId', () => {
    beforeEach(() => {
      // Add a script version for testing
      db.run(
        `INSERT INTO script_versions 
         (post_id, version_number, script_content, scene_breakdown, duration_estimate, 
          titles, description, keywords, generation_params, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'test-post-1',
          1,
          'Test script content',
          JSON.stringify([{ id: 1, narration: 'Test' }]),
          60,
          JSON.stringify(['Test Title']),
          'Test description',
          JSON.stringify(['test']),
          JSON.stringify({ style: 'motivational' }),
          true,
        ]
      );
    });

    it('should get active script version', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/scripts/test-post-1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.script).toBeDefined();
      expect(body.script.version_number).toBe(1);
    });

    it('should return 404 for post without script', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/scripts/test-post-2',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('No script found');
    });
  });

  describe('GET /api/scripts/:postId/versions', () => {
    beforeEach(() => {
      // Add multiple versions
      for (let i = 1; i <= 3; i++) {
        db.run(
          `INSERT INTO script_versions 
           (post_id, version_number, script_content, scene_breakdown, duration_estimate, 
            titles, description, keywords, generation_params, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'test-post-1',
            i,
            `Script version ${i}`,
            JSON.stringify([{ id: 1, narration: 'Test' }]),
            60,
            JSON.stringify([`Title ${i}`]),
            `Description ${i}`,
            JSON.stringify(['test']),
            JSON.stringify({ style: 'motivational' }),
            i === 3, // Last one is active
          ]
        );
      }
    });

    it('should list all script versions', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/scripts/test-post-1/versions',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.versions).toHaveLength(3);
      expect(body.total).toBe(3);
    });
  });

  describe('POST /api/scripts/:postId/regenerate', () => {
    it('should trigger regeneration with new parameters', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/scripts/test-post-1/regenerate',
        payload: {
          targetDuration: 90,
          style: 'educational',
          forceRegenerate: true,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.message).toContain('regeneration started');
    });

    it('should return 404 for non-existent post', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/scripts/non-existent/regenerate',
        payload: {},
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('POST /api/scripts/validate', () => {
    it('should validate a script', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/scripts/validate',
        payload: {
          scriptContent: 'Test script with sufficient content for validation',
          sceneBreakdown: [
            {
              id: 1,
              narration: 'Scene 1 with enough content',
              duration: 15,
              visualKeywords: ['test'],
              emotion: 'inspiring',
            },
            {
              id: 2,
              narration: 'Scene 2 with enough content',
              duration: 15,
              visualKeywords: ['test'],
              emotion: 'dramatic',
            },
          ],
          durationEstimate: 30,
          titles: ['Title 1', 'Title 2'],
          description: 'A good description with hashtags #test',
          keywords: ['test', 'validation'],
          generationParams: {
            style: 'motivational',
            targetDuration: 30,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.validation).toBeDefined();
      expect(body.validation.score).toBeDefined();
      expect(body.validation.isValid).toBeDefined();
    });
  });

  describe('Queue Management Endpoints', () => {
    describe('GET /api/scripts/queue/status', () => {
      it('should get queue status', async () => {
        const response = await fastify.inject({
          method: 'GET',
          url: '/api/scripts/queue/status',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.stats).toBeDefined();
        expect(body.jobs).toBeDefined();
        expect(body.isRunning).toBeDefined();
      });

      it('should filter by status', async () => {
        // Add test job
        db.run(
          `INSERT INTO generation_queue 
           (id, post_id, status, generation_params) 
           VALUES (?, ?, ?, ?)`,
          ['job-1', 'test-post-1', 'pending', '{}']
        );

        const response = await fastify.inject({
          method: 'GET',
          url: '/api/scripts/queue/status?status=pending',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.jobs).toHaveLength(1);
        expect(body.jobs[0].status).toBe('pending');
      });
    });

    describe('GET /api/scripts/queue/job/:jobId', () => {
      it('should get job details', async () => {
        // Add test job
        db.run(
          `INSERT INTO generation_queue 
           (id, post_id, status, generation_params) 
           VALUES (?, ?, ?, ?)`,
          ['job-1', 'test-post-1', 'pending', '{}']
        );

        const response = await fastify.inject({
          method: 'GET',
          url: '/api/scripts/queue/job/job-1',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(true);
        expect(body.job).toBeDefined();
        expect(body.job.id).toBe('job-1');
      });

      it('should return 404 for non-existent job', async () => {
        const response = await fastify.inject({
          method: 'GET',
          url: '/api/scripts/queue/job/non-existent',
        });

        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.success).toBe(false);
      });
    });

    describe('DELETE /api/scripts/queue/job/:jobId', () => {
      it('should cancel a job', async () => {
        // Add test job
        db.run(
          `INSERT INTO generation_queue 
           (id, post_id, status, generation_params) 
           VALUES (?, ?, ?, ?)`,
          ['job-to-cancel', 'test-post-1', 'pending', '{}']
        );

        const response = await fastify.inject({
          method: 'DELETE',
          url: '/api/scripts/queue/job/job-to-cancel',
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.success).toBeDefined();
      });
    });
  });

  describe('Batch Operations', () => {
    it('should trigger batch generation', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/scripts/batch/generate',
        payload: {
          postIds: ['test-post-1', 'test-post-2'],
          priority: 5,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.jobIds).toBeDefined();
      expect(body.message).toContain('Started generation');
    });

    it('should return error for empty batch', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/scripts/batch/generate',
        payload: {
          postIds: [],
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('No post IDs');
    });
  });

  describe('Pipeline Endpoints', () => {
    it('should get pipeline status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/scripts/pipeline/status',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.pipeline).toBeDefined();
      expect(body.pipeline.isRunning).toBeDefined();
      expect(body.pipeline.metrics).toBeDefined();
    });

    it('should get pipeline history for post', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/scripts/pipeline/history/test-post-1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.history).toBeDefined();
      expect(body.history.currentStatus).toBeDefined();
    });
  });
});
