/**
 * YOUTUBE VIRAL TITLE GENERATION SYSTEM
 *
 * Advanced title generation optimized for:
 * - Maximum CTR (Click-Through Rate) 10%+ target
 * - SEO optimization and algorithm favorability
 * - Psychological triggers and emotional engagement
 * - Viral potential and shareability
 * - Character length optimization (50-60 chars ideal)
 *
 * Specifically designed for Reddit story transformation content
 */

export interface TitleGenerationAnalysis {
  coreTransformation: string;
  universalThemes: string[];
  hookElements: string[];
  emotionalJourney: string[];
  audiencePainPoints: string[];
  psychologicalTriggers: string[];
  successOutcomes: string[];
  mainProblems: string[];
  solutionsProvided: string[];
  actionableInsights: string[];
}

export interface TitleTemplate {
  template: string;
  psychologicalTrigger:
    | 'curiosity'
    | 'fear'
    | 'urgency'
    | 'social_proof'
    | 'authority'
    | 'scarcity'
    | 'exclusivity';
  expectedCTR: string;
  bestUseCase: string;
  seoKeywords: string[];
  powerWords: string[];
  characterRange: string;
  viralPotential: 'high' | 'medium' | 'low';
}

export interface GeneratedTitle {
  title: string;
  characterCount: number;
  seoScore: number;
  viralScore: number;
  psychologicalScore: number;
  template: TitleTemplate;
  keywords: string[];
}

export class YouTubeTitleGenerator {
  private static powerWords = [
    // High-impact attention grabbers
    'shocking',
    'unbelievable',
    'incredible',
    'amazing',
    'mind-blowing',
    'life-changing',
    'game-changing',
    'revolutionary',
    'breakthrough',

    // Exclusivity and scarcity
    'secret',
    'hidden',
    'forbidden',
    'exclusive',
    'nobody talks about',
    "they don't want you to know",
    'insider',
    'leaked',
    'revealed',

    // Urgency and FOMO
    'now',
    'today',
    'immediately',
    "before it's too late",
    'urgent',
    'limited time',
    'act fast',
    "don't miss",
    'final chance',

    // Transformation promises
    'transform',
    'change everything',
    'revolutionize',
    'unlock',
    'master',
    'dominate',
    'crush',
    'destroy',
    'eliminate',

    // Emotional triggers
    'devastating',
    'heartbreaking',
    'inspiring',
    'touching',
    'powerful',
    'emotional',
    'tear-jerking',
    'uplifting',

    // Authority and proof
    'proven',
    'guaranteed',
    'scientific',
    'expert',
    'professional',
    'certified',
    'tested',
    'verified',
    'research-backed',
  ];

  private static viralFormulas = [
    // Pattern interrupt formulas
    "What {AUTHORITY_FIGURE} Don't Tell You About {TOPIC}",
    'The {TOPIC} Lie Everyone Believes',
    'Why {COMMON_BELIEF} Is Completely Wrong',

    // Curiosity gap formulas
    'This {AGE}-Year-Old Discovered {SHOCKING_THING}',
    "You Won't Believe What Happened When {PERSON} {ACTION}",
    "The {TOPIC} Method That {AUTHORITY} Doesn't Want You to Know",

    // Social proof formulas
    '{NUMBER} People Changed Their Lives With This {TOPIC} Secret',
    'How {PERSON} Went From {BEFORE} to {AFTER} in {TIMEFRAME}',
    'The {TOPIC} Strategy That Made {PERSON} {OUTCOME}',

    // Urgent revelation formulas
    'The {TOPIC} Truth That Changes Everything',
    'Why Everyone Gets {TOPIC} Wrong (And How to Get It Right)',
    "The Real Reason {PROBLEM} Happens (It's Not What You Think)",
  ];

