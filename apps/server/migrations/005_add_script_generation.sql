-- Script Generation and Versioning System Migration
-- Adds script versioning, generation queue, and quality tracking

-- Extend video_scripts table with generation metadata
ALTER TABLE video_scripts ADD COLUMN generation_queue_id TEXT;
ALTER TABLE video_scripts ADD COLUMN generation_started_at TIMESTAMP;
ALTER TABLE video_scripts ADD COLUMN generation_completed_at TIMESTAMP;
ALTER TABLE video_scripts ADD COLUMN claude_model TEXT;
ALTER TABLE video_scripts ADD COLUMN prompt_version TEXT;
ALTER TABLE video_scripts ADD COLUMN quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100);

-- Script Versions table for version history
CREATE TABLE script_versions (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES reddit_posts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    script_content TEXT NOT NULL,
    scene_breakdown TEXT NOT NULL, -- JSON serialized SceneData[]
    duration_target INTEGER NOT NULL DEFAULT 60,
    titles TEXT NOT NULL, -- JSON serialized string[] for 5 title variations
    description TEXT NOT NULL,
    thumbnail_suggestions TEXT NOT NULL, -- JSON serialized ThumbnailConcept[]
    generation_params TEXT NOT NULL, -- JSON serialized generation parameters
    quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
    claude_model TEXT,
    prompt_version TEXT,
    generation_duration INTEGER, -- milliseconds taken to generate
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT FALSE, -- current active version
    UNIQUE(post_id, version_number)
);

-- Generation Queue table for job processing
CREATE TABLE generation_queue (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES reddit_posts(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    priority INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    generation_params TEXT NOT NULL, -- JSON serialized ScriptGenerationRequest params
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    worker_id TEXT -- ID of processing worker for tracking
);

-- Performance indexes for new tables
CREATE INDEX idx_script_versions_post_id ON script_versions(post_id);
CREATE INDEX idx_script_versions_active ON script_versions(post_id, is_active);
CREATE INDEX idx_script_versions_version ON script_versions(post_id, version_number);
CREATE INDEX idx_generation_queue_status ON generation_queue(status);
CREATE INDEX idx_generation_queue_priority ON generation_queue(priority DESC, created_at ASC);
CREATE INDEX idx_generation_queue_post_id ON generation_queue(post_id);

-- Additional indexes for video_scripts enhancements
CREATE INDEX idx_video_scripts_queue_id ON video_scripts(generation_queue_id);
CREATE INDEX idx_video_scripts_quality ON video_scripts(quality_score);

-- Trigger to ensure only one active version per post
CREATE TRIGGER ensure_single_active_version
    BEFORE UPDATE ON script_versions
    WHEN NEW.is_active = TRUE
BEGIN
    UPDATE script_versions 
    SET is_active = FALSE 
    WHERE post_id = NEW.post_id AND id != NEW.id;
END;

-- Trigger for automatic version cleanup (keep last 5 versions)
CREATE TRIGGER cleanup_old_versions
    AFTER INSERT ON script_versions
BEGIN
    DELETE FROM script_versions 
    WHERE post_id = NEW.post_id 
    AND id NOT IN (
        SELECT id FROM script_versions 
        WHERE post_id = NEW.post_id 
        ORDER BY version_number DESC 
        LIMIT 5
    );
END;