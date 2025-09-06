/**
 * ADVANCED SEO OPTIMIZATION SYSTEM
 * Elite SEO engine for YouTube content optimization
 */

export interface SEOKeywordAnalysis {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  trend: 'rising' | 'stable' | 'declining';
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  semanticVariations: string[];
  relatedQueries: string[];
}

export interface ContentSEOScore {
  overallScore: number;
  keywordOptimization: number;
  contentStructure: number;
  readability: number;
  semanticRelevance: number;
  userIntent: number;
  recommendations: string[];
}

export interface LSIKeywordCluster {
  primaryTerm: string;
  relatedTerms: string[];
  semanticWeight: number;
  contextualRelevance: number;
}

export class AdvancedSEOOptimizer {
  private keywordDatabase: Map<string, SEOKeywordAnalysis> = new Map();
  private semanticEngine: SemanticAnalysisEngine;
  private contentAnalyzer: ContentAnalyzer;
  private competitionAnalyzer: CompetitionAnalyzer;

  constructor() {
    this.semanticEngine = new SemanticAnalysisEngine();
    this.contentAnalyzer = new ContentAnalyzer();
    this.competitionAnalyzer = new CompetitionAnalyzer();
    this.initializeKeywordDatabase();
  }

  /**
   * MASTER SEO OPTIMIZATION
   * Analyzes and optimizes content for maximum search visibility
   */
  async optimizeForSEO(
    title: string,
    content: string,
    targetKeywords: string[] = [],
    niche: string = 'personal-development'
  ): Promise<{
    optimizedTitle: string;
    optimizedDescription: string;
    keywordStrategy: SEOKeywordAnalysis[];
    lsiClusters: LSIKeywordCluster[];
    seoScore: ContentSEOScore;
    competitorAnalysis: any;
  }> {
    console.log('🎯 Starting advanced SEO optimization...');

    // Phase 1: Keyword Research & Analysis
    const primaryKeywords = await this.extractPrimaryKeywords(
      title,
      content,
      targetKeywords
    );
    const keywordAnalysis = await this.analyzeKeywords(primaryKeywords, niche);
    const lsiClusters = await this.generateLSIClusters(
      primaryKeywords,
      content
    );

    // Phase 2: Competition Analysis
    const competitorAnalysis =
      await this.competitionAnalyzer.analyzeCompetition(primaryKeywords, niche);

    // Phase 3: Content Optimization
    const optimizedTitle = await this.optimizeTitle(
      title,
      keywordAnalysis,
      competitorAnalysis
    );
    const optimizedDescription = await this.optimizeDescription(
      content,
      keywordAnalysis,
      lsiClusters
    );

    // Phase 4: SEO Scoring
    const seoScore = await this.calculateSEOScore(
      optimizedTitle,
      optimizedDescription,
      keywordAnalysis
    );

    console.log('✅ Advanced SEO optimization completed');
    console.log(`📊 SEO Score: ${seoScore.overallScore}/100`);

    return {
      optimizedTitle,
      optimizedDescription,
      keywordStrategy: keywordAnalysis,
      lsiClusters,
      seoScore,
      competitorAnalysis,
    };
  }

  /**
   * KEYWORD EXTRACTION & ANALYSIS
   * Advanced keyword extraction using NLP and semantic analysis
   */
  private async extractPrimaryKeywords(
    title: string,
    content: string,
    targetKeywords: string[]
  ): Promise<string[]> {
    const combinedText = `${title} ${content}`.toLowerCase();

    // High-value seed keywords for personal development niche
    const seedKeywords = [
      'personal growth',
      'self improvement',
      'mindset',
      'transformation',
      'success habits',
      'motivation',
      'psychology',
      'life change',
      'productivity',
      'goal achievement',
      'mental health',
      'confidence',
      'leadership',
      'emotional intelligence',
      'resilience',
      'discipline',
    ];

    // Extract contextual keywords
    const contextKeywords = this.extractContextualKeywords(combinedText);

    // Combine and prioritize
    const allKeywords = [
      ...targetKeywords,
      ...seedKeywords,
      ...contextKeywords,
    ];
    const relevantKeywords = allKeywords.filter(
      keyword =>
        combinedText.includes(keyword.toLowerCase()) ||
        this.semanticEngine.isSemanticallySimilar(combinedText, keyword)
    );

    // Score and rank keywords
    const rankedKeywords = await this.rankKeywordsByPotential(
      relevantKeywords,
      combinedText
    );

    return rankedKeywords.slice(0, 10);
  }

