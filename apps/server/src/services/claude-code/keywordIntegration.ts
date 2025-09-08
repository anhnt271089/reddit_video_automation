/**
 * Keyword Integration Module
 * Sprint 005 - Story 1: Integration with existing script processing workflow
 *
 * Enhances existing SceneData with intelligent keyword extraction for optimized Pexels asset search.
 * Seamlessly integrates with the current script generation pipeline.
 */

import {
  IntelligentKeywordExtractor,
  KeywordExtractionResult,
} from './keywordExtractor';
import { SceneData, GeneratedScript } from './types';

export class ScriptKeywordEnhancer {
  private keywordExtractor: IntelligentKeywordExtractor;

  constructor() {
    this.keywordExtractor = new IntelligentKeywordExtractor();
  }

  /**
   * Enhance existing GeneratedScript with intelligent keyword extraction
   */
  public enhanceScriptWithKeywords(script: GeneratedScript): GeneratedScript {
    try {
      console.log('🔍 Enhancing script with intelligent keyword extraction...');

      const enhancedScenes = script.sceneBreakdown.map(scene =>
        this.enhanceSceneWithKeywords(scene)
      );

      const enhancedScript: GeneratedScript = {
        ...script,
        sceneBreakdown: enhancedScenes,
      };

      console.log('✅ Script enhancement completed successfully');
      return enhancedScript;
    } catch (error) {
      console.error('❌ Script enhancement failed:', error);
      // Return original script if enhancement fails - graceful degradation
      return script;
    }
  }

  /**
   * Enhance individual scene with keyword extraction
   */
  public enhanceSceneWithKeywords(scene: SceneData): SceneData {
    try {
      // Extract keywords from scene narration
      const keywordExtraction = this.keywordExtractor.extractFromSentence(
        scene.narration
      );

      // Combine with existing visual keywords for backward compatibility
      const combinedKeywords = this.combineWithExistingKeywords(
        scene.visualKeywords,
        keywordExtraction
      );

      const enhancedScene: SceneData = {
        ...scene,
        visualKeywords: combinedKeywords,
        keywordExtraction: keywordExtraction,
      };

      return enhancedScene;
    } catch (error) {
      console.error(
        `❌ Scene enhancement failed for scene ${scene.id}:`,
        error
      );
      // Return original scene if enhancement fails
      return scene;
    }
  }

  /**
   * Generate optimized search queries for Pexels API
   */
  public generatePexelsSearchQueries(scene: SceneData): string[] {
    const queries: string[] = [];

    if (!scene.keywordExtraction) {
      // Fallback to original visual keywords if no extraction data
      return scene.visualKeywords.slice(0, 5);
    }

    const extraction = scene.keywordExtraction;

    // Priority 1: Use search phrases (pre-optimized combinations)
    queries.push(...extraction.searchPhrases.slice(0, 3));

    // Priority 2: Primary keywords + visual concepts
    for (const primary of extraction.primaryKeywords.slice(0, 2)) {
      for (const visual of extraction.visualConcepts.slice(0, 2)) {
        if (primary !== visual) {
          queries.push(`${primary} ${visual}`);
        }
      }
    }

    // Priority 3: Emotional triggers + visual concepts for compelling content
    for (const emotional of extraction.emotionalTriggers.slice(0, 2)) {
      for (const visual of extraction.visualConcepts.slice(0, 2)) {
        queries.push(`${emotional} ${visual}`);
      }
    }

    // Priority 4: Individual high-confidence keywords
    if (extraction.confidence > 0.7) {
      queries.push(...extraction.primaryKeywords.slice(0, 3));
      queries.push(...extraction.visualConcepts.slice(0, 2));
    }

    // Remove duplicates and limit to reasonable number
    const uniqueQueries = [...new Set(queries)];
    return uniqueQueries.slice(0, 8);
  }

