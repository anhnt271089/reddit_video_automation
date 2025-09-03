/**
 * Status Transition Service
 *
 * Implements state machine pattern for reddit post status transitions
 * with comprehensive validation, audit logging, and error handling.
 *
 * Features:
 * - State machine validation using PostStatusManager
 * - Automatic audit logging for all transitions
 * - Database transaction safety
 * - WebSocket event broadcasting for real-time updates
 * - Comprehensive error handling and validation
 */

import { DatabaseService } from './database.js';
import {
  PostStatusManager,
  UnifiedPostStatus,
} from '@video-automation/shared-types';
import { v4 as uuidv4 } from 'uuid';

export interface StatusTransitionRequest {
  postId: string;
  targetStatus: UnifiedPostStatus;
  triggerEvent: string; // 'api_call', 'script_generation', 'user_action', 'system_process'
  metadata?: Record<string, any>;
  userId?: string; // Optional user identifier for audit trail
}

export interface StatusTransitionResult {
  success: boolean;
  oldStatus?: UnifiedPostStatus;
  newStatus?: UnifiedPostStatus;
  auditLogId?: string;
  error?: string;
  validationErrors?: string[];
}

export interface StatusAuditEntry {
  id: string;
  postId: string;
  oldStatus: string;
  newStatus: string;
  triggerEvent: string;
  metadata?: string; // JSON serialized
  createdAt: string;
  createdBy?: string;
}

export class StatusTransitionService {
  private db: DatabaseService;

  constructor(database: DatabaseService) {
    this.db = database;
  }

