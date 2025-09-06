/**
 * Advanced YouTube Description Generation System
 * Optimized for SEO, Engagement, and Algorithm Performance
 *
 * Based on expert YouTube Growth Strategy recommendations
 */

import { TitleGenerationAnalysis } from './youtubeTitleGenerator';

export interface YouTubeDescription {
  description: string;
  seoScore: number;
  engagementScore: number;
  characterCount: number;
  hashtags: string[];
  timestamps: TimestampEntry[];
  callsToAction: string[];
  metadata: DescriptionMetadata;
}

export interface TimestampEntry {
  time: string;
  title: string;
  engagementValue: number;
}

export interface DescriptionMetadata {
  keywordDensity: number;
  readabilityScore: number;
  emotionalTriggers: string[];
  socialProofElements: string[];
  conversionHooks: string[];
}

export interface TargetAudience {
  demographics: string;
  interests: string[];
  painPoints: string[];
  motivations: string[];
}

export class YouTubeDescriptionGenerator {
  private static readonly ENGAGEMENT_HOOKS = [
    'What part of this story hit different for you?',
    'Drop a 🧠 if this changed your perspective',
    'Share your own transformation moment below',
    'Which insight are you going to implement first?',
    'Tag someone who needs to see this',
    "What's your biggest takeaway from this story?",
  ];

  private static readonly CTA_TEMPLATES = [
    '🔔 Subscribe for more psychology-backed insights',
    '👍 Hit that like button if this resonated with you',
    '💬 Comment your thoughts below - I read every one',
    '📢 Share this with someone who needs to see it',
    '🔗 Check out more transformation stories in our playlist',
    '📱 Follow us for daily motivation and growth tips',
  ];

  private static readonly SEO_POWER_PHRASES = [
    'psychological principles',
    'transformation strategies',
    'personal development',
    'mindset shift',
    'success habits',
    'breakthrough insights',
    'proven methods',
    'research-backed',
    'life-changing',
    'step-by-step guide',
  ];

  /**
   * Generate optimized YouTube description
   */
  public static async generateOptimizedDescription(
    script: any,
    analysis: TitleGenerationAnalysis,
    targetAudience?: TargetAudience
  ): Promise<YouTubeDescription> {
    // Strategic hook - Algorithm optimized opening
    const hook = this.generateStrategicHook(analysis);

    // Main content with SEO optimization
    const mainContent = this.generateSEOOptimizedContent(
      analysis,
      targetAudience
    );

    // Key insights with engagement drivers
    const insights = this.generateKeyInsights(analysis);

    // Skip timestamps generation since we cannot confirm video timing
    const timestamps: TimestampEntry[] = [];

    // Strategic CTAs with conversion optimization
    const ctas = this.generateStrategicCTAs(analysis);

    // Hashtag strategy
    const hashtags = this.generateHashtagStrategy(analysis);

    // Social proof elements
    const socialProof = this.generateSocialProof(analysis);

    // Combine all elements
    const description = this.combineDescriptionElements({
      hook,
      mainContent,
      insights,
      timestamps,
      ctas,
      hashtags,
      socialProof,
    });

    // Calculate scores
    const seoScore = this.calculateSEOScore(description, analysis);
    const engagementScore = this.calculateEngagementScore(
      description,
      analysis
    );

    // Generate metadata
    const metadata = this.generateMetadata(description, analysis);

    return {
      description,
      seoScore,
      engagementScore,
      characterCount: description.length,
      hashtags,
      timestamps,
      callsToAction: ctas,
      metadata,
    };
  }

  /**
   * Generate strategic hook for maximum algorithm performance
   */
  private static generateStrategicHook(
    analysis: TitleGenerationAnalysis
  ): string {
    const hooks = [
      `This ${analysis.universalThemes[0]} story reveals the psychological principles behind real transformation.`,
      `What you're about to discover will completely change how you think about ${analysis.universalThemes[0]}.`,
      `The psychology behind this ${analysis.universalThemes[0]} breakthrough is absolutely mind-blowing.`,
      `This isn't just another ${analysis.universalThemes[0]} story - it's a masterclass in human psychology.`,
      `The hidden psychology in this Reddit story will transform your approach to ${analysis.universalThemes[0]}.`,
    ];

    return hooks[Math.floor(Math.random() * hooks.length)];
  }

