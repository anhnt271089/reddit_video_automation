/**
 * Rate Limiter with Token Bucket Algorithm
 *
 * Implements Reddit API rate limiting:
 * - 60 requests per minute limit
 * - Request queuing when limit reached
 * - Priority queue for important requests
 * - Rate limit headers parsing
 * - Monitoring and statistics
 */

export interface RateLimiterConfig {
  tokensPerInterval: number;
  interval: number; // in milliseconds
  maxTokens: number;
}

export interface QueuedRequest {
  resolve: (value: void) => void;
  reject: (reason?: any) => void;
  priority: number;
  timestamp: number;
  endpoint?: string;
}

export interface RateLimitStats {
  tokensRemaining: number;
  maxTokens: number;
  queueSize: number;
  totalRequests: number;
  throttledRequests: number;
  averageWaitTime: number;
  lastRefill: number;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private config: RateLimiterConfig;
  private queue: QueuedRequest[] = [];
  private stats: {
    totalRequests: number;
    throttledRequests: number;
    totalWaitTime: number;
    completedRequests: number;
  };

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.tokens = config.maxTokens;
    this.lastRefill = Date.now();
    this.stats = {
      totalRequests: 0,
      throttledRequests: 0,
      totalWaitTime: 0,
      completedRequests: 0,
    };

    // Start refill interval
    this.startRefillInterval();
  }

  /**
   * Acquire a token for making a request
   * @param priority Higher values = higher priority (default: 1)
   * @param endpoint Optional endpoint name for monitoring
   * @returns Promise that resolves when token is available
   */
  async acquire(priority: number = 1, endpoint?: string): Promise<void> {
    this.stats.totalRequests++;

    return new Promise<void>((resolve, reject) => {
      // Try to get a token immediately
      if (this.tryAcquireToken()) {
        resolve();
        return;
      }

      // No tokens available, add to queue
      this.stats.throttledRequests++;
      const request: QueuedRequest = {
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
        endpoint,
      };

      // Insert into queue based on priority
      this.insertIntoQueue(request);
    });
  }

  /**
   * Try to acquire a token immediately
   * @returns true if token was acquired, false otherwise
   */
  private tryAcquireToken(): boolean {
    this.refillTokens();

    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }

    return false;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;

    if (elapsed >= this.config.interval) {
      const tokensToAdd =
        Math.floor(elapsed / this.config.interval) *
        this.config.tokensPerInterval;
      this.tokens = Math.min(this.config.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Insert request into priority queue
   */
  private insertIntoQueue(request: QueuedRequest): void {
    // Find insertion point based on priority (higher priority first)
    let insertIndex = 0;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < request.priority) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }

    this.queue.splice(insertIndex, 0, request);
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    while (this.queue.length > 0 && this.tryAcquireToken()) {
      const request = this.queue.shift()!;
      const waitTime = Date.now() - request.timestamp;

      this.stats.totalWaitTime += waitTime;
      this.stats.completedRequests++;

      request.resolve();
    }
  }

  /**
   * Start the token refill interval
   */
  private startRefillInterval(): void {
    setInterval(() => {
      this.refillTokens();
      this.processQueue();
    }, 1000); // Check every second
  }

  /**
   * Update rate limits from response headers
   * @param headers Response headers from Reddit API
   */
  updateFromHeaders(headers: Headers): void {
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    const used = headers.get('x-ratelimit-used');

    if (remaining) {
      const remainingTokens = parseInt(remaining, 10);
      if (!isNaN(remainingTokens)) {
        // Update tokens to match server's count (don't just minimize)
        this.tokens = Math.min(remainingTokens, this.config.maxTokens);
      }
    }

    if (reset) {
      const resetTime = parseInt(reset, 10) * 1000; // Convert to milliseconds
      const now = Date.now();
      if (resetTime > now) {
        // Adjust refill timing based on server reset time
        this.lastRefill = now - (this.config.interval - (resetTime - now));
      }
    }
  }

  /**
   * Get current rate limiter statistics
   */
  getStats(): RateLimitStats {
    this.refillTokens(); // Update tokens before returning stats

    return {
      tokensRemaining: this.tokens,
      maxTokens: this.config.maxTokens,
      queueSize: this.queue.length,
      totalRequests: this.stats.totalRequests,
      throttledRequests: this.stats.throttledRequests,
      averageWaitTime:
        this.stats.completedRequests > 0
          ? this.stats.totalWaitTime / this.stats.completedRequests
          : 0,
      lastRefill: this.lastRefill,
    };
  }

  /**
   * Clear all queued requests (useful for shutdown)
   */
  clearQueue(): void {
    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      request.reject(new Error('Rate limiter cleared'));
    }
  }

  /**
   * Reset rate limiter state
   */
  reset(): void {
    this.tokens = this.config.maxTokens;
    this.lastRefill = Date.now();
    this.clearQueue();
    this.stats = {
      totalRequests: 0,
      throttledRequests: 0,
      totalWaitTime: 0,
      completedRequests: 0,
    };
  }
}

/**
 * Create a Reddit API rate limiter with standard settings
 * 60 requests per minute = 1 request per second
 */
export function createRedditRateLimiter(): RateLimiter {
  return new RateLimiter({
    tokensPerInterval: 1, // 1 token per second
    interval: 1000, // 1 second
    maxTokens: 60, // Allow burst of 60 requests
  });
}

/**
 * Singleton instance for Reddit API rate limiting
 */
export const redditRateLimiter = createRedditRateLimiter();
