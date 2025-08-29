import { describe, it, expect, beforeEach } from 'vitest';
import { ContentValidator } from './contentValidator';
import { GeneratedScript } from './claude-code/types';

describe('ContentValidator', () => {
  let validator: ContentValidator;

  // Mock valid script
  const validScript: GeneratedScript = {
    scriptContent:
      'This is an amazing story about perseverance. Did you know that success often comes from failure? Let me tell you about an incredible journey. Imagine facing countless rejections before achieving your dreams. This is exactly what happened to our protagonist. Through determination and hard work, they overcame every obstacle. Subscribe for more inspiring stories!',
    sceneBreakdown: [
      {
        id: 1,
        narration:
          'Did you know that 90% of successful people failed multiple times? This is the story of one such journey.',
        duration: 15,
        visualKeywords: ['success', 'failure', 'journey'],
        emotion: 'inspiring',
      },
      {
        id: 2,
        narration:
          'Our protagonist faced rejection after rejection, but never gave up on their dreams.',
        duration: 20,
        visualKeywords: ['rejection', 'perseverance', 'dreams'],
        emotion: 'dramatic',
      },
      {
        id: 3,
        narration:
          'Through hard work and dedication, they finally achieved what seemed impossible.',
        duration: 15,
        visualKeywords: ['success', 'achievement', 'celebration'],
        emotion: 'uplifting',
      },
      {
        id: 4,
        narration:
          'The lesson? Never give up on your dreams. Subscribe for more inspiring content!',
        duration: 10,
        visualKeywords: ['motivation', 'inspiration', 'dreams'],
        emotion: 'inspiring',
      },
    ],
    durationEstimate: 60,
    titles: [
      "How Failure Led to Incredible Success - You Won't Believe This Story",
      'The Secret to Success: Why Failing is Actually Good',
      'From Rock Bottom to the Top: An Inspiring Journey',
      "What Successful People Don't Tell You About Failure",
      'The Amazing Truth About Success Nobody Talks About',
    ],
    description:
      'Discover the incredible journey from failure to success in this inspiring story. Learn how perseverance and determination can help you overcome any obstacle. This video will change how you think about failure and success.\n\n🎯 Key Takeaways:\n- Why failure is essential for success\n- How to persevere through challenges\n- The mindset of successful people\n\n#motivation #success #inspiration #nevergiveup #mindset',
    thumbnailConcepts: [
      {
        description: 'Split screen showing failure to success transformation',
        visualElements: ['before/after', 'arrows', 'dramatic lighting'],
        textOverlay: 'FROM FAILURE TO SUCCESS',
        colorScheme: 'dark to bright gradient',
      },
    ],
    keywords: [
      'success',
      'failure',
      'motivation',
      'inspiration',
      'perseverance',
    ],
    generationParams: {
      style: 'motivational',
      targetDuration: 60,
      sceneCount: 4,
    },
  };

  beforeEach(() => {
    validator = new ContentValidator();
  });

  describe('validateScript', () => {
    it('should validate a well-formed script with high score', async () => {
      const result = await validator.validateScript(validScript);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.issues).toHaveLength(0);
    });

    it('should fail validation for missing critical fields', async () => {
      const invalidScript: GeneratedScript = {
        ...validScript,
        scriptContent: '',
        sceneBreakdown: [],
      };

      const result = await validator.validateScript(invalidScript);

      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(70);
      expect(result.issues.some(i => i.severity === 'critical')).toBe(true);
    });

    it('should detect insufficient scenes', async () => {
      const fewScenesScript: GeneratedScript = {
        ...validScript,
        sceneBreakdown: validScript.sceneBreakdown.slice(0, 2),
      };

      const result = await validator.validateScript(fewScenesScript);

      expect(
        result.issues.some(
          i =>
            i.field === 'sceneBreakdown' && i.message.includes('Too few scenes')
        )
      ).toBe(true);
      expect(
        result.suggestions.some(s => s.includes('Add') && s.includes('scenes'))
      ).toBe(true);
    });

    it('should detect too many scenes', async () => {
      const manyScenesScript: GeneratedScript = {
        ...validScript,
        sceneBreakdown: Array(10)
          .fill(null)
          .map((_, i) => ({
            id: i + 1,
            narration: `Scene ${i + 1} narration with sufficient content`,
            duration: 10,
            visualKeywords: ['keyword'],
            emotion: 'inspiring' as const,
          })),
      };

      const result = await validator.validateScript(manyScenesScript);

      expect(
        result.issues.some(
          i =>
            i.field === 'sceneBreakdown' &&
            i.message.includes('Too many scenes')
        )
      ).toBe(true);
    });
  });

  describe('Structure Validation', () => {
    it('should validate scene durations', async () => {
      const shortSceneScript: GeneratedScript = {
        ...validScript,
        sceneBreakdown: [
          {
            id: 1,
            narration: 'Very short scene',
            duration: 5, // Too short
            visualKeywords: ['short'],
            emotion: 'inspiring',
          },
          ...validScript.sceneBreakdown.slice(1),
        ],
      };

      const result = await validator.validateScript(shortSceneScript);

      expect(
        result.issues.some(
          i =>
            i.field.includes('scene_1_duration') &&
            i.message.includes('too short')
        )
      ).toBe(true);
    });

    it('should validate scene narration content', async () => {
      const emptyNarrationScript: GeneratedScript = {
        ...validScript,
        sceneBreakdown: [
          {
            id: 1,
            narration: 'Short', // Too short
            duration: 15,
            visualKeywords: ['test'],
            emotion: 'inspiring',
          },
          ...validScript.sceneBreakdown.slice(1),
        ],
      };

      const result = await validator.validateScript(emptyNarrationScript);

      expect(
        result.issues.some(
          i =>
            i.field === 'scene_1' &&
            i.message.includes('insufficient narration')
        )
      ).toBe(true);
    });

    it('should check for visual keywords', async () => {
      const noKeywordsScript: GeneratedScript = {
        ...validScript,
        sceneBreakdown: [
          {
            id: 1,
            narration: 'Scene with no visual keywords specified',
            duration: 15,
            visualKeywords: [],
            emotion: 'inspiring',
          },
          ...validScript.sceneBreakdown.slice(1),
        ],
      };

      const result = await validator.validateScript(noKeywordsScript);

      expect(
        result.issues.some(
          i =>
            i.field.includes('keywords') &&
            i.message.includes('lacks visual keywords')
        )
      ).toBe(true);
    });
  });

  describe('Content Quality Validation', () => {
    it('should detect repetitive content', async () => {
      const repetitiveScript: GeneratedScript = {
        ...validScript,
        scriptContent:
          'This is great. This is great. This is great. This is amazing. This is great.',
      };

      const result = await validator.validateScript(repetitiveScript);

      expect(
        result.issues.some(
          i => i.field === 'scriptContent' && i.message.includes('repetitive')
        )
      ).toBe(true);
      expect(
        result.suggestions.some(s => s.includes('Vary the language'))
      ).toBe(true);
    });

    it('should check for engagement elements', async () => {
      const boringScript: GeneratedScript = {
        ...validScript,
        scriptContent:
          'This is a story. It happened. Then it ended. That was it.',
      };

      const result = await validator.validateScript(boringScript);

      expect(result.suggestions.some(s => s.includes('engagement hooks'))).toBe(
        true
      );
    });
  });

  describe('Metadata Validation', () => {
    it('should validate title count and quality', async () => {
      const fewTitlesScript: GeneratedScript = {
        ...validScript,
        titles: ['Only One Title'],
      };

      const result = await validator.validateScript(fewTitlesScript);

      expect(
        result.issues.some(
          i =>
            i.field === 'titles' &&
            i.message.includes('Insufficient title variations')
        )
      ).toBe(true);
    });

    it('should validate description length', async () => {
      const shortDescriptionScript: GeneratedScript = {
        ...validScript,
        description: 'Too short',
      };

      const result = await validator.validateScript(shortDescriptionScript);

      expect(
        result.issues.some(
          i => i.field === 'description' && i.message.includes('too short')
        )
      ).toBe(true);
      expect(
        result.suggestions.some(s => s.includes('Expand description'))
      ).toBe(true);
    });

    it('should check for hashtags', async () => {
      const noHashtagsScript: GeneratedScript = {
        ...validScript,
        description: 'A description without any hashtags at all',
      };

      const result = await validator.validateScript(noHashtagsScript);

      expect(result.suggestions.some(s => s.includes('hashtags'))).toBe(true);
    });
  });

  describe('Technical Validation', () => {
    it('should validate total duration', async () => {
      const shortVideoScript: GeneratedScript = {
        ...validScript,
        durationEstimate: 20, // Too short
      };

      const result = await validator.validateScript(shortVideoScript);

      expect(
        result.issues.some(
          i => i.field === 'durationEstimate' && i.message.includes('too short')
        )
      ).toBe(true);
    });

    it('should check scene duration sum matches total', async () => {
      const mismatchedScript: GeneratedScript = {
        ...validScript,
        durationEstimate: 100, // Doesn't match scene sum of 60
      };

      const result = await validator.validateScript(mismatchedScript);

      expect(
        result.issues.some(
          i => i.field === 'duration' && i.message.includes("don't match")
        )
      ).toBe(true);
    });

    it('should validate keywords for SEO', async () => {
      const noKeywordsScript: GeneratedScript = {
        ...validScript,
        keywords: [],
      };

      const result = await validator.validateScript(noKeywordsScript);

      expect(
        result.issues.some(
          i =>
            i.field === 'keywords' &&
            i.message.includes('Insufficient keywords')
        )
      ).toBe(true);
    });
  });

  describe('Engagement Score Calculation', () => {
    it('should reward scripts with hooks', async () => {
      const hookScript: GeneratedScript = {
        ...validScript,
        sceneBreakdown: [
          {
            ...validScript.sceneBreakdown[0],
            narration:
              'Did you know that this amazing fact will blow your mind?',
          },
          ...validScript.sceneBreakdown.slice(1),
        ],
      };

      const result = await validator.validateScript(hookScript);

      expect(result.details.engagementScore).toBeGreaterThanOrEqual(80);
    });

    it('should reward scripts with CTAs', async () => {
      const ctaScript: GeneratedScript = {
        ...validScript,
        scriptContent:
          validScript.scriptContent + " Don't forget to like and subscribe!",
      };

      const result = await validator.validateScript(ctaScript);

      expect(result.details.engagementScore).toBeGreaterThanOrEqual(80);
    });

    it('should reward emotional variety', async () => {
      // validScript already has variety (inspiring, dramatic, uplifting)
      const result = await validator.validateScript(validScript);

      expect(result.details.engagementScore).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Regeneration Logic', () => {
    it('should recommend regeneration for low scores', () => {
      const result = {
        isValid: false,
        score: 50,
        issues: [
          {
            type: 'error' as const,
            field: 'test',
            message: 'test',
            severity: 'major' as const,
          },
        ],
        suggestions: [],
        details: {
          structureScore: 50,
          contentScore: 50,
          metadataScore: 50,
          engagementScore: 50,
          technicalScore: 50,
        },
      };

      expect(validator.shouldRegenerate(result)).toBe(true);
    });

    it('should recommend regeneration for critical issues', () => {
      const result = {
        isValid: false,
        score: 75,
        issues: [
          {
            type: 'error' as const,
            field: 'test',
            message: 'test',
            severity: 'critical' as const,
          },
        ],
        suggestions: [],
        details: {
          structureScore: 75,
          contentScore: 75,
          metadataScore: 75,
          engagementScore: 75,
          technicalScore: 75,
        },
      };

      expect(validator.shouldRegenerate(result)).toBe(true);
    });

    it('should provide regeneration hints', () => {
      const result = {
        isValid: false,
        score: 50,
        issues: [
          {
            type: 'error' as const,
            field: 'scene_1',
            message: 'test',
            severity: 'major' as const,
          },
          {
            type: 'error' as const,
            field: 'scene_2',
            message: 'test',
            severity: 'major' as const,
          },
          {
            type: 'error' as const,
            field: 'scene_3',
            message: 'test',
            severity: 'major' as const,
          },
          {
            type: 'error' as const,
            field: 'durationEstimate',
            message: 'too short',
            severity: 'major' as const,
          },
        ],
        suggestions: [],
        details: {
          structureScore: 50,
          contentScore: 70,
          metadataScore: 70,
          engagementScore: 50,
          technicalScore: 50,
        },
      };

      const hints = validator.getRegenerationHints(result);

      expect(hints.focusAreas).toContain('scene structure and pacing');
      expect(hints.focusAreas).toContain('viewer engagement and hooks');
      expect(hints.parameters.sceneCount).toBe(4);
      expect(hints.parameters.style).toBe('entertainment');
    });
  });

  describe('Validation Report', () => {
    it('should format validation report correctly', async () => {
      const result = await validator.validateScript(validScript);
      const report = validator.formatValidationReport(result);

      expect(report).toContain('Script Validation Report');
      expect(report).toContain('Overall Score:');
      expect(report).toContain('Score Breakdown:');
      expect(report).toContain('Structure:');
      expect(report).toContain('Content:');
      expect(report).toContain('Metadata:');
      expect(report).toContain('Engagement:');
      expect(report).toContain('Technical:');
    });

    it('should include issues in report', async () => {
      const invalidScript: GeneratedScript = {
        ...validScript,
        scriptContent: '',
      };

      const result = await validator.validateScript(invalidScript);
      const report = validator.formatValidationReport(result);

      expect(report).toContain('Issues Found');
      expect(report).toContain('❌');
      expect(report).toContain('critical');
    });

    it('should include suggestions in report', async () => {
      const result = await validator.validateScript(validScript);

      if (result.suggestions.length > 0) {
        const report = validator.formatValidationReport(result);
        expect(report).toContain('Improvement Suggestions:');
        expect(report).toContain('💡');
      }
    });
  });
});