  /**
   * Perform a validated status transition with full audit logging
   */
  async transitionStatus(
    request: StatusTransitionRequest
  ): Promise<StatusTransitionResult> {
    const { postId, targetStatus, triggerEvent, metadata, userId } = request;

    try {
      // Get current post status
      const currentPost = await this.getPostStatus(postId);
      if (!currentPost) {
        return {
          success: false,
          error: `Post with ID ${postId} not found`,
        };
      }

      const currentStatus = PostStatusManager.normalizeStatus(
        currentPost.status
      );

      // Validate transition using state machine
      const transitionResult = PostStatusManager.transition(
        currentStatus,
        targetStatus
      );
      if (!transitionResult.success) {
        return {
          success: false,
          error: transitionResult.error,
          oldStatus: currentStatus,
        };
      }

      // Perform database transaction
      const result = await this.executeTransition({
        postId,
        currentStatus,
        targetStatus,
        triggerEvent,
        metadata,
        userId,
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Status transition failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get valid next statuses for a post
   */
  async getValidTransitions(postId: string): Promise<UnifiedPostStatus[]> {
    const currentPost = await this.getPostStatus(postId);
    if (!currentPost) {
      return [];
    }

    const currentStatus = PostStatusManager.normalizeStatus(currentPost.status);
    return PostStatusManager.getAllowedTransitions(currentStatus);
  }

  /**
   * Bulk status update with validation - useful for batch operations
   */
  async batchTransitionStatus(
    requests: StatusTransitionRequest[]
  ): Promise<StatusTransitionResult[]> {
    const results: StatusTransitionResult[] = [];

    // Execute in transaction for atomicity
    return await this.db.transaction(async () => {
      for (const request of requests) {
        const result = await this.transitionStatus(request);
        results.push(result);

        // Stop on first failure to maintain consistency
        if (!result.success) {
          throw new Error(
            `Batch operation failed at post ${request.postId}: ${result.error}`
          );
        }
      }
      return results;
    });
  }

  /**
   * Get status history for a post
   */
  async getStatusHistory(
    postId: string,
    limit: number = 50
  ): Promise<StatusAuditEntry[]> {
    const query = `
      SELECT id, post_id, old_status, new_status, trigger_event, metadata, created_at, created_by
      FROM status_audit_log 
      WHERE post_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const stmt = this.db.getDatabase().prepare(query);
    const rows = stmt.all(postId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      postId: row.post_id,
      oldStatus: row.old_status,
      newStatus: row.new_status,
      triggerEvent: row.trigger_event,
      metadata: row.metadata,
      createdAt: row.created_at,
      createdBy: row.created_by,
    }));
  }

  /**
   * Get posts by status with pagination
   */
  async getPostsByStatus(
    status: UnifiedPostStatus,
    page: number = 1,
    limit: number = 50
  ): Promise<{ posts: any[]; total: number; hasMore: boolean }> {
    const offset = (page - 1) * limit;

    // Count total
    const countQuery = `SELECT COUNT(*) as count FROM reddit_posts WHERE status = ?`;
    const countStmt = this.db.getDatabase().prepare(countQuery);
    const countResult = countStmt.get(status) as { count: number };
    const total = countResult.count;

    // Get posts
    const query = `
      SELECT id, reddit_id, title, status, score, upvotes, comments, 
             created_date, discovered_at, updated_at
      FROM reddit_posts 
      WHERE status = ?
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const stmt = this.db.getDatabase().prepare(query);
    const posts = stmt.all(status, limit, offset);

    return {
      posts,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get status distribution statistics
   */
  async getStatusStatistics(): Promise<Record<UnifiedPostStatus, number>> {
    const query = `
      SELECT status, COUNT(*) as count 
      FROM reddit_posts 
      GROUP BY status
    `;

    const stmt = this.db.getDatabase().prepare(query);
    const results = stmt.all() as { status: string; count: number }[];

    const stats: Partial<Record<UnifiedPostStatus, number>> = {};

    for (const result of results) {
      const normalized = PostStatusManager.normalizeStatus(result.status);
      stats[normalized] = result.count;
    }

    // Ensure all statuses are represented
    const allStatuses: UnifiedPostStatus[] = [
      'discovered',
      'idea_selected',
      'script_generating',
      'script_generated',
      'script_approved',
      'script_generation_failed',
      'rejected',
      'assets_ready',
      'rendering',
      'completed',
      'failed',
    ];

    const completeStats: Record<UnifiedPostStatus, number> = {} as Record<
      UnifiedPostStatus,
      number
    >;
    for (const status of allStatuses) {
      completeStats[status] = stats[status] || 0;
    }

    return completeStats;
  }

  /**
   * Force status update (bypasses validation) - use with extreme caution
   */
  async forceStatusUpdate(
    postId: string,
    targetStatus: UnifiedPostStatus,
    reason: string,
    userId?: string
  ): Promise<StatusTransitionResult> {
    console.warn(
      `Force status update for post ${postId} to ${targetStatus}: ${reason}`
    );

    try {
      const currentPost = await this.getPostStatus(postId);
      if (!currentPost) {
        return {
          success: false,
          error: `Post with ID ${postId} not found`,
        };
      }

      const currentStatus = PostStatusManager.normalizeStatus(
        currentPost.status
      );

      const result = await this.executeTransition({
        postId,
        currentStatus,
        targetStatus,
        triggerEvent: 'force_update',
        metadata: { reason, forced: true },
        userId,
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Force status update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Private method to execute the actual database transition
   */
  private async executeTransition({
    postId,
    currentStatus,
    targetStatus,
    triggerEvent,
    metadata,
    userId,
  }: {
    postId: string;
    currentStatus: UnifiedPostStatus;
    targetStatus: UnifiedPostStatus;
    triggerEvent: string;
    metadata?: Record<string, any>;
    userId?: string;
  }): Promise<StatusTransitionResult> {
    return await this.db.transaction(async () => {
      // Update post status
      const updateQuery = `
        UPDATE reddit_posts 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      const updateStmt = this.db.getDatabase().prepare(updateQuery);
      const updateResult = updateStmt.run(targetStatus, postId);

      if (updateResult.changes === 0) {
        throw new Error(`Failed to update post ${postId} - no rows affected`);
      }

      // Create audit log entry (trigger will also create one, but this gives us control)
      const auditId = uuidv4();
      const auditQuery = `
        INSERT INTO status_audit_log (
          id, post_id, old_status, new_status, trigger_event, metadata, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const auditStmt = this.db.getDatabase().prepare(auditQuery);
      auditStmt.run(
        auditId,
        postId,
        currentStatus,
        targetStatus,
        triggerEvent,
        metadata ? JSON.stringify(metadata) : null,
        userId || null
      );

      return {
        success: true,
        oldStatus: currentStatus,
        newStatus: targetStatus,
        auditLogId: auditId,
      };
    });
  }

  /**
   * Get current post status from database
   */
  private async getPostStatus(
    postId: string
  ): Promise<{ id: string; status: string } | null> {
    const query = `SELECT id, status FROM reddit_posts WHERE id = ?`;
    const stmt = this.db.getDatabase().prepare(query);
    const result = stmt.get(postId) as
      | { id: string; status: string }
      | undefined;

    return result || null;
  }

  /**
   * Validate multiple post IDs exist
   */
  async validatePostsExist(
    postIds: string[]
  ): Promise<{ valid: string[]; invalid: string[] }> {
    if (postIds.length === 0) {
      return { valid: [], invalid: [] };
    }

    const placeholders = postIds.map(() => '?').join(',');
    const query = `SELECT id FROM reddit_posts WHERE id IN (${placeholders})`;

    const stmt = this.db.getDatabase().prepare(query);
    const results = stmt.all(...postIds) as { id: string }[];

    const validIds = results.map(r => r.id);
    const invalidIds = postIds.filter(id => !validIds.includes(id));

    return { valid: validIds, invalid: invalidIds };
  }

  /**
   * Get posts that are stuck in processing states for too long
   */
  async getStuckPosts(hoursStuck: number = 24): Promise<any[]> {
    const processingStatuses = ['script_generating', 'rendering'];
    const cutoffTime = new Date(
      Date.now() - hoursStuck * 60 * 60 * 1000
    ).toISOString();

    const placeholders = processingStatuses.map(() => '?').join(',');
    const query = `
      SELECT id, reddit_id, title, status, updated_at
      FROM reddit_posts 
      WHERE status IN (${placeholders})
      AND updated_at < ?
      ORDER BY updated_at ASC
    `;

    const stmt = this.db.getDatabase().prepare(query);
    return stmt.all(...processingStatuses, cutoffTime);
  }
}

export default StatusTransitionService;
