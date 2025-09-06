import { YouTubeDescriptionGenerator } from './descriptionGenerator';
import { AdvancedSEOOptimizer } from './seoOptimizer';
import { GeneratedScript, RedditPost, ScriptStyle } from './types';

/**
 * COMPREHENSIVE TEST SUITE FOR YOUTUBE DESCRIPTION SYSTEM
 * Tests all expert agents and optimization systems
 */

describe('YouTube Description Generation System', () => {
  let descriptionGenerator: YouTubeDescriptionGenerator;
  let seoOptimizer: AdvancedSEOOptimizer;
  let mockScript: GeneratedScript;
  let mockRedditPost: RedditPost;

  beforeEach(() => {
    descriptionGenerator = new YouTubeDescriptionGenerator();
    seoOptimizer = new AdvancedSEOOptimizer();

    // Mock Reddit post data
    mockRedditPost = {
      id: 'test123',
      title: 'How I Transformed My Life with This Simple Morning Routine',
      content:
        'I used to struggle with productivity and motivation every single day. I would wake up, feel overwhelmed, and spend hours scrolling social media instead of working on important tasks. Then I discovered this simple 10-minute morning routine that changed everything. Now I wake up at 5:30 AM, do 5 minutes of meditation, write down 3 goals for the day, and do 10 push-ups. This simple routine has transformed my productivity, mental clarity, and overall life satisfaction. The key is starting small and being consistent.',
      author: 'testuser',
      subreddit: 'getmotivated',
      score: 1250,
      upvotes: 1250,
      comments: 89,
      created_at: new Date(),
      url: 'https://reddit.com/test',
      awards: [],
    };

    // Mock generated script
    mockScript = {
      scriptContent:
        "What if I told you that a simple 10-minute morning routine could completely transform your life? This incredible story from Reddit shows exactly how one person went from struggling with productivity to achieving complete mental clarity and life satisfaction. If you've ever felt overwhelmed, unmotivated, or stuck in cycles of procrastination, this story will change everything you think you know about morning routines and productivity. The person in this story was exactly like you - struggling every single day with basic tasks, spending hours on social media instead of important work, feeling like they were living life on autopilot. But then they discovered something that changed everything. Here's what really happens in your brain when you start your day without structure. When we wake up without a clear plan, our prefrontal cortex - the part responsible for decision-making - becomes overwhelmed by possibilities. This creates what psychologists call 'decision fatigue' before you even get out of bed. Your brain starts fighting between what you should do and what feels easy, leading to that familiar pattern of scrolling instead of acting. But here's the breakthrough: this person discovered that the solution isn't about willpower or motivation - it's about removing decisions from your morning entirely. They created a simple 10-minute routine: 5 minutes of meditation to calm the mind, writing down 3 specific goals to create clarity, and 10 push-ups to activate the body. The psychology behind why this works is fascinating. Meditation reduces cortisol levels and activates the parasympathetic nervous system, creating calm focus. Goal writing engages the reticular activating system, making your brain notice opportunities to achieve those goals throughout the day. And physical movement releases BDNF - brain-derived neurotrophic factor - which literally grows new neural pathways for better thinking. The results were remarkable: complete transformation in productivity, crystal-clear mental clarity, and genuine life satisfaction. But here's the crucial part - it wasn't the specific activities that mattered, it was the psychological principle behind them: creating a predictable sequence that your brain could follow without resistance. So here's your challenge: for the next 7 days, create your own simple 3-step morning routine. Pick one activity for your mind, one for clarity, and one for your body. Keep it under 15 minutes total. The goal isn't perfection - it's consistency. Which part of this transformation strategy will you implement first? Share your morning routine goals in the comments below, and let's build a community of people committed to real change. Remember: small consistent actions create massive long-term results.",
      sceneBreakdown: [
        {
          id: 1,
          narration:
            'What if I told you that a simple 10-minute morning routine could completely transform your life?',
          duration: 8,
          visualKeywords: ['transformation', 'morning routine', 'curiosity'],
          emotion: 'inspiring',
        },
        {
          id: 2,
          narration:
            'This incredible story from Reddit shows exactly how one person went from struggling with productivity to achieving complete mental clarity.',
          duration: 10,
          visualKeywords: [
            'Reddit story',
            'productivity struggle',
            'mental clarity',
          ],
          emotion: 'educational',
        },
        {
          id: 3,
          narration:
            "The person discovered that the solution isn't about willpower - it's about removing decisions from your morning entirely.",
          duration: 12,
          visualKeywords: ['breakthrough', 'decision fatigue', 'willpower'],
          emotion: 'dramatic',
        },
        {
          id: 4,
          narration:
            'They created a simple routine: 5 minutes meditation, writing 3 goals, and 10 push-ups.',
          duration: 8,
          visualKeywords: ['meditation', 'goal writing', 'exercise'],
          emotion: 'educational',
        },
        {
          id: 5,
          narration:
            'The psychology behind why this works involves cortisol reduction, reticular activation, and BDNF release.',
          duration: 15,
          visualKeywords: ['brain science', 'psychology', 'neuroscience'],
          emotion: 'educational',
        },
        {
          id: 6,
          narration:
            'The results were remarkable: complete productivity transformation and genuine life satisfaction.',
          duration: 10,
          visualKeywords: ['success', 'transformation results', 'satisfaction'],
          emotion: 'inspiring',
        },
        {
          id: 7,
          narration:
            'Create your own 3-step routine for the next 7 days - one activity for mind, clarity, and body.',
          duration: 12,
          visualKeywords: ['action plan', 'challenge', 'implementation'],
          emotion: 'motivational',
        },
      ],
      durationEstimate: 75,
      titles: [
        'The 10-Minute Morning Routine That Transforms Your Entire Life',
        'How This Simple Morning Routine Changed Everything (Psychology Explained)',
        'The Science-Backed Morning Routine That Guarantees Productivity',
        'From Overwhelmed to Optimized: The Morning Routine That Works',
        'This Morning Routine Hack Will Transform Your Brain (Reddit Story)',
      ],
      description:
        'This powerful Reddit story reveals the psychology behind life transformation through simple morning routines.',
      thumbnailConcepts: [],
      keywords: [
        'morning routine',
        'productivity',
        'psychology',
        'transformation',
        'habits',
        'motivation',
      ],
      generationParams: {
        style: 'educational' as ScriptStyle,
        targetDuration: 75,
        sceneCount: 7,
      },
    };
  });

  describe('YouTube Description Generator', () => {
    test('should generate optimized description with all components', async () => {
      const result = await descriptionGenerator.generateOptimizedDescription(
        mockScript,
        mockRedditPost,
        {
          demographics: 'Young professionals aged 22-40',
          interests: ['personal growth', 'productivity', 'psychology'],
          painPoints: ['lack of motivation', 'feeling overwhelmed'],
          motivations: ['achieve success', 'build better habits'],
        }
      );

      // Test structure
      expect(result).toBeDefined();
      expect(result.hook).toBeDefined();
      expect(result.mainContent).toBeDefined();
      expect(result.keyInsights).toHaveLength(6);
      expect(result.timestamps.chapters.length).toBeGreaterThan(0);
      expect(result.callsToAction.length).toBeGreaterThan(0);
      expect(result.hashtags.length).toBeGreaterThan(0);
      expect(result.socialProof.length).toBeGreaterThan(0);
      expect(result.crossPromotion.length).toBeGreaterThan(0);
      expect(result.fullDescription).toBeDefined();

      // Test scoring
      expect(result.seoScore).toBeGreaterThan(0);
      expect(result.seoScore).toBeLessThanOrEqual(100);
      expect(result.engagementScore).toBeGreaterThan(0);
      expect(result.engagementScore).toBeLessThanOrEqual(100);

      // Test content quality
      expect(result.fullDescription.length).toBeGreaterThan(500); // Substantial content
      expect(result.hook).toContain('psychology'); // Contains key concepts
      expect(result.mainContent).toContain('transformation'); // Relevant to content

      console.log(
        'Generated Description Length:',
        result.fullDescription.length
      );
      console.log('SEO Score:', result.seoScore);
      console.log('Engagement Score:', result.engagementScore);
    }, 10000);

    test('should generate appropriate timestamps based on scenes', async () => {
      const result = await descriptionGenerator.generateOptimizedDescription(
        mockScript,
        mockRedditPost
      );

      expect(result.timestamps.chapters).toHaveLength(
        mockScript.sceneBreakdown.length
      );

      // Test timestamp format
      result.timestamps.chapters.forEach(chapter => {
        expect(chapter.time).toMatch(/^\d+:\d{2}$/); // Format: M:SS or MM:SS
        expect(chapter.title).toBeDefined();
        expect(chapter.keywords.length).toBeGreaterThan(0);
        expect(chapter.engagementValue).toBeGreaterThan(0);
      });

      // Test chronological order
      const timeInSeconds = result.timestamps.chapters.map(ch => {
        const [mins, secs] = ch.time.split(':').map(Number);
        return mins * 60 + secs;
      });

      for (let i = 1; i < timeInSeconds.length; i++) {
        expect(timeInSeconds[i]).toBeGreaterThanOrEqual(timeInSeconds[i - 1]);
      }
    });

    test('should generate appropriate hashtags for discoverability', async () => {
      const result = await descriptionGenerator.generateOptimizedDescription(
        mockScript,
        mockRedditPost
      );

      expect(result.hashtags.length).toBeGreaterThanOrEqual(10);
      expect(result.hashtags.length).toBeLessThanOrEqual(15);

      // Should contain trending and niche hashtags
      const hashtagsLower = result.hashtags.map(h => h.toLowerCase());
      expect(
        hashtagsLower.some(h => h.includes('personal') || h.includes('growth'))
      ).toBeTruthy();
      expect(
        hashtagsLower.some(h => h.includes('product') || h.includes('routine'))
      ).toBeTruthy();
      expect(
        hashtagsLower.some(
          h => h.includes('psychology') || h.includes('mindset')
        )
      ).toBeTruthy();
    });

    test('should generate engaging calls-to-action', async () => {
      const result = await descriptionGenerator.generateOptimizedDescription(
        mockScript,
        mockRedditPost
      );

      expect(result.callsToAction.length).toBeGreaterThanOrEqual(4);

      // Should contain different types of CTAs
      const ctaText = result.callsToAction.join(' ').toLowerCase();
      expect(ctaText).toContain('comment'); // Comment CTA
      expect(ctaText).toContain('like'); // Like CTA
      expect(ctaText).toContain('subscribe'); // Subscribe CTA

      // Each CTA should be actionable
      result.callsToAction.forEach(cta => {
        expect(cta.length).toBeGreaterThan(10); // Substantial content
        expect(cta).toMatch(/[💬👍🔔📤🎯💪]/u); // Contains emojis for engagement
      });
    });
  });

  describe('SEO Optimizer', () => {
    test('should extract and analyze relevant keywords', async () => {
      const result = await seoOptimizer.optimizeForSEO(
        mockScript.titles[0],
        mockScript.scriptContent,
        mockScript.keywords,
        'personal-development'
      );

      expect(result.keywordStrategy.length).toBeGreaterThan(0);
      expect(result.lsiClusters.length).toBeGreaterThan(0);
      expect(result.seoScore.overallScore).toBeGreaterThan(0);
      expect(result.seoScore.overallScore).toBeLessThanOrEqual(100);

      // Test keyword analysis quality
      result.keywordStrategy.forEach(keyword => {
        expect(keyword.keyword).toBeDefined();
        expect(keyword.searchVolume).toBeGreaterThan(0);
        expect(keyword.difficulty).toBeGreaterThanOrEqual(0);
        expect(keyword.difficulty).toBeLessThanOrEqual(100);
        expect(['rising', 'stable', 'declining']).toContain(keyword.trend);
        expect([
          'informational',
          'commercial',
          'transactional',
          'navigational',
        ]).toContain(keyword.intent);
      });

      console.log('SEO Keywords Found:', result.keywordStrategy.length);
      console.log('LSI Clusters:', result.lsiClusters.length);
      console.log('Overall SEO Score:', result.seoScore.overallScore);
    }, 10000);

    test('should generate LSI keyword clusters', async () => {
      const result = await seoOptimizer.optimizeForSEO(
        'Psychology of Morning Routines',
        'This content explores the psychological principles behind effective morning routines, including meditation, goal setting, and habit formation.',
        ['psychology', 'morning routine', 'habits'],
        'personal-development'
      );

      expect(result.lsiClusters.length).toBeGreaterThan(0);

      result.lsiClusters.forEach(cluster => {
        expect(cluster.primaryTerm).toBeDefined();
        expect(cluster.relatedTerms.length).toBeGreaterThan(0);
        expect(cluster.semanticWeight).toBeGreaterThanOrEqual(0);
        expect(cluster.contextualRelevance).toBeGreaterThanOrEqual(0);
        expect(cluster.contextualRelevance).toBeLessThanOrEqual(100);
      });
    });

    test('should provide actionable SEO recommendations', async () => {
      const result = await seoOptimizer.optimizeForSEO(
        'Short Title',
        'Brief content without much depth.',
        ['test'],
        'personal-development'
      );

      expect(result.seoScore.recommendations).toBeDefined();
      expect(result.seoScore.recommendations.length).toBeGreaterThan(0);

      // Recommendations should be actionable
      result.seoScore.recommendations.forEach(rec => {
        expect(rec.length).toBeGreaterThan(20); // Substantial recommendations
        expect(rec).toMatch(/^[A-Z]/); // Proper capitalization
      });
    });
  });

  describe('Integration Tests', () => {
    test('should integrate description generation with SEO optimization', async () => {
      // Generate description
      const description =
        await descriptionGenerator.generateOptimizedDescription(
          mockScript,
          mockRedditPost
        );

      // Optimize with SEO
      const seoResult = await seoOptimizer.optimizeForSEO(
        mockScript.titles[0],
        description.fullDescription,
        mockScript.keywords,
        'personal-development'
      );

      expect(seoResult.optimizedDescription).toBeDefined();
      expect(seoResult.optimizedDescription.length).toBeGreaterThan(
        description.fullDescription.length * 0.8
      ); // Reasonable length
      expect(seoResult.seoScore.overallScore).toBeGreaterThan(50); // Decent SEO score

      console.log(
        'Original Description Length:',
        description.fullDescription.length
      );
      console.log(
        'Optimized Description Length:',
        seoResult.optimizedDescription.length
      );
      console.log('Final SEO Score:', seoResult.seoScore.overallScore);
    }, 15000);

    test('should handle different content types appropriately', async () => {
      // Test with fitness content
      const fitnessPost = {
        ...mockRedditPost,
        title: 'How I Lost 50 Pounds in 6 Months',
        content:
          'My weight loss journey using intermittent fasting and strength training. Started at 200lbs, now at 150lbs through consistent diet and exercise.',
      };

      const fitnessScript = {
        ...mockScript,
        scriptContent:
          'This amazing weight loss transformation shows the power of consistency and proper nutrition...',
        keywords: [
          'weight loss',
          'fitness',
          'diet',
          'exercise',
          'transformation',
        ],
      };

      const result = await descriptionGenerator.generateOptimizedDescription(
        fitnessScript,
        fitnessPost
      );

      expect(
        result.hashtags.some(
          tag =>
            tag.toLowerCase().includes('fitness') ||
            tag.toLowerCase().includes('weight')
        )
      ).toBeTruthy();
      expect(
        result.keyInsights.some(
          insight =>
            insight.toLowerCase().includes('weight') ||
            insight.toLowerCase().includes('fitness')
        )
      ).toBeTruthy();
    }, 10000);

    test('should maintain performance with large content', async () => {
      // Create large script content
      const largeScript = {
        ...mockScript,
        scriptContent: mockScript.scriptContent.repeat(5), // 5x larger content
        sceneBreakdown: Array(20)
          .fill(null)
          .map((_, i) => ({
            id: i + 1,
            narration: `Scene ${i + 1} narration with detailed content about transformation and psychology.`,
            duration: 10,
            visualKeywords: ['psychology', 'transformation', 'success'],
            emotion: 'educational' as const,
          })),
      };

      const startTime = Date.now();
      const result = await descriptionGenerator.generateOptimizedDescription(
        largeScript,
        mockRedditPost
      );
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.timestamps.chapters.length).toBe(20); // Should handle all scenes

      console.log('Large Content Processing Time:', endTime - startTime, 'ms');
    }, 10000);
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty or minimal content gracefully', async () => {
      const minimalScript = {
        ...mockScript,
        scriptContent: 'Short content.',
        sceneBreakdown: [],
        keywords: [],
      };

      const result = await descriptionGenerator.generateOptimizedDescription(
        minimalScript,
        mockRedditPost
      );

      expect(result).toBeDefined();
      expect(result.fullDescription.length).toBeGreaterThan(100); // Should still generate substantial content
      expect(result.seoScore).toBeGreaterThan(0); // Should have some SEO value
    });

    test('should handle missing optional parameters', async () => {
      const result = await descriptionGenerator.generateOptimizedDescription(
        mockScript,
        mockRedditPost
      );

      expect(result).toBeDefined();
      expect(result.fullDescription).toBeDefined();
      expect(result.seoScore).toBeGreaterThan(0);
    });

    test('should generate appropriate content for different script styles', async () => {
      const styles: ScriptStyle[] = [
        'motivational',
        'educational',
        'entertainment',
        'storytelling',
      ];

      for (const style of styles) {
        const styledScript = {
          ...mockScript,
          generationParams: { ...mockScript.generationParams, style },
        };

        const result = await descriptionGenerator.generateOptimizedDescription(
          styledScript,
          mockRedditPost
        );

        expect(result).toBeDefined();
        expect(result.fullDescription.length).toBeGreaterThan(300);
        // Each style should produce different content characteristics
      }
    }, 15000);
  });
});

