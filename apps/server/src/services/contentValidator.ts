import { logger } from '../utils/logger';
import {
  VideoScript,
  SceneData,
  ThumbnailConcept,
} from '@video-automation/shared-types';
import { GeneratedScript } from './claude-code/types';

interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  suggestions: string[];
  details: ValidationDetails;
}

interface ValidationIssue {
  type: 'error' | 'warning';
  field: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
}

interface ValidationDetails {
  structureScore: number;
  contentScore: number;
  metadataScore: number;
  engagementScore: number;
  technicalScore: number;
}

interface ValidationThresholds {
  minimumScore: number;
  criticalFields: string[];
  minSceneCount: number;
  maxSceneCount: number;
  minSceneDuration: number;
  maxSceneDuration: number;
  minTotalDuration: number;
  maxTotalDuration: number;
  minTitleCount: number;
  minDescriptionLength: number;
  maxDescriptionLength: number;
}

export class ContentValidator {
  private readonly thresholds: ValidationThresholds = {
    minimumScore: 70,
    criticalFields: [
      'scriptContent',
      'sceneBreakdown',
      'titles',
      'description',
      'durationEstimate',
    ],
    minSceneCount: 3,
    maxSceneCount: 7,
    minSceneDuration: 10,
    maxSceneDuration: 30,
    minTotalDuration: 30,
    maxTotalDuration: 180,
    minTitleCount: 3,
    minDescriptionLength: 100,
    maxDescriptionLength: 5000,
  };

