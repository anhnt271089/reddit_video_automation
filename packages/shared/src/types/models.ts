/**
 * Core data models for the Reddit-to-video pipeline
 * Shared between frontend and backend with full TypeScript type safety
 */

export type ProcessingStatus =
  | 'idea'
  | 'idea_selected'
  | 'script_generated'
  | 'script_approved'
  | 'script_rejected'
  | 'assets_ready'
  | 'rendering'
  | 'completed'
  | 'failed';

export interface RedditPost {
  id: string;
  reddit_id?: string;
  title: string;
  content: string;
  url: string;
  author: string;
  upvotes: number;
  comments: number;
  created_date?: Date;
  created_at: string; // Frontend uses string format
  score: number;
  status: ProcessingStatus;
  discovered_at?: Date;
  updated_at?: Date;
  subreddit: string;
  quality_score?: number;
}

// Frontend-specific type alias for backwards compatibility
export interface ContentDiscoveryPost {
  id: string;
  title: string;
  content: string;
  author: string;
  subreddit: string;
  score: number;
  upvotes: number;
  comments: number;
  created_at: string;
  url: string;
  status: 'discovered' | 'approved' | 'rejected' | 'script_generated';
  quality_score?: number;
}

export interface SceneData {
  scene_number: number;
  content: string;
  keywords: string[];
  duration_estimate: number;
  emotional_tone: 'motivational' | 'contemplative' | 'urgent';
}

export interface ThumbnailConcept {
  text_overlay: string;
  emotional_style: string;
  visual_theme: string;
}

export interface VideoScript {
  id: string;
  post_id: string;
  script_content: string;
  scene_breakdown: SceneData[];
  duration_target: number;
  titles: string[];
  description: string;
  thumbnail_suggestions: ThumbnailConcept[];
  version: number;
  approved: boolean;
  generated_at: Date;
  approved_at?: Date;
  // New versioning fields
  generation_queue_id?: string;
  generation_started_at?: Date;
  generation_completed_at?: Date;
  claude_model?: string;
  prompt_version?: string;
  quality_score?: number;
}

export interface ScriptVersion {
  id: string;
  post_id: string;
  version_number: number;
  script_content: string;
  scene_breakdown: SceneData[];
  duration_target: number;
  titles: string[];
  description: string;
  thumbnail_suggestions: ThumbnailConcept[];
  generation_params: {
    style: 'motivational' | 'educational' | 'entertainment' | 'storytelling';
    targetDuration: number;
    sceneCount: number;
  };
  quality_score?: number;
  claude_model?: string;
  prompt_version?: string;
  generation_duration?: number; // milliseconds
  created_at: Date;
  is_active: boolean;
}

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface GenerationQueueJob {
  id: string;
  post_id: string;
  status: QueueStatus;
  priority: number;
  attempts: number;
  max_attempts: number;
  generation_params: {
    style: 'motivational' | 'educational' | 'entertainment' | 'storytelling';
    targetDuration: number;
    sceneCount?: number;
  };
  progress_percentage: number;
  error_message?: string;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  worker_id?: string;
}

export interface VideoAsset {
  id: string;
  script_id: string;
  scene_number: number;
  pexels_id: number;
  asset_type: 'video' | 'image';
  url: string;
  local_path: string;
  photographer: string;
  duration?: number;
  resolution: string;
  relevance_score: number;
  approved: boolean;
  cached_at: Date;
}

export interface BackgroundMusic {
  id: string;
  title: string;
  file_path: string;
  duration: number;
  emotional_tone: 'motivational' | 'contemplative' | 'urgent' | 'neutral';
  genre: string;
  volume_level: number;
  loop_enabled: boolean;
  artist: string;
  license: string;
  created_at: Date;
}

export interface MusicSelection {
  id: string;
  script_id: string;
  music_id: string;
  selected_at: Date;
  volume_adjustment?: number;
  fade_in_duration?: number;
  fade_out_duration?: number;
}

export interface RenderConfig {
  fps: number;
  codec: string;
  bitrate: string;
  template: string;
}

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  category: string;
}

export interface VideoOutput {
  id: string;
  post_id: string;
  script_id: string;
  file_path: string;
  file_size: number;
  duration: number;
  resolution: string;
  render_settings: RenderConfig;
  status: 'rendering' | 'completed' | 'failed';
  thumbnail_paths: string[];
  metadata: VideoMetadata;
  rendered_at?: Date;
  error_message?: string;
}
