/**
 * Reddit Authentication Service Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RedditAuthService } from './auth.js';
import { DatabaseService } from '../database.js';
import { Logger } from '../../utils/logger.js';

// Mock environment variables
process.env.REDDIT_CLIENT_ID = 'test_client_id';
process.env.REDDIT_CLIENT_SECRET = 'test_client_secret';
process.env.REDDIT_REDIRECT_URI = 'http://localhost:3001/auth/reddit/callback';
process.env.REDDIT_USER_AGENT = 'test-app/1.0';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RedditAuthService', () => {
  let authService: RedditAuthService;
  let mockDb: DatabaseService;
  let mockLogger: Logger;

  beforeEach(() => {
    // Create mock database
    mockDb = {
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
      transaction: vi.fn(fn => fn()),
      close: vi.fn(),
      getDatabase: vi.fn(),
    } as unknown as DatabaseService;

    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as Logger;

    authService = new RedditAuthService(mockDb, mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with valid configuration', () => {
      expect(authService).toBeInstanceOf(RedditAuthService);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Reddit Auth Service initialized',
        expect.objectContaining({
          clientId: 'test_cli...',
          redirectUri: 'http://localhost:3001/auth/reddit/callback',
        })
      );
    });

    it('should throw error with missing configuration', () => {
      delete process.env.REDDIT_CLIENT_ID;

      expect(() => {
        new RedditAuthService(mockDb, mockLogger);
      }).toThrow('Missing Reddit OAuth2 configuration');

      // Restore for other tests
      process.env.REDDIT_CLIENT_ID = 'test_client_id';
    });
  });

  describe('generateAuthUrl', () => {
    it('should generate valid authorization URL with state', () => {
      const result = authService.generateAuthUrl(['read', 'identity']);

      expect(result.url).toContain('https://www.reddit.com/api/v1/authorize');
      expect(result.url).toContain('client_id=test_client_id');
      expect(result.url).toContain('scope=read+identity');
      expect(result.url).toContain(`state=${result.state}`);
      expect(result.state).toHaveLength(64); // 32 bytes hex = 64 chars
    });

    it('should use default scope if none provided', () => {
      const result = authService.generateAuthUrl();

      expect(result.url).toContain('scope=read');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should successfully exchange code for token', async () => {
      const mockTokenResponse = {
        access_token: 'test_access_token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'test_refresh_token',
        scope: 'read',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      (mockDb.run as any).mockReturnValueOnce({ changes: 0 }); // DELETE call
      (mockDb.run as any).mockReturnValueOnce({ lastInsertRowid: 1 }); // INSERT call

      const result = await authService.exchangeCodeForToken(
        'test_code',
        'test_state'
      );

      expect(result.access_token).toBe('test_access_token');
      expect(result.refresh_token).toBe('test_refresh_token');
      expect(result.id).toBe(1);
      expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM reddit_tokens');
    });

    it('should handle token exchange failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Invalid request'),
      });

      await expect(
        authService.exchangeCodeForToken('invalid_code', 'test_state')
      ).rejects.toThrow('Token exchange failed: 400 - Invalid request');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh access token', async () => {
      const mockTokenResponse = {
        access_token: 'new_access_token',
        token_type: 'bearer',
        expires_in: 3600,
        scope: 'read',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      (mockDb.run as any).mockReturnValueOnce({ changes: 1 });
      (mockDb.get as any).mockReturnValueOnce({
        id: 1,
        access_token: 'new_access_token',
        refresh_token: 'test_refresh_token',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        scope: 'read',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const result = await authService.refreshToken('test_refresh_token');

      expect(result.access_token).toBe('new_access_token');
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE reddit_tokens'),
        expect.arrayContaining(['new_access_token'])
      );
    });

    it('should handle refresh token failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Invalid refresh token'),
      });

      await expect(
        authService.refreshToken('invalid_refresh_token')
      ).rejects.toThrow('Token refresh failed: 401 - Invalid refresh token');
    });
  });

  describe('getValidAccessToken', () => {
    it('should return valid token if not expired', async () => {
      const futureExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      (mockDb.get as any).mockReturnValueOnce({
        id: 1,
        access_token: 'valid_token',
        refresh_token: 'refresh_token',
        expires_at: futureExpiry.toISOString(),
        scope: 'read',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const token = await authService.getValidAccessToken();
      expect(token).toBe('valid_token');
    });

    it('should refresh token if expires soon', async () => {
      const soonExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

      // Mock current token (expires soon)
      (mockDb.get as any).mockReturnValueOnce({
        id: 1,
        access_token: 'expiring_token',
        refresh_token: 'refresh_token',
        expires_at: soonExpiry.toISOString(),
        scope: 'read',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Mock refresh response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'refreshed_token',
            token_type: 'bearer',
            expires_in: 3600,
            scope: 'read',
          }),
      });

      (mockDb.run as any).mockReturnValueOnce({ changes: 1 });
      (mockDb.get as any).mockReturnValueOnce({
        id: 1,
        access_token: 'refreshed_token',
        refresh_token: 'refresh_token',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        scope: 'read',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const token = await authService.getValidAccessToken();
      expect(token).toBe('refreshed_token');
    });

    it('should throw error if no token available', async () => {
      (mockDb.get as any).mockReturnValueOnce(null);

      await expect(authService.getValidAccessToken()).rejects.toThrow(
        'No Reddit token available. Please authenticate first.'
      );
    });
  });

  describe('validateToken', () => {
    it('should return true for valid token', async () => {
      // Mock getting valid token
      (mockDb.get as any).mockReturnValueOnce({
        id: 1,
        access_token: 'valid_token',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        scope: 'read',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Mock Reddit API validation response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ name: 'test_user' }),
      });

      const isValid = await authService.validateToken();
      expect(isValid).toBe(true);
    });

    it('should return false for invalid token', async () => {
      (mockDb.get as any).mockReturnValueOnce({
        id: 1,
        access_token: 'invalid_token',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        scope: 'read',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const isValid = await authService.validateToken();
      expect(isValid).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', async () => {
      (mockDb.get as any).mockReturnValueOnce({
        id: 1,
        access_token: 'token',
        expires_at: new Date().toISOString(),
        scope: 'read',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const result = await authService.isAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false when no token exists', async () => {
      (mockDb.get as any).mockReturnValueOnce(null);

      const result = await authService.isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('revokeToken', () => {
    it('should successfully revoke token', async () => {
      (mockDb.get as any).mockReturnValueOnce({
        id: 1,
        access_token: 'token_to_revoke',
        expires_at: new Date().toISOString(),
        scope: 'read',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      mockFetch.mockResolvedValueOnce({ ok: true });
      (mockDb.run as any).mockReturnValueOnce({ changes: 1 });

      await authService.revokeToken();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/revoke_token'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        'DELETE FROM reddit_tokens WHERE id = ?',
        [1]
      );
    });

    it('should handle case when no token exists', async () => {
      (mockDb.get as any).mockReturnValueOnce(null);

      await expect(authService.revokeToken()).resolves.not.toThrow();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
