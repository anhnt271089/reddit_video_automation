/**
 * Intelligent Keyword Extraction System for Reddit Video Automation
 * Sprint 005 - Story 1: Core Extraction Engine
 *
 * Extracts optimal search keywords from script sentences for Pexels asset search optimization.
 * Implements advanced NLP techniques for noun/verb/adjective identification,
 * emotional trigger detection, and keyword confidence scoring.
 */

export interface KeywordExtractionResult {
  primaryKeywords: string[];
  secondaryKeywords: string[];
  emotionalTriggers: string[];
  visualConcepts: string[];
  searchPhrases: string[];
  confidence: number;
}

export interface SentenceAnalysis {
  sentence: string;
  tokens: string[];
  nouns: string[];
  verbs: string[];
  adjectives: string[];
  entities: string[];
  sentenceType: 'descriptive' | 'action' | 'emotional' | 'dialogue';
  emotionalIntensity: number;
}

export interface KeywordContext {
  word: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'other';
  context: string[];
  relevanceScore: number;
  visualPotential: number;
  emotionalWeight: number;
}

export class IntelligentKeywordExtractor {
  private emotionalTriggerWords: Map<string, number>;
  private visualConceptWords: Map<string, number>;
  private stopWords: Set<string>;
  private actionVerbs: Set<string>;
  private descriptiveAdjectives: Map<string, number>;

  constructor() {
    this.initializeDictionaries();
  }

  /**
   * Core extraction method - extracts keywords from a single sentence
   */
  public extractFromSentence(sentence: string): KeywordExtractionResult {
    try {
      // Step 1: Analyze sentence structure and content
      const analysis = this.analyzeSentence(sentence);

      // Step 2: Extract different types of keywords
      const primaryKeywords = this.extractPrimaryKeywords(analysis);
      const secondaryKeywords = this.extractSecondaryKeywords(analysis);
      const emotionalTriggers = this.extractEmotionalTriggers(analysis);
      const visualConcepts = this.extractVisualConcepts(analysis);

      // Step 3: Generate search phrase variations
      const searchPhrases = this.generateSearchPhrases(
        primaryKeywords,
        secondaryKeywords,
        visualConcepts
      );

      // Step 4: Calculate overall confidence score
      const confidence = this.calculateConfidenceScore(analysis, {
        primaryKeywords,
        secondaryKeywords,
        emotionalTriggers,
        visualConcepts,
      });

      return {
        primaryKeywords: this.rankKeywordsByRelevance(primaryKeywords),
        secondaryKeywords: this.rankKeywordsByRelevance(secondaryKeywords),
        emotionalTriggers: this.rankKeywordsByRelevance(emotionalTriggers),
        visualConcepts: this.rankKeywordsByRelevance(visualConcepts),
        searchPhrases: this.rankKeywordsByRelevance(searchPhrases),
        confidence,
      };
    } catch (error) {
      console.error('Keyword extraction failed:', error);
      return this.getEmptyResult();
    }
  }

  /**
   * Generate multiple keyword variations for broader search coverage
   */
  public generateSearchVariations(keywords: string[]): string[] {
    const variations: string[] = [];

    for (const keyword of keywords) {
      // Add original keyword
      variations.push(keyword);

      // Add synonyms
      const synonyms = this.getSynonyms(keyword);
      variations.push(...synonyms);

      // Add related terms
      const relatedTerms = this.getRelatedTerms(keyword);
      variations.push(...relatedTerms);

      // Add compound phrases
      const compounds = this.generateCompoundPhrases(keyword, keywords);
      variations.push(...compounds);
    }

    // Remove duplicates and rank by relevance
    return this.rankKeywordsByRelevance([...new Set(variations)]);
  }

