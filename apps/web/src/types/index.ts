// WebSocket connection states
export type WebSocketState = 'connecting' | 'connected' | 'disconnected' | 'error';

// Post-related types
export interface Post {
  id: string;
  title: string;
  content: string;
  url: string;
  score: number;
  author: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Script-related types
export interface VideoScript {
  id: string;
  post_id: string;
  title: string;
  content: string;
  duration_seconds: number;
  status: 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// Asset-related types
export interface VideoAsset {
  id: string;
  script_id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  description: string;
  duration_seconds?: number;
  start_time: number;
  end_time: number;
  created_at: string;
}

// Video output types
export interface VideoOutput {
  id: string;
  script_id: string;
  filename: string;
  file_path: string;
  file_size_bytes: number;
  duration_seconds: number;
  status: 'rendering' | 'completed' | 'failed';
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'broadcast' | 'direct';
  data: {
    event: string;
    postId?: string;
    scriptId?: string;
    videoId?: string;
    status?: string;
    progress?: number;
    data?: any;
  };
  timestamp: string;
}