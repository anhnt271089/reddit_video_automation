/**
 * Reddit API Client Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RedditApiClient, RedditListing, RedditPost } from './client.js';
import { RedditAuthService } from './auth.js';

// Mock environment variables
process.env.REDDIT_USER_AGENT = 'test-app/1.0';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('RedditApiClient', () => {
  let apiClient: RedditApiClient;
  let mockAuthService: RedditAuthService;
  let mockLogger: any;

  beforeEach(() => {
    // Create mock auth service
    mockAuthService = {
      getValidAccessToken: vi.fn().mockResolvedValue('mock_access_token'),
    } as unknown as RedditAuthService;

    // Create mock logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    apiClient = new RedditApiClient(mockAuthService, mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('makeRequest', () => {
    it('should make successful authenticated request', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
        status: 200,
      });

      const result = await (apiClient as any).makeRequest('/test');

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock_access_token',
            'User-Agent': 'test-app/1.0',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle rate limiting with retry-after header', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: {
            get: vi.fn().mockReturnValue('2'),
          },
          text: () => Promise.resolve('Rate limited'),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
          status: 200,
        });

      const sleepSpy = vi
        .spyOn(apiClient as any, 'sleep')
        .mockResolvedValue(undefined);

      const result = await (apiClient as any).makeRequest('/test');

      expect(result).toEqual({ success: true });
      expect(sleepSpy).toHaveBeenCalledWith(2000); // 2 seconds
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Rate limited by Reddit API',
        expect.objectContaining({
          endpoint: '/test',
          retryAfter: 2,
          attempt: 1,
        })
      );
    });

    it('should retry with exponential backoff on server errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
          status: 200,
        });

      const sleepSpy = vi
        .spyOn(apiClient as any, 'sleep')
        .mockResolvedValue(undefined);

      const result = await (apiClient as any).makeRequest('/test');

      expect(result).toEqual({ success: true });
      expect(sleepSpy).toHaveBeenCalledWith(1000); // Base delay
    });

    it('should not retry on authentication errors', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: vi.fn().mockResolvedValue('Unauthorized'),
        headers: new Headers(),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      try {
        await (apiClient as any).makeRequest('/test');
        expect.fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Reddit API error: Unauthorized');
      }

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error after max retries exceeded', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server Error'),
        headers: new Headers(),
      });

      const sleepSpy = vi
        .spyOn(apiClient as any, 'sleep')
        .mockResolvedValue(undefined);

      await expect((apiClient as any).makeRequest('/test')).rejects.toThrow(
        'Reddit API error: Server Error'
      );

      expect(mockFetch).toHaveBeenCalledTimes(3); // Max retries
      expect(sleepSpy).toHaveBeenCalledTimes(2); // Retry delays
    });
  });

  describe('getUserInfo', () => {
    it('should get current user information', async () => {
      const mockUserInfo = {
        id: 'user123',
        name: 'testuser',
        created: 1234567890,
        created_utc: 1234567890,
        link_karma: 100,
        comment_karma: 50,
        is_gold: false,
        is_mod: false,
        verified: true,
        has_verified_email: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
        status: 200,
      });

      const result = await apiClient.getUserInfo();

      expect(result).toEqual(mockUserInfo);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/api/v1/me',
        expect.any(Object)
      );
    });
  });

  describe('getSubredditInfo', () => {
    it('should get subreddit information', async () => {
      const mockSubredditInfo = {
        id: 'sub123',
        name: 't5_2qh1i',
        display_name: 'GetMotivated',
        title: 'Get Motivated',
        description: 'Motivational content',
        subscribers: 50000,
        active_user_count: 1000,
        created: 1234567890,
        created_utc: 1234567890,
        over18: false,
        lang: 'en',
        url: '/r/GetMotivated/',
        icon_img: '',
        banner_background_image: '',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSubredditInfo),
        status: 200,
      });

      const result = await apiClient.getSubredditInfo('GetMotivated');

      expect(result).toEqual(mockSubredditInfo);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/r/GetMotivated/about',
        expect.any(Object)
      );
    });
  });

  describe('getSubredditPosts', () => {
    const mockListing: RedditListing<RedditPost> = {
      kind: 'Listing',
      data: {
        after: 'after123',
        before: null,
        children: [
          {
            kind: 't3',
            data: {
              id: 'post123',
              name: 't3_post123',
              title: 'Test Post',
              selftext: 'Test content',
              author: 'testuser',
              subreddit: 'GetMotivated',
              score: 100,
              upvote_ratio: 0.95,
              num_comments: 10,
              created: 1234567890,
              created_utc: 1234567890,
              permalink: '/r/GetMotivated/comments/post123/test_post/',
              url: 'https://reddit.com/r/GetMotivated/comments/post123/test_post/',
              thumbnail: '',
              domain: 'self.GetMotivated',
              is_video: false,
              is_self: true,
            },
          },
        ],
        dist: 1,
        modhash: '',
      },
    };

    it('should get hot posts from subreddit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
        status: 200,
      });

      const result = await apiClient.getSubredditPosts('GetMotivated', 'hot');

      expect(result).toEqual(mockListing);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/r/GetMotivated/hot',
        expect.any(Object)
      );
    });

    it('should get top posts with time filter and options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
        status: 200,
      });

      const result = await apiClient.getSubredditPosts('GetMotivated', 'top', {
        limit: 25,
        time: 'week',
        after: 'after123',
      });

      expect(result).toEqual(mockListing);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/r/GetMotivated/top?limit=25&after=after123&t=week',
        expect.any(Object)
      );
    });

    it('should get new posts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
        status: 200,
      });

      const result = await apiClient.getNewPosts('GetMotivated', { limit: 10 });

      expect(result).toEqual(mockListing);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/r/GetMotivated/new?limit=10',
        expect.any(Object)
      );
    });
  });

  describe('getTopPosts', () => {
    it('should get top posts with default time filter', async () => {
      const mockListing: RedditListing<RedditPost> = {
        kind: 'Listing',
        data: {
          after: null,
          before: null,
          children: [],
          dist: 0,
          modhash: '',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
        status: 200,
      });

      const result = await apiClient.getTopPosts('GetMotivated');

      expect(result).toEqual(mockListing);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/r/GetMotivated/top?t=week',
        expect.any(Object)
      );
    });

    it('should get top posts with custom time filter', async () => {
      const mockListing: RedditListing<RedditPost> = {
        kind: 'Listing',
        data: {
          after: null,
          before: null,
          children: [],
          dist: 0,
          modhash: '',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
        status: 200,
      });

      const result = await apiClient.getTopPosts('GetMotivated', 'month', {
        limit: 50,
      });

      expect(result).toEqual(mockListing);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/r/GetMotivated/top?limit=50&t=month',
        expect.any(Object)
      );
    });
  });

  describe('searchPosts', () => {
    it('should search posts in subreddit', async () => {
      const mockListing: RedditListing<RedditPost> = {
        kind: 'Listing',
        data: {
          after: null,
          before: null,
          children: [],
          dist: 0,
          modhash: '',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
        status: 200,
      });

      const result = await apiClient.searchPosts('GetMotivated', 'motivation', {
        sort: 'top',
        time: 'week',
        limit: 25,
      });

      expect(result).toEqual(mockListing);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/r/GetMotivated/search?q=motivation&restrict_sr=true&limit=25&sort=top&t=week',
        expect.any(Object)
      );
    });
  });

  describe('getPost', () => {
    it('should get specific post by ID', async () => {
      const mockListing: RedditListing<RedditPost> = {
        kind: 'Listing',
        data: {
          after: null,
          before: null,
          children: [
            {
              kind: 't3',
              data: {
                id: 'post123',
                name: 't3_post123',
                title: 'Specific Post',
                selftext: 'Post content',
                author: 'author',
                subreddit: 'GetMotivated',
                score: 200,
                upvote_ratio: 0.9,
                num_comments: 20,
                created: 1234567890,
                created_utc: 1234567890,
                permalink: '/r/GetMotivated/comments/post123/specific_post/',
                url: 'https://reddit.com/r/GetMotivated/comments/post123/specific_post/',
                thumbnail: '',
                domain: 'self.GetMotivated',
                is_video: false,
                is_self: true,
              },
            },
          ],
          dist: 1,
          modhash: '',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
        status: 200,
      });

      const result = await apiClient.getPost('GetMotivated', 'post123');

      expect(result).toEqual(mockListing);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://oauth.reddit.com/r/GetMotivated/comments/post123',
        expect.any(Object)
      );
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection test', async () => {
      const mockUserInfo = {
        id: 'user123',
        name: 'testuser',
        created: 1234567890,
        created_utc: 1234567890,
        link_karma: 100,
        comment_karma: 50,
        is_gold: false,
        is_mod: false,
        verified: true,
        has_verified_email: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserInfo),
        status: 200,
      });

      const result = await apiClient.testConnection();

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Reddit API connection test successful'
      );
    });

    it('should return false for failed connection test', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
        headers: new Headers(),
      });

      const result = await apiClient.testConnection();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenLastCalledWith(
        'Reddit API connection test failed',
        expect.objectContaining({
          error: expect.stringContaining('Reddit API error'),
        })
      );
    });
  });
});
