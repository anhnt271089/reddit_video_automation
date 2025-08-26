/**
 * Re-export shared types and add web-specific types
 */

// Re-export all shared types
export type {
  // Data models
  ProcessingStatus,
  RedditPost,
  SceneData,
  ThumbnailConcept,
  VideoScript,
  VideoAsset,
  BackgroundMusic,
  MusicSelection,
  RenderConfig,
  VideoMetadata,
  VideoOutput,

  // API types
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

  // WebSocket types
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
} from '@video-automation/shared-types';

// Web-specific types (if any additional types are needed for UI)
export interface UINotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  notificationsEnabled: boolean;
}

// Legacy type aliases for backward compatibility (to be removed gradually)
/** @deprecated Use RedditPost from shared types */
export type Post = RedditPost;

/** @deprecated Use ConnectionState from shared types */
export type WebSocketState = ConnectionState;
