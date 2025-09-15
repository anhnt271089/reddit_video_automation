export interface SceneData {
  id: number;
  narration: string;
  duration: number;
  visualKeywords: string[];
  keywordExtraction?: {
    primaryKeywords: string[];
    secondaryKeywords: string[];
    emotionalTriggers: string[];
    visualConcepts: string[];
    searchPhrases: string[];
    confidence: number;
  };
  emotion:
    | 'inspiring'
    | 'dramatic'
    | 'educational'
    | 'humorous'
    | 'motivational';
}

export interface AssetData {
  id: string;
  type: 'image' | 'video';
  url: string;
  localPath?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    photographer?: string;
    tags?: string[];
  };
}

export interface VideoComposition {
  id: string;
  title: string;
  description: string;
  scenes: SceneWithAssets[];
  style: VideoStyle;
  dimensions: {
    width: number;
    height: number;
  };
  fps: number;
  duration: number;
}

export interface SceneWithAssets extends SceneData {
  assets: AssetData[];
  startTime: number;
  endTime: number;
  textAnimation: TextAnimationProps;
}

export interface TextAnimationProps {
  text: string;
  style: TextStyle;
  animation: AnimationType;
  timing: {
    fadeInStart: number;
    fadeInDuration: number;
    holdDuration: number;
    fadeOutStart: number;
    fadeOutDuration: number;
  };
}

export type VideoStyle = 'motivational' | 'contemplative' | 'urgent';

export type TextStyle = {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  textAlign: 'left' | 'center' | 'right';
  maxWidth?: number;
  lineHeight?: number;
  textShadow?: string;
};

export type AnimationType =
  | 'fadeIn'
  | 'slideUp'
  | 'slideDown'
  | 'typewriter'
  | 'bounce'
  | 'scale'
  | 'none';

export interface VideoGenerationRequest {
  scriptId: string;
  postId: string;
  style: VideoStyle;
  outputFormat: 'mp4' | 'webm';
  quality: 'low' | 'medium' | 'high';
}

export interface VideoGenerationProgress {
  stage: 'preparing' | 'rendering' | 'encoding' | 'complete' | 'error';
  progress: number; // 0-100
  currentScene?: number;
  totalScenes: number;
  message: string;
  error?: string;
}
