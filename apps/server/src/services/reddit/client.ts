/**
 * Reddit API Client
 * Provides typed interface for Reddit API requests
 */

import winston from 'winston';
import { RedditAuthService } from './auth.js';

// Reddit API Response Types
export interface RedditPost {
  id: string;
  name: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  score: number;
  upvote_ratio: number;
  num_comments: number;
  created: number;
  created_utc: number;
  permalink: string;
  url: string;
  thumbnail: string;
  domain: string;
  is_video: boolean;
  is_self: boolean;
  post_hint?: string;
  preview?: {
    images: Array<{
      source: {
        url: string;
        width: number;
        height: number;
      };
    }>;
  };
}

export interface RedditListing<T = RedditPost> {
  kind: 'Listing';
  data: {
    after: string | null;
    before: string | null;
    children: Array<{
      kind: 't3';
      data: T;
    }>;
    dist: number;
    modhash: string;
  };
}

export interface RedditSubredditInfo {
  id: string;
  name: string;
  display_name: string;
  title: string;
  description: string;
  subscribers: number;
  active_user_count: number;
  created: number;
  created_utc: number;
  over18: boolean;
  lang: string;
  url: string;
  icon_img: string;
  banner_background_image: string;
}

export interface RedditUserInfo {
  id: string;
  name: string;
  created: number;
  created_utc: number;
  link_karma: number;
  comment_karma: number;
  is_gold: boolean;
  is_mod: boolean;
  verified: boolean;
  has_verified_email: boolean;
}

export interface RedditApiOptions {
  limit?: number;
  after?: string;
  before?: string;
  count?: number;
  time?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';
  sort?: 'hot' | 'new' | 'top' | 'rising';
}

export interface RedditApiError {
  message: string;
  error_type: string;
}

export class RedditApiClient {
  private readonly baseUrl = 'https://oauth.reddit.com';
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000; // 1 second

  constructor(
    private readonly authService: RedditAuthService,
    private readonly logger: winston.Logger
  ) {}

  /**
   * Make authenticated request to Reddit API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = await this.authService.getValidAccessToken();
    const url = `${this.baseUrl}${endpoint}`;

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'User-Agent': process.env.REDDIT_USER_AGENT || 'video-automation/1.0',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        this.logger.debug('Making Reddit API request', {
          endpoint,
          attempt: attempt + 1,
          method: requestOptions.method || 'GET',
        });

        const response = await fetch(url, requestOptions);

        if (!response) {
          throw new Error('Fetch returned no response');
        }

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(
            response.headers.get('retry-after') || '60',
            10
          );
          const delay = Math.min(retryAfter * 1000, 300000); // Max 5 minutes

          this.logger.warn('Rate limited by Reddit API', {
            endpoint,
            retryAfter,
            attempt: attempt + 1,
          });

          if (attempt < this.maxRetries - 1) {
            await this.sleep(delay);
            continue;
          }
        }

        // Handle other HTTP errors
        if (!response.ok) {
          const errorText = await response.text();
          let errorData: RedditApiError;

          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = {
              message:
                errorText || `HTTP ${response.status}: ${response.statusText}`,
              error_type: 'http_error',
            };
          }

          const error = new Error(`Reddit API error: ${errorData.message}`);
          error.name = 'RedditApiError';
          (error as any).status = response.status;
          (error as any).errorType = errorData.error_type;

          this.logger.error('Reddit API request failed', {
            endpoint,
            status: response.status,
            error: errorData,
            attempt: attempt + 1,
          });

          // Don't retry on authentication errors
          if (response.status === 401 || response.status === 403) {
            throw error;
          }

          lastError = error;

          if (attempt < this.maxRetries - 1) {
            const delay = this.baseDelay * Math.pow(2, attempt);
            await this.sleep(delay);
            continue;
          }

          // If we reach here, we've exceeded retries for non-auth errors
          throw lastError || new Error('Unknown error occurred');
        }

        const data = await response.json();

        this.logger.debug('Reddit API request successful', {
          endpoint,
          status: response.status,
          attempt: attempt + 1,
        });

        return data;
      } catch (error) {
        // Re-throw authentication errors immediately (don't retry)
        if (
          error instanceof Error &&
          error.name === 'RedditApiError' &&
          ((error as any).status === 401 || (error as any).status === 403)
        ) {
          throw error;
        }

        this.logger.error('Reddit API request error', {
          endpoint,
          error: error instanceof Error ? error.message : String(error),
          attempt: attempt + 1,
        });

        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.maxRetries - 1) {
          const delay = this.baseDelay * Math.pow(2, attempt);
          await this.sleep(delay);
          continue;
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current user info
   */
  async getUserInfo(): Promise<RedditUserInfo> {
    return this.makeRequest<RedditUserInfo>('/api/v1/me');
  }

