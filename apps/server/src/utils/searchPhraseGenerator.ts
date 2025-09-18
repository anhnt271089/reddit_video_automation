/**
 * Search Phrase Generation Utility
 * Extracted from search-phrases.ts for reuse in asset download pipeline
 */

/**
 * Generate primary search phrase for a sentence
 */
export function generatePrimarySearchPhrase(
  content: string,
  assetType: 'photo' | 'video'
): string {
  const cleanContent = content.toLowerCase().trim();

  // Enhanced visual concept mapping for better asset search
  const conceptMappings: Record<string, string> = {
    // Psychology & mindset
    psychology: 'brain science',
    mindset: 'focused person thinking',
    mental: 'meditation peaceful',
    brain: 'human brain',
    cognitive: 'thinking person',
    behavior: 'people interaction',
    habit: 'routine lifestyle',
    pattern: 'geometric pattern',
    mechanism: 'gears machinery',
    trigger: 'finger pointing',
    emotion: 'facial expression',

    // Success & achievement
    success: 'celebration winner',
    achievement: 'trophy victory',
    breakthrough: 'light through darkness',
    transformation: 'butterfly metamorphosis',
    growth: 'plant growing',
    motivation: 'mountain climber',
    productivity: 'organized desk workspace',
    performance: 'athlete running',
    excellence: 'gold medal',
    mastery: 'expert craftsman',

    // Problem & solution
    problem: 'puzzle pieces',
    solution: 'lightbulb idea',
    challenge: 'obstacle course',
    obstacle: 'road barrier',
    struggle: 'person climbing',
    difficulty: 'maze puzzle',
    strategy: 'chess game',
    method: 'step by step',
    approach: 'pathway forward',
    technique: 'skilled hands working',
    framework: 'building structure',
    system: 'connected network',

    // Learning & development
    learning: 'books study',
    knowledge: 'library books',
    wisdom: 'elderly sage',
    experience: 'journey path',
    insight: 'eye opening',
    discovery: 'explorer finding',
    understanding: 'person reading',
    research: 'scientist laboratory',
    analysis: 'data charts',
    study: 'student studying',
  };

  // Extract meaningful keywords
  const words = cleanContent.split(/\s+/).filter(word => word.length > 3);

  // Find the best concept mapping
  for (const [concept, visualPhrase] of Object.entries(conceptMappings)) {
    if (cleanContent.includes(concept)) {
      return visualPhrase;
    }
  }

  // Extract visual elements from content
  const visualConcepts = extractVisualConcepts(cleanContent);
  const actionWords = extractActionWords(cleanContent);
  const objectsAndSubjects = extractObjectsAndSubjects(cleanContent);

  // Build search phrase based on asset type
  if (assetType === 'video') {
    // For videos, prioritize dynamic content
    if (actionWords.length > 0 && visualConcepts.length > 0) {
      return `${visualConcepts[0]} ${actionWords[0]}`;
    } else if (actionWords.length > 0) {
      return `person ${actionWords[0]}`;
    } else if (visualConcepts.length > 0) {
      return `${visualConcepts[0]} motion`;
    }
  } else {
    // For photos, prioritize clear visual subjects
    if (visualConcepts.length > 0 && objectsAndSubjects.length > 0) {
      return `${visualConcepts[0]} ${objectsAndSubjects[0]}`;
    } else if (visualConcepts.length > 0) {
      return visualConcepts[0];
    } else if (objectsAndSubjects.length > 0) {
      return objectsAndSubjects[0];
    }
  }

  // Enhanced fallback with more unique phrases based on content analysis
  const contentWords = cleanContent
    .split(/\s+/)
    .filter(word => word.length > 3);

  // Generate unique phrases by combining content elements
  const creativePhrasesPool = [
    'abstract geometric patterns',
    'sunrise golden hour',
    'coffee steam morning',
    'hands typing keyboard',
    'ocean waves peaceful',
    'city skyline night',
    'forest path sunlight',
    'paper airplane flight',
    'candle flame meditation',
    'rain drops window',
    'book pages turning',
    'clock ticking time',
    'mirror reflection',
    'shadow silhouette',
    'bridge crossing water',
    'stairs ascending',
    'door opening light',
    'flower blooming nature',
    'pencil sketching art',
    'compass direction',
  ];

  // Try to create contextual unique phrases
  const contextualUniquePhrase = generateContextualPhrase(
    contentWords,
    assetType
  );
  if (contextualUniquePhrase) {
    return contextualUniquePhrase;
  }

  // Semi-random selection to ensure uniqueness
  const phraseIndex = Math.floor(Math.random() * creativePhrasesPool.length);
  return creativePhrasesPool[phraseIndex];
}