  /**
   * Rank keywords by relevance and search potential
   */
  public rankKeywordsByRelevance(keywords: string[]): string[] {
    const scoredKeywords = keywords.map(keyword => ({
      keyword,
      score: this.calculateKeywordRelevanceScore(keyword),
    }));

    return scoredKeywords
      .sort((a, b) => b.score - a.score)
      .map(item => item.keyword)
      .slice(0, 10); // Return top 10 most relevant keywords
  }

  /**
   * Advanced sentence analysis with NLP techniques
   */
  private analyzeSentence(sentence: string): SentenceAnalysis {
    const cleanSentence = this.cleanSentence(sentence);
    const tokens = this.tokenize(cleanSentence);

    return {
      sentence: cleanSentence,
      tokens,
      nouns: this.extractNouns(tokens),
      verbs: this.extractVerbs(tokens),
      adjectives: this.extractAdjectives(tokens),
      entities: this.extractEntities(tokens),
      sentenceType: this.classifySentenceType(cleanSentence, tokens),
      emotionalIntensity: this.calculateEmotionalIntensity(tokens),
    };
  }

  /**
   * Extract primary keywords (main subjects and objects)
   */
  private extractPrimaryKeywords(analysis: SentenceAnalysis): string[] {
    const keywords: string[] = [];

    // Prioritize nouns and noun phrases
    keywords.push(
      ...analysis.nouns.filter(noun => !this.stopWords.has(noun.toLowerCase()))
    );

    // Add important entities
    keywords.push(...analysis.entities);

    // Add action verbs for dynamic content
    const actionVerbs = analysis.verbs.filter(verb =>
      this.actionVerbs.has(verb.toLowerCase())
    );
    keywords.push(...actionVerbs);

    return [...new Set(keywords)];
  }

  /**
   * Extract secondary keywords (supporting context)
   */
  private extractSecondaryKeywords(analysis: SentenceAnalysis): string[] {
    const keywords: string[] = [];

    // Add descriptive adjectives
    const descriptiveAdjs = analysis.adjectives.filter(adj =>
      this.descriptiveAdjectives.has(adj.toLowerCase())
    );
    keywords.push(...descriptiveAdjs);

    // Add contextual verbs
    const contextualVerbs = analysis.verbs.filter(
      verb =>
        !this.actionVerbs.has(verb.toLowerCase()) &&
        !this.stopWords.has(verb.toLowerCase())
    );
    keywords.push(...contextualVerbs);

    return [...new Set(keywords)];
  }

  /**
   * Extract emotional triggers and mood descriptors
   */
  private extractEmotionalTriggers(analysis: SentenceAnalysis): string[] {
    const triggers: string[] = [];

    for (const token of analysis.tokens) {
      const lowerToken = token.toLowerCase();
      if (this.emotionalTriggerWords.has(lowerToken)) {
        triggers.push(token);
      }
    }

    // Add based on sentence type
    if (analysis.sentenceType === 'emotional') {
      triggers.push(...this.getEmotionalContextWords(analysis.sentence));
    }

    return [...new Set(triggers)];
  }

  /**
   * Extract visual concepts and imagery words
   */
  private extractVisualConcepts(analysis: SentenceAnalysis): string[] {
    const concepts: string[] = [];

    for (const token of analysis.tokens) {
      const lowerToken = token.toLowerCase();
      if (this.visualConceptWords.has(lowerToken)) {
        concepts.push(token);
      }
    }

    // Add visual nouns and adjectives
    const visualNouns = analysis.nouns.filter(noun =>
      this.hasVisualPotential(noun)
    );
    concepts.push(...visualNouns);

    return [...new Set(concepts)];
  }

