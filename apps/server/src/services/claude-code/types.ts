export interface SceneData {
  id: number;
  narration: string;
  duration: number;
  visualKeywords: string[];
  emotion:
    | 'inspiring'
    | 'dramatic'
    | 'educational'
    | 'humorous'
    | 'motivational';
}

export interface ThumbnailConcept {
  description: string;
  visualElements: string[];
  textOverlay?: string;
  colorScheme: string;
  // Enhanced properties for detailed thumbnail generation
  composition: {
    layout:
      | 'split-screen'
      | 'spotlight'
      | 'transformation-triangle'
      | 'before-after'
      | 'central-focus';
    visualFlow: string; // Description of eye movement pattern
    focalPoint: string; // Primary attention grabber
  };
  characters: {
    count: number;
    demographics: string; // Age, appearance, relatability factors
    expressions: string[]; // Specific facial expressions and emotions
    positioning: string; // How characters are positioned in frame
    clothing: string; // Clothing style that resonates with target audience
  };
  objects: {
    symbolic: string[]; // Metaphorical objects (keys, lightbulbs, doors, etc.)
    contextual: string[]; // Story-specific props and background elements
    emotional: string[]; // Objects that trigger emotional responses
  };
  textStrategy: {
    primary: string; // Main headline text
    secondary?: string; // Supporting text if needed
    font: string; // Font style recommendation (bold, clean, dramatic)
    placement: string; // Where text appears for maximum impact
    color: string; // Text color for optimal contrast and emotion
  };
  psychologicalTriggers: string[]; // Which psychological buttons this thumbnail pushes
  targetEmotion:
    | 'curiosity'
    | 'urgency'
    | 'hope'
    | 'fear'
    | 'excitement'
    | 'empowerment'
    | 'relatability';
  ctrOptimization: {
    contrastLevel: 'high' | 'medium' | 'low';
    emotionalIntensity: 'subtle' | 'moderate' | 'intense';
    clarityScore: number; // 1-10 how clear the message is at thumbnail size
  };
}

export interface GeneratedScript {
  scriptContent: string;
  sceneBreakdown: SceneData[];
  durationEstimate: number;
  titles: string[]; // 5 variations
  description: string;
  thumbnailConcepts: ThumbnailConcept[];
  keywords: string[];
  generationParams: {
    style: ScriptStyle;
    targetDuration: number;
    sceneCount: number;
  };
}

export interface ScriptGenerationRequest {
  redditPost: RedditPost;
  targetDuration: number; // in seconds
  style?: ScriptStyle;
  sceneCount?: number;
}

export type ScriptStyle =
  | 'motivational'
  | 'educational'
  | 'entertainment'
  | 'storytelling';

export interface RedditPost {
  id: string;
  title: string;
  content: string;
  author: string;
  subreddit: string;
  score: number;
  upvotes: number;
  comments: number;
  created_at: Date;
  url: string;
  awards?: any[];
}

export interface ProcessedContent {
  title: string;
  content: string;
  metadata: {
    author: string;
    subreddit: string;
    score: number;
    awards?: any[];
    wordCount: number;
    readingTime: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100 quality score
}

export interface ClaudeCodeResponse {
  script: string;
  scenes: SceneData[];
  metadata: {
    titles: string[];
    description: string;
    thumbnailConcepts: ThumbnailConcept[];
    tags: string[];
  };
}
