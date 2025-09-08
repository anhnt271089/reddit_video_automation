/**
 * Integration Tests for Keyword Enhancement System
 * Sprint 005 - Story 1: Integration testing with existing workflow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ScriptKeywordEnhancer,
  enhanceScriptWithIntelligentKeywords,
  generateOptimizedPexelsQueries,
} from './keywordIntegration';
import { SceneData, GeneratedScript } from './types';

describe('ScriptKeywordEnhancer', () => {
  let enhancer: ScriptKeywordEnhancer;
  let mockScene: SceneData;
  let mockScript: GeneratedScript;

  beforeEach(() => {
    enhancer = new ScriptKeywordEnhancer();

    mockScene = {
      id: 1,
      narration:
        'The beautiful mountain landscape stretches across the horizon',
      duration: 5,
      visualKeywords: ['mountain', 'landscape'],
      emotion: 'inspiring',
    };

    mockScript = {
      scriptContent: 'A test script about overcoming challenges',
      sceneBreakdown: [mockScene],
      durationEstimate: 60,
      titles: ['Amazing Success Story'],
      description: 'A motivational video',
      thumbnailConcepts: [],
      keywords: ['success', 'motivation'],
      generationParams: {
        style: 'motivational',
        targetDuration: 60,
        sceneCount: 1,
      },
    };
  });

  describe('enhanceSceneWithKeywords', () => {
    it('should enhance scene with keyword extraction data', () => {
      const enhancedScene = enhancer.enhanceSceneWithKeywords(mockScene);

      expect(enhancedScene.keywordExtraction).toBeDefined();
      expect(enhancedScene.keywordExtraction!.primaryKeywords).toContain(
        'mountain'
      );
      expect(enhancedScene.keywordExtraction!.primaryKeywords).toContain(
        'landscape'
      );
      expect(enhancedScene.keywordExtraction!.emotionalTriggers).toContain(
        'beautiful'
      );
      expect(enhancedScene.keywordExtraction!.confidence).toBeGreaterThan(0.5);
    });

    it('should combine new keywords with existing visual keywords', () => {
      const enhancedScene = enhancer.enhanceSceneWithKeywords(mockScene);

      // Should contain original keywords
      expect(enhancedScene.visualKeywords).toContain('mountain');
      expect(enhancedScene.visualKeywords).toContain('landscape');

      // Should contain new keywords
      expect(enhancedScene.visualKeywords).toContain('beautiful');
      expect(enhancedScene.visualKeywords).toContain('horizon');
    });

    it('should handle empty or problematic narration gracefully', () => {
      const emptyScene: SceneData = {
        ...mockScene,
        narration: '',
      };

      const enhancedScene = enhancer.enhanceSceneWithKeywords(emptyScene);

      expect(enhancedScene.keywordExtraction).toBeDefined();
      expect(enhancedScene.keywordExtraction!.confidence).toBe(0);
      expect(enhancedScene.visualKeywords).toEqual(mockScene.visualKeywords); // Original preserved
    });
  });

  describe('enhanceScriptWithKeywords', () => {
    it('should enhance all scenes in the script', () => {
      const enhancedScript = enhancer.enhanceScriptWithKeywords(mockScript);

      expect(enhancedScript.sceneBreakdown).toHaveLength(1);
      expect(enhancedScript.sceneBreakdown[0].keywordExtraction).toBeDefined();
      expect(
        enhancedScript.sceneBreakdown[0].keywordExtraction!.primaryKeywords
          .length
      ).toBeGreaterThan(0);
    });

    it('should preserve original script properties', () => {
      const enhancedScript = enhancer.enhanceScriptWithKeywords(mockScript);

      expect(enhancedScript.scriptContent).toBe(mockScript.scriptContent);
      expect(enhancedScript.titles).toEqual(mockScript.titles);
      expect(enhancedScript.description).toBe(mockScript.description);
      expect(enhancedScript.generationParams).toEqual(
        mockScript.generationParams
      );
    });
  });

  describe('generatePexelsSearchQueries', () => {
    it('should generate optimized search queries from enhanced scene', () => {
      const enhancedScene = enhancer.enhanceSceneWithKeywords(mockScene);
      const queries = enhancer.generatePexelsSearchQueries(enhancedScene);

      expect(queries.length).toBeGreaterThan(0);
      expect(queries.length).toBeLessThanOrEqual(8);

      // Should contain relevant keywords
      const queriesString = queries.join(' ');
      expect(queriesString).toMatch(/mountain|landscape|beautiful|horizon/);
    });

    it('should fallback to original keywords if no enhancement data', () => {
      const queries = enhancer.generatePexelsSearchQueries(mockScene);

      expect(queries).toContain('mountain');
      expect(queries).toContain('landscape');
    });

    it('should prioritize search phrases over individual keywords', () => {
      const enhancedScene = enhancer.enhanceSceneWithKeywords(mockScene);
      const queries = enhancer.generatePexelsSearchQueries(enhancedScene);

      // Should have some multi-word phrases
      const hasMultiWordPhrases = queries.some(query => query.includes(' '));
      expect(hasMultiWordPhrases).toBe(true);
    });
  });

  describe('getExtractionMetrics', () => {
    it('should calculate metrics for enhanced script', () => {
      const enhancedScript = enhancer.enhanceScriptWithKeywords(mockScript);
      const metrics = enhancer.getExtractionMetrics(enhancedScript);

      expect(metrics.averageConfidence).toBeGreaterThan(0);
      expect(metrics.averageConfidence).toBeLessThanOrEqual(1);
      expect(metrics.totalKeywords).toBeGreaterThan(0);
      expect(metrics.scenesWithHighConfidence).toBeGreaterThanOrEqual(0);
      expect(metrics.searchOptimizationScore).toBeGreaterThan(0);
    });

    it('should handle script with no enhancement data', () => {
      const metrics = enhancer.getExtractionMetrics(mockScript);

      expect(metrics.averageConfidence).toBe(0);
      expect(metrics.totalKeywords).toBe(0);
      expect(metrics.scenesWithHighConfidence).toBe(0);
      expect(metrics.searchOptimizationScore).toBe(0);
    });
  });

  describe('generateFallbackKeywords', () => {
    it('should generate emotion-based fallback keywords', () => {
      const fallbackKeywords = enhancer.generateFallbackKeywords(mockScene);

      expect(fallbackKeywords.length).toBeGreaterThan(0);
      expect(fallbackKeywords).toContain('inspiration');
      expect(fallbackKeywords).toContain('motivation');
    });

    it('should generate different keywords for different emotions', () => {
      const dramaticScene: SceneData = { ...mockScene, emotion: 'dramatic' };
      const educationalScene: SceneData = {
        ...mockScene,
        emotion: 'educational',
      };

      const dramaticKeywords = enhancer.generateFallbackKeywords(dramaticScene);
      const educationalKeywords =
        enhancer.generateFallbackKeywords(educationalScene);

      expect(dramaticKeywords).toContain('dramatic');
      expect(educationalKeywords).toContain('education');
    });
  });

  describe('validateKeywordQuality', () => {
    it('should validate high-quality extraction', () => {
      const enhancedScene = enhancer.enhanceSceneWithKeywords(mockScene);
      const validation = enhancer.validateKeywordQuality(
        enhancedScene.keywordExtraction!
      );

      if (enhancedScene.keywordExtraction!.confidence > 0.3) {
        expect(validation.isValid).toBe(true);
        expect(validation.issues.length).toBe(0);
      }
    });

    it('should identify low-quality extraction', () => {
      const emptyScene: SceneData = { ...mockScene, narration: '' };
      const enhancedScene = enhancer.enhanceSceneWithKeywords(emptyScene);
      const validation = enhancer.validateKeywordQuality(
        enhancedScene.keywordExtraction!
      );

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.suggestions.length).toBeGreaterThan(0);
    });
  });
});

describe('Helper Functions', () => {
  let mockScript: GeneratedScript;

  beforeEach(() => {
    mockScript = {
      scriptContent: 'A test script',
      sceneBreakdown: [
        {
          id: 1,
          narration: 'Amazing sunset over the ocean',
          duration: 5,
          visualKeywords: ['sunset', 'ocean'],
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
        sceneCount: 1,
      },
    };
  });

  describe('enhanceScriptWithIntelligentKeywords', () => {
    it('should enhance script using the helper function', () => {
      const enhancedScript = enhanceScriptWithIntelligentKeywords(mockScript);

      expect(enhancedScript.sceneBreakdown[0].keywordExtraction).toBeDefined();
      expect(
        enhancedScript.sceneBreakdown[0].keywordExtraction!.primaryKeywords
      ).toContain('sunset');
      expect(
        enhancedScript.sceneBreakdown[0].keywordExtraction!.primaryKeywords
      ).toContain('ocean');
    });
  });

  describe('generateOptimizedPexelsQueries', () => {
    it('should generate optimized queries using the helper function', () => {
      const enhancedScript = enhanceScriptWithIntelligentKeywords(mockScript);
      const queries = generateOptimizedPexelsQueries(
        enhancedScript.sceneBreakdown[0]
      );

      expect(queries.length).toBeGreaterThan(0);

      const queriesString = queries.join(' ');
      expect(queriesString).toMatch(/sunset|ocean|amazing/);
    });
  });
});

describe('Integration with Existing Workflow', () => {
  it('should maintain backward compatibility with existing SceneData structure', () => {
    const enhancer = new ScriptKeywordEnhancer();
    const originalScene: SceneData = {
      id: 1,
      narration: 'A person walking through the forest',
      duration: 5,
      visualKeywords: ['person', 'forest'],
      emotion: 'contemplative',
    };

    const enhancedScene = enhancer.enhanceSceneWithKeywords(originalScene);

    // Should preserve all original properties
    expect(enhancedScene.id).toBe(originalScene.id);
    expect(enhancedScene.narration).toBe(originalScene.narration);
    expect(enhancedScene.duration).toBe(originalScene.duration);
    expect(enhancedScene.emotion).toBe(originalScene.emotion);

    // Should enhance visualKeywords
    expect(enhancedScene.visualKeywords).toContain('person');
    expect(enhancedScene.visualKeywords).toContain('forest');
    expect(enhancedScene.visualKeywords.length).toBeGreaterThanOrEqual(
      originalScene.visualKeywords.length
    );

    // Should add new keywordExtraction property
    expect(enhancedScene.keywordExtraction).toBeDefined();
  });

  it('should provide meaningful search optimization for Pexels integration', () => {
    const enhancer = new ScriptKeywordEnhancer();
    const scene: SceneData = {
      id: 1,
      narration:
        'The entrepreneur works late into the night, building their startup dream',
      duration: 5,
      visualKeywords: ['entrepreneur', 'startup'],
      emotion: 'motivational',
    };

    const enhancedScene = enhancer.enhanceSceneWithKeywords(scene);
    const queries = enhancer.generatePexelsSearchQueries(enhancedScene);

    // Should generate queries suitable for Pexels search
    expect(queries.length).toBeGreaterThan(3);
    expect(queries.some(q => q.includes('entrepreneur'))).toBe(true);
    expect(
      queries.some(
        q => q.includes('night') || q.includes('dream') || q.includes('startup')
      )
    ).toBe(true);

    // Queries should be useful for finding relevant stock content
    const hasBusinessRelatedQueries = queries.some(
      q =>
        q.includes('entrepreneur') ||
        q.includes('startup') ||
        q.includes('business')
    );
    expect(hasBusinessRelatedQueries).toBe(true);
  });
});
