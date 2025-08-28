import { DatabaseService } from './database';
import {
  ScriptVersion,
  GenerationQueueJob,
  VideoScript,
  SceneData as SharedSceneData,
  ThumbnailConcept as SharedThumbnailConcept,
} from '@video-automation/shared-types';
import {
  GeneratedScript,
  SceneData as ClaudeSceneData,
  ThumbnailConcept as ClaudeThumbnailConcept,
} from './claude-code/types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export class ScriptVersionManager {
  constructor(private db: DatabaseService) {}

  /**
   * Convert Claude Code SceneData to Shared SceneData
   */
  private convertSceneData(claudeScenes: ClaudeSceneData[]): SharedSceneData[] {
    return claudeScenes.map(scene => ({
      scene_number: scene.id,
      content: scene.narration,
      keywords: scene.visualKeywords,
      duration_estimate: scene.duration,
      emotional_tone:
        scene.emotion === 'inspiring'
          ? 'motivational'
          : scene.emotion === 'dramatic'
            ? 'urgent'
            : 'contemplative',
    }));
  }

  /**
   * Convert Claude Code ThumbnailConcept to Shared ThumbnailConcept
   */
  private convertThumbnailConcepts(
    claudeConcepts: ClaudeThumbnailConcept[]
  ): SharedThumbnailConcept[] {
    return claudeConcepts.map(concept => ({
      text_overlay: concept.textOverlay || '',
      emotional_style: concept.colorScheme,
      visual_theme: concept.description,
    }));
  }

  /**
   * Create a new script version from a GeneratedScript
   */
  async createVersion(
    postId: string,
    generatedScript: GeneratedScript,
    generationDuration?: number
  ): Promise<ScriptVersion> {
    return this.db.transaction(() => {
      // Get the next version number
      const lastVersion = this.db.get<{ version_number: number }>(
        'SELECT version_number FROM script_versions WHERE post_id = ? ORDER BY version_number DESC LIMIT 1',
        [postId]
      );

      const versionNumber = (lastVersion?.version_number ?? 0) + 1;
      const versionId = uuidv4();

      // Deactivate all previous versions
      this.db.run(
        'UPDATE script_versions SET is_active = 0 WHERE post_id = ?',
        [postId]
      );

      // Create new version
      const version: ScriptVersion = {
        id: versionId,
        post_id: postId,
        version_number: versionNumber,
        script_content: generatedScript.scriptContent,
        scene_breakdown: this.convertSceneData(generatedScript.sceneBreakdown),
        duration_target: generatedScript.durationEstimate,
        titles: generatedScript.titles,
        description: generatedScript.description,
        thumbnail_suggestions: this.convertThumbnailConcepts(
          generatedScript.thumbnailConcepts
        ),
        generation_params: generatedScript.generationParams,
        quality_score: undefined, // To be set by validation
        claude_model: 'claude-sonnet-4', // Current model
        prompt_version: '1.0',
        generation_duration: generationDuration,
        created_at: new Date(),
        is_active: true,
      };

      // Insert version record
      this.db.run(
        `
        INSERT INTO script_versions (
          id, post_id, version_number, script_content, scene_breakdown,
          duration_target, titles, description, thumbnail_suggestions,
          generation_params, claude_model, prompt_version, generation_duration,
          created_at, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          version.id,
          version.post_id,
          version.version_number,
          version.script_content,
          JSON.stringify(version.scene_breakdown),
          version.duration_target,
          JSON.stringify(version.titles),
          version.description,
          JSON.stringify(version.thumbnail_suggestions),
          JSON.stringify(version.generation_params),
          version.claude_model,
          version.prompt_version,
          version.generation_duration,
          version.created_at.toISOString(),
          version.is_active ? 1 : 0,
        ]
      );

      // Update or create the main video_scripts record
      const existingScript = this.db.get<{ id: string }>(
        'SELECT id FROM video_scripts WHERE post_id = ?',
        [postId]
      );

      if (existingScript) {
        // Update existing script
        this.db.run(
          `
          UPDATE video_scripts SET
            script_content = ?,
            scene_breakdown = ?,
            duration_target = ?,
            titles = ?,
            description = ?,
            thumbnail_suggestions = ?,
            version = ?,
            generated_at = ?
          WHERE post_id = ?
        `,
          [
            version.script_content,
            JSON.stringify(version.scene_breakdown),
            version.duration_target,
            JSON.stringify(version.titles),
            version.description,
            JSON.stringify(version.thumbnail_suggestions),
            version.version_number,
            version.created_at.toISOString(),
            postId,
          ]
        );
      } else {
        // Create new script record
        const scriptId = uuidv4();
        this.db.run(
          `
          INSERT INTO video_scripts (
            id, post_id, script_content, scene_breakdown, duration_target,
            titles, description, thumbnail_suggestions, version, approved,
            generated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            scriptId,
            postId,
            version.script_content,
            JSON.stringify(version.scene_breakdown),
            version.duration_target,
            JSON.stringify(version.titles),
            version.description,
            JSON.stringify(version.thumbnail_suggestions),
            version.version_number,
            0, // false as 0
            version.created_at.toISOString(),
          ]
        );
      }

      logger.info('Created new script version', {
        postId,
        versionNumber,
        versionId,
        duration: generationDuration,
      });

      return version;
    });
  }

  /**
   * Get all versions for a post
   */
  async getVersions(postId: string): Promise<ScriptVersion[]> {
    const versions = this.db.all<any>(
      `SELECT * FROM script_versions 
       WHERE post_id = ? 
       ORDER BY version_number DESC`,
      [postId]
    );

    return versions.map(this.mapRowToVersion);
  }

  /**
   * Get active version for a post
   */
  async getActiveVersion(postId: string): Promise<ScriptVersion | null> {
    const version = this.db.get<any>(
      `SELECT * FROM script_versions 
       WHERE post_id = ? AND is_active = 1`,
      [postId]
    );

    return version ? this.mapRowToVersion(version) : null;
  }

  /**
   * Get specific version by number
   */
  async getVersion(
    postId: string,
    versionNumber: number
  ): Promise<ScriptVersion | null> {
    const version = this.db.get<any>(
      `SELECT * FROM script_versions 
       WHERE post_id = ? AND version_number = ?`,
      [postId, versionNumber]
    );

    return version ? this.mapRowToVersion(version) : null;
  }

  /**
   * Revert to a previous version
   */
  async revertToVersion(
    postId: string,
    versionNumber: number
  ): Promise<ScriptVersion> {
    return this.db.transaction(() => {
      const targetVersion = this.db.get<any>(
        `SELECT * FROM script_versions 
         WHERE post_id = ? AND version_number = ?`,
        [postId, versionNumber]
      );

      if (!targetVersion) {
        throw new Error(
          `Version ${versionNumber} not found for post ${postId}`
        );
      }

      // Deactivate all versions
      this.db.run(
        'UPDATE script_versions SET is_active = 0 WHERE post_id = ?',
        [postId]
      );

      // Activate target version
      this.db.run('UPDATE script_versions SET is_active = 1 WHERE id = ?', [
        targetVersion.id,
      ]);

      // Update main video_scripts table
      this.db.run(
        `
        UPDATE video_scripts SET
          script_content = ?,
          scene_breakdown = ?,
          duration_target = ?,
          titles = ?,
          description = ?,
          thumbnail_suggestions = ?,
          version = ?
        WHERE post_id = ?
      `,
        [
          targetVersion.script_content,
          targetVersion.scene_breakdown,
          targetVersion.duration_target,
          targetVersion.titles,
          targetVersion.description,
          targetVersion.thumbnail_suggestions,
          targetVersion.version_number,
          postId,
        ]
      );

      logger.info('Reverted to script version', {
        postId,
        versionNumber,
        versionId: targetVersion.id,
      });

      // Re-fetch the updated version to get the correct is_active status
      const updatedVersion = this.db.get<any>(
        `SELECT * FROM script_versions WHERE id = ?`,
        [targetVersion.id]
      );

      return this.mapRowToVersion(updatedVersion);
    });
  }

  /**
   * Update version quality score
   */
  async updateQualityScore(
    versionId: string,
    qualityScore: number
  ): Promise<void> {
    this.db.run('UPDATE script_versions SET quality_score = ? WHERE id = ?', [
      qualityScore,
      versionId,
    ]);

    // Also update main video_scripts table if this is the active version
    const version = this.db.get<any>(
      'SELECT post_id FROM script_versions WHERE id = ? AND is_active = 1',
      [versionId]
    );

    if (version) {
      this.db.run(
        'UPDATE video_scripts SET quality_score = ? WHERE post_id = ?',
        [qualityScore, version.post_id]
      );
    }

    logger.info('Updated version quality score', { versionId, qualityScore });
  }

  /**
   * Delete old versions beyond the keep limit (default 5)
   */
  async cleanupOldVersions(
    postId: string,
    keepCount: number = 5
  ): Promise<number> {
    const deletedCount = this.db.run(
      `
      DELETE FROM script_versions 
      WHERE post_id = ? AND id NOT IN (
        SELECT id FROM script_versions 
        WHERE post_id = ? 
        ORDER BY version_number DESC 
        LIMIT ?
      )
    `,
      [postId, postId, keepCount]
    ).changes;

    if (deletedCount > 0) {
      logger.info('Cleaned up old script versions', {
        postId,
        deletedCount,
        keepCount,
      });
    }

    return deletedCount;
  }

  /**
   * Get version comparison data
   */
  async compareVersions(
    postId: string,
    version1: number,
    version2: number
  ): Promise<{
    version1: ScriptVersion;
    version2: ScriptVersion;
    differences: {
      content_changed: boolean;
      scene_count_changed: boolean;
      duration_changed: boolean;
      titles_changed: boolean;
    };
  }> {
    const v1 = await this.getVersion(postId, version1);
    const v2 = await this.getVersion(postId, version2);

    if (!v1 || !v2) {
      throw new Error('One or both versions not found');
    }

    const differences = {
      content_changed: v1.script_content !== v2.script_content,
      scene_count_changed:
        v1.scene_breakdown.length !== v2.scene_breakdown.length,
      duration_changed: v1.duration_target !== v2.duration_target,
      titles_changed: JSON.stringify(v1.titles) !== JSON.stringify(v2.titles),
    };

    return { version1: v1, version2: v2, differences };
  }

  /**
   * Map database row to ScriptVersion object
   */
  private mapRowToVersion(row: any): ScriptVersion {
    return {
      id: row.id,
      post_id: row.post_id,
      version_number: row.version_number,
      script_content: row.script_content,
      scene_breakdown: JSON.parse(row.scene_breakdown),
      duration_target: row.duration_target,
      titles: JSON.parse(row.titles),
      description: row.description,
      thumbnail_suggestions: JSON.parse(row.thumbnail_suggestions),
      generation_params: JSON.parse(row.generation_params),
      quality_score: row.quality_score,
      claude_model: row.claude_model,
      prompt_version: row.prompt_version,
      generation_duration: row.generation_duration,
      created_at: new Date(row.created_at),
      is_active: Boolean(row.is_active), // Convert 0/1 to boolean
    };
  }
}
