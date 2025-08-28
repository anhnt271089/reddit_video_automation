import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from './database';
import { ScriptVersionManager } from './scriptVersionManager';
import { GeneratedScript } from './claude-code/types';
import { ScriptVersion } from '@video-automation/shared-types';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

describe('ScriptVersionManager', () => {
  let db: DatabaseService;
  let versionManager: ScriptVersionManager;
  const testDbPath = join(__dirname, '../../test-versions.db');

  // Sample test data
  const mockGeneratedScript: GeneratedScript = {
    scriptContent: 'This is a test script content.',
    sceneBreakdown: [
      {
        id: 1,
        narration: 'Scene 1 content',
        duration: 15,
        visualKeywords: ['test', 'scene'],
        emotion: 'inspiring',
      },
      {
        id: 2,
        narration: 'Scene 2 content',
        duration: 20,
        visualKeywords: ['video', 'content'],
        emotion: 'educational',
      },
    ],
    durationEstimate: 35,
    titles: [
      'Test Title 1',
      'Test Title 2',
      'Test Title 3',
      'Test Title 4',
      'Test Title 5',
    ],
    description: 'Test video description with hashtags #test #video',
    thumbnailConcepts: [
      {
        description: 'Test thumbnail',
        visualElements: ['text', 'background'],
        textOverlay: 'TEST',
        colorScheme: 'blue and white',
      },
    ],
    keywords: ['test', 'script', 'generation'],
    generationParams: {
      style: 'educational',
      targetDuration: 35,
      sceneCount: 2,
    },
  };

  const testPostId = 'test-post-123';

  beforeEach(async () => {
    // Clean up any existing test database
    if (existsSync(testDbPath)) {
      unlinkSync(testDbPath);
    }

    // Initialize test database
    db = new DatabaseService({ path: testDbPath });
    versionManager = new ScriptVersionManager(db);

    // Create test schema
    await setupTestSchema();
  });

  afterEach(() => {
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
        status TEXT DEFAULT 'idea'
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
        generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        quality_score INTEGER
      )
    `);

    db.run(`
      CREATE TABLE script_versions (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL REFERENCES reddit_posts(id),
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

    // Insert test reddit post
    db.run('INSERT INTO reddit_posts (id, title, content) VALUES (?, ?, ?)', [
      testPostId,
      'Test Post',
      'Test content for video generation',
    ]);
  }

  describe('createVersion', () => {
    it('should create the first version for a post', async () => {
      const version = await versionManager.createVersion(
        testPostId,
        mockGeneratedScript,
        1500 // generation time in ms
      );

      expect(version).toBeDefined();
      expect(version.post_id).toBe(testPostId);
      expect(version.version_number).toBe(1);
      expect(version.is_active).toBe(true);
      expect(version.script_content).toBe(mockGeneratedScript.scriptContent);
      expect(version.generation_duration).toBe(1500);
      expect(version.scene_breakdown).toHaveLength(2);
    });

    it('should increment version number for subsequent versions', async () => {
      // Create first version
      await versionManager.createVersion(testPostId, mockGeneratedScript);

      // Create second version with modified content
      const modifiedScript = {
        ...mockGeneratedScript,
        scriptContent: 'Modified script content',
      };
      const version2 = await versionManager.createVersion(
        testPostId,
        modifiedScript
      );

      expect(version2.version_number).toBe(2);
      expect(version2.is_active).toBe(true);
      expect(version2.script_content).toBe('Modified script content');

      // First version should no longer be active
      const version1 = await versionManager.getVersion(testPostId, 1);
      expect(version1?.is_active).toBe(false);
    });

    it('should update main video_scripts table', async () => {
      await versionManager.createVersion(testPostId, mockGeneratedScript);

      const script = db.get<any>(
        'SELECT * FROM video_scripts WHERE post_id = ?',
        [testPostId]
      );

      expect(script).toBeDefined();
      expect(script.version).toBe(1);
      expect(script.script_content).toBe(mockGeneratedScript.scriptContent);
      expect(JSON.parse(script.scene_breakdown)).toHaveLength(2);
    });
  });

  describe('getVersions', () => {
    it('should return all versions for a post ordered by version number', async () => {
      // Create multiple versions
      await versionManager.createVersion(testPostId, mockGeneratedScript);
      await versionManager.createVersion(testPostId, {
        ...mockGeneratedScript,
        scriptContent: 'Version 2 content',
      });
      await versionManager.createVersion(testPostId, {
        ...mockGeneratedScript,
        scriptContent: 'Version 3 content',
      });

      const versions = await versionManager.getVersions(testPostId);

      expect(versions).toHaveLength(3);
      expect(versions[0].version_number).toBe(3); // Newest first
      expect(versions[1].version_number).toBe(2);
      expect(versions[2].version_number).toBe(1);
      expect(versions[0].is_active).toBe(true);
      expect(versions[1].is_active).toBe(false);
      expect(versions[2].is_active).toBe(false);
    });

    it('should return empty array for post with no versions', async () => {
      const versions = await versionManager.getVersions('non-existent-post');
      expect(versions).toHaveLength(0);
    });
  });

  describe('getActiveVersion', () => {
    it('should return the active version for a post', async () => {
      await versionManager.createVersion(testPostId, mockGeneratedScript);
      await versionManager.createVersion(testPostId, {
        ...mockGeneratedScript,
        scriptContent: 'Version 2 content',
      });

      const activeVersion = await versionManager.getActiveVersion(testPostId);

      expect(activeVersion).toBeDefined();
      expect(activeVersion?.version_number).toBe(2);
      expect(activeVersion?.is_active).toBe(true);
      expect(activeVersion?.script_content).toBe('Version 2 content');
    });

    it('should return null for post with no versions', async () => {
      const activeVersion =
        await versionManager.getActiveVersion('non-existent-post');
      expect(activeVersion).toBeNull();
    });
  });

  describe('getVersion', () => {
    it('should return specific version by number', async () => {
      await versionManager.createVersion(testPostId, mockGeneratedScript);
      await versionManager.createVersion(testPostId, {
        ...mockGeneratedScript,
        scriptContent: 'Version 2 content',
      });

      const version1 = await versionManager.getVersion(testPostId, 1);
      const version2 = await versionManager.getVersion(testPostId, 2);

      expect(version1?.version_number).toBe(1);
      expect(version1?.script_content).toBe(mockGeneratedScript.scriptContent);
      expect(version2?.version_number).toBe(2);
      expect(version2?.script_content).toBe('Version 2 content');
    });

    it('should return null for non-existent version', async () => {
      const version = await versionManager.getVersion(testPostId, 999);
      expect(version).toBeNull();
    });
  });

  describe('revertToVersion', () => {
    it('should revert to previous version and update main script', async () => {
      // Create two versions
      await versionManager.createVersion(testPostId, mockGeneratedScript);
      await versionManager.createVersion(testPostId, {
        ...mockGeneratedScript,
        scriptContent: 'Version 2 content',
      });

      // Revert to version 1
      const revertedVersion = await versionManager.revertToVersion(
        testPostId,
        1
      );

      expect(revertedVersion.version_number).toBe(1);
      expect(revertedVersion.is_active).toBe(true);

      // Check that version 2 is no longer active
      const version2 = await versionManager.getVersion(testPostId, 2);
      expect(version2?.is_active).toBe(false);

      // Check main script table is updated
      const script = db.get<any>(
        'SELECT * FROM video_scripts WHERE post_id = ?',
        [testPostId]
      );
      expect(script.version).toBe(1);
      expect(script.script_content).toBe(mockGeneratedScript.scriptContent);
    });

    it('should throw error when reverting to non-existent version', async () => {
      await versionManager.createVersion(testPostId, mockGeneratedScript);

      await expect(
        versionManager.revertToVersion(testPostId, 999)
      ).rejects.toThrow('Version 999 not found for post test-post-123');
    });
  });

  describe('updateQualityScore', () => {
    it('should update quality score for version and main script if active', async () => {
      const version = await versionManager.createVersion(
        testPostId,
        mockGeneratedScript
      );

      await versionManager.updateQualityScore(version.id, 85);

      const updatedVersion = await versionManager.getVersion(testPostId, 1);
      expect(updatedVersion?.quality_score).toBe(85);

      // Check main script table
      const script = db.get<any>(
        'SELECT quality_score FROM video_scripts WHERE post_id = ?',
        [testPostId]
      );
      expect(script.quality_score).toBe(85);
    });

    it('should not update main script table for inactive version', async () => {
      const version1 = await versionManager.createVersion(
        testPostId,
        mockGeneratedScript
      );
      await versionManager.createVersion(testPostId, {
        ...mockGeneratedScript,
        scriptContent: 'Version 2',
      });

      // Update inactive version 1
      await versionManager.updateQualityScore(version1.id, 75);

      // Main script should still have no quality score
      const script = db.get<any>(
        'SELECT quality_score FROM video_scripts WHERE post_id = ?',
        [testPostId]
      );
      expect(script.quality_score).toBeNull();
    });
  });

  describe('cleanupOldVersions', () => {
    it('should keep specified number of newest versions', async () => {
      // Create 7 versions
      for (let i = 1; i <= 7; i++) {
        await versionManager.createVersion(testPostId, {
          ...mockGeneratedScript,
          scriptContent: `Version ${i} content`,
        });
      }

      // Keep only 3 versions
      const deletedCount = await versionManager.cleanupOldVersions(
        testPostId,
        3
      );

      expect(deletedCount).toBe(4); // 7 - 3 = 4 deleted

      const remainingVersions = await versionManager.getVersions(testPostId);
      expect(remainingVersions).toHaveLength(3);
      expect(remainingVersions[0].version_number).toBe(7); // Newest
      expect(remainingVersions[1].version_number).toBe(6);
      expect(remainingVersions[2].version_number).toBe(5);
    });

    it('should not delete versions when count is within limit', async () => {
      await versionManager.createVersion(testPostId, mockGeneratedScript);

      const deletedCount = await versionManager.cleanupOldVersions(
        testPostId,
        5
      );

      expect(deletedCount).toBe(0);
    });
  });

  describe('compareVersions', () => {
    it('should identify differences between versions', async () => {
      await versionManager.createVersion(testPostId, mockGeneratedScript);
      await versionManager.createVersion(testPostId, {
        ...mockGeneratedScript,
        scriptContent: 'Different content',
        durationEstimate: 60,
        titles: [
          'Different Title 1',
          'Different Title 2',
          'Different Title 3',
          'Different Title 4',
          'Different Title 5',
        ],
      });

      const comparison = await versionManager.compareVersions(testPostId, 1, 2);

      expect(comparison.version1.version_number).toBe(1);
      expect(comparison.version2.version_number).toBe(2);
      expect(comparison.differences.content_changed).toBe(true);
      expect(comparison.differences.duration_changed).toBe(true);
      expect(comparison.differences.titles_changed).toBe(true);
      expect(comparison.differences.scene_count_changed).toBe(false);
    });

    it('should throw error for non-existent versions', async () => {
      await expect(
        versionManager.compareVersions(testPostId, 1, 2)
      ).rejects.toThrow('One or both versions not found');
    });
  });

  describe('database constraints', () => {
    it('should enforce unique version numbers per post', async () => {
      await versionManager.createVersion(testPostId, mockGeneratedScript);

      // Try to manually insert duplicate version number
      expect(() => {
        db.run(
          `
          INSERT INTO script_versions (
            id, post_id, version_number, script_content, scene_breakdown,
            duration_target, titles, description, thumbnail_suggestions,
            generation_params, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            'duplicate-id',
            testPostId,
            1, // Duplicate version number
            'content',
            '[]',
            60,
            '[]',
            'description',
            '[]',
            '{}',
            false,
          ]
        );
      }).toThrow(); // Should violate unique constraint
    });
  });
});
