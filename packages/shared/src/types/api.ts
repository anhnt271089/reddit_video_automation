/**
 * REST API request/response interfaces
 * Based on OpenAPI specification for Reddit-to-video automation
 */

import type {
  RedditPost,
  VideoScript,
  VideoAsset,
  VideoOutput,
  ProcessingStatus,
} from './models.js';

// Common API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Content Discovery Endpoints
export interface GetPostsQuery {
  status?: ProcessingStatus;
  limit?: number;
}

export interface GetPostsResponse {
  posts: RedditPost[];
  total: number;
}

export interface ApprovePostRequest {
  postId: string;
}

// Script Generation Endpoints
export interface GenerateScriptRequest {
  post_id: string;
  duration_target?: number;
}

export interface ApproveScriptRequest {
  scriptId: string;
}

export interface RejectScriptRequest {
  scriptId: string;
}

// Asset Management Endpoints
export interface ApproveBatchAssetsRequest {
  script_id: string;
}

// Video Generation Endpoints
export interface GetVideosResponse {
  videos: VideoOutput[];
}

export interface DownloadVideoRequest {
  videoId: string;
}

// Health Check
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  services: {
    database: boolean;
    reddit_api: boolean;
    claude_api: boolean;
    pexels_api: boolean;
  };
  timestamp: string;
}

// Error responses
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  validation_errors?: ValidationError[];
}