  /**
   * Validate a generated script
   */
  async validateScript(script: GeneratedScript): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];

    // Perform validation checks
    const structureScore = this.validateStructure(script, issues, suggestions);
    const contentScore = this.validateContent(script, issues, suggestions);
    const metadataScore = this.validateMetadata(script, issues, suggestions);
    const engagementScore = this.calculateEngagementScore(script, suggestions);
    const technicalScore = this.validateTechnical(script, issues, suggestions);

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      structureScore * 0.25 +
        contentScore * 0.25 +
        metadataScore * 0.2 +
        engagementScore * 0.15 +
        technicalScore * 0.15
    );

    const isValid =
      overallScore >= this.thresholds.minimumScore &&
      !issues.some(issue => issue.severity === 'critical');

    const result: ValidationResult = {
      isValid,
      score: overallScore,
      issues,
      suggestions,
      details: {
        structureScore,
        contentScore,
        metadataScore,
        engagementScore,
        technicalScore,
      },
    };

    logger.info('Script validation completed', {
      score: overallScore,
      isValid,
      issueCount: issues.length,
    });

    return result;
  }

  /**
   * Validate script structure
   */
  private validateStructure(
    script: GeneratedScript,
    issues: ValidationIssue[],
    suggestions: string[]
  ): number {
    let score = 100;

    // Check critical fields existence
    for (const field of this.thresholds.criticalFields) {
      if (!script[field as keyof GeneratedScript]) {
        issues.push({
          type: 'error',
          field,
          message: `Missing required field: ${field}`,
          severity: 'critical',
        });
        score -= 20;
      }
    }

    // Validate scene count
    const sceneCount = script.sceneBreakdown?.length || 0;
    if (sceneCount < this.thresholds.minSceneCount) {
      issues.push({
        type: 'error',
        field: 'sceneBreakdown',
        message: `Too few scenes: ${sceneCount} (minimum: ${this.thresholds.minSceneCount})`,
        severity: 'major',
      });
      score -= 15;
      suggestions.push(
        `Add ${this.thresholds.minSceneCount - sceneCount} more scenes for better pacing`
      );
    } else if (sceneCount > this.thresholds.maxSceneCount) {
      issues.push({
        type: 'warning',
        field: 'sceneBreakdown',
        message: `Too many scenes: ${sceneCount} (maximum: ${this.thresholds.maxSceneCount})`,
        severity: 'minor',
      });
      score -= 10;
      suggestions.push('Consider consolidating scenes for better flow');
    }

    // Validate scene structure
    if (script.sceneBreakdown) {
      script.sceneBreakdown.forEach((scene, index) => {
        if (!scene.narration || scene.narration.trim().length < 20) {
          issues.push({
            type: 'error',
            field: `scene_${index + 1}`,
            message: `Scene ${index + 1} has insufficient narration`,
            severity: 'major',
          });
          score -= 10;
        }

        if (!scene.visualKeywords || scene.visualKeywords.length === 0) {
          issues.push({
            type: 'warning',
            field: `scene_${index + 1}_keywords`,
            message: `Scene ${index + 1} lacks visual keywords`,
            severity: 'minor',
          });
          score -= 5;
        }

        // Check scene duration
        if (scene.duration < this.thresholds.minSceneDuration) {
          issues.push({
            type: 'warning',
            field: `scene_${index + 1}_duration`,
            message: `Scene ${index + 1} is too short (${scene.duration}s)`,
            severity: 'minor',
          });
          score -= 5;
        } else if (scene.duration > this.thresholds.maxSceneDuration) {
          issues.push({
            type: 'warning',
            field: `scene_${index + 1}_duration`,
            message: `Scene ${index + 1} is too long (${scene.duration}s)`,
            severity: 'minor',
          });
          score -= 5;
        }
      });
    }

    return Math.max(0, score);
  }

  /**
   * Validate content quality
   */
  private validateContent(
    script: GeneratedScript,
    issues: ValidationIssue[],
    suggestions: string[]
  ): number {
    let score = 100;

    // Check script content
    if (!script.scriptContent || script.scriptContent.trim().length < 100) {
      issues.push({
        type: 'error',
        field: 'scriptContent',
        message: 'Script content is too short',
        severity: 'critical',
      });
      score -= 30;
    }

    // Check for repetitive content
    if (script.scriptContent) {
      const sentences = script.scriptContent.split(/[.!?]+/);
      const uniqueSentences = new Set(
        sentences.map(s => s.trim().toLowerCase())
      );
      const repetitionRatio = uniqueSentences.size / sentences.length;

      if (repetitionRatio < 0.8) {
        issues.push({
          type: 'warning',
          field: 'scriptContent',
          message: 'Script contains repetitive content',
          severity: 'minor',
        });
        score -= 10;
        suggestions.push('Vary the language to avoid repetition');
      }
    }

    // Check content coherence
    if (script.sceneBreakdown && script.sceneBreakdown.length > 1) {
      const hasTransitions = script.sceneBreakdown.every((scene, index) => {
        if (index === 0) {
          return true;
        }
        // Check if scenes flow logically (basic check)
        return scene.narration && scene.narration.length > 0;
      });

      if (!hasTransitions) {
        issues.push({
          type: 'warning',
          field: 'sceneBreakdown',
          message: 'Scenes lack smooth transitions',
          severity: 'minor',
        });
        score -= 10;
        suggestions.push('Add transitional phrases between scenes');
      }
    }

    // Check for engagement elements
    const engagementKeywords = [
      'imagine',
      'think about',
      'consider',
      'what if',
      'have you ever',
      "let's",
      'discover',
      'explore',
      'amazing',
      'incredible',
    ];

    const hasEngagement = engagementKeywords.some(keyword =>
      script.scriptContent?.toLowerCase().includes(keyword)
    );

    if (!hasEngagement) {
      suggestions.push('Add engagement hooks to capture viewer attention');
      score -= 5;
    }

    return Math.max(0, score);
  }

  /**
   * Validate metadata
   */
  private validateMetadata(
    script: GeneratedScript,
    issues: ValidationIssue[],
    suggestions: string[]
  ): number {
    let score = 100;

    // Validate titles
    if (
      !script.titles ||
      script.titles.length < this.thresholds.minTitleCount
    ) {
      issues.push({
        type: 'error',
        field: 'titles',
        message: `Insufficient title variations (minimum: ${this.thresholds.minTitleCount})`,
        severity: 'major',
      });
      score -= 20;
    } else {
      // Check title quality
      script.titles.forEach((title, index) => {
        if (title.length < 10 || title.length > 100) {
          issues.push({
            type: 'warning',
            field: `title_${index + 1}`,
            message: `Title ${index + 1} length is suboptimal`,
            severity: 'minor',
          });
          score -= 5;
        }

        // Check for clickbait elements (good for YouTube)
        const clickbaitElements = [
          'how',
          'why',
          'what',
          'best',
          'top',
          'secret',
          'amazing',
        ];
        const hasClickbait = clickbaitElements.some(element =>
          title.toLowerCase().includes(element)
        );

        if (!hasClickbait && index === 0) {
          suggestions.push(
            `Consider adding engaging words to title: "${title}"`
          );
        }
      });
    }

    // Validate description
    if (!script.description) {
      issues.push({
        type: 'error',
        field: 'description',
        message: 'Missing video description',
        severity: 'major',
      });
      score -= 20;
    } else if (
      script.description.length < this.thresholds.minDescriptionLength
    ) {
      issues.push({
        type: 'warning',
        field: 'description',
        message: 'Description is too short for SEO',
        severity: 'minor',
      });
      score -= 10;
      suggestions.push('Expand description with keywords and timestamps');
    } else if (
      script.description.length > this.thresholds.maxDescriptionLength
    ) {
      issues.push({
        type: 'warning',
        field: 'description',
        message: 'Description exceeds recommended length',
        severity: 'minor',
      });
      score -= 5;
    }

    // Check for hashtags in description
    const hashtagCount = (script.description?.match(/#\w+/g) || []).length;
    if (hashtagCount < 3) {
      suggestions.push('Add relevant hashtags to improve discoverability');
      score -= 5;
    } else if (hashtagCount > 30) {
      issues.push({
        type: 'warning',
        field: 'description',
        message: 'Too many hashtags',
        severity: 'minor',
      });
      score -= 5;
    }

    // Validate thumbnail concepts
    if (!script.thumbnailConcepts || script.thumbnailConcepts.length === 0) {
      issues.push({
        type: 'warning',
        field: 'thumbnailConcepts',
        message: 'No thumbnail concepts provided',
        severity: 'minor',
      });
      score -= 10;
      suggestions.push('Generate thumbnail concepts for better visual appeal');
    }

    return Math.max(0, score);
  }

  /**
   * Calculate engagement potential score
   */
  private calculateEngagementScore(
    script: GeneratedScript,
    suggestions: string[]
  ): number {
    let score = 70; // Base score

    // Check for hook in opening
    if (script.sceneBreakdown && script.sceneBreakdown[0]) {
      const firstScene = script.sceneBreakdown[0].narration;
      const hasHook = /^(did you know|imagine|what if|have you ever)/i.test(
        firstScene
      );

      if (hasHook) {
        score += 10;
      } else {
        suggestions.push('Add a strong hook in the opening scene');
      }
    }

    // Check for call-to-action
    const hasCTA =
      script.scriptContent?.toLowerCase().includes('subscribe') ||
      script.scriptContent?.toLowerCase().includes('like') ||
      script.scriptContent?.toLowerCase().includes('comment') ||
      script.scriptContent?.toLowerCase().includes('share');

    if (hasCTA) {
      score += 10;
    } else {
      suggestions.push('Include a call-to-action for viewer engagement');
    }

    // Check emotional variety in scenes
    if (script.sceneBreakdown && script.sceneBreakdown.length > 2) {
      const emotions = new Set(script.sceneBreakdown.map(s => s.emotion));
      if (emotions.size > 1) {
        score += 10; // Variety in emotional tones
      } else {
        suggestions.push(
          'Vary emotional tones across scenes for better engagement'
        );
      }
    }

    return Math.min(100, score);
  }

  /**
   * Validate technical aspects
   */
  private validateTechnical(
    script: GeneratedScript,
    issues: ValidationIssue[],
    suggestions: string[]
  ): number {
    let score = 100;

    // Validate total duration
    const totalDuration = script.durationEstimate || 0;

    if (totalDuration < this.thresholds.minTotalDuration) {
      issues.push({
        type: 'error',
        field: 'durationEstimate',
        message: `Video too short: ${totalDuration}s (minimum: ${this.thresholds.minTotalDuration}s)`,
        severity: 'major',
      });
      score -= 20;
    } else if (totalDuration > this.thresholds.maxTotalDuration) {
      issues.push({
        type: 'warning',
        field: 'durationEstimate',
        message: `Video too long: ${totalDuration}s (maximum: ${this.thresholds.maxTotalDuration}s)`,
        severity: 'minor',
      });
      score -= 10;
      suggestions.push('Consider splitting into multiple videos');
    }

    // Validate scene duration sum matches total
    if (script.sceneBreakdown) {
      const sceneDurationSum = script.sceneBreakdown.reduce(
        (sum, scene) => sum + (scene.duration || 0),
        0
      );

      const durationMismatch = Math.abs(sceneDurationSum - totalDuration);
      if (durationMismatch > 5) {
        issues.push({
          type: 'warning',
          field: 'duration',
          message: `Scene durations don't match total: ${sceneDurationSum}s vs ${totalDuration}s`,
          severity: 'minor',
        });
        score -= 10;
      }
    }

    // Check keywords
    if (!script.keywords || script.keywords.length < 5) {
      issues.push({
        type: 'warning',
        field: 'keywords',
        message: 'Insufficient keywords for SEO',
        severity: 'minor',
      });
      score -= 10;
      suggestions.push('Add more relevant keywords for better discoverability');
    }

    // Validate generation parameters
    if (!script.generationParams) {
      issues.push({
        type: 'warning',
        field: 'generationParams',
        message: 'Missing generation parameters',
        severity: 'minor',
      });
      score -= 5;
    }

    return Math.max(0, score);
  }

  /**
   * Determine if script should be regenerated
   */
  shouldRegenerate(validationResult: ValidationResult): boolean {
    // Regenerate if score is below threshold or has critical issues
    return (
      validationResult.score < this.thresholds.minimumScore ||
      validationResult.issues.some(issue => issue.severity === 'critical')
    );
  }

  /**
   * Get improvement suggestions for regeneration
   */
  getRegenerationHints(validationResult: ValidationResult): {
    focusAreas: string[];
    parameters: Partial<{
      sceneCount: number;
      targetDuration: number;
      style: string;
    }>;
  } {
    const focusAreas: string[] = [];
    const parameters: any = {};

    // Analyze issues to determine focus areas
    const issuesByField = validationResult.issues.reduce(
      (acc, issue) => {
        const field = issue.field.split('_')[0];
        acc[field] = (acc[field] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Determine what needs improvement
    if (issuesByField['scene'] > 2) {
      focusAreas.push('scene structure and pacing');
      parameters.sceneCount = 4; // Default to optimal count
    }

    if (issuesByField['scriptContent']) {
      focusAreas.push('content quality and engagement');
    }

    if (issuesByField['titles'] || issuesByField['description']) {
      focusAreas.push('metadata and SEO optimization');
    }

    if (validationResult.details.engagementScore < 70) {
      focusAreas.push('viewer engagement and hooks');
      parameters.style = 'entertainment'; // More engaging style
    }

    // Add duration adjustment if needed
    const durationIssue = validationResult.issues.find(
      i => i.field === 'durationEstimate'
    );

    if (durationIssue) {
      if (durationIssue.message.includes('too short')) {
        parameters.targetDuration = this.thresholds.minTotalDuration + 15;
      } else if (durationIssue.message.includes('too long')) {
        parameters.targetDuration = this.thresholds.maxTotalDuration - 30;
      }
    }

    return {
      focusAreas,
      parameters,
    };
  }

  /**
   * Format validation report for logging/display
   */
  formatValidationReport(result: ValidationResult): string {
    const lines: string[] = [
      '=== Script Validation Report ===',
      `Overall Score: ${result.score}/100 (${result.isValid ? 'PASS' : 'FAIL'})`,
      '',
      'Score Breakdown:',
      `  Structure: ${result.details.structureScore}/100`,
      `  Content: ${result.details.contentScore}/100`,
      `  Metadata: ${result.details.metadataScore}/100`,
      `  Engagement: ${result.details.engagementScore}/100`,
      `  Technical: ${result.details.technicalScore}/100`,
      '',
    ];

    if (result.issues.length > 0) {
      lines.push(`Issues Found (${result.issues.length}):`);
      result.issues.forEach(issue => {
        const icon = issue.type === 'error' ? '❌' : '⚠️';
        lines.push(
          `  ${icon} [${issue.severity}] ${issue.field}: ${issue.message}`
        );
      });
      lines.push('');
    }

    if (result.suggestions.length > 0) {
      lines.push('Improvement Suggestions:');
      result.suggestions.forEach(suggestion => {
        lines.push(`  💡 ${suggestion}`);
      });
    }

    return lines.join('\n');
  }
}
