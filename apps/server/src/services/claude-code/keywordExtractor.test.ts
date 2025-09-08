/**
 * Comprehensive Unit Tests for Intelligent Keyword Extraction System
 * Sprint 005 - Story 1: >90% Coverage Requirement
 *
 * Tests all aspects of keyword extraction including:
 * - Core extraction functionality
 * - Sentence analysis and classification
 * - Keyword ranking and relevance scoring
 * - Search phrase generation
 * - Edge cases and error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  IntelligentKeywordExtractor,
  KeywordExtractionResult,
  SentenceAnalysis,
} from './keywordExtractor';

describe('IntelligentKeywordExtractor', () => {
  let extractor: IntelligentKeywordExtractor;

  beforeEach(() => {
    extractor = new IntelligentKeywordExtractor();
  });

  describe('Core Extraction Functionality', () => {
    describe('extractFromSentence', () => {
      it('should extract keywords from a simple descriptive sentence', () => {
        const sentence =
          'The beautiful mountain landscape stretches across the horizon';
        const result = extractor.extractFromSentence(sentence);

        expect(result).toMatchObject({
          primaryKeywords: expect.arrayContaining([
            'mountain',
            'landscape',
            'horizon',
          ]),
          visualConcepts: expect.arrayContaining(['landscape']),
          emotionalTriggers: expect.arrayContaining(['beautiful']),
          searchPhrases: expect.any(Array),
          confidence: expect.any(Number),
        });

        expect(result.confidence).toBeGreaterThan(0.5);
        expect(result.primaryKeywords.length).toBeGreaterThan(0);
      });

      it('should extract keywords from an action-oriented sentence', () => {
        const sentence =
          'People running through the vibrant city streets at sunset';
        const result = extractor.extractFromSentence(sentence);

        expect(result.primaryKeywords).toContain('running');
        expect(result.visualConcepts).toContain('city');
        expect(result.emotionalTriggers).toContain('vibrant');
        expect(result.confidence).toBeGreaterThan(0.6);
      });

      it('should extract keywords from an emotional sentence', () => {
        const sentence = 'The incredible moment when dreams finally come true';
        const result = extractor.extractFromSentence(sentence);

        expect(result.emotionalTriggers).toContain('incredible');
        expect(result.primaryKeywords).toContain('moment');
        expect(result.primaryKeywords).toContain('dreams');
        expect(result.confidence).toBeGreaterThan(0.7);
      });

      it('should handle sentences with proper nouns and entities', () => {
        const sentence = 'John walked through Central Park in Manhattan';
        const result = extractor.extractFromSentence(sentence);

        expect(result.primaryKeywords).toContain('John');
        expect(result.primaryKeywords).toContain('Central');
        expect(result.primaryKeywords).toContain('Park');
        expect(result.primaryKeywords).toContain('Manhattan');
      });

      it('should generate meaningful search phrases', () => {
        const sentence =
          'Amazing aerial view of the sparkling ocean at sunrise';
        const result = extractor.extractFromSentence(sentence);

        expect(result.searchPhrases.length).toBeGreaterThan(0);
        // Should have meaningful combinations of keywords
        const hasRelevantPhrase = result.searchPhrases.some(
          phrase =>
            phrase.includes('ocean') ||
            phrase.includes('sunrise') ||
            phrase.includes('aerial')
        );
        expect(hasRelevantPhrase).toBe(true);
      });

      it('should handle empty or invalid input gracefully', () => {
        const emptyResult = extractor.extractFromSentence('');
        expect(emptyResult.confidence).toBe(0);
        expect(emptyResult.primaryKeywords).toEqual([]);

        const shortResult = extractor.extractFromSentence('Hi');
        expect(shortResult.confidence).toBeLessThan(0.5);
      });

      it('should handle sentences with punctuation and special characters', () => {
        const sentence =
          "Wow! The city's skyline is absolutely stunning, isn't it?";
        const result = extractor.extractFromSentence(sentence);

        expect(result.primaryKeywords).toContain('city');
        expect(result.primaryKeywords).toContain('skyline');
        expect(result.emotionalTriggers).toContain('stunning');
      });
    });

    describe('generateSearchVariations', () => {
      it('should generate variations for given keywords', () => {
        const keywords = ['beautiful', 'mountain'];
        const variations = extractor.generateSearchVariations(keywords);

        expect(variations.length).toBeGreaterThan(keywords.length);
        expect(variations).toContain('beautiful');
        expect(variations).toContain('mountain');

        // Should include synonyms
        expect(variations).toContain('stunning');
      });

      it('should limit the number of variations returned', () => {
        const manyKeywords = Array.from(
          { length: 20 },
          (_, i) => `keyword${i}`
        );
        const variations = extractor.generateSearchVariations(manyKeywords);

        expect(variations.length).toBeLessThanOrEqual(10);
      });

      it('should handle empty keyword array', () => {
        const variations = extractor.generateSearchVariations([]);
        expect(variations).toEqual([]);
      });
    });

    describe('rankKeywordsByRelevance', () => {
      it('should rank visual concepts higher', () => {
        const keywords = ['the', 'nature', 'and', 'forest'];
        const ranked = extractor.rankKeywordsByRelevance(keywords);

        const natureIndex = ranked.indexOf('nature');
        const forestIndex = ranked.indexOf('forest');
        const theIndex = ranked.indexOf('the');

        expect(natureIndex).toBeLessThan(theIndex);
        expect(forestIndex).toBeLessThan(theIndex);
      });

      it('should limit results to top 10 keywords', () => {
        const manyKeywords = Array.from(
          { length: 20 },
          (_, i) => `keyword${i}`
        );
        const ranked = extractor.rankKeywordsByRelevance(manyKeywords);

        expect(ranked.length).toBeLessThanOrEqual(10);
      });

      it('should handle empty input', () => {
        const ranked = extractor.rankKeywordsByRelevance([]);
        expect(ranked).toEqual([]);
      });
    });
  });

  describe('Sentence Analysis', () => {
    it('should classify sentence types correctly', () => {
      const descriptive = 'The red car is parked outside';
      const action = 'She is running through the park';
      const emotional = 'This amazing view is absolutely stunning';
      const dialogue = 'He said the meeting was postponed';

      const descriptiveResult = extractor.extractFromSentence(descriptive);
      const actionResult = extractor.extractFromSentence(action);
      const emotionalResult = extractor.extractFromSentence(emotional);
      const dialogueResult = extractor.extractFromSentence(dialogue);

      // Verify that emotional sentences have emotional triggers
      expect(emotionalResult.emotionalTriggers.length).toBeGreaterThan(0);

      // Verify that action sentences have action words in keywords
      expect(actionResult.primaryKeywords).toContain('running');
    });

    it('should calculate emotional intensity accurately', () => {
      const lowEmotional = 'The table is brown';
      const highEmotional =
        'The absolutely incredible stunning magnificent view';

      const lowResult = extractor.extractFromSentence(lowEmotional);
      const highResult = extractor.extractFromSentence(highEmotional);

      expect(highResult.emotionalTriggers.length).toBeGreaterThan(
        lowResult.emotionalTriggers.length
      );
    });
  });

  describe('Keyword Classification', () => {
    it('should identify primary keywords correctly', () => {
      const sentence = 'The photographer captured the mountain landscape';
      const result = extractor.extractFromSentence(sentence);

      expect(result.primaryKeywords).toContain('photographer');
      expect(result.primaryKeywords).toContain('mountain');
      expect(result.primaryKeywords).toContain('landscape');
      expect(result.primaryKeywords).toContain('captured');
    });

    it('should identify visual concepts', () => {
      const sentence = 'The bright sunset colors filled the sky';
      const result = extractor.extractFromSentence(sentence);

      expect(result.visualConcepts).toContain('sunset');
      expect(result.visualConcepts).toContain('sky');
    });

    it('should identify emotional triggers', () => {
      const sentence = 'The peaceful and serene mountain view';
      const result = extractor.extractFromSentence(sentence);

      expect(result.emotionalTriggers).toContain('peaceful');
      expect(result.emotionalTriggers).toContain('serene');
    });

    it('should filter out stop words from primary keywords', () => {
      const sentence = 'The quick brown fox jumps over the lazy dog';
      const result = extractor.extractFromSentence(sentence);

      expect(result.primaryKeywords).not.toContain('the');
      expect(result.primaryKeywords).not.toContain('over');
      expect(result.primaryKeywords).toContain('fox');
      expect(result.primaryKeywords).toContain('dog');
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign higher confidence to sentences with more keywords', () => {
      const shortSentence = 'Car red';
      const longSentence =
        'The beautiful red sports car speeds through the winding mountain road at sunset';

      const shortResult = extractor.extractFromSentence(shortSentence);
      const longResult = extractor.extractFromSentence(longSentence);

      expect(longResult.confidence).toBeGreaterThan(shortResult.confidence);
    });

    it('should assign higher confidence to sentences with visual concepts', () => {
      const noVisual = 'The meeting was scheduled for tomorrow';
      const withVisual = 'The stunning mountain landscape stretches endlessly';

      const noVisualResult = extractor.extractFromSentence(noVisual);
      const withVisualResult = extractor.extractFromSentence(withVisual);

      expect(withVisualResult.confidence).toBeGreaterThan(
        noVisualResult.confidence
      );
    });

    it('should penalize very short sentences', () => {
      const veryShort = 'Hi';
      const normal = 'The mountain view is beautiful';

      const shortResult = extractor.extractFromSentence(veryShort);
      const normalResult = extractor.extractFromSentence(normal);

      expect(normalResult.confidence).toBeGreaterThan(shortResult.confidence);
    });

    it('should ensure confidence scores are between 0 and 1', () => {
      const testSentences = [
        '',
        'Hi',
        'The beautiful amazing incredible stunning magnificent view',
        'The quick brown fox jumps over the lazy dog',
        'This is a test sentence with normal content',
      ];

      testSentences.forEach(sentence => {
        const result = extractor.extractFromSentence(sentence);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Search Phrase Generation', () => {
    it('should combine primary keywords with visual concepts', () => {
      const sentence = 'The majestic eagle soars over the mountain peaks';
      const result = extractor.extractFromSentence(sentence);

      const hasEagleMountainPhrase = result.searchPhrases.some(
        phrase => phrase.includes('eagle') && phrase.includes('mountain')
      );
      expect(hasEagleMountainPhrase).toBe(true);
    });

    it('should generate reasonable number of search phrases', () => {
      const sentence = 'Beautiful sunset over the ocean with birds flying';
      const result = extractor.extractFromSentence(sentence);

      expect(result.searchPhrases.length).toBeGreaterThan(0);
      expect(result.searchPhrases.length).toBeLessThan(15); // Reasonable limit
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle sentences with only punctuation', () => {
      const result = extractor.extractFromSentence('!@#$%^&*()');
      expect(result.confidence).toBe(0);
      expect(result.primaryKeywords).toEqual([]);
    });

    it('should handle sentences with repeated words', () => {
      const sentence = 'Beautiful beautiful beautiful mountain mountain';
      const result = extractor.extractFromSentence(sentence);

      // Should not have duplicates
      const uniquePrimary = [...new Set(result.primaryKeywords)];
      expect(result.primaryKeywords.length).toBe(uniquePrimary.length);
    });

    it('should handle mixed case input', () => {
      const sentence = 'BEAUTIFUL Mountain LandScape';
      const result = extractor.extractFromSentence(sentence);

      expect(result.primaryKeywords.length).toBeGreaterThan(0);
      expect(result.emotionalTriggers.length).toBeGreaterThan(0);
    });

    it('should handle sentences with numbers', () => {
      const sentence = '5 people standing near 10 tall buildings';
      const result = extractor.extractFromSentence(sentence);

      expect(result.primaryKeywords).toContain('people');
      expect(result.primaryKeywords).toContain('buildings');
    });

    it('should handle very long sentences', () => {
      const longSentence = Array(50)
        .fill('beautiful mountain landscape')
        .join(' ');
      const result = extractor.extractFromSentence(longSentence);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.primaryKeywords.length).toBeGreaterThan(0);
      // Should still limit keywords appropriately
      expect(result.primaryKeywords.length).toBeLessThan(20);
    });
  });

  describe('Dictionary and Classification Tests', () => {
    it('should correctly identify emotional trigger words', () => {
      const emotionalWords = [
        'amazing',
        'incredible',
        'stunning',
        'beautiful',
        'dramatic',
      ];

      emotionalWords.forEach(word => {
        const result = extractor.extractFromSentence(`The ${word} view`);
        expect(result.emotionalTriggers).toContain(word);
      });
    });

    it('should correctly identify visual concept words', () => {
      const visualWords = [
        'landscape',
        'sunset',
        'ocean',
        'mountain',
        'forest',
      ];

      visualWords.forEach(word => {
        const result = extractor.extractFromSentence(`Beautiful ${word} scene`);
        expect(result.visualConcepts).toContain(word);
      });
    });

    it('should correctly identify action verbs', () => {
      const actionWords = [
        'running',
        'jumping',
        'flying',
        'swimming',
        'dancing',
      ];

      actionWords.forEach(word => {
        const result = extractor.extractFromSentence(`Person ${word} quickly`);
        expect(result.primaryKeywords).toContain(word);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should process sentences efficiently', () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        extractor.extractFromSentence(
          'The beautiful mountain landscape with amazing sunset colors'
        );
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should process 100 sentences in under 1 second
    });

    it('should handle batch processing', () => {
      const sentences = [
        'Beautiful mountain landscape',
        'Amazing city skyline at night',
        'Peaceful forest scene with wildlife',
        'Dramatic ocean waves crashing',
        'Serene lake reflection at sunset',
      ];

      const results = sentences.map(sentence =>
        extractor.extractFromSentence(sentence)
      );

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.primaryKeywords.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration Readiness', () => {
    it('should return properly structured results for integration', () => {
      const sentence = 'The incredible aerial view of the sparkling ocean';
      const result = extractor.extractFromSentence(sentence);

      // Verify all required fields are present
      expect(result).toHaveProperty('primaryKeywords');
      expect(result).toHaveProperty('secondaryKeywords');
      expect(result).toHaveProperty('emotionalTriggers');
      expect(result).toHaveProperty('visualConcepts');
      expect(result).toHaveProperty('searchPhrases');
      expect(result).toHaveProperty('confidence');

      // Verify types are correct
      expect(Array.isArray(result.primaryKeywords)).toBe(true);
      expect(Array.isArray(result.secondaryKeywords)).toBe(true);
      expect(Array.isArray(result.emotionalTriggers)).toBe(true);
      expect(Array.isArray(result.visualConcepts)).toBe(true);
      expect(Array.isArray(result.searchPhrases)).toBe(true);
      expect(typeof result.confidence).toBe('number');
    });

    it('should work with existing SceneData interface', () => {
      // Test compatibility with existing scene processing
      const sceneNarration =
        'A person walks through the peaceful forest at dawn';
      const result = extractor.extractFromSentence(sceneNarration);

      // Should extract keywords that could enhance existing visualKeywords
      expect(
        result.primaryKeywords.some(keyword =>
          ['person', 'forest', 'dawn'].includes(keyword.toLowerCase())
        )
      ).toBe(true);

      expect(
        result.visualConcepts.some(concept =>
          ['forest'].includes(concept.toLowerCase())
        )
      ).toBe(true);
    });
  });
});

describe('IntelligentKeywordExtractor - Advanced Integration Tests', () => {
  let extractor: IntelligentKeywordExtractor;

  beforeEach(() => {
    extractor = new IntelligentKeywordExtractor();
  });

  it('should handle real-world script sentences', () => {
    const realWorldSentences = [
      "In this incredible transformation story, we follow Sarah's journey from despair to triumph",
      'The moment when everything changed happened on a quiet Tuesday morning',
      'Watch as the stunning revelation unfolds before your eyes',
      'This simple technique revolutionized how millions of people think about success',
      'The shocking truth about what really happened that night will amaze you',
    ];

    realWorldSentences.forEach(sentence => {
      const result = extractor.extractFromSentence(sentence);

      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.primaryKeywords.length).toBeGreaterThan(0);

      console.log(`Sentence: "${sentence}"`);
      console.log(`Primary Keywords: ${result.primaryKeywords.join(', ')}`);
      console.log(`Visual Concepts: ${result.visualConcepts.join(', ')}`);
      console.log(`Emotional Triggers: ${result.emotionalTriggers.join(', ')}`);
      console.log(`Confidence: ${result.confidence.toFixed(3)}`);
      console.log('---');
    });
  });

  it('should provide comprehensive keyword extraction for video asset search', () => {
    const videoSentence =
      'The majestic eagle soars above the snow-covered mountain peaks as the golden sunrise illuminates the dramatic landscape';
    const result = extractor.extractFromSentence(videoSentence);

    // Should have rich keyword extraction for visual assets
    expect(result.primaryKeywords).toContain('eagle');
    expect(result.primaryKeywords).toContain('mountain');
    expect(result.visualConcepts).toContain('landscape');
    expect(result.visualConcepts).toContain('sunrise');
    expect(result.emotionalTriggers).toContain('majestic');
    expect(result.emotionalTriggers).toContain('dramatic');

    // Should generate search phrases suitable for Pexels
    expect(
      result.searchPhrases.some(
        phrase =>
          phrase.toLowerCase().includes('eagle mountain') ||
          phrase.toLowerCase().includes('mountain eagle')
      )
    ).toBe(true);

    expect(result.confidence).toBeGreaterThan(0.8);

    console.log('Video Asset Search Keywords:');
    console.log('Primary:', result.primaryKeywords);
    console.log('Visual:', result.visualConcepts);
    console.log('Emotional:', result.emotionalTriggers);
    console.log('Search Phrases:', result.searchPhrases);
    console.log('Confidence:', result.confidence);
  });
});