  /**
   * MASTER TITLE GENERATION FUNCTION
   * Generates 5 highly optimized titles based on content analysis
   */
  public static generateOptimizedTitles(
    analysis: TitleGenerationAnalysis
  ): GeneratedTitle[] {
    const titleTemplates = this.getOptimizedTemplates();
    const generatedTitles: GeneratedTitle[] = [];

    // Generate one title for each template type
    titleTemplates.forEach((template, index) => {
      const title = this.buildTitleFromTemplate(template, analysis);
      const metrics = this.calculateTitleMetrics(title, template, analysis);

      generatedTitles.push({
        title,
        characterCount: title.length,
        seoScore: metrics.seoScore,
        viralScore: metrics.viralScore,
        psychologicalScore: metrics.psychologicalScore,
        template,
        keywords: metrics.keywords,
      });
    });

    // Sort by combined score (viral + psychological + SEO)
    return generatedTitles.sort((a, b) => {
      const scoreA =
        a.viralScore * 0.4 + a.psychologicalScore * 0.4 + a.seoScore * 0.2;
      const scoreB =
        b.viralScore * 0.4 + b.psychologicalScore * 0.4 + b.seoScore * 0.2;
      return scoreB - scoreA;
    });
  }

  /**
   * HIGHLY OPTIMIZED TITLE TEMPLATES
   * Each template targets specific psychological triggers with proven viral potential
   */
  private static getOptimizedTemplates(): TitleTemplate[] {
    return [
      {
        template: 'The {TRANSFORMATION} Truth That No One Talks About',
        psychologicalTrigger: 'exclusivity',
        expectedCTR: '12-15%',
        bestUseCase: 'Revealing hidden insights or controversial truths',
        seoKeywords: ['truth', 'hidden', 'secret', 'revealed'],
        powerWords: ['truth', 'no one talks about', 'hidden', 'revealed'],
        characterRange: '45-55',
        viralPotential: 'high',
      },
      {
        template: 'Why Everyone Gets {TOPIC} Wrong (The Real Solution)',
        psychologicalTrigger: 'authority',
        expectedCTR: '11-14%',
        bestUseCase: 'Debunking common misconceptions with expert knowledge',
        seoKeywords: ['why', 'wrong', 'real solution', 'truth'],
        powerWords: ['everyone gets wrong', 'real solution', 'truth'],
        characterRange: '48-58',
        viralPotential: 'high',
      },
      {
        template: 'This {DEMOGRAPHIC} Cracked The {PROBLEM} Code',
        psychologicalTrigger: 'social_proof',
        expectedCTR: '10-13%',
        bestUseCase: 'Success stories with relatable protagonists',
        seoKeywords: ['cracked', 'code', 'solution', 'breakthrough'],
        powerWords: ['cracked the code', 'breakthrough', 'discovered'],
        characterRange: '40-50',
        viralPotential: 'high',
      },
      {
        template: 'How {PERSON} Went From {STRUGGLE} to {SUCCESS}',
        psychologicalTrigger: 'curiosity',
        expectedCTR: '9-12%',
        bestUseCase: 'Transformation stories with clear before/after',
        seoKeywords: ['how', 'transformation', 'from', 'to', 'success'],
        powerWords: ['transformation', 'breakthrough', 'success'],
        characterRange: '45-55',
        viralPotential: 'medium',
      },
      {
        template: 'The {TIMEFRAME} {TOPIC} Method That Changes Everything',
        psychologicalTrigger: 'urgency',
        expectedCTR: '8-11%',
        bestUseCase: 'Quick transformation methods with immediate impact',
        seoKeywords: ['method', 'changes everything', 'quick', 'fast'],
        powerWords: ['changes everything', 'method', 'breakthrough'],
        characterRange: '50-60',
        viralPotential: 'medium',
      },
    ];
  }

  /**
   * INTELLIGENT TITLE BUILDING
   * Dynamically constructs titles using content analysis and psychological optimization
   */
  private static buildTitleFromTemplate(
    template: TitleTemplate,
    analysis: TitleGenerationAnalysis
  ): string {
    let title = template.template;

    // Replace dynamic placeholders with content-aware substitutions
    title = title.replace(
      '{TRANSFORMATION}',
      this.selectTransformation(analysis)
    );
    title = title.replace('{TOPIC}', this.selectTopic(analysis));
    title = title.replace('{PROBLEM}', this.selectProblem(analysis));
    title = title.replace('{DEMOGRAPHIC}', this.selectDemographic(analysis));
    title = title.replace('{PERSON}', this.selectPerson(analysis));
    title = title.replace('{STRUGGLE}', this.selectStruggle(analysis));
    title = title.replace('{SUCCESS}', this.selectSuccess(analysis));
    title = title.replace('{TIMEFRAME}', this.selectTimeframe(analysis));

    // Optimize character length (50-60 chars ideal)
    title = this.optimizeLength(title, 60);

    // Ensure title starts with capital and ends properly
    return this.finalizeTitle(title);
  }