  /**
   * Generate SEO-optimized main content
   */
  private static generateSEOOptimizedContent(
    analysis: TitleGenerationAnalysis,
    targetAudience?: TargetAudience
  ): string {
    const primaryTheme = analysis.universalThemes[0] || 'personal growth';
    const secondaryTheme = analysis.universalThemes[1] || 'transformation';

    let content = `\n\nIn this compelling analysis, we dive deep into the psychological principles that make ${primaryTheme} strategies actually work. `;

    if (targetAudience) {
      content += `Perfect for ${targetAudience.demographics} who are serious about ${secondaryTheme}. `;
    }

    content += `This research-backed approach combines proven methods with real-world application, giving you a step-by-step blueprint for lasting change.\n\n`;

    return content;
  }

  /**
   * Generate key insights with psychological triggers
   */
  private static generateKeyInsights(
    analysis: TitleGenerationAnalysis
  ): string {
    const insights = [
      analysis.actionableInsights[0] ||
        'The mindset shift that changes everything',
      analysis.actionableInsights[1] ||
        'Why most people fail at lasting change',
      analysis.actionableInsights[2] || 'The specific steps you can take today',
      `The psychology behind successful ${analysis.universalThemes[0] || 'transformation'}`,
      'How to maintain momentum when motivation fades',
      'The surprising truth about sustainable growth',
    ];

    let content = "🧠 What you'll discover:\n";
    insights.slice(0, 6).forEach((insight, index) => {
      const bullet = ['•', '◦', '▪', '→', '✓', '★'][index % 6];
      content += `${bullet} ${insight}\n`;
    });

    return content + '\n';
  }

  /**
   * Generate timestamps with engagement optimization
   */
  private static generateTimestamps(
    script: any,
    analysis: TitleGenerationAnalysis
  ): TimestampEntry[] {
    const baseTimestamps = [
      {
        time: '0:00',
        title: 'The Setup - Understanding the Challenge',
        engagementValue: 85,
      },
      {
        time: '1:30',
        title: 'The Psychology Behind the Problem',
        engagementValue: 90,
      },
      { time: '3:15', title: 'The Breakthrough Moment', engagementValue: 95 },
      {
        time: '5:00',
        title: 'The Science-Backed Solution',
        engagementValue: 88,
      },
      {
        time: '7:20',
        title: 'Practical Implementation Steps',
        engagementValue: 92,
      },
      {
        time: '9:10',
        title: 'Key Takeaways & Next Steps',
        engagementValue: 87,
      },
    ];

    // Customize based on analysis
    if (analysis.universalThemes.length > 0) {
      baseTimestamps[1].title = `The Psychology Behind ${analysis.universalThemes[0]}`;
      baseTimestamps[3].title = `The ${analysis.universalThemes[0]} Solution That Works`;
    }

    return baseTimestamps;
  }

  /**
   * Generate strategic calls-to-action
   */
  private static generateStrategicCTAs(
    analysis: TitleGenerationAnalysis
  ): string[] {
    const ctas = [
      ...this.CTA_TEMPLATES.slice(0, 3),
      `🎯 What's your experience with ${analysis.universalThemes[0]}? Share below!`,
      `💡 Which of these ${analysis.universalThemes[0]} insights will you try first?`,
    ];

    return ctas;
  }

  /**
   * Generate strategic hashtag optimization
   */
  private static generateHashtagStrategy(
    analysis: TitleGenerationAnalysis
  ): string[] {
    const hashtags = [
      ...analysis.universalThemes.map(theme =>
        theme.replace(/\s+/g, '').toLowerCase()
      ),
      'psychology',
      'transformation',
      'personalgrowth',
      'mindset',
      'success',
      'motivation',
      'selfimprovement',
      'lifehacks',
      'productivity',
      'mentalhealth',
      'breakthrough',
      'inspiration',
      'reddit',
      'storytelling',
    ];

    // Return unique hashtags, limited to 15 for optimal performance
    return [...new Set(hashtags)].slice(0, 15);
  }

  /**
   * Generate social proof elements
   */
  private static generateSocialProof(
    analysis: TitleGenerationAnalysis
  ): string {
    const proofElements = [
      'Based on psychological research and real transformation stories',
      'Thousands have used these principles for lasting change',
      'Backed by behavioral psychology and proven case studies',
      'Join our community of growth-minded individuals',
    ];

    return proofElements[Math.floor(Math.random() * proofElements.length)];
  }

