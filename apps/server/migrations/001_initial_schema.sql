-- Initial schema for video automation system
-- Based on architecture.md database schema

-- Reddit Posts Table
CREATE TABLE reddit_posts (
    id TEXT PRIMARY KEY,
    reddit_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    url TEXT NOT NULL,
    author TEXT NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,
    created_date TIMESTAMP NOT NULL,
    score REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN (
        'discovered', 'idea_selected', 'script_generating', 'script_generated', 
        'script_approved', 'script_generation_failed', 'rejected', 'assets_ready', 
        'rendering', 'completed', 'failed'
    )) DEFAULT 'discovered',
    discovered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Video Scripts Table
CREATE TABLE video_scripts (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES reddit_posts(id) ON DELETE CASCADE,
    script_content TEXT NOT NULL,
    scene_breakdown TEXT NOT NULL, -- JSON serialized SceneData[]
    duration_target INTEGER NOT NULL DEFAULT 60,
    titles TEXT NOT NULL, -- JSON serialized string[] for 5 title variations
    description TEXT NOT NULL,
    thumbnail_suggestions TEXT NOT NULL, -- JSON serialized ThumbnailConcept[]
    version INTEGER NOT NULL DEFAULT 1,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    audio_path TEXT,
    word_timings TEXT, -- JSON serialized word-level timing data
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP
);

-- Video Assets Table (Pexels content)
CREATE TABLE video_assets (
    id TEXT PRIMARY KEY,
    script_id TEXT NOT NULL REFERENCES video_scripts(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    pexels_id INTEGER NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('video', 'image')),
    url TEXT NOT NULL,
    local_path TEXT NOT NULL,
    photographer TEXT NOT NULL,
    duration INTEGER, -- NULL for images, seconds for videos
    resolution TEXT NOT NULL,
    relevance_score REAL NOT NULL CHECK (relevance_score BETWEEN 0 AND 1),
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    cached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Background Music Library
CREATE TABLE background_music (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    duration INTEGER NOT NULL,
    emotional_tone TEXT NOT NULL CHECK (emotional_tone IN (
        'motivational', 'contemplative', 'urgent', 'neutral'
    )),
    genre TEXT NOT NULL,
    volume_level REAL NOT NULL CHECK (volume_level BETWEEN 0 AND 1),
    loop_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    artist TEXT NOT NULL,
    license TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Music Selection for Scripts
CREATE TABLE music_selections (
    id TEXT PRIMARY KEY,
    script_id TEXT NOT NULL REFERENCES video_scripts(id) ON DELETE CASCADE,
    music_id TEXT NOT NULL REFERENCES background_music(id) ON DELETE CASCADE,
    selected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    volume_adjustment REAL CHECK (volume_adjustment BETWEEN 0 AND 1),
    fade_in_duration INTEGER DEFAULT 3, -- seconds
    fade_out_duration INTEGER DEFAULT 3, -- seconds
    UNIQUE(script_id) -- One music track per script
);

-- Video Outputs Table
CREATE TABLE video_outputs (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES reddit_posts(id) ON DELETE CASCADE,
    script_id TEXT NOT NULL REFERENCES video_scripts(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    duration INTEGER NOT NULL,
    resolution TEXT NOT NULL DEFAULT '1920x1080',
    render_settings TEXT NOT NULL, -- JSON serialized RenderConfig
    status TEXT NOT NULL CHECK (status IN ('rendering', 'completed', 'failed')),
    thumbnail_paths TEXT, -- JSON serialized string[] for thumbnail options
    metadata TEXT NOT NULL, -- JSON serialized VideoMetadata
    rendered_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX idx_reddit_posts_status ON reddit_posts(status);
CREATE INDEX idx_reddit_posts_score ON reddit_posts(score DESC);
CREATE INDEX idx_video_scripts_post_id ON video_scripts(post_id);
CREATE INDEX idx_video_assets_script_id ON video_assets(script_id);
CREATE INDEX idx_background_music_tone ON background_music(emotional_tone);
CREATE INDEX idx_music_selections_script ON music_selections(script_id);
CREATE INDEX idx_video_outputs_status ON video_outputs(status);

-- Status Audit Log Table for tracking status transitions
CREATE TABLE status_audit_log (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES reddit_posts(id) ON DELETE CASCADE,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    trigger_event TEXT NOT NULL, -- 'api_call', 'script_generation', 'user_action', etc.
    metadata TEXT, -- JSON serialized additional context
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT -- User ID or system process
);

-- Index for audit log queries
CREATE INDEX idx_status_audit_post_id ON status_audit_log(post_id);
CREATE INDEX idx_status_audit_created_at ON status_audit_log(created_at DESC);

-- Create trigger for automatic status change logging
CREATE TRIGGER log_status_changes
    AFTER UPDATE OF status ON reddit_posts
    FOR EACH ROW
    WHEN OLD.status != NEW.status
BEGIN
    INSERT INTO status_audit_log (id, post_id, old_status, new_status, trigger_event, created_at)
    VALUES (
        lower(hex(randomblob(16))),
        NEW.id,
        OLD.status,
        NEW.status,
        'database_update',
        CURRENT_TIMESTAMP
    );
END;

-- Update updated_at trigger for reddit_posts
DROP TRIGGER IF EXISTS update_reddit_posts_timestamp;
CREATE TRIGGER update_reddit_posts_timestamp
    AFTER UPDATE ON reddit_posts
    FOR EACH ROW
BEGIN
    UPDATE reddit_posts 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Sample Background Music Data
INSERT INTO background_music (id, title, file_path, duration, emotional_tone, genre, volume_level, loop_enabled, artist, license) VALUES
('bg_001', 'Uplifting Journey', '/assets/music/uplifting_journey.mp3', 180, 'motivational', 'upbeat', 0.3, TRUE, 'Various Artists', 'Royalty Free'),
('bg_002', 'Peaceful Reflection', '/assets/music/peaceful_reflection.mp3', 240, 'contemplative', 'ambient', 0.25, TRUE, 'Various Artists', 'Royalty Free'),
('bg_003', 'Dynamic Energy', '/assets/music/dynamic_energy.mp3', 150, 'urgent', 'electronic', 0.35, TRUE, 'Various Artists', 'Royalty Free'),
('bg_004', 'Gentle Focus', '/assets/music/gentle_focus.mp3', 300, 'neutral', 'cinematic', 0.2, TRUE, 'Various Artists', 'Royalty Free');