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
    // HIGH-INTENSITY EMOTIONAL TRIGGERS
    vulnerability: [
      'terrified me',
      'destroyed me',
      'cost me everything',
      'nearly killed me',
      'broke me completely',
      'saved my life',
    ],
    controversial: [
      'banned',
      'forbidden',
      'they tried to stop',
      'cover-up',
      'exposed',
      'whistleblower',
    ],
    personal_stakes: [
      'my biggest mistake',
      'nearly ruined me',
      'changed my life forever',
      'my darkest moment',
      'almost gave up',
    ],

    // UPGRADED TRADITIONAL CATEGORIES
    curiosity: [
      'secret',
      'hidden',
      'nobody talks about',
      'truth',
      'real reason',
      "what they don't tell you",
      'buried evidence',
      'shocking discovery',
    ],
    transformation: [
      'changes everything',
      'breakthrough',
      'revolutionary',
      'game-changer',
      'life-changing',
      'total transformation',
      'complete reversal',
    ],
    authority: [
      'proven',
      'research shows',
      'experts',
      'study reveals',
      'science-backed',
      'Harvard study',
      'PhD confirms',
    ],
    urgency: [
      'now',
      "before it's too late",
      'immediately',
      'stop doing',
      'start today',
      'final warning',
      'time is running out',
    ],
    social: [
      'everyone',
      'people',
      'most successful',
      'millionaires',
      'top performers',
      'elite achievers',
      'industry leaders',
    ],
    exclusivity: [
      'only',
      'exclusive',
      'insider',
      'elite',
      'advanced',
      'classified',
      'restricted',
      'members only',
    ],
    emotional: [
      'shocking',
      'incredible',
      'amazing',
      'unbelievable',
      'mind-blowing',
      'devastating',
      'life-altering',
    ],
  };

  private static readonly TITLE_TEMPLATES = [
    // TIER 1: MAXIMUM CTR POTENTIAL (15-20%)
    {
      template: 'I Tried {topic} For {timeframe} - The Results Terrified Me',
      psychologyType: 'Personal Stakes + Fear + Curiosity',
      expectedCTR: '16-20%',
      useCase: 'High-stakes personal experiments with unexpected outcomes',
      weight: 0.5,
    },
    {
      template: 'Why {authority} Banned This {method} (It Actually Works)',
      psychologyType: 'Conspiracy + Authority + Effectiveness',
      expectedCTR: '15-18%',
      useCase: 'Controversial methods that challenge establishment',
      weight: 0.45,
    },
    {
      template: 'The {problem} Mistake That Cost Me Everything',
      psychologyType: 'Loss + Vulnerability + Warning',
      expectedCTR: '14-17%',
      useCase: 'Personal failures with high stakes and lessons',
      weight: 0.4,
    },

    // TIER 2: HIGH PERFORMANCE (12-15%)
    {
      template: '{person} Did {action} For {timeframe} - {shocking_result}',
      psychologyType: 'Transformation + Shock + Specificity',
      expectedCTR: '13-16%',
      useCase: 'Dramatic transformation stories with specific timeframes',
      weight: 0.38,
    },
    {
      template: 'The {topic} Truth That No One Talks About',
      psychologyType: 'Exclusivity + Authority',
      expectedCTR: '12-15%',
      useCase: 'Controversial or contrarian insights (backup template)',
      weight: 0.3,
    },

    // TIER 3: SOLID PERFORMANCE (10-13%)
    {
      template: 'Why Everyone Gets {topic} Wrong (The Real Solution)',
      psychologyType: 'Authority + Problem/Solution',
      expectedCTR: '11-14%',
      useCase: 'Correcting common misconceptions',
      weight: 0.25,
    },
    {
      template: 'This {person} Cracked The {problem} Code',
      psychologyType: 'Social Proof + Achievement',
      expectedCTR: '10-13%',
      useCase: 'Success stories and breakthroughs',
      weight: 0.22,
    },
    {
      template: 'How {person} Went From {struggle} to {success}',
      psychologyType: 'Transformation + Social Proof',
      expectedCTR: '9-12%',
      useCase: 'Classic transformation narratives',
      weight: 0.2,
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
      title = title.replace(/{authority}/g, this.extractAuthority(analysis));
      title = title.replace(
        /{shocking_result}/g,
        this.extractShockingResult(analysis)
      );
      title = title.replace(/{action}/g, this.extractAction(analysis));
      title = title.replace(
        /{shock_outcome}/g,
        this.extractShockOutcome(analysis)
      );

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
      if (solution.toLowerCase().includes('technique')) {
        return 'Technique';
      }
      if (solution.toLowerCase().includes('hack')) {
        return 'Hack';
      }
    }
    return 'Method';
  }

  /**
   * Extract authority figure for controversial templates
   */
  private static extractAuthority(analysis: TitleGenerationAnalysis): string {
    const authorities = [
      'Doctors',
      'Scientists',
      'Experts',
      'Researchers',
      'Psychologists',
      'Nutritionists',
      'Trainers',
      'Coaches',
      'Industry Leaders',
      'Gurus',
    ];

    const theme = analysis.universalThemes[0]?.toLowerCase() || '';

    if (theme.includes('health') || theme.includes('medical')) {
      return 'Doctors';
    }
    if (theme.includes('psychology') || theme.includes('mental')) {
      return 'Psychologists';
    }
    if (theme.includes('fitness') || theme.includes('exercise')) {
      return 'Trainers';
    }
    if (theme.includes('business') || theme.includes('success')) {
      return 'Industry Leaders';
    }
    if (theme.includes('productivity') || theme.includes('performance')) {
      return 'Experts';
    }

    return authorities[Math.floor(Math.random() * authorities.length)];
  }

  /**
   * Extract shocking result for transformation templates
   */
  private static extractShockingResult(
    analysis: TitleGenerationAnalysis
  ): string {
    const baseOutcomes = analysis.successOutcomes;
    const shockingModifiers = [
      "You Won't Believe What Happened",
      'The Results Shocked Everyone',
      'This Changed Everything',
      'The Outcome Was Incredible',
      "Here's What Nobody Expected",
      'The Results Broke The Internet',
    ];

    if (baseOutcomes.length > 0) {
      const outcome = baseOutcomes[0];
      if (
        outcome.toLowerCase().includes('lost') ||
        outcome.toLowerCase().includes('weight')
      ) {
        return 'Lost 50 Pounds In 30 Days';
      }
      if (
        outcome.toLowerCase().includes('money') ||
        outcome.toLowerCase().includes('income')
      ) {
        return 'Made $10K In The First Month';
      }
      if (
        outcome.toLowerCase().includes('confidence') ||
        outcome.toLowerCase().includes('social')
      ) {
        return 'Became The Most Popular Person';
      }
      if (
        outcome.toLowerCase().includes('productivity') ||
        outcome.toLowerCase().includes('work')
      ) {
        return 'Tripled My Productivity Overnight';
      }
    }

    return shockingModifiers[
      Math.floor(Math.random() * shockingModifiers.length)
    ];
  }

  /**
   * Extract specific action for narrative templates
   */
  private static extractAction(analysis: TitleGenerationAnalysis): string {
    const solutions = analysis.solutionsProvided;
    const actions = [
      'This One Thing',
      'One Simple Change',
      'This Daily Habit',
      'This 5-Minute Rule',
      'This Mindset Shift',
      'This Simple Trick',
    ];

    if (solutions.length > 0) {
      const solution = solutions[0].toLowerCase();
      if (solution.includes('habit') || solution.includes('daily')) {
        return 'This Daily Habit';
      }
      if (solution.includes('mindset') || solution.includes('thinking')) {
        return 'This Mindset Shift';
      }
      if (solution.includes('rule') || solution.includes('principle')) {
        return 'This One Rule';
      }
      if (solution.includes('minute') || solution.includes('quick')) {
        return 'This 5-Minute Trick';
      }
    }

    return actions[Math.floor(Math.random() * actions.length)];
  }

  /**
   * Extract shock outcome for vulnerability templates
   */
  private static extractShockOutcome(
    analysis: TitleGenerationAnalysis
  ): string {
    const shockOutcomes = [
      'Terrified Me',
      'Changed Everything',
      'Broke Me Down',
      'Saved My Life',
      'Destroyed My Confidence',
      'Made Me Question Everything',
      'Left Me Speechless',
      'Nearly Killed Me',
      'Cost Me Everything',
    ];

    // Try to match content-specific outcomes
    if (analysis.successOutcomes.length > 0) {
      const outcome = analysis.successOutcomes[0].toLowerCase();
      if (outcome.includes('lost') || outcome.includes('weight')) {
        return 'Shocked Everyone';
      }
      if (outcome.includes('money') || outcome.includes('income')) {
        return 'Made Me Rich';
      }
      if (outcome.includes('relationship') || outcome.includes('marriage')) {
        return 'Saved My Marriage';
      }
      if (outcome.includes('health') || outcome.includes('energy')) {
        return 'Saved My Life';
      }
    }

    // Check for negative outcomes from pain points
    if (analysis.audiencePainPoints.length > 0) {
      const painPoint = analysis.audiencePainPoints[0].toLowerCase();
      if (painPoint.includes('anxiety') || painPoint.includes('stress')) {
        return 'Nearly Broke Me';
      }
      if (painPoint.includes('failure') || painPoint.includes('mistake')) {
        return 'Cost Me Everything';
      }
    }

    return shockOutcomes[Math.floor(Math.random() * shockOutcomes.length)];
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
   * Calculate viral potential score with advanced psychology triggers
   */
  private static calculateViralScore(
    title: string,
    analysis: TitleGenerationAnalysis
  ): number {
    let score = 0;
    const titleLower = title.toLowerCase();

    // HIGH-IMPACT TRIGGERS (NEW)
    // Personal vulnerability/stakes (highest viral potential)
    const vulnerabilityWords = this.POWER_WORDS.vulnerability;
    for (const word of vulnerabilityWords) {
      if (titleLower.includes(word.toLowerCase())) {
        score += 30; // Highest boost for personal stakes
      }
    }

    // Controversial/conspiracy elements
    const controversialWords = this.POWER_WORDS.controversial;
    for (const word of controversialWords) {
      if (titleLower.includes(word.toLowerCase())) {
        score += 25; // High boost for controversy
      }
    }

    // Personal stakes language
    const personalWords = this.POWER_WORDS.personal_stakes;
    for (const word of personalWords) {
      if (titleLower.includes(word.toLowerCase())) {
        score += 22; // High emotional connection
      }
    }

    // TRADITIONAL TRIGGERS (UPDATED)
    // Curiosity gaps (still important but less unique)
    const curiosityWords = this.POWER_WORDS.curiosity;
    for (const word of curiosityWords) {
      if (titleLower.includes(word.toLowerCase())) {
        score += 15; // Reduced from 20 due to market saturation
      }
    }

    // Emotional triggers
    const emotionalWords = this.POWER_WORDS.emotional;
    for (const word of emotionalWords) {
      if (titleLower.includes(word.toLowerCase())) {
        score += 12; // Slightly reduced
      }
    }

    // Transformation language
    const transformWords = this.POWER_WORDS.transformation;
    for (const word of transformWords) {
      if (titleLower.includes(word.toLowerCase())) {
        score += 15; // Reduced from 18
      }
    }

    // Social proof elements
    const socialWords = this.POWER_WORDS.social;
    for (const word of socialWords) {
      if (titleLower.includes(word.toLowerCase())) {
        score += 12; // Reduced from 15
      }
    }

    // BONUS MULTIPLIERS
    // First-person perspective bonus ("I tried", "My mistake", etc.)
    if (
      titleLower.includes('i ') ||
      titleLower.includes('my ') ||
      titleLower.includes('me ')
    ) {
      score += 18; // Personal stories perform better
    }

    // Specific timeframes/numbers boost credibility
    const timeNumbers = [
      '30 days',
      '7 days',
      '24 hours',
      '10 minutes',
      '5 minutes',
      '1 year',
    ];
    for (const timeNum of timeNumbers) {
      if (titleLower.includes(timeNum)) {
        score += 10;
        break;
      }
    }

    // Negative penalty for overused patterns
    if (
      titleLower.includes('story') &&
      !titleLower.includes('incredible') &&
      !titleLower.includes('terrifying')
    ) {
      score -= 10;
    }

    // Penalty for generic "how to" without personal stakes
    if (titleLower.startsWith('how to') && score < 30) {
      score -= 15;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate psychological impact score with advanced behavioral triggers
   */
  private static calculatePsychologicalScore(
    title: string,
    template: any,
    analysis: TitleGenerationAnalysis
  ): number {
    let score = 30; // Reduced base score to allow for more differentiation
    const titleLower = title.toLowerCase();

    // Template weight bonus (higher impact for new templates)
    score += template.weight * 40;

    // HIGH-IMPACT PSYCHOLOGICAL TRIGGERS
    // Loss aversion (strongest psychological trigger)
    if (
      titleLower.includes('cost me') ||
      titleLower.includes('mistake') ||
      titleLower.includes('lost everything') ||
      titleLower.includes('destroyed')
    ) {
      score += 30; // Highest psychological impact
    }

    // Fear and urgency combined
    if (
      titleLower.includes('terrified') ||
      titleLower.includes('scared') ||
      titleLower.includes('afraid')
    ) {
      score += 25;
    }

    // Social proof with specificity
    if (
      titleLower.includes('banned') ||
      titleLower.includes('forbidden') ||
      titleLower.includes('they tried to stop')
    ) {
      score += 22;
    }

    // TRADITIONAL TRIGGERS (UPDATED)
    // Authority indicators
    if (
      titleLower.includes('truth') ||
      titleLower.includes('real') ||
      titleLower.includes('proven')
    ) {
      score += 12; // Reduced from 15
    }

    // Exclusivity indicators
    if (
      titleLower.includes('nobody') ||
      titleLower.includes('no one') ||
      titleLower.includes('secret')
    ) {
      score += 15; // Reduced from 20
    }

    // Problem/solution structure
    if (
      titleLower.includes('why') &&
      (titleLower.includes('wrong') || titleLower.includes('solution'))
    ) {
      score += 12; // Reduced from 15
    }

    // Transformation indicators
    if (titleLower.includes('from') && titleLower.includes('to')) {
      score += 10; // Reduced from 12
    }

    // BEHAVIORAL PSYCHOLOGY BONUSES
    // Personal relevance (you/your)
    if (titleLower.includes('you') || titleLower.includes('your')) {
      score += 8;
    }

    // Specificity bonus (numbers, dates, exact figures)
    const specificityIndicators = /\d+|exactly|precisely|specific|detailed/;
    if (specificityIndicators.test(titleLower)) {
      score += 10;
    }

    // Negative social proof (what everyone else is doing wrong)
    if (titleLower.includes('everyone') && titleLower.includes('wrong')) {
      score += 8;
    }

    // Time pressure/urgency
    if (
      titleLower.includes('before') ||
      titleLower.includes('too late') ||
      titleLower.includes('final')
    ) {
      score += 12;
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

    // Calculate expected CTR based on improved scoring
    let expectedCTR = 3; // Base CTR
    if (avgScore > 85) {
      expectedCTR = 18; // New high-performance tier
    } else if (avgScore > 80) {
      expectedCTR = 15; // Premium tier
    } else if (avgScore > 75) {
      expectedCTR = 12; // High performance
    } else if (avgScore > 70) {
      expectedCTR = 9;
    } else if (avgScore > 60) {
      expectedCTR = 7;
    } else if (avgScore > 50) {
      expectedCTR = 5;
    }

    // Determine viral potential with new thresholds
    let viralPotential: 'Low' | 'Medium' | 'High' | 'Viral' = 'Low';
    if (title.viralScore > 80) {
      viralPotential = 'Viral'; // Lowered threshold due to new high-impact triggers
    } else if (title.viralScore > 65) {
      viralPotential = 'High';
    } else if (title.viralScore > 45) {
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
