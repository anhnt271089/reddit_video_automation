/**
 * Unified Post Status Management Service
 *
 * Provides centralized status management with state machine pattern
 * for the Reddit-to-video automation pipeline.
 *
 * Critical Requirements:
 * - Unifies inconsistent status values across frontend/backend
 * - Implements state machine for valid transitions
 * - Supports progressive workflow UI requirements
 * - Provides validation and error handling
 */

// Unified Status Enum - Single source of truth
export type UnifiedPostStatus =
  | 'discovered' // Initial state when post is found
  | 'idea_selected' // Post approved for script generation
  | 'script_generating' // Script generation in progress (NEW)
  | 'script_generated' // Script generation completed
  | 'script_approved' // Script approved by user
  | 'script_generation_failed' // Script generation failed (NEW)
  | 'rejected' // Post rejected, will not be processed
  | 'assets_ready' // Assets gathered for video creation
  | 'rendering' // Video rendering in progress
  | 'completed' // Video completed successfully
  | 'failed'; // Pipeline failed

// Legacy status mapping for backward compatibility
export const LEGACY_STATUS_MAP: Record<string, UnifiedPostStatus> = {
  // Frontend legacy statuses
  approved: 'idea_selected',

  // Database legacy statuses
  idea: 'discovered',
  script_rejected: 'rejected',

  // Already unified
  discovered: 'discovered',
  idea_selected: 'idea_selected',
  script_generating: 'script_generating',
  script_generated: 'script_generated',
  script_approved: 'script_approved',
  script_generation_failed: 'script_generation_failed',
  rejected: 'rejected',
  assets_ready: 'assets_ready',
  rendering: 'rendering',
  completed: 'completed',
  failed: 'failed',
};

// Status categories for UI logic
export const STATUS_CATEGORIES = {
  INITIAL: ['discovered'] as const,
  APPROVED: ['idea_selected'] as const,
  GENERATING: ['script_generating'] as const,
  GENERATED: ['script_generated', 'script_approved'] as const,
  PROCESSING: ['assets_ready', 'rendering'] as const,
  FINAL: [
    'completed',
    'rejected',
    'failed',
    'script_generation_failed',
  ] as const,
};

// Valid state transitions (state machine definition)
export const VALID_TRANSITIONS: Record<UnifiedPostStatus, UnifiedPostStatus[]> =
  {
    discovered: ['idea_selected', 'rejected'],
    idea_selected: ['script_generating', 'rejected'],
    script_generating: ['script_generated', 'script_generation_failed'],
    script_generated: ['script_approved', 'rejected', 'script_generating'], // Allow regeneration
    script_approved: ['assets_ready', 'rejected'],
    script_generation_failed: ['script_generating', 'rejected'], // Allow retry
    rejected: [], // Terminal state
    assets_ready: ['rendering'],
    rendering: ['completed', 'failed'],
    completed: [], // Terminal state
    failed: ['assets_ready'], // Allow retry from assets
  };

// Progressive UI configuration - which buttons to show for each status
export const UI_BUTTON_CONFIG: Record<
  UnifiedPostStatus,
  {
    showApprove: boolean;
    showReject: boolean;
    showView: boolean;
    showGenerate: boolean;
    showViewScript: boolean;
    primaryAction?: string;
  }
> = {
  discovered: {
    showApprove: true,
    showReject: true,
    showView: true,
    showGenerate: false,
    showViewScript: false,
    primaryAction: 'Approve',
  },
  idea_selected: {
    showApprove: false,
    showReject: true,
    showView: true,
    showGenerate: true,
    showViewScript: false,
    primaryAction: 'Generate Script',
  },
  script_generating: {
    showApprove: false,
    showReject: true,
    showView: true,
    showGenerate: false,
    showViewScript: false,
    primaryAction: 'Generating Script...',
  },
  script_generated: {
    showApprove: false,
    showReject: true,
    showView: true,
    showGenerate: true, // Allow regeneration
    showViewScript: true,
    primaryAction: 'View Script Details',
  },
  script_approved: {
    showApprove: false,
    showReject: true,
    showView: true,
    showGenerate: false,
    showViewScript: true,
    primaryAction: 'Continue to Assets',
  },
  script_generation_failed: {
    showApprove: false,
    showReject: true,
    showView: true,
    showGenerate: true, // Allow retry
    showViewScript: false,
    primaryAction: 'Retry Generation',
  },
  rejected: {
    showApprove: false,
    showReject: false,
    showView: true,
    showGenerate: false,
    showViewScript: false,
  },
  assets_ready: {
    showApprove: false,
    showReject: true,
    showView: true,
    showGenerate: false,
    showViewScript: true,
    primaryAction: 'Start Rendering',
  },
  rendering: {
    showApprove: false,
    showReject: false,
    showView: true,
    showGenerate: false,
    showViewScript: true,
    primaryAction: 'Rendering...',
  },
  completed: {
    showApprove: false,
    showReject: false,
    showView: true,
    showGenerate: false,
    showViewScript: true,
    primaryAction: 'View Video',
  },
  failed: {
    showApprove: false,
    showReject: true,
    showView: true,
    showGenerate: false,
    showViewScript: true,
    primaryAction: 'Retry',
  },
};

