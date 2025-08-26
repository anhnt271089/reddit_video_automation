-- Create reddit_tokens table for OAuth2 token storage
CREATE TABLE reddit_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP NOT NULL,
  scope TEXT NOT NULL DEFAULT 'read',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on expires_at for efficient token expiry checks
CREATE INDEX idx_reddit_tokens_expires_at ON reddit_tokens(expires_at);