  /**
   * Get keyword extraction metrics for quality assessment
   */
  public getExtractionMetrics(script: GeneratedScript): {
    averageConfidence: number;
    totalKeywords: number;
    scenesWithHighConfidence: number;
    searchOptimizationScore: number;
  } {
    let totalConfidence = 0;
    let totalKeywords = 0;
    let highConfidenceScenes = 0;
    let validScenes = 0;

    for (const scene of script.sceneBreakdown) {
      if (scene.keywordExtraction) {
        validScenes++;
        totalConfidence += scene.keywordExtraction.confidence;
        totalKeywords +=
          scene.keywordExtraction.primaryKeywords.length +
          scene.keywordExtraction.visualConcepts.length;

        if (scene.keywordExtraction.confidence > 0.7) {
          highConfidenceScenes++;
        }
      }
    }

    const averageConfidence =
      validScenes > 0 ? totalConfidence / validScenes : 0;
    const searchOptimizationScore =
      validScenes > 0
        ? averageConfidence * 0.6 + (highConfidenceScenes / validScenes) * 0.4
        : 0;

    return {
      averageConfidence,
      totalKeywords,
      scenesWithHighConfidence: highConfidenceScenes,
      searchOptimizationScore,
    };
  }

  /**
   * Generate fallback keywords for low-confidence extractions
   */
  public generateFallbackKeywords(scene: SceneData): string[] {
    const fallbackKeywords: string[] = [];

    // Use emotion-based keywords
    switch (scene.emotion) {
      case 'inspiring':
        fallbackKeywords.push(
          'inspiration',
          'motivation',
          'success',
          'achievement'
        );
        break;
      case 'dramatic':
        fallbackKeywords.push('dramatic', 'intense', 'powerful', 'emotional');
        break;
      case 'educational':
        fallbackKeywords.push(
          'learning',
          'education',
          'knowledge',
          'information'
        );
        break;
      case 'humorous':
        fallbackKeywords.push('funny', 'humor', 'laughter', 'entertainment');
        break;
      case 'motivational':
        fallbackKeywords.push(
          'motivation',
          'determination',
          'goals',
          'progress'
        );
        break;
    }

    // Add generic visual concepts
    fallbackKeywords.push('people', 'lifestyle', 'modern', 'concept');

    return fallbackKeywords;
  }

  /**
   * Combine new keyword extraction with existing visual keywords
   */
  private combineWithExistingKeywords(
    existingKeywords: string[],
    extraction: KeywordExtractionResult
  ): string[] {
    const combinedSet = new Set<string>();

    // Add existing keywords (maintain backward compatibility)
    existingKeywords.forEach(keyword => combinedSet.add(keyword));

    // Add new primary keywords
    extraction.primaryKeywords.forEach(keyword => combinedSet.add(keyword));

    // Add visual concepts
    extraction.visualConcepts.forEach(keyword => combinedSet.add(keyword));

    // Add top emotional triggers (limited to maintain relevance)
    extraction.emotionalTriggers
      .slice(0, 2)
      .forEach(keyword => combinedSet.add(keyword));

    return Array.from(combinedSet);
  }

  /**
   * Validate keyword extraction quality
   */
  public validateKeywordQuality(extraction: KeywordExtractionResult): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (extraction.confidence < 0.3) {
      issues.push('Very low confidence score');
      suggestions.push('Consider using fallback keywords or manual review');
    }

    if (extraction.primaryKeywords.length === 0) {
      issues.push('No primary keywords extracted');
      suggestions.push('Review sentence structure and content relevance');
    }

    if (extraction.visualConcepts.length === 0) {
      suggestions.push(
        'Consider adding more visual descriptors to improve asset search'
      );
    }

    if (extraction.searchPhrases.length < 2) {
      suggestions.push(
        'Limited search phrase variations - may affect search coverage'
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
    };
  }
}

/**
 * Helper function to enhance existing scripts in the pipeline
 */
export function enhanceScriptWithIntelligentKeywords(
  script: GeneratedScript
): GeneratedScript {
  const enhancer = new ScriptKeywordEnhancer();
  return enhancer.enhanceScriptWithKeywords(script);
}

/**
 * Helper function to generate optimized Pexels search queries
 */
export function generateOptimizedPexelsQueries(scene: SceneData): string[] {
  const enhancer = new ScriptKeywordEnhancer();
  return enhancer.generatePexelsSearchQueries(scene);
}