/**
 * PERFORMANCE BENCHMARKS
 * Measures system performance under various conditions
 */
describe('Performance Benchmarks', () => {
  test('should meet performance targets for typical content', async () => {
    const generator = new YouTubeDescriptionGenerator();
    const optimizer = new AdvancedSEOOptimizer();

    const mockScript: GeneratedScript = {
      scriptContent:
        'Typical script content about personal development and productivity habits...',
      sceneBreakdown: Array(8)
        .fill(null)
        .map((_, i) => ({
          id: i + 1,
          narration: `Scene narration ${i + 1}`,
          duration: 10,
          visualKeywords: ['productivity', 'habits'],
          emotion: 'educational' as const,
        })),
      durationEstimate: 80,
      titles: ['Test Title'],
      description: 'Test description',
      thumbnailConcepts: [],
      keywords: ['productivity', 'habits'],
      generationParams: {
        style: 'educational' as ScriptStyle,
        targetDuration: 80,
        sceneCount: 8,
      },
    };

    const mockPost: RedditPost = {
      id: 'test',
      title: 'Test Post',
      content: 'Test content',
      author: 'test',
      subreddit: 'test',
      score: 100,
      upvotes: 100,
      comments: 10,
      created_at: new Date(),
      url: 'test',
      awards: [],
    };

    // Benchmark description generation
    const descStartTime = Date.now();
    const description = await generator.generateOptimizedDescription(
      mockScript,
      mockPost
    );
    const descEndTime = Date.now();

    // Benchmark SEO optimization
    const seoStartTime = Date.now();
    const seoResult = await optimizer.optimizeForSEO(
      'Test Title',
      description.fullDescription,
      ['test'],
      'personal-development'
    );
    const seoEndTime = Date.now();

    // Performance assertions
    expect(descEndTime - descStartTime).toBeLessThan(3000); // Description generation < 3s
    expect(seoEndTime - seoStartTime).toBeLessThan(2000); // SEO optimization < 2s

    console.log(
      'Description Generation Time:',
      descEndTime - descStartTime,
      'ms'
    );
    console.log('SEO Optimization Time:', seoEndTime - seoStartTime, 'ms');
    console.log(
      'Total Processing Time:',
      descEndTime - descStartTime + (seoEndTime - seoStartTime),
      'ms'
    );
  }, 10000);
});