  /**
   * CONTENT-AWARE SUBSTITUTION METHODS
   * Select the most impactful words based on analysis
   */
  private static selectTransformation(
    analysis: TitleGenerationAnalysis
  ): string {
    const transformations = [
      analysis.universalThemes[0]?.replace(/[^a-zA-Z\s]/g, '').trim(),
      'Life-Changing',
      'Mind-Blowing',
      'Game-Changing',
      'Revolutionary',
    ].filter(Boolean);

    return this.capitalizeWords(transformations[0] || 'Life-Changing');
  }

  private static selectTopic(analysis: TitleGenerationAnalysis): string {
    const topics = [
      analysis.universalThemes[0]?.replace(/[^a-zA-Z\s]/g, '').trim(),
      'Personal Growth',
      'Success',
      'Life Transformation',
      'Mindset',
    ].filter(Boolean);

    return this.capitalizeWords(topics[0] || 'Personal Growth');
  }

  private static selectProblem(analysis: TitleGenerationAnalysis): string {
    const problems = [
      this.extractKeyword(analysis.mainProblems[0]),
      this.extractKeyword(analysis.audiencePainPoints[0]),
      'Productivity',
      'Success',
      'Growth',
    ].filter(Boolean);

    return this.capitalizeWords(problems[0] || 'Success');
  }

  private static selectDemographic(analysis: TitleGenerationAnalysis): string {
    // Extract age or demographic hints from the transformation
    const transformation = analysis.coreTransformation.toLowerCase();

    if (
      transformation.includes('student') ||
      transformation.includes('college')
    ) {
      return 'Student';
    }
    if (transformation.includes('young') || transformation.includes('20')) {
      return '20-Year-Old';
    }
    if (
      transformation.includes('professional') ||
      transformation.includes('career')
    ) {
      return 'Professional';
    }
    if (
      transformation.includes('parent') ||
      transformation.includes('mom') ||
      transformation.includes('dad')
    ) {
      return 'Parent';
    }

    return 'Person'; // Safe default
  }

  private static selectPerson(analysis: TitleGenerationAnalysis): string {
    return 'This Person'; // Keep anonymous for broader appeal
  }

  private static selectStruggle(analysis: TitleGenerationAnalysis): string {
    const struggles = [
      this.extractKeyword(analysis.mainProblems[0]),
      this.extractKeyword(analysis.audiencePainPoints[0]),
      'Struggling',
      'Stuck',
      'Lost',
    ].filter(Boolean);

    return this.capitalizeWords(struggles[0] || 'Struggling');
  }

  private static selectSuccess(analysis: TitleGenerationAnalysis): string {
    const successes = [
      this.extractKeyword(analysis.successOutcomes[0]),
      'Success',
      'Breakthrough',
      'Transformation',
      'Achievement',
    ].filter(Boolean);

    return this.capitalizeWords(successes[0] || 'Success');
  }

  private static selectTimeframe(analysis: TitleGenerationAnalysis): string {
    // Look for time indicators in the content
    const transformation = analysis.coreTransformation.toLowerCase();

    if (transformation.includes('day') || transformation.includes('daily')) {
      return '30-Day';
    }
    if (transformation.includes('week')) {
      return '7-Day';
    }
    if (transformation.includes('month')) {
      return '3-Month';
    }
    if (transformation.includes('year')) {
      return '1-Year';
    }
    if (transformation.includes('minute') || transformation.includes('quick')) {
      return '10-Minute';
    }

    return 'Simple'; // Default to emphasize simplicity
  }