/**
 * Post Status Manager Service
 * Centralized service for status operations with validation
 */
export class PostStatusManager {
  /**
   * Normalize legacy status to unified status
   */
  static normalizeStatus(status: string): UnifiedPostStatus {
    const normalized = LEGACY_STATUS_MAP[status];
    if (!normalized) {
      console.warn(`Unknown status "${status}", defaulting to 'discovered'`);
      return 'discovered';
    }
    return normalized;
  }

  /**
   * Validate if a status transition is allowed
   */
  static isValidTransition(
    from: UnifiedPostStatus,
    to: UnifiedPostStatus
  ): boolean {
    const allowedTransitions = VALID_TRANSITIONS[from];
    return allowedTransitions.includes(to);
  }

  /**
   * Get next allowed statuses from current status
   */
  static getAllowedTransitions(
    currentStatus: UnifiedPostStatus
  ): UnifiedPostStatus[] {
    return VALID_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Validate and perform status transition
   */
  static transition(
    currentStatus: string,
    targetStatus: string
  ): {
    success: boolean;
    newStatus?: UnifiedPostStatus;
    error?: string;
  } {
    const current = this.normalizeStatus(currentStatus);
    const target = this.normalizeStatus(targetStatus);

    if (!this.isValidTransition(current, target)) {
      return {
        success: false,
        error: `Invalid transition from "${current}" to "${target}". Allowed: [${this.getAllowedTransitions(current).join(', ')}]`,
      };
    }

    return {
      success: true,
      newStatus: target,
    };
  }

  /**
   * Get UI configuration for status
   */
  static getUIConfig(status: string) {
    const normalized = this.normalizeStatus(status);
    return UI_BUTTON_CONFIG[normalized];
  }

  /**
   * Check if status is in a specific category
   */
  static isInCategory(
    status: string,
    category: keyof typeof STATUS_CATEGORIES
  ): boolean {
    const normalized = this.normalizeStatus(status);
    return (
      STATUS_CATEGORIES[category] as readonly UnifiedPostStatus[]
    ).includes(normalized);
  }

  /**
   * Check if status represents a terminal state
   */
  static isTerminalStatus(status: string): boolean {
    const normalized = this.normalizeStatus(status);
    return VALID_TRANSITIONS[normalized].length === 0;
  }

  /**
   * Check if status represents an active processing state
   */
  static isProcessingStatus(status: string): boolean {
    return (
      this.isInCategory(status, 'GENERATING') ||
      this.isInCategory(status, 'PROCESSING')
    );
  }

  /**
   * Get user-friendly status display name
   */
  static getDisplayName(status: string): string {
    const normalized = this.normalizeStatus(status);
    const displayNames: Record<UnifiedPostStatus, string> = {
      discovered: 'New Post',
      idea_selected: 'Approved for Script',
      script_generating: 'Generating Script',
      script_generated: 'Script Ready',
      script_approved: 'Script Approved',
      script_generation_failed: 'Script Generation Failed',
      rejected: 'Rejected',
      assets_ready: 'Assets Ready',
      rendering: 'Rendering Video',
      completed: 'Video Complete',
      failed: 'Failed',
    };
    return displayNames[normalized] || normalized;
  }

  /**
   * Get status color/variant for UI theming
   */
  static getStatusVariant(
    status: string
  ): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    const normalized = this.normalizeStatus(status);

    if (this.isInCategory(status, 'INITIAL')) {
      return 'default';
    }
    if (this.isInCategory(status, 'APPROVED')) {
      return 'secondary';
    }
    if (
      this.isInCategory(status, 'GENERATING') ||
      this.isInCategory(status, 'PROCESSING')
    ) {
      return 'warning';
    }
    if (normalized === 'completed') {
      return 'success';
    }

    // Check if it's a terminal failure state
    const finalStatuses: UnifiedPostStatus[] = [
      'rejected',
      'failed',
      'script_generation_failed',
    ];
    if (finalStatuses.includes(normalized)) {
      return 'destructive';
    }

    return 'default';
  }
}

// Export unified status type and manager
export default PostStatusManager;
