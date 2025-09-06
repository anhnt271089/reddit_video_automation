/**
 * Advanced YouTube Title Generation System
 * Optimized for SEO, CTR, and Viral Potential
 *
 * Based on expert YouTube Growth Strategy recommendations
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

export interface OptimizedTitle {
  title: string;
  template: string;
  psychologyType: string;
  expectedCTR: string;
  useCase: string;
  seoKeywords: string[];
  characterCount: number;
  seoScore: number;
  viralScore: number;
  psychologicalScore: number;
  overallScore: number;
}

export interface TitlePerformancePrediction {
  expectedCTR: number;
  viralPotential: 'Low' | 'Medium' | 'High' | 'Viral';
  seoRanking: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  audienceEngagement: 'Low' | 'Medium' | 'High';
  overallRating: number;
}

export class YouTubeTitleGenerator {
  private static readonly POWER_WORDS = {
    curiosity: [
      'secret',
      'hidden',
      'nobody talks about',
      'truth',
      'real reason',
      "what they don't tell you",
    ],
    transformation: [
      'changes everything',
      'breakthrough',
      'revolutionary',
      'game-changer',
      'life-changing',
    ],
    authority: [
      'proven',
      'research shows',
      'experts',
      'study reveals',
      'science-backed',
    ],
    urgency: [
      'now',
      "before it's too late",
      'immediately',
      'stop doing',
      'start today',
    ],
    social: [
      'everyone',
      'people',
      'most successful',
      'millionaires',
      'top performers',
    ],
    exclusivity: ['only', 'exclusive', 'insider', 'elite', 'advanced'],
    emotional: [
      'shocking',
      'incredible',
      'amazing',
      'unbelievable',
      'mind-blowing',
    ],
  };

  private static readonly TITLE_TEMPLATES = [
    {
      template: 'The {topic} Truth That No One Talks About',
      psychologyType: 'Exclusivity + Authority',
      expectedCTR: '12-15%',
      useCase: 'Controversial or contrarian insights',
      weight: 0.4,
    },
    {
      template: 'Why Everyone Gets {topic} Wrong (The Real Solution)',
      psychologyType: 'Authority + Problem/Solution',
      expectedCTR: '11-14%',
      useCase: 'Correcting common misconceptions',
      weight: 0.3,
    },
    {
      template: 'This {person} Cracked The {problem} Code',
      psychologyType: 'Social Proof + Achievement',
      expectedCTR: '10-13%',
      useCase: 'Success stories and breakthroughs',
      weight: 0.25,
    },
    {
      template: 'How {person} Went From {struggle} to {success}',
      psychologyType: 'Transformation + Social Proof',
      expectedCTR: '9-12%',
      useCase: 'Classic transformation narratives',
      weight: 0.3,
    },
    {
      template: 'The {timeframe} {method} That Changes Everything',
      psychologyType: 'Urgency + Transformation',
      expectedCTR: '8-11%',
      useCase: 'Time-bound solutions and methods',
      weight: 0.35,
    },
  ];

  /**
   * Generate 5 optimized titles based on content analysis
   */
  public static generateOptimizedTitles(
    analysis: TitleGenerationAnalysis
  ): OptimizedTitle[] {
    const titles: OptimizedTitle[] = [];

    // Generate titles for each template
    for (const template of this.TITLE_TEMPLATES) {
      const generatedTitle = this.generateTitleFromTemplate(template, analysis);
      if (generatedTitle) {
        titles.push(generatedTitle);
      }
    }

    // Sort by overall score and return top 5
    return titles.sort((a, b) => b.overallScore - a.overallScore).slice(0, 5);
  }

  /**
   * Generate a single title from a template
   */
  private static generateTitleFromTemplate(
    template: any,
    analysis: TitleGenerationAnalysis
  ): OptimizedTitle | null {
    try {
      let title = template.template;
      const seoKeywords: string[] = [];

      // Replace placeholders with content-specific terms
      title = title.replace(/{topic}/g, this.extractTopic(analysis));
      title = title.replace(/{person}/g, this.extractPersona(analysis));
      title = title.replace(/{problem}/g, this.extractProblem(analysis));
      title = title.replace(/{success}/g, this.extractSuccess(analysis));
      title = title.replace(/{struggle}/g, this.extractStruggle(analysis));
      title = title.replace(/{timeframe}/g, this.extractTimeframe(analysis));
      title = title.replace(/{method}/g, this.extractMethod(analysis));

      // Add SEO keywords
      seoKeywords.push(...analysis.universalThemes.slice(0, 2));
      seoKeywords.push(...analysis.psychologicalTriggers.slice(0, 1));

      // Calculate scores
      const characterCount = title.length;
      const seoScore = this.calculateSEOScore(title, seoKeywords, analysis);
      const viralScore = this.calculateViralScore(title, analysis);
      const psychologicalScore = this.calculatePsychologicalScore(
        title,
        template,
        analysis
      );

      const overallScore =
        viralScore * 0.4 + psychologicalScore * 0.4 + seoScore * 0.2;

      return {
        title,
        template: template.template,
        psychologyType: template.psychologyType,
        expectedCTR: template.expectedCTR,
        useCase: template.useCase,
        seoKeywords,
        characterCount,
        seoScore,
        viralScore,
        psychologicalScore,
        overallScore,
      };
    } catch (error) {
      console.error('Error generating title from template:', error);
      return null;
    }
  }

  /**
   * Extract topic from analysis
   */
  private static extractTopic(analysis: TitleGenerationAnalysis): string {
    const theme = analysis.universalThemes[0] || 'Success';
    return theme.charAt(0).toUpperCase() + theme.slice(1).toLowerCase();
  }

  /**
   * Extract persona/person from analysis
   */
  private static extractPersona(analysis: TitleGenerationAnalysis): string {
    const personas = [
      'Student',
      'Professional',
      'Person',
      'Individual',
      'Entrepreneur',
    ];
    // Try to extract from content or use default
    if (analysis.coreTransformation.toLowerCase().includes('student')) {
      return 'Student';
    }
    if (
      analysis.coreTransformation.toLowerCase().includes('work') ||
      analysis.coreTransformation.toLowerCase().includes('job')
    ) {
      return 'Professional';
    }
    return personas[Math.floor(Math.random() * personas.length)];
  }

  /**
   * Extract main problem from analysis
   */
  private static extractProblem(analysis: TitleGenerationAnalysis): string {
    if (analysis.mainProblems.length > 0) {
      const problem = analysis.mainProblems[0];
      // Extract key noun from problem description
      const words = problem.split(' ');
      for (const word of words) {
        if (
          word.length > 4 &&
          !['with', 'from', 'that', 'this', 'they'].includes(word.toLowerCase())
        ) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
      }
    }
    return (
      analysis.universalThemes[0]?.charAt(0).toUpperCase() +
        analysis.universalThemes[0]?.slice(1) || 'Challenge'
    );
  }

  /**
   * Extract success outcome from analysis
   */
  private static extractSuccess(analysis: TitleGenerationAnalysis): string {
    if (analysis.successOutcomes.length > 0) {
      return analysis.successOutcomes[0].replace(/^./, c => c.toUpperCase());
    }
    return 'Success';
  }

  /**
   * Extract struggle from pain points
   */
  private static extractStruggle(analysis: TitleGenerationAnalysis): string {
    if (analysis.audiencePainPoints.length > 0) {
      const struggle = analysis.audiencePainPoints[0];
      // Convert to simple struggle term
      if (struggle.toLowerCase().includes('stuck')) {
        return 'Stuck';
      }
      if (struggle.toLowerCase().includes('motivation')) {
        return 'No Motivation';
      }
      if (struggle.toLowerCase().includes('time')) {
        return 'No Time';
      }
      return struggle.substring(0, 20);
    }
    return 'Struggle';
  }

  /**
   * Extract or generate timeframe
   */
  private static extractTimeframe(analysis: TitleGenerationAnalysis): string {
    const timeframes = [
      '7-Day',
      '30-Day',
      '90-Day',
      'Simple',
      'Quick',
      'Ultimate',
    ];
    return timeframes[Math.floor(Math.random() * timeframes.length)];
  }

  /**
   * Extract method from solutions
   */
  private static extractMethod(analysis: TitleGenerationAnalysis): string {
    if (analysis.solutionsProvided.length > 0) {
      const solution = analysis.solutionsProvided[0];
      if (solution.toLowerCase().includes('method')) {
        return 'Method';
      }
      if (solution.toLowerCase().includes('system')) {
        return 'System';
      }
      if (solution.toLowerCase().includes('strategy')) {
        return 'Strategy';
      }
      if (solution.toLowerCase().includes('approach')) {
        return 'Approach';
      }
    }
    return 'Method';
  }

  /**
   * Calculate SEO score based on keywords and length
   */
  private static calculateSEOScore(
    title: string,
    keywords: string[],
    analysis: TitleGenerationAnalysis
  ): number {
    let score = 0;

    // Character length optimization (50-60 is ideal)
    const length = title.length;
    if (length >= 50 && length <= 60) {
      score += 30;
    } else if (length >= 40 && length <= 70) {
      score += 20;
    } else {
      score += 10;
    }

    // Keyword presence
    const titleLower = title.toLowerCase();
    for (const keyword of keywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        score += 15;
      }
    }

    // Power word presence
    let powerWordCount = 0;
    for (const category of Object.values(this.POWER_WORDS)) {
      for (const word of category) {
        if (titleLower.includes(word.toLowerCase())) {
          powerWordCount++;
          score += 10;
        }
      }
    }

    // Avoid keyword stuffing penalty
    if (powerWordCount > 3) {
      score -= 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate viral potential score
   */
  private static calculateViralScore(
    title: string,
    analysis: TitleGenerationAnalysis
  ): number {
    let score = 0;
    const titleLower = title.toLowerCase();

    // Emotional triggers
    const emotionalWords = this.POWER_WORDS.emotional;
    for (const word of emotionalWords) {
      if (titleLower.includes(word)) {
        score += 15;
      }
    }

    // Curiosity gaps
    const curiosityWords = this.POWER_WORDS.curiosity;
    for (const word of curiosityWords) {
      if (titleLower.includes(word)) {
        score += 20;
      }
    }

    // Social proof elements
    const socialWords = this.POWER_WORDS.social;
    for (const word of socialWords) {
      if (titleLower.includes(word)) {
        score += 15;
      }
    }

    // Transformation language
    const transformWords = this.POWER_WORDS.transformation;
    for (const word of transformWords) {
      if (titleLower.includes(word)) {
        score += 18;
      }
    }

    // Negative penalty for generic titles
    if (
      titleLower.includes('story') &&
      !titleLower.includes('incredible') &&
      !titleLower.includes('amazing')
    ) {
      score -= 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate psychological impact score
   */
  private static calculatePsychologicalScore(
    title: string,
    template: any,
    analysis: TitleGenerationAnalysis
  ): number {
    let score = 40; // Base score
    const titleLower = title.toLowerCase();

    // Template weight bonus
    score += template.weight * 30;

    // Authority indicators
    if (
      titleLower.includes('truth') ||
      titleLower.includes('real') ||
      titleLower.includes('proven')
    ) {
      score += 15;
    }

    // Exclusivity indicators
    if (
      titleLower.includes('nobody') ||
      titleLower.includes('no one') ||
      titleLower.includes('secret')
    ) {
      score += 20;
    }

    // Problem/solution structure
    if (
      titleLower.includes('why') &&
      (titleLower.includes('wrong') || titleLower.includes('solution'))
    ) {
      score += 15;
    }

    // Transformation indicators
    if (titleLower.includes('from') && titleLower.includes('to')) {
      score += 12;
    }

    // Personal connection
    if (titleLower.includes('you') || titleLower.includes('your')) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Predict title performance
   */
  public static predictPerformance(
    title: OptimizedTitle
  ): TitlePerformancePrediction {
    const avgScore =
      (title.seoScore + title.viralScore + title.psychologicalScore) / 3;

    // Calculate expected CTR based on scores
    let expectedCTR = 3; // Base CTR
    if (avgScore > 80) {
      expectedCTR = 12;
    } else if (avgScore > 70) {
      expectedCTR = 9;
    } else if (avgScore > 60) {
      expectedCTR = 7;
    } else if (avgScore > 50) {
      expectedCTR = 5;
    }

    // Determine viral potential
    let viralPotential: 'Low' | 'Medium' | 'High' | 'Viral' = 'Low';
    if (title.viralScore > 85) {
      viralPotential = 'Viral';
    } else if (title.viralScore > 70) {
      viralPotential = 'High';
    } else if (title.viralScore > 50) {
      viralPotential = 'Medium';
    }

    // Determine SEO ranking potential
    let seoRanking: 'Poor' | 'Fair' | 'Good' | 'Excellent' = 'Poor';
    if (title.seoScore > 80) {
      seoRanking = 'Excellent';
    } else if (title.seoScore > 65) {
      seoRanking = 'Good';
    } else if (title.seoScore > 45) {
      seoRanking = 'Fair';
    }

    // Determine audience engagement
    let audienceEngagement: 'Low' | 'Medium' | 'High' = 'Low';
    if (title.psychologicalScore > 75) {
      audienceEngagement = 'High';
    } else if (title.psychologicalScore > 55) {
      audienceEngagement = 'Medium';
    }

    return {
      expectedCTR,
      viralPotential,
      seoRanking,
      audienceEngagement,
      overallRating: Math.round(avgScore),
    };
  }
}