  /**
   * Get subreddit information
   */
  async getSubredditInfo(subreddit: string): Promise<RedditSubredditInfo> {
    return this.makeRequest<RedditSubredditInfo>(`/r/${subreddit}/about`);
  }

  /**
   * Get posts from subreddit
   */
  async getSubredditPosts(
    subreddit: string,
    sort: 'hot' | 'new' | 'top' | 'rising' = 'hot',
    options: RedditApiOptions = {}
  ): Promise<RedditListing<RedditPost>> {
    const params = new URLSearchParams();

    if (options.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options.after) {
      params.append('after', options.after);
    }
    if (options.before) {
      params.append('before', options.before);
    }
    if (options.count) {
      params.append('count', options.count.toString());
    }
    if (options.time && sort === 'top') {
      params.append('t', options.time);
    }

    const queryString = params.toString();
    const endpoint = `/r/${subreddit}/${sort}${queryString ? '?' + queryString : ''}`;

    return this.makeRequest<RedditListing<RedditPost>>(endpoint);
  }

  /**
   * Get top posts from subreddit with time filter
   */
  async getTopPosts(
    subreddit: string,
    time: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' = 'week',
    options: RedditApiOptions = {}
  ): Promise<RedditListing<RedditPost>> {
    return this.getSubredditPosts(subreddit, 'top', { ...options, time });
  }

  /**
   * Get hot posts from subreddit
   */
  async getHotPosts(
    subreddit: string,
    options: RedditApiOptions = {}
  ): Promise<RedditListing<RedditPost>> {
    return this.getSubredditPosts(subreddit, 'hot', options);
  }

  /**
   * Get new posts from subreddit
   */
  async getNewPosts(
    subreddit: string,
    options: RedditApiOptions = {}
  ): Promise<RedditListing<RedditPost>> {
    return this.getSubredditPosts(subreddit, 'new', options);
  }

  /**
   * Get rising posts from subreddit
   */
  async getRisingPosts(
    subreddit: string,
    options: RedditApiOptions = {}
  ): Promise<RedditListing<RedditPost>> {
    return this.getSubredditPosts(subreddit, 'rising', options);
  }

  /**
   * Get specific post by ID
   */
  async getPost(
    subreddit: string,
    postId: string
  ): Promise<RedditListing<RedditPost>> {
    return this.makeRequest<RedditListing<RedditPost>>(
      `/r/${subreddit}/comments/${postId}`
    );
  }

  /**
   * Search posts in subreddit
   */
  async searchPosts(
    subreddit: string,
    query: string,
    options: RedditApiOptions & {
      sort?: 'relevance' | 'hot' | 'top' | 'new' | 'comments';
    } = {}
  ): Promise<RedditListing<RedditPost>> {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('restrict_sr', 'true');

    if (options.limit) {
      params.append('limit', options.limit.toString());
    }
    if (options.after) {
      params.append('after', options.after);
    }
    if (options.before) {
      params.append('before', options.before);
    }
    if (options.sort) {
      params.append('sort', options.sort);
    }
    if (options.time) {
      params.append('t', options.time);
    }

    const endpoint = `/r/${subreddit}/search?${params.toString()}`;
    return this.makeRequest<RedditListing<RedditPost>>(endpoint);
  }

  /**
   * Test API connectivity and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getUserInfo();
      this.logger.info('Reddit API connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Reddit API connection test failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