  /**
   * UTILITY METHODS
   */
  private static extractKeyword(text: string | undefined): string {
    if (!text) {
      return '';
    }

    // Extract the most important noun or adjective
    const words = text
      .split(/\s+/)
      .filter(
        word =>
          word.length > 3 &&
          !['the', 'and', 'but', 'for', 'with', 'this', 'that'].includes(
            word.toLowerCase()
          )
      );

    return words[0] || '';
  }

  private static capitalizeWords(text: string): string {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private static optimizeLength(title: string, maxLength: number): string {
    if (title.length <= maxLength) {
      return title;
    }

    // Try to trim at word boundaries
    const words = title.split(' ');
    let optimized = '';

    for (const word of words) {
      if ((optimized + ' ' + word).trim().length > maxLength) {
        break;
      }
      optimized = optimized ? optimized + ' ' + word : word;
    }

    return optimized || title.substring(0, maxLength - 3) + '...';
  }

  private static finalizeTitle(title: string): string {
    // Ensure proper capitalization and punctuation
    title = title.trim();
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // Remove trailing punctuation except for question marks and exclamations
    if (title.endsWith('.') || title.endsWith(',')) {
      title = title.slice(0, -1);
    }

    return title;
  }

  /**
   * ADVANCED METRICS CALCULATION
   * Scores titles on multiple dimensions for optimization
   */
  private static calculateTitleMetrics(
    title: string,
    template: TitleTemplate,
    analysis: TitleGenerationAnalysis
  ): {
    seoScore: number;
    viralScore: number;
    psychologicalScore: number;
    keywords: string[];
  } {
    const titleLower = title.toLowerCase();
    let seoScore = 0;
    let viralScore = 0;
    let psychologicalScore = 0;
    const keywords: string[] = [];

    // SEO SCORING (0-100)
    // Character length optimization (50-60 ideal)
    if (title.length >= 45 && title.length <= 65) {
      seoScore += 25;
    } else if (title.length >= 40 && title.length <= 70) {
      seoScore += 15;
    } else {
      seoScore += 5;
    }

    // Keyword presence
    template.seoKeywords.forEach(keyword => {
      if (titleLower.includes(keyword.toLowerCase())) {
        seoScore += 10;
        keywords.push(keyword);
      }
    });

    // Power words count
    let powerWordCount = 0;
    this.powerWords.forEach(powerWord => {
      if (titleLower.includes(powerWord.toLowerCase())) {
        powerWordCount++;
        keywords.push(powerWord);
      }
    });
    seoScore += Math.min(powerWordCount * 5, 25);

    // VIRAL SCORING (0-100)
    // Template viral potential
    viralScore +=
      template.viralPotential === 'high'
        ? 40
        : template.viralPotential === 'medium'
          ? 25
          : 10;

    // Emotional intensity
    const emotionalWords = [
      'shocking',
      'amazing',
      'incredible',
      'unbelievable',
      'mind-blowing',
      'life-changing',
    ];
    emotionalWords.forEach(word => {
      if (titleLower.includes(word)) {
        viralScore += 10;
      }
    });

    // Curiosity gap indicators
    const curiosityWords = [
      'secret',
      'truth',
      'hidden',
      'nobody talks',
      "don't want you to know",
      'real reason',
    ];
    curiosityWords.forEach(word => {
      if (titleLower.includes(word)) {
        viralScore += 15;
      }
    });

    // PSYCHOLOGICAL SCORING (0-100)
    // Psychological trigger strength
    const triggerStrength = {
      curiosity: 30,
      fear: 25,
      urgency: 25,
      social_proof: 20,
      authority: 30,
      scarcity: 35,
      exclusivity: 40,
    };
    psychologicalScore += triggerStrength[template.psychologicalTrigger] || 15;

    // Pain point resonance
    analysis.audiencePainPoints.forEach(painPoint => {
      const painKeywords = painPoint.toLowerCase().split(' ');
      painKeywords.forEach(keyword => {
        if (keyword.length > 3 && titleLower.includes(keyword)) {
          psychologicalScore += 10;
        }
      });
    });

    // Transformation promise
    analysis.successOutcomes.forEach(outcome => {
      const outcomeKeywords = outcome.toLowerCase().split(' ');
      outcomeKeywords.forEach(keyword => {
        if (keyword.length > 3 && titleLower.includes(keyword)) {
          psychologicalScore += 5;
        }
      });
    });

    // Normalize scores to 0-100 range
    seoScore = Math.min(seoScore, 100);
    viralScore = Math.min(viralScore, 100);
    psychologicalScore = Math.min(psychologicalScore, 100);

    return {
      seoScore,
      viralScore,
      psychologicalScore,
      keywords: [...new Set(keywords)], // Remove duplicates
    };
  }

  /**
   * CONTEXTUAL TITLE VARIATIONS
   * Generate variations for A/B testing
   */
  public static generateTitleVariations(
    baseTitle: GeneratedTitle,
    analysis: TitleGenerationAnalysis,
    count: number = 3
  ): GeneratedTitle[] {
    const variations: GeneratedTitle[] = [baseTitle];

    // Generate variations by modifying key elements
    for (let i = 1; i < count + 1; i++) {
      const template =
        this.getOptimizedTemplates()[i % this.getOptimizedTemplates().length];
      const variation = this.buildTitleFromTemplate(template, analysis);
      const metrics = this.calculateTitleMetrics(variation, template, analysis);

      variations.push({
        title: variation,
        characterCount: variation.length,
        seoScore: metrics.seoScore,
        viralScore: metrics.viralScore,
        psychologicalScore: metrics.psychologicalScore,
        template,
        keywords: metrics.keywords,
      });
    }

    return variations;
  }

  /**
   * TITLE PERFORMANCE PREDICTOR
   * Estimates performance metrics based on title characteristics
   */
  public static predictPerformance(title: GeneratedTitle): {
    estimatedCTR: string;
    viralPotential: 'high' | 'medium' | 'low';
    audienceMatch: string;
    recommendedTesting: string;
  } {
    const combinedScore =
      title.viralScore * 0.4 +
      title.psychologicalScore * 0.4 +
      title.seoScore * 0.2;

    let estimatedCTR: string;
    let viralPotential: 'high' | 'medium' | 'low';
    let audienceMatch: string;

    if (combinedScore >= 80) {
      estimatedCTR = '12-15%';
      viralPotential = 'high';
      audienceMatch = 'Excellent - appeals to core transformation audience';
    } else if (combinedScore >= 65) {
      estimatedCTR = '9-12%';
      viralPotential = 'medium';
      audienceMatch = 'Good - solid appeal with room for optimization';
    } else {
      estimatedCTR = '6-9%';
      viralPotential = 'low';
      audienceMatch = 'Fair - may need refinement for better performance';
    }

    const recommendedTesting =
      combinedScore >= 75
        ? 'Ready for immediate deployment with A/B variants'
        : 'Test against higher-scoring alternatives';

    return {
      estimatedCTR,
      viralPotential,
      audienceMatch,
      recommendedTesting,
    };
  }

  /**
   * DEMONSTRATION FUNCTION
   * Shows how the title generation system works with example Reddit content
   */
  public static demonstrateTitleGeneration(): void {
    console.log('🎬 YOUTUBE TITLE GENERATION SYSTEM DEMONSTRATION\n');

    // Example Reddit story analysis
    const exampleAnalysis: TitleGenerationAnalysis = {
      coreTransformation:
        'From procrastination paralysis to productivity master through the 10-minute rule',
      universalThemes: [
        'productivity',
        'habit formation',
        'overcoming procrastination',
      ],
      hookElements: [
        'simple technique',
        'dramatic results',
        'anyone can do it',
      ],
      emotionalJourney: ['frustration', 'curiosity', 'hope', 'empowerment'],
      audiencePainPoints: [
        'chronic procrastination',
        'feeling overwhelmed',
        'lack of motivation',
      ],
      psychologicalTriggers: [
        'fear of failure',
        'desire for control',
        'hope for change',
      ],
      successOutcomes: [
        'increased productivity',
        'reduced stress',
        'better work-life balance',
      ],
      mainProblems: [
        'task avoidance',
        'mental overwhelm',
        'perfectionism paralysis',
      ],
      solutionsProvided: [
        '10-minute commitment technique',
        'breaking mental barriers',
        'momentum building',
      ],
      actionableInsights: [
        'Small commitments eliminate psychological resistance',
        'Starting is harder than continuing',
        'Progress beats perfection',
      ],
    };

    // Generate optimized titles
    const titles = this.generateOptimizedTitles(exampleAnalysis);

    console.log('📊 GENERATED TITLES (Ranked by Performance Score):\n');

    titles.forEach((title, index) => {
      const performance = this.predictPerformance(title);
      const combinedScore = Math.round(
        title.viralScore * 0.4 +
          title.psychologicalScore * 0.4 +
          title.seoScore * 0.2
      );

      console.log(`${index + 1}. "${title.title}"`);
      console.log(`   📏 Length: ${title.characterCount} chars`);
      console.log(
        `   🎯 Psychological Trigger: ${title.template.psychologicalTrigger}`
      );
      console.log(`   📈 Expected CTR: ${performance.estimatedCTR}`);
      console.log(
        `   🚀 Viral Potential: ${performance.viralPotential.toUpperCase()}`
      );
      console.log(
        `   🔢 Scores - SEO: ${title.seoScore}/100 | Viral: ${title.viralScore}/100 | Psychology: ${title.psychologicalScore}/100`
      );
      console.log(`   ⭐ Combined Score: ${combinedScore}/100`);
      console.log(`   💡 Best Use Case: ${title.template.bestUseCase}`);
      console.log(
        `   🏷️  Keywords: ${title.keywords.slice(0, 5).join(', ')}\n`
      );
    });

    console.log('🎯 TITLE FORMULA PATTERNS FOR REDDIT STORY CONTENT:\n');

    const patterns = [
      {
        pattern: 'The [Problem] Truth That No One Talks About',
        ctr: '12-15%',
        psychology: 'Exclusivity + Authority',
        example: 'The Procrastination Truth That No One Talks About',
      },
      {
        pattern: 'Why Everyone Gets [Topic] Wrong (The Real Solution)',
        ctr: '11-14%',
        psychology: 'Authority + Problem/Solution',
        example: 'Why Everyone Gets Productivity Wrong (The Real Solution)',
      },
      {
        pattern: 'This [Person] Cracked The [Challenge] Code',
        ctr: '10-13%',
        psychology: 'Social Proof + Achievement',
        example: 'This Student Cracked The Focus Code',
      },
      {
        pattern: 'How [Person] Went From [Problem] to [Success]',
        ctr: '9-12%',
        psychology: 'Transformation + Curiosity',
        example: 'How This Person Went From Burnout to Balance',
      },
      {
        pattern: 'The [Timeframe] [Method] That Changes Everything',
        ctr: '8-11%',
        psychology: 'Urgency + Transformation',
        example: 'The 10-Minute Method That Changes Everything',
      },
    ];

    patterns.forEach((pattern, index) => {
      console.log(`${index + 1}. Pattern: "${pattern.pattern}"`);
      console.log(`   📊 Expected CTR: ${pattern.ctr}`);
      console.log(`   🧠 Psychology: ${pattern.psychology}`);
      console.log(`   💡 Example: "${pattern.example}"\n`);
    });

    console.log('🎨 POWER WORDS FOR MAXIMUM IMPACT:\n');

    const powerWordCategories = {
      'Curiosity/Exclusivity': [
        'secret',
        'hidden',
        'nobody talks about',
        "don't want you to know",
        'revealed',
        'exposed',
      ],
      Transformation: [
        'changes everything',
        'revolutionary',
        'breakthrough',
        'game-changing',
        'life-changing',
      ],
      'Authority/Trust': [
        'truth',
        'real reason',
        'science behind',
        'proven',
        'research shows',
      ],
      'Urgency/Action': [
        'now',
        'today',
        'immediately',
        "before it's too late",
        'final chance',
      ],
      'Social Proof': [
        'everyone',
        'most people',
        'successful people',
        'experts',
        'professionals',
      ],
    };

    Object.entries(powerWordCategories).forEach(([category, words]) => {
      console.log(`${category}: ${words.join(', ')}`);
    });

    console.log('\n✅ Title Generation System Ready for Production Use!');
  }
}
