/**
 * WebSocket event interfaces for real-time updates
 * Supports pipeline status updates and progress monitoring
 */

import type { ProcessingStatus, VideoScript } from './models.js';

// Base WebSocket message structure
export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: string;
}

// Post processing status updates
export interface PostStatusUpdateData {
  post_id: string;
  old_status: ProcessingStatus;
  new_status: ProcessingStatus;
  message?: string;
}

// Script generation completion
export interface ScriptGeneratedData {
  script: VideoScript;
  post_id: string;
}

// Video rendering progress
export interface RenderProgressData {
  video_id: string;
  progress: number; // 0-100
  stage: 'preparing' | 'rendering' | 'encoding' | 'finalizing';
  eta_seconds?: number;
  current_frame?: number;
  total_frames?: number;
}

// Video rendering completion
export interface RenderCompleteData {
  video_id: string;
  file_path: string;
  duration: number;
  file_size: number;
  thumbnail_paths: string[];
  success: boolean;
  error_message?: string;
}

// Asset processing updates
export interface AssetProcessingData {
  script_id: string;
  scene_number: number;
  assets_found: number;
  assets_approved: number;
  status: 'searching' | 'found' | 'approved' | 'failed';
}

// System notifications
export interface SystemNotificationData {
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: string;
  action_required?: boolean;
}

// Typed WebSocket events
export type WebSocketEvents = {
  post_status_update: PostStatusUpdateData;
  script_generated: ScriptGeneratedData;
  render_progress: RenderProgressData;
  render_complete: RenderCompleteData;
  asset_processing: AssetProcessingData;
  system_notification: SystemNotificationData;
};

// Client-to-server events
export interface ClientEvents {
  subscribe: {
    events: (keyof WebSocketEvents)[];
  };
  unsubscribe: {
    events: (keyof WebSocketEvents)[];
  };
  ping: Record<string, never>;
}

// Server-to-client events
export type ServerEvents = WebSocketEvents & {
  pong: Record<string, never>;
  error: {
    message: string;
    code?: string;
  };
  connected: {
    client_id: string;
    server_time: string;
  };
};

// WebSocket connection state
export type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

// WebSocket client options
export interface WebSocketOptions {
  url: string;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}
