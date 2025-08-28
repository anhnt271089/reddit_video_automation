-- Reddit OAuth2 Tokens Table
-- Store Reddit authentication tokens for API access

CREATE TABLE reddit_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at DATETIME NOT NULL,
    scope TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient token lookup
CREATE INDEX idx_reddit_tokens_expires_at ON reddit_tokens(expires_at);