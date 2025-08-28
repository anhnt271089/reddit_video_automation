export interface SceneData {
  id: number;
  narration: string;
  duration: number;
  visualKeywords: string[];
  emotion: 'inspiring' | 'dramatic' | 'educational' | 'humorous' | 'motivational';
}

export interface ThumbnailConcept {
  description: string;
  visualElements: string[];
  textOverlay?: string;
  colorScheme: string;
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

export type ScriptStyle = 'motivational' | 'educational' | 'entertainment' | 'storytelling';

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