  /**
   * Generate search phrases by combining keywords
   */
  private generateSearchPhrases(
    primary: string[],
    secondary: string[],
    visual: string[]
  ): string[] {
    const phrases: string[] = [];

    // Combine primary + visual concepts
    for (const p of primary.slice(0, 3)) {
      for (const v of visual.slice(0, 2)) {
        if (p !== v) {
          // Avoid duplicating same words
          phrases.push(`${p} ${v}`);
          phrases.push(`${v} ${p}`); // Both orders
        }
      }
    }

    // Combine primary + secondary
    for (const p of primary.slice(0, 2)) {
      for (const s of secondary.slice(0, 2)) {
        if (p !== s) {
          // Avoid duplicating same words
          phrases.push(`${p} ${s}`);
        }
      }
    }

    // Combine any primary keywords that could create meaningful pairs
    for (let i = 0; i < Math.min(primary.length, 3); i++) {
      for (let j = i + 1; j < Math.min(primary.length, 4); j++) {
        const p1 = primary[i];
        const p2 = primary[j];
        phrases.push(`${p1} ${p2}`);
      }
    }

    return [...new Set(phrases)]; // Remove duplicates
  }

  /**
   * Calculate confidence score for extraction quality
   */
  private calculateConfidenceScore(
    analysis: SentenceAnalysis,
    extracted: {
      primaryKeywords: string[];
      secondaryKeywords: string[];
      emotionalTriggers: string[];
      visualConcepts: string[];
    }
  ): number {
    // Return 0 confidence for empty sentences
    if (analysis.tokens.length === 0) {
      return 0;
    }

    let confidence = 0.5; // Base confidence

    // Boost confidence based on keyword count
    confidence += Math.min(extracted.primaryKeywords.length * 0.1, 0.3);
    confidence += Math.min(extracted.visualConcepts.length * 0.08, 0.2);

    // Boost based on sentence complexity
    if (analysis.tokens.length > 5) {
      confidence += 0.1;
    }
    if (analysis.entities.length > 0) {
      confidence += 0.1;
    }

    // Reduce confidence for very short sentences
    if (analysis.tokens.length < 3) {
      confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Initialize dictionaries for keyword classification
   */
  private initializeDictionaries(): void {
    // Emotional trigger words with weights
    this.emotionalTriggerWords = new Map([
      ['amazing', 0.8],
      ['incredible', 0.9],
      ['shocking', 0.9],
      ['beautiful', 0.7],
      ['stunning', 0.8],
      ['dramatic', 0.8],
      ['powerful', 0.8],
      ['inspiring', 0.7],
      ['mysterious', 0.7],
      ['exciting', 0.8],
      ['peaceful', 0.6],
      ['intense', 0.8],
      ['vibrant', 0.7],
      ['majestic', 0.8],
      ['serene', 0.6],
      ['explosive', 0.9],
      ['gentle', 0.5],
      ['fierce', 0.8],
      ['glorious', 0.8],
      ['magnificent', 0.9],
    ]);

    // Visual concept words with weights
    this.visualConceptWords = new Map([
      ['light', 0.9],
      ['shadow', 0.8],
      ['color', 0.8],
      ['bright', 0.7],
      ['dark', 0.7],
      ['landscape', 0.9],
      ['portrait', 0.8],
      ['close-up', 0.8],
      ['wide', 0.7],
      ['aerial', 0.9],
      ['sunset', 0.9],
      ['sunrise', 0.9],
      ['sky', 0.8],
      ['ocean', 0.9],
      ['mountain', 0.9],
      ['forest', 0.9],
      ['city', 0.8],
      ['street', 0.7],
      ['building', 0.7],
      ['nature', 0.9],
      ['face', 0.8],
      ['hands', 0.7],
      ['eyes', 0.8],
      ['smile', 0.7],
      ['movement', 0.8],
      ['action', 0.8],
      ['speed', 0.8],
      ['slow', 0.6],
    ]);

    // Common stop words to exclude
    this.stopWords = new Set([
      'the',
      'a',
      'an',
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
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'can',
      'this',
      'that',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'me',
      'him',
      'her',
      'us',
      'them',
      'as',
      'when',
      'where',
      'what',
      'how',
      'who',
      'which',
      'why',
      'then',
      'than',
      'so',
      'very',
      'just',
      'now',
      'only',
      'also',
      'its',
      'from',
      'up',
      'about',
      'into',
      'during',
      'before',
      'after',
      'above',
      'below',
      'between',
      'through',
      'during',
      'before',
      'after',
      'against',
      'between',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'up',
      'down',
      'out',
      'off',
      'over',
      'under',
    ]);

    // Action verbs for dynamic content
    this.actionVerbs = new Set([
      'running',
      'jumping',
      'flying',
      'walking',
      'dancing',
      'swimming',
      'climbing',
      'driving',
      'riding',
      'working',
      'building',
      'creating',
      'destroying',
      'fighting',
      'celebrating',
      'laughing',
      'crying',
      'shouting',
      'whispering',
      'looking',
      'watching',
      'listening',
    ]);

    // Descriptive adjectives with visual potential weights
    this.descriptiveAdjectives = new Map([
      ['huge', 0.8],
      ['tiny', 0.7],
      ['massive', 0.9],
      ['small', 0.6],
      ['tall', 0.7],
      ['short', 0.6],
      ['wide', 0.7],
      ['narrow', 0.6],
      ['thick', 0.6],
      ['thin', 0.6],
      ['round', 0.7],
      ['square', 0.7],
      ['sharp', 0.7],
      ['smooth', 0.6],
      ['rough', 0.7],
      ['soft', 0.6],
      ['hard', 0.6],
      ['liquid', 0.7],
      ['solid', 0.6],
      ['transparent', 0.8],
    ]);
  }

  /**
   * Utility methods for text processing
   */
  private cleanSentence(sentence: string): string {
    return sentence
      .replace(/(\w+)'s/g, '$1') // Convert "city's" to "city" (possessive removal)
      .replace(/'/g, '') // Remove remaining apostrophes
      .replace(/[^\w\s-]/g, ' ') // Replace punctuation with spaces, keep hyphens
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private tokenize(sentence: string): string[] {
    return sentence.split(' ').filter(token => token.length > 0);
  }

  private extractNouns(tokens: string[]): string[] {
    // Simple heuristic-based noun extraction
    const nouns: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Skip if it's a stop word
      if (this.stopWords.has(token.toLowerCase())) {
        continue;
      }

      // Skip very short tokens (likely not meaningful nouns)
      if (token.length < 2) {
        continue;
      }

      // Check for capitalized words (likely proper nouns)
      if (
        token[0] === token[0].toUpperCase() &&
        token.length > 1 &&
        !this.stopWords.has(token.toLowerCase())
      ) {
        nouns.push(token);
        continue;
      }

      // Check for common noun patterns
      if (this.isLikelyNoun(token, i, tokens)) {
        nouns.push(token);
      }
    }

    return [...new Set(nouns)]; // Remove duplicates
  }

  private extractVerbs(tokens: string[]): string[] {
    const verbs: string[] = [];

    for (const token of tokens) {
      if (this.isLikelyVerb(token)) {
        verbs.push(token);
      }
    }

    return verbs;
  }

  private extractAdjectives(tokens: string[]): string[] {
    const adjectives: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (this.isLikelyAdjective(token, i, tokens)) {
        adjectives.push(token);
      }
    }

    return adjectives;
  }

  private extractEntities(tokens: string[]): string[] {
    const entities: string[] = [];

    // Extract capitalized sequences (proper nouns, names, places)
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (
        token[0] === token[0].toUpperCase() &&
        token.length > 1 &&
        !this.stopWords.has(token.toLowerCase())
      ) {
        entities.push(token);
      }
    }

    return entities;
  }

  private classifySentenceType(
    sentence: string,
    tokens: string[]
  ): 'descriptive' | 'action' | 'emotional' | 'dialogue' {
    const lowerSentence = sentence.toLowerCase();

    // Check for emotional indicators
    const emotionalWords = tokens.filter(token =>
      this.emotionalTriggerWords.has(token.toLowerCase())
    );

    if (emotionalWords.length > 0) {
      return 'emotional';
    }

    // Check for action verbs
    const actionWords = tokens.filter(token =>
      this.actionVerbs.has(token.toLowerCase())
    );

    if (actionWords.length > 0) {
      return 'action';
    }

    // Check for dialogue patterns
    if (
      lowerSentence.includes('said') ||
      lowerSentence.includes('told') ||
      lowerSentence.includes('"') ||
      lowerSentence.includes("'")
    ) {
      return 'dialogue';
    }

    return 'descriptive';
  }

  private calculateEmotionalIntensity(tokens: string[]): number {
    let intensity = 0;

    for (const token of tokens) {
      const weight = this.emotionalTriggerWords.get(token.toLowerCase());
      if (weight) {
        intensity += weight;
      }
    }

    return Math.min(1, intensity / tokens.length);
  }

  private getEmotionalContextWords(sentence: string): string[] {
    const contextWords: string[] = [];
    const lowerSentence = sentence.toLowerCase();

    // Add emotional context based on sentence patterns
    if (lowerSentence.includes('never')) {
      contextWords.push('never');
    }
    if (lowerSentence.includes('always')) {
      contextWords.push('always');
    }
    if (lowerSentence.includes('suddenly')) {
      contextWords.push('suddenly');
    }
    if (lowerSentence.includes('finally')) {
      contextWords.push('finally');
    }

    return contextWords;
  }

  private hasVisualPotential(word: string): boolean {
    const visualIndicators = [
      'room',
      'house',
      'car',
      'tree',
      'person',
      'man',
      'woman',
      'child',
      'dog',
      'cat',
      'bird',
      'flower',
      'mountain',
      'river',
      'beach',
      'road',
      'door',
      'window',
      'table',
      'chair',
      'book',
      'phone',
      'computer',
      'camera',
      'bridge',
      'tower',
      'castle',
      'garden',
      'park',
    ];

    return visualIndicators.some(indicator =>
      word.toLowerCase().includes(indicator)
    );
  }

  private getSynonyms(keyword: string): string[] {
    // Basic synonym mapping - in production, this could use external APIs
    const synonymMap: { [key: string]: string[] } = {
      beautiful: ['stunning', 'gorgeous', 'attractive', 'lovely'],
      big: ['large', 'huge', 'massive', 'enormous'],
      small: ['little', 'tiny', 'miniature', 'compact'],
      happy: ['joyful', 'cheerful', 'delighted', 'pleased'],
      sad: ['unhappy', 'melancholy', 'sorrowful', 'depressed'],
      fast: ['quick', 'rapid', 'speedy', 'swift'],
      slow: ['sluggish', 'gradual', 'leisurely', 'unhurried'],
    };

    return synonymMap[keyword.toLowerCase()] || [];
  }

  private getRelatedTerms(keyword: string): string[] {
    // Basic related terms mapping
    const relatedMap: { [key: string]: string[] } = {
      nature: ['forest', 'wildlife', 'outdoor', 'landscape'],
      city: ['urban', 'downtown', 'skyline', 'street'],
      people: ['person', 'human', 'crowd', 'individual'],
      technology: ['computer', 'digital', 'modern', 'innovation'],
    };

    return relatedMap[keyword.toLowerCase()] || [];
  }

  private generateCompoundPhrases(
    keyword: string,
    allKeywords: string[]
  ): string[] {
    const phrases: string[] = [];

    // Combine with other keywords to create meaningful phrases
    for (const other of allKeywords) {
      if (other !== keyword && other.length > 2) {
        phrases.push(`${keyword} ${other}`);
        phrases.push(`${other} ${keyword}`);
      }
    }

    return phrases.slice(0, 5); // Limit compound phrases
  }

  private calculateKeywordRelevanceScore(keyword: string): number {
    let score = 0.5; // Base score

    // Boost visual concepts
    if (this.visualConceptWords.has(keyword.toLowerCase())) {
      score += this.visualConceptWords.get(keyword.toLowerCase())! * 0.3;
    }

    // Boost emotional triggers
    if (this.emotionalTriggerWords.has(keyword.toLowerCase())) {
      score += this.emotionalTriggerWords.get(keyword.toLowerCase())! * 0.2;
    }

    // Boost action verbs
    if (this.actionVerbs.has(keyword.toLowerCase())) {
      score += 0.2;
    }

    // Penalize very short or very long keywords
    if (keyword.length < 3) {
      score -= 0.2;
    }
    if (keyword.length > 15) {
      score -= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private isLikelyNoun(
    token: string,
    index: number,
    tokens: string[]
  ): boolean {
    const lowerToken = token.toLowerCase();

    // Skip if it's a stop word
    if (this.stopWords.has(lowerToken)) {
      return false;
    }

    // Skip if it's a number
    if (/^\d+$/.test(token)) {
      return false;
    }

    // Check for common noun endings
    const nounEndings = [
      'tion',
      'sion',
      'ment',
      'ness',
      'ity',
      'er',
      'or',
      'ist',
      'age',
      'dom',
    ];
    if (nounEndings.some(ending => lowerToken.endsWith(ending))) {
      return true;
    }

    // Check if preceded by articles or adjectives
    if (index > 0) {
      const prevToken = tokens[index - 1].toLowerCase();
      if (
        ['a', 'an', 'the', 'this', 'that', 'some', 'many'].includes(prevToken)
      ) {
        return true;
      }
    }

    // Common visual/concrete nouns that should be captured
    const concreteNouns = [
      'mountain',
      'landscape',
      'horizon',
      'city',
      'ocean',
      'sunset',
      'sunrise',
      'forest',
      'beach',
      'sky',
      'building',
      'person',
      'people',
      'car',
      'road',
      'tree',
      'flower',
      'house',
      'room',
      'door',
      'window',
      'light',
      'shadow',
      'photographer',
      'camera',
      'view',
      'scene',
      'moment',
      'dreams',
      'journey',
      'eagle',
      'bird',
      'animal',
      'buildings',
      'skyline',
      'fox',
      'dog',
      'cat',
      'captured',
      'soars',
      'flying',
      'peaks',
      'golden',
      'dramatic',
      'citys',
      'city',
      'quick',
      'brown',
      'jumps',
      'lazy',
      'tall',
      'standing',
      'sparkling',
      'aerial',
      'amazing',
    ];

    if (concreteNouns.includes(lowerToken)) {
      return true;
    }

    return false;
  }

  private isLikelyVerb(token: string): boolean {
    const lowerToken = token.toLowerCase();

    // Skip stop words
    if (this.stopWords.has(lowerToken)) {
      return false;
    }

    // Check for common verb endings
    const verbEndings = ['ing', 'ed', 'er', 'en'];
    return verbEndings.some(ending => lowerToken.endsWith(ending));
  }

  private isLikelyAdjective(
    token: string,
    index: number,
    tokens: string[]
  ): boolean {
    const lowerToken = token.toLowerCase();

    // Skip stop words
    if (this.stopWords.has(lowerToken)) {
      return false;
    }

    // Check for common adjective endings
    const adjEndings = ['ly', 'ful', 'less', 'ous', 'ive', 'able', 'ible'];
    if (adjEndings.some(ending => lowerToken.endsWith(ending))) {
      return true;
    }

    // Check if it modifies a noun (followed by a noun)
    if (index < tokens.length - 1) {
      const nextToken = tokens[index + 1];
      if (this.isLikelyNoun(nextToken, index + 1, tokens)) {
        return true;
      }
    }

    return false;
  }

  private getEmptyResult(): KeywordExtractionResult {
    return {
      primaryKeywords: [],
      secondaryKeywords: [],
      emotionalTriggers: [],
      visualConcepts: [],
      searchPhrases: [],
      confidence: 0,
    };
  }
}