  /**
   * CONTEXTUAL KEYWORD EXTRACTION
   * Extracts meaningful keywords from content using advanced NLP
   */
  private extractContextualKeywords(text: string): string[] {
    const keywords = [];

    // Concept extraction patterns
    const conceptPatterns = [
      // Psychology concepts
      /\b(cognitive\s+bias|neuroplasticity|dopamine|serotonin|mindfulness|meditation)\b/gi,
      // Success concepts
      /\b(goal\s+setting|time\s+management|habit\s+formation|compound\s+effect)\b/gi,
      // Transformation concepts
      /\b(breakthrough|paradigm\s+shift|life\s+change|personal\s+transformation)\b/gi,
      // Skill concepts
      /\b(emotional\s+intelligence|critical\s+thinking|problem\s+solving|decision\s+making)\b/gi,
    ];

    conceptPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches.map(match => match.toLowerCase().trim()));
      }
    });

    // Entity extraction (people, methods, techniques)
    const entities = this.extractEntities(text);
    keywords.push(...entities);

    // Action-based keywords
    const actionKeywords = this.extractActionKeywords(text);
    keywords.push(...actionKeywords);

    return [...new Set(keywords)].filter(kw => kw.length > 3);
  }

  /**
   * ENTITY EXTRACTION
   * Extracts proper nouns, techniques, and methodologies
   */
  private extractEntities(text: string): string[] {
    const entities = [];

    // Famous methodologies and frameworks
    const methodologies = [
      'pomodoro technique',
      'getting things done',
      'atomic habits',
      'okr',
      'smart goals',
      'eisenhower matrix',
      'pareto principle',
      'kaizen',
      'stoicism',
      'cognitive behavioral therapy',
      'growth mindset',
    ];

    methodologies.forEach(method => {
      if (text.toLowerCase().includes(method)) {
        entities.push(method);
      }
    });

    // Extract capitalized terms (potential proper nouns)
    const capitalizedTerms = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (capitalizedTerms) {
      entities.push(
        ...capitalizedTerms.filter(
          term => term.length > 3 && !this.isCommonWord(term.toLowerCase())
        )
      );
    }

    return entities.map(e => e.toLowerCase());
  }

  /**
   * ACTION KEYWORD EXTRACTION
   * Extracts actionable keywords that indicate user intent
   */
  private extractActionKeywords(text: string): string[] {
    const actionPatterns = [
      /\b(how\s+to\s+\w+(?:\s+\w+){0,3})/gi,
      /\b(ways\s+to\s+\w+(?:\s+\w+){0,3})/gi,
      /\b(steps\s+to\s+\w+(?:\s+\w+){0,3})/gi,
      /\b(guide\s+to\s+\w+(?:\s+\w+){0,3})/gi,
      /\b(tips\s+for\s+\w+(?:\s+\w+){0,3})/gi,
    ];

    const actionKeywords = [];
    actionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        actionKeywords.push(
          ...matches.map(match => match.toLowerCase().trim())
        );
      }
    });

    return actionKeywords;
  }

  /**
   * KEYWORD RANKING BY POTENTIAL
   * Ranks keywords based on SEO potential and relevance
   */
  private async rankKeywordsByPotential(
    keywords: string[],
    content: string
  ): Promise<string[]> {
    const keywordScores = keywords.map(keyword => {
      const relevanceScore = this.calculateRelevanceScore(keyword, content);
      const commercialScore = this.calculateCommercialValue(keyword);
      const competitionScore = this.estimateCompetitionLevel(keyword);
      const trendScore = this.estimateTrendScore(keyword);

      const totalScore =
        relevanceScore * 0.3 +
        commercialScore * 0.2 +
        competitionScore * 0.3 +
        trendScore * 0.2;

      return { keyword, score: totalScore };
    });

    return keywordScores
      .sort((a, b) => b.score - a.score)
      .map(item => item.keyword);
  }

  /**
   * RELEVANCE SCORING
   * Calculates how relevant a keyword is to the content
   */
  private calculateRelevanceScore(keyword: string, content: string): number {
    const keywordWords = keyword.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    const totalWords = contentWords.length;

    let matches = 0;
    keywordWords.forEach(word => {
      matches += contentWords.filter(
        contentWord => contentWord.includes(word) || word.includes(contentWord)
      ).length;
    });

    const density = (matches / totalWords) * 100;
    const proximity = this.calculateKeywordProximity(
      keywordWords,
      contentWords
    );

    return Math.min(100, density * 50 + proximity * 50);
  }

  /**
   * KEYWORD PROXIMITY CALCULATION
   * Measures how close related keywords appear in content
   */
  private calculateKeywordProximity(
    keywordWords: string[],
    contentWords: string[]
  ): number {
    if (keywordWords.length < 2) {
      return 100;
    }

    const positions = keywordWords
      .map(kw =>
        contentWords.findIndex(cw => cw.includes(kw) || kw.includes(cw))
      )
      .filter(pos => pos !== -1);

    if (positions.length < 2) {
      return 0;
    }

    const maxDistance = Math.max(...positions) - Math.min(...positions);
    const proximityScore = Math.max(0, 100 - maxDistance * 2);

    return proximityScore;
  }

  /**
   * COMMERCIAL VALUE CALCULATION
   * Estimates the commercial potential of a keyword
   */
  private calculateCommercialValue(keyword: string): number {
    const highValueTerms = [
      'course',
      'training',
      'coaching',
      'program',
      'system',
      'method',
      'guide',
      'blueprint',
      'strategy',
      'technique',
      'solution',
      'secret',
    ];

    const commercialIndicators = [
      'best',
      'top',
      'review',
      'comparison',
      'vs',
      'alternative',
      'price',
      'cost',
      'buy',
      'purchase',
      'subscribe',
      'premium',
    ];

    let score = 30; // Base score

    highValueTerms.forEach(term => {
      if (keyword.toLowerCase().includes(term)) {
        score += 15;
      }
    });

    commercialIndicators.forEach(indicator => {
      if (keyword.toLowerCase().includes(indicator)) {
        score += 10;
      }
    });

    return Math.min(100, score);
  }

  /**
   * COMPETITION LEVEL ESTIMATION
   * Estimates competition level for a keyword
   */
  private estimateCompetitionLevel(keyword: string): number {
    const keywordLength = keyword.length;
    const wordCount = keyword.split(/\s+/).length;

    // Longer, more specific keywords typically have less competition
    let competitionScore = 100;

    if (wordCount >= 4) {
      competitionScore -= 30;
    } else if (wordCount >= 3) {
      competitionScore -= 20;
    } else if (wordCount >= 2) {
      competitionScore -= 10;
    }

    if (keywordLength > 20) {
      competitionScore -= 20;
    } else if (keywordLength > 15) {
      competitionScore -= 15;
    } else if (keywordLength > 10) {
      competitionScore -= 10;
    }

    // Niche-specific terms have lower competition
    const nicheTerms = [
      'psychology',
      'neuroscience',
      'cognitive',
      'behavioral',
    ];
    nicheTerms.forEach(term => {
      if (keyword.toLowerCase().includes(term)) {
        competitionScore -= 15;
      }
    });

    return Math.max(10, competitionScore);
  }

  /**
   * TREND SCORING
   * Estimates trending potential of keywords
   */
  private estimateTrendScore(keyword: string): number {
    const trendingTerms2024 = [
      'ai',
      'automation',
      'remote work',
      'digital detox',
      'mental health',
      'sustainability',
      'mindfulness',
      'productivity',
      'side hustle',
      'financial literacy',
      'emotional intelligence',
      'resilience',
    ];

    let trendScore = 50; // Base score

    trendingTerms2024.forEach(term => {
      if (keyword.toLowerCase().includes(term)) {
        trendScore += 20;
      }
    });

    // Bonus for action-oriented keywords
    if (keyword.includes('how to') || keyword.includes('guide')) {
      trendScore += 15;
    }
    if (keyword.includes('2024') || keyword.includes('2025')) {
      trendScore += 10;
    }

    return Math.min(100, trendScore);
  }

  /**
   * KEYWORD ANALYSIS
   * Performs detailed analysis of selected keywords
   */
  private async analyzeKeywords(
    keywords: string[],
    niche: string
  ): Promise<SEOKeywordAnalysis[]> {
    return keywords.map(keyword => {
      const analysis =
        this.keywordDatabase.get(keyword) ||
        this.generateKeywordAnalysis(keyword, niche);
      this.keywordDatabase.set(keyword, analysis);
      return analysis;
    });
  }

  /**
   * GENERATE KEYWORD ANALYSIS
   * Creates comprehensive analysis for a keyword
   */
  private generateKeywordAnalysis(
    keyword: string,
    niche: string
  ): SEOKeywordAnalysis {
    const baseVolume = this.estimateSearchVolume(keyword, niche);
    const difficulty = this.estimateKeywordDifficulty(keyword);
    const cpc = this.estimateCPC(keyword);

    return {
      keyword,
      searchVolume: baseVolume,
      difficulty,
      cpc,
      trend: this.determineTrend(keyword),
      intent: this.determineSearchIntent(keyword),
      semanticVariations: this.generateSemanticVariations(keyword),
      relatedQueries: this.generateRelatedQueries(keyword),
    };
  }

  /**
   * SEARCH VOLUME ESTIMATION
   * Estimates monthly search volume for keywords
   */
  private estimateSearchVolume(keyword: string, niche: string): number {
    const baseVolumes = {
      'personal development': 45000,
      productivity: 35000,
      motivation: 60000,
      psychology: 25000,
      success: 80000,
      habits: 30000,
      mindset: 40000,
      'self improvement': 55000,
    };

    const keywordLower = keyword.toLowerCase();
    let estimatedVolume = 5000; // Base volume

    // Check for high-volume base terms
    Object.entries(baseVolumes).forEach(([term, volume]) => {
      if (keywordLower.includes(term)) {
        estimatedVolume = volume;
      }
    });

    // Adjust based on keyword characteristics
    const wordCount = keyword.split(/\s+/).length;
    if (wordCount >= 4) {
      estimatedVolume *= 0.3;
    } else if (wordCount >= 3) {
      estimatedVolume *= 0.5;
    } else if (wordCount >= 2) {
      estimatedVolume *= 0.7;
    }

    // Action keywords typically have higher volume
    if (keywordLower.includes('how to')) {
      estimatedVolume *= 1.5;
    }
    if (keywordLower.includes('best')) {
      estimatedVolume *= 1.3;
    }
    if (keywordLower.includes('guide')) {
      estimatedVolume *= 1.2;
    }

    return Math.round(estimatedVolume);
  }

  /**
   * KEYWORD DIFFICULTY ESTIMATION
   * Estimates ranking difficulty (0-100)
   */
  private estimateKeywordDifficulty(keyword: string): number {
    let difficulty = 50; // Base difficulty

    const wordCount = keyword.split(/\s+/).length;
    const keywordLength = keyword.length;

    // More specific keywords are typically easier
    if (wordCount >= 4) {
      difficulty -= 25;
    } else if (wordCount >= 3) {
      difficulty -= 15;
    } else if (wordCount >= 2) {
      difficulty -= 5;
    }

    if (keywordLength > 25) {
      difficulty -= 15;
    } else if (keywordLength > 15) {
      difficulty -= 10;
    }

    // High-competition terms
    const competitiveTerms = [
      'success',
      'money',
      'business',
      'marketing',
      'fitness',
    ];
    competitiveTerms.forEach(term => {
      if (keyword.toLowerCase().includes(term)) {
        difficulty += 20;
      }
    });

    // Low-competition niches
    const nicheTerms = ['psychology', 'neuroscience', 'cognitive bias'];
    nicheTerms.forEach(term => {
      if (keyword.toLowerCase().includes(term)) {
        difficulty -= 10;
      }
    });

    return Math.max(10, Math.min(90, difficulty));
  }

  /**
   * CPC ESTIMATION
   * Estimates cost-per-click for advertising
   */
  private estimateCPC(keyword: string): number {
    const baseCPC = {
      business: 8.5,
      marketing: 7.2,
      finance: 6.8,
      health: 4.5,
      education: 3.2,
      psychology: 2.8,
      productivity: 3.5,
      motivation: 2.1,
    };

    let estimatedCPC = 1.5; // Base CPC

    Object.entries(baseCPC).forEach(([term, cpc]) => {
      if (keyword.toLowerCase().includes(term)) {
        estimatedCPC = Math.max(estimatedCPC, cpc);
      }
    });

    // Commercial intent increases CPC
    if (this.determineSearchIntent(keyword) === 'commercial') {
      estimatedCPC *= 1.5;
    } else if (this.determineSearchIntent(keyword) === 'transactional') {
      estimatedCPC *= 2.0;
    }

    return Math.round(estimatedCPC * 100) / 100;
  }

  /**
   * TREND DETERMINATION
   * Determines if keyword is rising, stable, or declining
   */
  private determineTrend(keyword: string): 'rising' | 'stable' | 'declining' {
    const risingTerms = [
      'ai',
      'automation',
      'remote',
      'digital',
      'virtual',
      'online',
      'mental health',
      'mindfulness',
      '2024',
      '2025',
    ];

    const decliningTerms = [
      'traditional',
      'old school',
      'classic',
      '2020',
      '2021',
    ];

    const keywordLower = keyword.toLowerCase();

    if (risingTerms.some(term => keywordLower.includes(term))) {
      return 'rising';
    } else if (decliningTerms.some(term => keywordLower.includes(term))) {
      return 'declining';
    }

    return 'stable';
  }

  /**
   * SEARCH INTENT DETERMINATION
   * Determines the search intent behind a keyword
   */
  private determineSearchIntent(
    keyword: string
  ): 'informational' | 'commercial' | 'transactional' | 'navigational' {
    const keywordLower = keyword.toLowerCase();

    // Transactional intent
    const transactionalTerms = [
      'buy',
      'purchase',
      'order',
      'subscribe',
      'download',
      'get',
      'pricing',
    ];
    if (transactionalTerms.some(term => keywordLower.includes(term))) {
      return 'transactional';
    }

    // Commercial intent
    const commercialTerms = [
      'best',
      'top',
      'review',
      'comparison',
      'vs',
      'alternative',
      'recommended',
    ];
    if (commercialTerms.some(term => keywordLower.includes(term))) {
      return 'commercial';
    }

    // Navigational intent
    const navigationalTerms = ['login', 'website', 'official', 'homepage'];
    if (navigationalTerms.some(term => keywordLower.includes(term))) {
      return 'navigational';
    }

    // Default to informational
    return 'informational';
  }

  /**
   * SEMANTIC VARIATIONS GENERATION
   * Generates semantic variations of keywords
   */
  private generateSemanticVariations(keyword: string): string[] {
    const variations = [];
    const synonymMap = {
      'personal growth': [
        'self development',
        'personal development',
        'self improvement',
      ],
      success: ['achievement', 'accomplishment', 'winning', 'victory'],
      mindset: ['mentality', 'attitude', 'perspective', 'thinking'],
      habits: ['routines', 'practices', 'behaviors', 'patterns'],
      psychology: ['mental', 'cognitive', 'behavioral', 'psychological'],
      motivation: ['inspiration', 'drive', 'ambition', 'determination'],
    };

    const keywordLower = keyword.toLowerCase();
    Object.entries(synonymMap).forEach(([term, synonyms]) => {
      if (keywordLower.includes(term)) {
        synonyms.forEach(synonym => {
          variations.push(keywordLower.replace(term, synonym));
        });
      }
    });

    // Add plural/singular variations
    if (keyword.endsWith('s') && keyword.length > 4) {
      variations.push(keyword.slice(0, -1));
    } else if (!keyword.endsWith('s')) {
      variations.push(keyword + 's');
    }

    // Add action variations
    if (!keywordLower.includes('how to')) {
      variations.push(`how to ${keyword}`);
    }
    if (!keywordLower.includes('guide')) {
      variations.push(`${keyword} guide`);
    }

    return [...new Set(variations)].slice(0, 5);
  }

  /**
   * RELATED QUERIES GENERATION
   * Generates related search queries
   */
  private generateRelatedQueries(keyword: string): string[] {
    const queries = [];
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'which'];

    questionWords.forEach(qw => {
      if (qw === 'what') {
        queries.push(`what is ${keyword}`);
        queries.push(`what are the benefits of ${keyword}`);
      } else if (qw === 'how') {
        queries.push(`how to improve ${keyword}`);
        queries.push(`how does ${keyword} work`);
      } else if (qw === 'why') {
        queries.push(`why is ${keyword} important`);
      }
    });

    // Add comparative queries
    queries.push(`${keyword} vs`);
    queries.push(`best ${keyword}`);
    queries.push(`${keyword} tips`);
    queries.push(`${keyword} examples`);

    return queries.slice(0, 8);
  }

  /**
   * LSI CLUSTER GENERATION
   * Generates Latent Semantic Indexing keyword clusters
   */
  private async generateLSIClusters(
    keywords: string[],
    content: string
  ): Promise<LSIKeywordCluster[]> {
    const clusters = [];

    for (const keyword of keywords.slice(0, 5)) {
      // Top 5 keywords
      const relatedTerms = await this.semanticEngine.findRelatedTerms(
        keyword,
        content
      );
      const semanticWeight = this.calculateSemanticWeight(keyword, content);
      const contextualRelevance = this.calculateContextualRelevance(
        keyword,
        relatedTerms,
        content
      );

      clusters.push({
        primaryTerm: keyword,
        relatedTerms,
        semanticWeight,
        contextualRelevance,
      });
    }

    return clusters;
  }

  /**
   * SEMANTIC WEIGHT CALCULATION
   * Calculates the semantic importance of a keyword in context
   */
  private calculateSemanticWeight(keyword: string, content: string): number {
    const keywordFrequency = (
      content.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []
    ).length;
    const contentLength = content.split(/\s+/).length;
    const tfScore = (keywordFrequency / contentLength) * 100;

    // Adjust for keyword prominence (appears in first/last 10% of content)
    const firstPortion = content.substring(0, content.length * 0.1);
    const lastPortion = content.substring(content.length * 0.9);

    let prominenceBonus = 0;
    if (firstPortion.toLowerCase().includes(keyword.toLowerCase())) {
      prominenceBonus += 20;
    }
    if (lastPortion.toLowerCase().includes(keyword.toLowerCase())) {
      prominenceBonus += 10;
    }

    return Math.min(100, tfScore * 10 + prominenceBonus);
  }

  /**
   * CONTEXTUAL RELEVANCE CALCULATION
   * Calculates how relevant related terms are in context
   */
  private calculateContextualRelevance(
    keyword: string,
    relatedTerms: string[],
    content: string
  ): number {
    const contentLower = content.toLowerCase();
    let relevantTerms = 0;

    relatedTerms.forEach(term => {
      if (contentLower.includes(term.toLowerCase())) {
        relevantTerms++;
      }
    });

    return relatedTerms.length > 0
      ? (relevantTerms / relatedTerms.length) * 100
      : 0;
  }

  /**
   * TITLE OPTIMIZATION
   * Optimizes title for SEO and CTR
   */
  private async optimizeTitle(
    originalTitle: string,
    keywordAnalysis: SEOKeywordAnalysis[],
    competitorAnalysis: any
  ): Promise<string> {
    const primaryKeyword = keywordAnalysis[0]?.keyword || 'transformation';
    const secondaryKeyword = keywordAnalysis[1]?.keyword || 'mindset';

    // High-CTR title templates optimized for SEO
    const titleTemplates = [
      `${primaryKeyword}: The ${secondaryKeyword} Secret Nobody Talks About`,
      `How ${primaryKeyword} Changed Everything (${secondaryKeyword} Breakthrough)`,
      `The Truth About ${primaryKeyword} - ${secondaryKeyword} Revealed`,
      `${primaryKeyword} vs ${secondaryKeyword}: What Really Works in 2024`,
      `Why ${primaryKeyword} Fails (And How ${secondaryKeyword} Fixes It)`,
    ];

    // Select best template based on keyword analysis
    return this.selectOptimalTitle(
      titleTemplates,
      keywordAnalysis,
      originalTitle
    );
  }

  /**
   * DESCRIPTION OPTIMIZATION
   * Creates SEO-optimized description with natural keyword integration
   */
  private async optimizeDescription(
    originalContent: string,
    keywordAnalysis: SEOKeywordAnalysis[],
    lsiClusters: LSIKeywordCluster[]
  ): Promise<string> {
    const primaryKeywords = keywordAnalysis.slice(0, 3).map(ka => ka.keyword);
    const lsiTerms = lsiClusters
      .flatMap(cluster => cluster.relatedTerms)
      .slice(0, 5);

    // Create keyword-optimized paragraphs
    const optimizedParagraphs = [
      this.createOpeningParagraph(primaryKeywords[0], originalContent),
      this.createValueParagraph(primaryKeywords, lsiTerms),
      this.createSocialProofParagraph(primaryKeywords[1]),
      this.createActionParagraph(primaryKeywords[2] || primaryKeywords[0]),
    ];

    return optimizedParagraphs.join('\n\n');
  }

  /**
   * OPTIMIZED PARAGRAPH CREATION
   * Creates SEO-optimized content paragraphs
   */
  private createOpeningParagraph(
    primaryKeyword: string,
    content: string
  ): string {
    const hook = this.extractMainHook(content);
    return `Discover the hidden psychology behind ${primaryKeyword} that transforms lives. ${hook} This comprehensive guide reveals research-backed strategies for ${primaryKeyword} that work for anyone, regardless of starting point.`;
  }

  private createValueParagraph(keywords: string[], lsiTerms: string[]): string {
    return `🧠 What you'll learn:
• The ${keywords[0]} framework used by top performers worldwide
• Why traditional ${keywords[1] || 'approaches'} fail and what works instead  
• Advanced ${lsiTerms[0] || 'techniques'} for sustainable ${keywords[2] || 'transformation'}
• Real ${lsiTerms[1] || 'examples'} you can implement immediately
• The ${lsiTerms[2] || 'psychological'} triggers that guarantee long-term success`;
  }

  private createSocialProofParagraph(keyword: string): string {
    return `✅ Results speak for themselves: Over 50,000 people have used these ${keyword} strategies to create lasting change. Featured in top psychology publications and backed by university research from Stanford and Harvard.`;
  }

  private createActionParagraph(keyword: string): string {
    return `🎯 Take action now: Start your ${keyword} journey today. Like if this resonates, subscribe for weekly transformation content, and comment with your biggest insight below. Your transformation begins with your next decision.`;
  }

  /**
   * SEO SCORE CALCULATION
   * Comprehensive SEO scoring system
   */
  private async calculateSEOScore(
    title: string,
    description: string,
    keywordAnalysis: SEOKeywordAnalysis[]
  ): Promise<ContentSEOScore> {
    const keywordOptimization = this.scoreKeywordOptimization(
      title,
      description,
      keywordAnalysis
    );
    const contentStructure = this.scoreContentStructure(description);
    const readability = this.scoreReadability(description);
    const semanticRelevance = this.scoreSemanticRelevance(
      title,
      description,
      keywordAnalysis
    );
    const userIntent = this.scoreUserIntent(description, keywordAnalysis);

    const overallScore = Math.round(
      keywordOptimization * 0.25 +
        contentStructure * 0.2 +
        readability * 0.2 +
        semanticRelevance * 0.2 +
        userIntent * 0.15
    );

    const recommendations = this.generateSEORecommendations(
      overallScore,
      keywordOptimization,
      contentStructure,
      readability
    );

    return {
      overallScore,
      keywordOptimization,
      contentStructure,
      readability,
      semanticRelevance,
      userIntent,
      recommendations,
    };
  }

  // Helper methods
  private extractMainHook(content: string): string {
    const sentences = content.split(/[.!?]/);
    return sentences[0] || 'This story will transform your perspective.';
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'this',
      'that',
      'they',
      'them',
      'there',
      'their',
    ]);
    return commonWords.has(word.toLowerCase());
  }

  private selectOptimalTitle(
    templates: string[],
    keywordAnalysis: SEOKeywordAnalysis[],
    original: string
  ): string {
    // Score each template based on keyword presence and CTR potential
    let bestTemplate = templates[0];
    let bestScore = 0;

    templates.forEach(template => {
      let score = 0;

      // Keyword presence score
      keywordAnalysis.forEach(ka => {
        if (template.toLowerCase().includes(ka.keyword.toLowerCase())) {
          score += ka.searchVolume / 1000;
        }
      });

      // CTR elements score
      if (template.includes('Secret') || template.includes('Truth')) {
        score += 20;
      }
      if (template.includes('Nobody') || template.includes('Hidden')) {
        score += 15;
      }
      if (template.includes('2024') || template.includes('2025')) {
        score += 10;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    });

    return bestTemplate;
  }

  // Scoring methods
  private scoreKeywordOptimization(
    title: string,
    description: string,
    keywordAnalysis: SEOKeywordAnalysis[]
  ): number {
    let score = 0;
    const combinedContent = `${title} ${description}`.toLowerCase();

    keywordAnalysis.forEach((ka, index) => {
      const weight = index === 0 ? 40 : index === 1 ? 30 : 15; // Primary keyword gets most weight

      if (combinedContent.includes(ka.keyword.toLowerCase())) {
        score += weight;
      }

      // Bonus for keyword in title
      if (title.toLowerCase().includes(ka.keyword.toLowerCase())) {
        score += 10;
      }
    });

    return Math.min(100, score);
  }

  private scoreContentStructure(description: string): number {
    let score = 0;

    // Check for bullets/lists
    if (
      description.includes('•') ||
      description.includes('-') ||
      /\d+\./.test(description)
    ) {
      score += 25;
    }

    // Check for emojis (engagement)
    const emojiCount = (
      description.match(
        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
      ) || []
    ).length;
    score += Math.min(25, emojiCount * 3);

    // Check for clear sections
    const paragraphs = description.split('\n\n').length;
    if (paragraphs >= 3 && paragraphs <= 5) {
      score += 20;
    }

    // Check for call-to-action
    if (
      description.toLowerCase().includes('subscribe') ||
      description.toLowerCase().includes('like')
    ) {
      score += 20;
    }

    // Word count optimization
    const wordCount = description.split(/\s+/).length;
    if (wordCount >= 150 && wordCount <= 250) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private scoreReadability(description: string): number {
    const sentences = description
      .split(/[.!?]/)
      .filter(s => s.trim().length > 0);
    const words = description.split(/\s+/);
    const avgWordsPerSentence = words.length / sentences.length;

    let score = 80; // Base score

    // Penalize long sentences
    if (avgWordsPerSentence > 20) {
      score -= 20;
    } else if (avgWordsPerSentence > 15) {
      score -= 10;
    }

    // Bonus for good sentence variation
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const variation = this.calculateVariation(sentenceLengths);
    if (variation > 3) {
      score += 10;
    }

    // Check for complex words (more than 2 syllables)
    const complexWords = words.filter(
      word => this.estimateSyllables(word) > 2
    ).length;
    const complexRatio = complexWords / words.length;
    if (complexRatio > 0.2) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  private scoreSemanticRelevance(
    title: string,
    description: string,
    keywordAnalysis: SEOKeywordAnalysis[]
  ): number {
    let score = 0;
    const content = `${title} ${description}`.toLowerCase();

    keywordAnalysis.forEach(ka => {
      // Check for semantic variations
      ka.semanticVariations.forEach(variation => {
        if (content.includes(variation.toLowerCase())) {
          score += 5;
        }
      });

      // Check for related queries
      ka.relatedQueries.forEach(query => {
        const queryWords = query.toLowerCase().split(/\s+/);
        const matchingWords = queryWords.filter(word =>
          content.includes(word)
        ).length;
        score += (matchingWords / queryWords.length) * 10;
      });
    });

    return Math.min(100, score);
  }

  private scoreUserIntent(
    description: string,
    keywordAnalysis: SEOKeywordAnalysis[]
  ): number {
    let score = 50; // Base score

    keywordAnalysis.forEach(ka => {
      const descLower = description.toLowerCase();

      switch (ka.intent) {
        case 'informational':
          if (
            descLower.includes('learn') ||
            descLower.includes('discover') ||
            descLower.includes('understand')
          ) {
            score += 15;
          }
          break;
        case 'commercial':
          if (
            descLower.includes('best') ||
            descLower.includes('compare') ||
            descLower.includes('review')
          ) {
            score += 15;
          }
          break;
        case 'transactional':
          if (
            descLower.includes('subscribe') ||
            descLower.includes('get') ||
            descLower.includes('download')
          ) {
            score += 15;
          }
          break;
      }
    });

    return Math.min(100, score);
  }

  private generateSEORecommendations(
    overall: number,
    keyword: number,
    structure: number,
    readability: number
  ): string[] {
    const recommendations = [];

    if (overall < 70) {
      recommendations.push(
        'Overall SEO needs improvement - focus on keyword optimization and content structure'
      );
    }

    if (keyword < 60) {
      recommendations.push(
        'Include primary keyword in title and first paragraph'
      );
      recommendations.push(
        'Add 2-3 secondary keywords naturally throughout content'
      );
    }

    if (structure < 70) {
      recommendations.push(
        'Add bullet points or numbered lists for better scanability'
      );
      recommendations.push('Include clear call-to-action statements');
      recommendations.push('Use emojis to increase engagement');
    }

    if (readability < 70) {
      recommendations.push(
        'Simplify sentence structure - aim for 15-20 words per sentence'
      );
      recommendations.push('Replace complex words with simpler alternatives');
    }

    return recommendations.slice(0, 5);
  }

  // Utility methods
  private calculateVariation(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b) / numbers.length;
    const variance =
      numbers.reduce((acc, num) => acc + Math.pow(num - mean, 2), 0) /
      numbers.length;
    return Math.sqrt(variance);
  }

  private estimateSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) {
      return 1;
    }
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }

  private initializeKeywordDatabase(): void {
    // Pre-populate with high-value keywords
    const seedKeywords = [
      'personal growth',
      'self improvement',
      'mindset',
      'success habits',
      'productivity',
      'motivation',
      'psychology',
      'transformation',
    ];

    seedKeywords.forEach(keyword => {
      this.keywordDatabase.set(
        keyword,
        this.generateKeywordAnalysis(keyword, 'personal-development')
      );
    });
  }
}

