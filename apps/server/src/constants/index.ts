/**
 * Application Constants
 * Centralized location for all magic numbers, default values, and configuration constants
 */

// API Configuration
export const API_CONFIG = {
  // Default ports
  DEFAULT_PORT: 3001,

  // Request timeouts (in milliseconds)
  REQUEST_TIMEOUT: 30000, // 30 seconds
  LONG_REQUEST_TIMEOUT: 300000, // 5 minutes for video processing

  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Rate limiting
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 100,
} as const;

// Video Generation Constants
export const VIDEO_CONFIG = {
  // Default video settings
  DEFAULT_DIMENSIONS: {
    width: 1080,
    height: 1920,
  },
  DEFAULT_FPS: 30,
  DEFAULT_DURATION: 60, // seconds

  // Quality settings
  QUALITY_PRESETS: {
    low: { scale: 0.5, crf: 28 },
    medium: { scale: 1.0, crf: 23 },
    high: { scale: 1.0, crf: 18 },
  },

  // Scene duration thresholds
  PHOTO_DURATION_THRESHOLD: 4, // scenes under 4 seconds use photos
  VIDEO_DURATION_THRESHOLD: 4, // scenes 4+ seconds use videos
} as const;

// Asset Download Constants
export const ASSET_CONFIG = {
  // Download timeouts
  DOWNLOAD_TIMEOUT: 30000, // 30 seconds per asset
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second

  // Progress tracking
  PROGRESS_UPDATE_INTERVAL: 500, // 500ms

  // File size limits (in bytes)
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
} as const;

// Script Generation Constants
export const SCRIPT_CONFIG = {
  // Default values
  DEFAULT_TARGET_DURATION: 60, // seconds
  DEFAULT_SCENE_COUNT: 8,

  // Limits
  MIN_SCENE_COUNT: 3,
  MAX_SCENE_COUNT: 20,
  MIN_DURATION: 15,
  MAX_DURATION: 300, // 5 minutes

  // Text processing
  MAX_CONTENT_LENGTH: 50000, // characters
  MIN_CONTENT_LENGTH: 100,
} as const;

// Database Constants
export const DATABASE_CONFIG = {
  // Connection settings
  CONNECTION_TIMEOUT: 5000, // 5 seconds

  // Query limits
  DEFAULT_QUERY_LIMIT: 50,
  MAX_QUERY_LIMIT: 1000,

  // Backup settings
  BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const;

// WebSocket Constants
export const WEBSOCKET_CONFIG = {
  // Connection settings
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  RECONNECT_DELAY: 5000, // 5 seconds
  MAX_RECONNECT_ATTEMPTS: 5,

  // Message types
  MESSAGE_TYPES: {
    ASSET_DOWNLOAD_PROGRESS: 'asset_download_progress',
    ASSET_DOWNLOAD_STARTED: 'asset_download_started',
    ASSET_DOWNLOAD_COMPLETED: 'asset_download_completed',
    ASSET_DOWNLOAD_FAILED: 'asset_download_failed',
    ASSET_DOWNLOAD_STATUS_CHANGE: 'asset_download_status_change',
    VIDEO_GENERATION_PROGRESS: 'video_generation_progress',
    SCRIPT_GENERATION_PROGRESS: 'script_generation_progress',
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Generic errors
  INTERNAL_SERVER_ERROR: 'Internal server error occurred',
  INVALID_REQUEST: 'Invalid request parameters',
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',

  // Script-specific errors
  SCRIPT_NOT_FOUND: 'Script not found',
  SCRIPT_GENERATION_FAILED: 'Failed to generate script',
  SCRIPT_ALREADY_EXISTS: 'Script already exists for this post',

  // Asset-specific errors
  ASSET_DOWNLOAD_FAILED: 'Failed to download asset',
  ASSET_NOT_FOUND: 'Asset not found',
  ASSET_SIZE_EXCEEDED: 'Asset size exceeds maximum limit',

  // Video-specific errors
  VIDEO_GENERATION_FAILED: 'Failed to generate video',
  VIDEO_NOT_FOUND: 'Video not found',

  // Database errors
  DATABASE_CONNECTION_FAILED: 'Failed to connect to database',
  DATABASE_QUERY_FAILED: 'Database query failed',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SCRIPT_GENERATED: 'Script generated successfully',
  SCRIPT_APPROVED: 'Script approved successfully',
  ASSET_DOWNLOADED: 'Asset downloaded successfully',
  VIDEO_GENERATED: 'Video generated successfully',
  CONFIGURATION_LOADED: 'Configuration loaded and validated successfully',
} as const;

// File Extensions
export const FILE_EXTENSIONS = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  VIDEOS: ['.mp4', '.webm', '.avi', '.mov'],
  AUDIO: ['.mp3', '.wav', '.aac', '.ogg'],
} as const;

// HTTP Status Codes (for consistency)
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Validation Patterns
export const VALIDATION_PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  POST_ID: /^[a-zA-Z0-9_-]+$/,
  URL: /^https?:\/\/.+/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Environment-specific constants
export const ENV_CONSTANTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;
