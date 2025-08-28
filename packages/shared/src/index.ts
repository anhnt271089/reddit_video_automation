/**
 * @video-automation/shared-types
 * Shared TypeScript types and interfaces for video automation platform
 */

// Core data models
export type {
  ProcessingStatus,
  RedditPost,
  ContentDiscoveryPost,
  SceneData,
  ThumbnailConcept,
  VideoScript,
  VideoAsset,
  BackgroundMusic,
  MusicSelection,
  RenderConfig,
  VideoMetadata,
  VideoOutput,
  // New versioning types
  ScriptVersion,
  QueueStatus,
  GenerationQueueJob,
} from './types/models.js';

// API interfaces
export type {
  ApiResponse,
  GetPostsQuery,
  GetPostsResponse,
  ApprovePostRequest,
  GenerateScriptRequest,
  ApproveScriptRequest,
  RejectScriptRequest,
  ApproveBatchAssetsRequest,
  GetVideosResponse,
  DownloadVideoRequest,
  HealthCheckResponse,
  ValidationError,
  ApiError,
} from './types/api.js';

// WebSocket interfaces
export type {
  WebSocketMessage,
  PostStatusUpdateData,
  ScriptGeneratedData,
  RenderProgressData,
  RenderCompleteData,
  AssetProcessingData,
  SystemNotificationData,
  WebSocketEvents,
  ClientEvents,
  ServerEvents,
  ConnectionState,
  WebSocketOptions,
} from './types/websocket.js';

// Version info
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@video-automation/shared-types';