  /**
   * Combine all description elements strategically
   */
  private static combineDescriptionElements(elements: any): string {
    let description = elements.hook;
    description += elements.mainContent;
    description += elements.insights;

    // Skip timestamps section completely since we cannot confirm video timing

    // Add social proof
    description += `${elements.socialProof}\n\n`;

    // Add CTAs
    elements.ctas.forEach((cta: string) => {
      description += `${cta}\n`;
    });
    description += '\n';

    // Add engagement hooks
    const randomHook =
      this.ENGAGEMENT_HOOKS[
        Math.floor(Math.random() * this.ENGAGEMENT_HOOKS.length)
      ];
    description += `💭 ${randomHook}\n\n`;

    // Add hashtags
    description += `#${elements.hashtags.join(' #')}`;

    return description;
  }

  /**
   * Calculate SEO score (0-100)
   */
  private static calculateSEOScore(
    description: string,
    analysis: TitleGenerationAnalysis
  ): number {
    let score = 0;
    const descLower = description.toLowerCase();

    // Keyword presence (40 points)
    analysis.universalThemes.forEach(theme => {
      if (descLower.includes(theme.toLowerCase())) {
        score += 8;
      }
    });

    // SEO power phrases (30 points)
    this.SEO_POWER_PHRASES.forEach(phrase => {
      if (descLower.includes(phrase)) {
        score += 5;
      }
    });

    // Length optimization (20 points)
    const length = description.length;
    if (length >= 200 && length <= 500) {
      score += 20;
    } else if (length >= 150 && length <= 600) {
      score += 15;
    } else if (length >= 100) {
      score += 10;
    }

    // Hashtag optimization (10 points)
    const hashtagCount = (description.match(/#/g) || []).length;
    if (hashtagCount >= 10 && hashtagCount <= 15) {
      score += 10;
    } else if (hashtagCount >= 5) {
      score += 5;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate engagement score (0-100)
   */
  private static calculateEngagementScore(
    description: string,
    analysis: TitleGenerationAnalysis
  ): number {
    let score = 0;
    const descLower = description.toLowerCase();

    // Question/engagement triggers (30 points)
    const questionCount = (description.match(/\?/g) || []).length;
    score += Math.min(questionCount * 5, 30);

    // Emotional triggers (25 points)
    const emotionalWords = [
      'incredible',
      'amazing',
      'shocking',
      'mind-blowing',
      'powerful',
      'inspiring',
    ];
    emotionalWords.forEach(word => {
      if (descLower.includes(word)) {
        score += 4;
      }
    });

    // Call-to-action presence (20 points)
    const ctaWords = ['subscribe', 'like', 'comment', 'share', 'follow'];
    ctaWords.forEach(word => {
      if (descLower.includes(word)) {
        score += 4;
      }
    });

    // Personal connection words (15 points)
    const personalWords = ['you', 'your', 'yourself'];
    personalWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = description.match(regex) || [];
      score += Math.min(matches.length, 5);
    });

    // Social proof indicators (10 points)
    if (
      descLower.includes('research') ||
      descLower.includes('proven') ||
      descLower.includes('thousands')
    ) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Generate metadata for analytics
   */
  private static generateMetadata(
    description: string,
    analysis: TitleGenerationAnalysis
  ): DescriptionMetadata {
    const descLower = description.toLowerCase();

    // Calculate keyword density
    const totalWords = description.split(/\s+/).length;
    const keywordCount = analysis.universalThemes.reduce((count, theme) => {
      const regex = new RegExp(`\\b${theme.toLowerCase()}\\b`, 'gi');
      return count + (description.match(regex) || []).length;
    }, 0);
    const keywordDensity = (keywordCount / totalWords) * 100;

    // Emotional triggers
    const emotionalTriggers = this.SEO_POWER_PHRASES.filter(phrase =>
      descLower.includes(phrase)
    );

    // Social proof elements
    const socialProofElements = [
      'research',
      'proven',
      'thousands',
      'community',
    ].filter(element => descLower.includes(element));

    // Conversion hooks
    const conversionHooks = ['subscribe', 'like', 'comment', 'share'].filter(
      hook => descLower.includes(hook)
    );

    return {
      keywordDensity,
      readabilityScore: this.calculateReadabilityScore(description),
      emotionalTriggers,
      socialProofElements,
      conversionHooks,
    };
  }

  /**
   * Calculate readability score using simple metrics
   */
  private static calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = words.length / sentences.length;

    // Simple readability metric (lower is better, we invert for score)
    const complexity = avgWordsPerSentence;
    let score = 100;

    if (complexity > 20) {
      score -= 30;
    } else if (complexity > 15) {
      score -= 20;
    } else if (complexity > 12) {
      score -= 10;
    }

    return Math.max(score, 0);
  }
}
