/**
 * Reddit OAuth2 Authentication Service
 * Handles OAuth2 flow, token management, and refresh logic
 */

import crypto from 'crypto';
import winston from 'winston';
import { DatabaseService } from '../database.js';
import { logger } from '../../utils/logger.js';

interface RedditTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface StoredToken {
  id?: number;
  access_token: string;
  refresh_token?: string;
  expires_at: Date;
  scope: string;
  created_at: Date;
  updated_at: Date;
}

interface TokenRow {
  id: number;
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  scope: string;
  created_at: string;
  updated_at: string;
}

export class RedditAuthService {
  private readonly baseUrl = 'https://www.reddit.com/api/v1';
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly userAgent: string;

  constructor(
    private readonly db: DatabaseService,
    private readonly logger: winston.Logger
  ) {
    this.clientId = process.env.REDDIT_CLIENT_ID!;
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET!;
    this.redirectUri = process.env.REDDIT_REDIRECT_URI!;
    this.userAgent = process.env.REDDIT_USER_AGENT || 'video-automation/1.0';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Missing Reddit OAuth2 configuration');
    }

    this.logger.info('Reddit Auth Service initialized', {
      clientId: this.clientId.substring(0, 8) + '...',
      redirectUri: this.redirectUri,
    });
  }

  /**
   * Generate OAuth2 authorization URL with state parameter
   */
  generateAuthUrl(scopes: string[] = ['read']): { url: string; state: string } {
    const state = crypto.randomBytes(32).toString('hex');
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      state,
      redirect_uri: this.redirectUri,
      duration: 'permanent',
      scope: scopes.join(' '),
    });

    const url = `${this.baseUrl}/authorize?${params.toString()}`;

    this.logger.info('Generated Reddit auth URL', { state, scopes });
    return { url, state };
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<StoredToken> {
    this.logger.info('Exchanging authorization code for token', {
      code: code.substring(0, 10) + '...',
      state,
    });

    try {
      const response = await fetch(`${this.baseUrl}/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'User-Agent': this.userAgent,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token exchange failed: ${response.status} - ${error}`);
      }

      const tokenData: RedditTokenResponse = await response.json();
      const storedToken = await this.storeToken(tokenData);

      this.logger.info('Successfully exchanged code for token', {
        tokenId: storedToken.id,
        expiresAt: storedToken.expires_at,
        scope: storedToken.scope,
      });

      return storedToken;
    } catch (error) {
      this.logger.error('Failed to exchange code for token', {
        error,
        code: code.substring(0, 10) + '...',
      });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<StoredToken> {
    this.logger.info('Refreshing access token');

    try {
      const response = await fetch(`${this.baseUrl}/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'User-Agent': this.userAgent,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token refresh failed: ${response.status} - ${error}`);
      }

      const tokenData: RedditTokenResponse = await response.json();

      // Use existing refresh token if not provided in response
      if (!tokenData.refresh_token) {
        tokenData.refresh_token = refreshToken;
      }

      const storedToken = await this.updateToken(tokenData, refreshToken);

      this.logger.info('Successfully refreshed token', {
        tokenId: storedToken.id,
        expiresAt: storedToken.expires_at,
      });

      return storedToken;
    } catch (error) {
      this.logger.error('Failed to refresh token', { error });
      throw error;
    }
  }

  /**
   * Get current valid access token (refresh if needed)
   */
  async getValidAccessToken(): Promise<string> {
    const token = await this.getCurrentToken();

    if (!token) {
      throw new Error('No Reddit token available. Please authenticate first.');
    }

    // Check if token is expired or expires within 5 minutes
    const now = new Date();
    const expiresAt = new Date(token.expires_at);
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (expiresAt <= fiveMinutesFromNow) {
      if (!token.refresh_token) {
        throw new Error('Token expired and no refresh token available');
      }

      const refreshedToken = await this.refreshToken(token.refresh_token);
      return refreshedToken.access_token;
    }

    return token.access_token;
  }

  /**
   * Validate if current token is valid
   */
  async validateToken(): Promise<boolean> {
    try {
      const accessToken = await this.getValidAccessToken();

      const response = await fetch('https://oauth.reddit.com/api/v1/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': this.userAgent,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        this.logger.info('Token validation successful', {
          username: userData.name,
        });
        return true;
      }

      this.logger.warn('Token validation failed', { status: response.status });
      return false;
    } catch (error) {
      this.logger.error('Token validation error', { error });
      return false;
    }
  }

  /**
   * Store token in database
   */
  private async storeToken(
    tokenData: RedditTokenResponse
  ): Promise<StoredToken> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + tokenData.expires_in * 1000);

    const token: Omit<StoredToken, 'id'> = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      scope: tokenData.scope,
      created_at: now,
      updated_at: now,
    };

    // Clear existing tokens and insert new one
    await this.db.run('DELETE FROM reddit_tokens');

    const result = await this.db.run(
      `INSERT INTO reddit_tokens (access_token, refresh_token, expires_at, scope, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        token.access_token,
        token.refresh_token,
        token.expires_at.toISOString(),
        token.scope,
        token.created_at.toISOString(),
        token.updated_at.toISOString(),
      ]
    );

    return { ...token, id: result.lastInsertRowid as number };
  }

  /**
   * Update existing token in database
   */
  private async updateToken(
    tokenData: RedditTokenResponse,
    oldRefreshToken: string
  ): Promise<StoredToken> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + tokenData.expires_in * 1000);

    const result = await this.db.run(
      `UPDATE reddit_tokens 
       SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = ?
       WHERE refresh_token = ?`,
      [
        tokenData.access_token,
        tokenData.refresh_token || oldRefreshToken,
        expiresAt.toISOString(),
        now.toISOString(),
        oldRefreshToken,
      ]
    );

    if (result.changes === 0) {
      throw new Error('Failed to update token - token not found');
    }

    const updated = await this.getCurrentToken();
    if (!updated) {
      throw new Error('Failed to retrieve updated token');
    }

    return updated;
  }

  /**
   * Get current token from database
   */
  private async getCurrentToken(): Promise<StoredToken | null> {
    const row = await this.db.get<TokenRow>(
      'SELECT * FROM reddit_tokens ORDER BY created_at DESC LIMIT 1'
    );

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      access_token: row.access_token,
      refresh_token: row.refresh_token,
      expires_at: new Date(row.expires_at),
      scope: row.scope,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  /**
   * Check if authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getCurrentToken();
    return token !== null;
  }

  /**
   * Revoke current token
   */
  async revokeToken(): Promise<void> {
    const token = await this.getCurrentToken();
    if (!token) {
      return;
    }

    try {
      await fetch(`${this.baseUrl}/revoke_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'User-Agent': this.userAgent,
        },
        body: new URLSearchParams({
          token: token.access_token,
          token_type_hint: 'access_token',
        }),
      });

      await this.db.run('DELETE FROM reddit_tokens WHERE id = ?', [token.id]);

      this.logger.info('Token revoked successfully', { tokenId: token.id });
    } catch (error) {
      this.logger.error('Failed to revoke token', { error });
      throw error;
    }
  }
}