/**
 * SEMANTIC ANALYSIS ENGINE
 * Advanced semantic analysis for content optimization
 */
class SemanticAnalysisEngine {
  async findRelatedTerms(keyword: string, content: string): Promise<string[]> {
    const semanticMap = {
      psychology: [
        'behavioral',
        'cognitive',
        'mental',
        'subconscious',
        'neuroplasticity',
      ],
      transformation: [
        'change',
        'evolution',
        'metamorphosis',
        'shift',
        'breakthrough',
      ],
      success: [
        'achievement',
        'accomplishment',
        'victory',
        'triumph',
        'mastery',
      ],
      mindset: ['attitude', 'perspective', 'mentality', 'thinking', 'outlook'],
      habits: ['routines', 'behaviors', 'practices', 'patterns', 'discipline'],
    };

    const keywordLower = keyword.toLowerCase();
    const relatedTerms = [];

    Object.entries(semanticMap).forEach(([term, related]) => {
      if (keywordLower.includes(term) || term.includes(keywordLower)) {
        relatedTerms.push(...related);
      }
    });

    // Add context-specific terms found in content
    const contentWords = content.toLowerCase().split(/\s+/);
    const contextTerms = this.extractContextTerms(contentWords, keywordLower);
    relatedTerms.push(...contextTerms);

    return [...new Set(relatedTerms)].slice(0, 8);
  }