/**
 * Generate contextual phrase based on content words
 */
function generateContextualPhrase(
  words: string[],
  assetType: 'photo' | 'video'
): string | null {
  // Context-specific phrase generation
  const contextMappings = [
    {
      keywords: ['time', 'moment', 'second'],
      phrases: ['clock mechanism', 'hourglass sand', 'calendar pages'],
    },
    {
      keywords: ['mind', 'think', 'brain'],
      phrases: ['neural network', 'lightbulb moment', 'puzzle solving'],
    },
    {
      keywords: ['change', 'transform'],
      phrases: ['butterfly emerging', 'season transition', 'water flowing'],
    },
    {
      keywords: ['grow', 'development'],
      phrases: [
        'seedling sprouting',
        'building construction',
        'ladder climbing',
      ],
    },
    {
      keywords: ['connect', 'relationship'],
      phrases: ['bridge spanning', 'handshake meeting', 'network nodes'],
    },
    {
      keywords: ['create', 'build', 'make'],
      phrases: ['artist painting', 'sculptor carving', 'architect drawing'],
    },
    {
      keywords: ['learn', 'study', 'education'],
      phrases: ['library books', 'graduation cap', 'telescope stargazing'],
    },
    {
      keywords: ['energy', 'power', 'force'],
      phrases: ['lightning storm', 'waterfall cascade', 'solar panels'],
    },
    {
      keywords: ['path', 'journey', 'direction'],
      phrases: ['mountain trail', 'compass needle', 'road horizon'],
    },
    {
      keywords: ['balance', 'harmony'],
      phrases: ['zen stones', 'scale equilibrium', 'dancer pose'],
    },
  ];

  for (const mapping of contextMappings) {
    if (
      mapping.keywords.some(keyword =>
        words.some(word => word.includes(keyword))
      )
    ) {
      const randomPhrase =
        mapping.phrases[Math.floor(Math.random() * mapping.phrases.length)];
      return assetType === 'video' ? `${randomPhrase} motion` : randomPhrase;
    }
  }

  return null;
}

/**
 * Extract visual concepts from text
 */
function extractVisualConcepts(content: string): string[] {
  const visualWords = [
    'person',
    'people',
    'man',
    'woman',
    'child',
    'family',
    'house',
    'building',
    'city',
    'street',
    'road',
    'car',
    'nature',
    'tree',
    'forest',
    'mountain',
    'ocean',
    'sky',
    'technology',
    'computer',
    'phone',
    'money',
    'business',
    'food',
    'restaurant',
    'kitchen',
    'office',
    'school',
    'sun',
    'light',
    'dark',
    'night',
    'day',
    'weather',
  ];

  return visualWords.filter(word => content.includes(word));
}

/**
 * Extract action words for video content
 */
function extractActionWords(content: string): string[] {
  const actionWords = [
    'running',
    'walking',
    'talking',
    'working',
    'playing',
    'driving',
    'flying',
    'swimming',
    'dancing',
    'cooking',
    'building',
    'creating',
    'making',
    'moving',
    'growing',
    'falling',
    'rising',
    'flowing',
    'spinning',
    'jumping',
  ];

  const foundActions = actionWords.filter(word => content.includes(word));

  // Also look for -ing verbs
  const words = content.split(' ');
  const ingWords = words.filter(
    word => word.endsWith('ing') && word.length > 4
  );

  return [...foundActions, ...ingWords.slice(0, 2)];
}

/**
 * Extract main objects and subjects
 */
function extractObjectsAndSubjects(content: string): string[] {
  const commonNouns = [
    'student',
    'teacher',
    'doctor',
    'engineer',
    'artist',
    'company',
    'business',
    'market',
    'economy',
    'system',
    'problem',
    'solution',
    'idea',
    'concept',
    'method',
    'research',
    'study',
    'analysis',
    'data',
    'information',
  ];

  return commonNouns.filter(noun => content.includes(noun));
}