  isSemanticallySimilar(content: string, keyword: string): boolean {
    const contentLower = content.toLowerCase();
    const keywordWords = keyword.toLowerCase().split(/\s+/);

    // Check for partial matches and synonyms
    const synonyms = this.getSynonyms(keyword);

    return keywordWords.some(
      word =>
        contentLower.includes(word) ||
        synonyms.some(synonym => contentLower.includes(synonym))
    );
  }

  private extractContextTerms(
    contentWords: string[],
    keyword: string
  ): string[] {
    const contextTerms = [];
    const keywordIndex = contentWords.findIndex(word => word.includes(keyword));

    if (keywordIndex !== -1) {
      // Get words near the keyword (context window)
      const contextStart = Math.max(0, keywordIndex - 3);
      const contextEnd = Math.min(contentWords.length, keywordIndex + 4);
      const contextWords = contentWords.slice(contextStart, contextEnd);

      contextTerms.push(
        ...contextWords.filter(
          word => word.length > 3 && !this.isStopWord(word)
        )
      );
    }

    return contextTerms;
  }

  private getSynonyms(keyword: string): string[] {
    const synonymMap = {
      success: ['achievement', 'accomplishment', 'victory'],
      change: ['transform', 'shift', 'evolve'],
      improve: ['enhance', 'better', 'upgrade'],
      learn: ['discover', 'understand', 'master'],
    };

    const keywordLower = keyword.toLowerCase();
    return Object.entries(synonymMap)
      .filter(([term]) => keywordLower.includes(term))
      .flatMap(([, synonyms]) => synonyms);
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'this',
      'that',
      'they',
      'them',
      'there',
      'their',
    ]);
    return stopWords.has(word.toLowerCase());
  }
}

/**
 * CONTENT ANALYZER
 * Analyzes content structure and quality
 */
class ContentAnalyzer {
  analyzeContent(content: string): any {
    return {
      wordCount: content.split(/\s+/).length,
      sentenceCount: content.split(/[.!?]/).length,
      paragraphCount: content.split(/\n\n/).length,
      readabilityScore: this.calculateReadabilityScore(content),
      keywordDensity: this.calculateKeywordDensity(content),
      structureScore: this.analyzeStructure(content),
    };
  }

  private calculateReadabilityScore(content: string): number {
    // Simplified readability calculation
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]/).length;
    const avgWordsPerSentence = words / sentences;

    let score = 100;
    if (avgWordsPerSentence > 20) {
      score -= 20;
    } else if (avgWordsPerSentence > 15) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  private calculateKeywordDensity(content: string): { [key: string]: number } {
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = {};

    words.forEach(word => {
      if (word.length > 3) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });

    const totalWords = words.length;
    const density = {};
    Object.entries(wordCount).forEach(([word, count]) => {
      density[word] = ((count as number) / totalWords) * 100;
    });

    return density;
  }

  private analyzeStructure(content: string): number {
    let score = 0;

    if (content.includes('\n\n')) {
      score += 20;
    } // Paragraphs
    if (content.includes('•') || content.includes('-')) {
      score += 20;
    } // Lists
    if (/\d+\./.test(content)) {
      score += 15;
    } // Numbered lists
    if (content.includes('?')) {
      score += 10;
    } // Questions
    if (content.includes('!')) {
      score += 10;
    } // Exclamations

    return Math.min(100, score);
  }
}

/**
 * COMPETITION ANALYZER
 * Analyzes competitive landscape for keywords
 */
class CompetitionAnalyzer {
  async analyzeCompetition(keywords: string[], niche: string): Promise<any> {
    return {
      competitionLevel: this.assessOverallCompetition(keywords),
      opportunities: this.identifyOpportunities(keywords),
      threats: this.identifyThreats(keywords),
      recommendations: this.generateCompetitiveRecommendations(keywords),
    };
  }

  private assessOverallCompetition(
    keywords: string[]
  ): 'low' | 'medium' | 'high' {
    const avgLength =
      keywords.reduce((sum, kw) => sum + kw.length, 0) / keywords.length;

    if (avgLength > 20) {
      return 'low';
    }
    if (avgLength > 12) {
      return 'medium';
    }
    return 'high';
  }

  private identifyOpportunities(keywords: string[]): string[] {
    return keywords
      .filter(kw => kw.split(/\s+/).length >= 3)
      .map(kw => `Long-tail opportunity: "${kw}" has lower competition`)
      .slice(0, 3);
  }

  private identifyThreats(keywords: string[]): string[] {
    const highCompetitionTerms = ['success', 'money', 'business', 'marketing'];

    return keywords
      .filter(kw =>
        highCompetitionTerms.some(term => kw.toLowerCase().includes(term))
      )
      .map(
        kw => `High competition for "${kw}" - consider more specific variants`
      )
      .slice(0, 3);
  }

  private generateCompetitiveRecommendations(keywords: string[]): string[] {
    return [
      'Focus on long-tail keywords (3+ words) for easier ranking',
      'Create content clusters around primary keywords',
      'Target question-based keywords for featured snippets',
      'Build topical authority in your niche gradually',
    ];
  }
}
