/**
 * Rate Limiter Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimiter, createRedditRateLimiter } from './rateLimiter.js';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      tokensPerInterval: 5, // 5 tokens per second for testing
      interval: 1000, // 1 second
      maxTokens: 10, // Allow burst of 10 tokens
    });
  });

  afterEach(async () => {
    // Clear queue without rejecting (to avoid unhandled rejections in tests)
    if (rateLimiter) {
      (rateLimiter as any).queue = []; // Clear queue directly
    }
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Token Bucket Algorithm', () => {
    it('should allow immediate requests when tokens are available', async () => {
      const start = Date.now();
      await rateLimiter.acquire();
      const elapsed = Date.now() - start;

      // Should complete immediately (within 10ms)
      expect(elapsed).toBeLessThan(10);
    });

    it('should refill tokens over time', async () => {
      vi.useFakeTimers();

      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        await rateLimiter.acquire();
      }

      // Stats should show no tokens remaining
      let stats = rateLimiter.getStats();
      expect(stats.tokensRemaining).toBe(0);

      // Advance time by 1 second
      vi.advanceTimersByTime(1000);

      // Should have refilled 5 tokens
      stats = rateLimiter.getStats();
      expect(stats.tokensRemaining).toBe(5);

      vi.useRealTimers();
    });

    it('should not exceed max tokens when refilling', async () => {
      vi.useFakeTimers();

      // Start with full tokens, advance time significantly
      vi.advanceTimersByTime(10000); // 10 seconds

      const stats = rateLimiter.getStats();
      expect(stats.tokensRemaining).toBeLessThanOrEqual(10); // maxTokens

      vi.useRealTimers();
    });
  });

  describe('Request Queuing', () => {
    it('should queue requests when no tokens are available', async () => {
      vi.useFakeTimers();

      // Consume all available tokens
      const immediatePromises = [];
      for (let i = 0; i < 10; i++) {
        immediatePromises.push(rateLimiter.acquire());
      }
      await Promise.all(immediatePromises);

      // This request should be queued
      const queuedPromise = rateLimiter.acquire();

      // Should be in queue
      const stats = rateLimiter.getStats();
      expect(stats.queueSize).toBe(1);
      expect(stats.throttledRequests).toBe(1);

      // Advance time to allow token refill
      vi.advanceTimersByTime(1000);
      await queuedPromise;

      // Queue should be empty now
      const finalStats = rateLimiter.getStats();
      expect(finalStats.queueSize).toBe(0);

      vi.useRealTimers();
    });

    it('should process queued requests in priority order', async () => {
      vi.useFakeTimers();

      // Consume all tokens
      const immediatePromises = [];
      for (let i = 0; i < 10; i++) {
        immediatePromises.push(rateLimiter.acquire());
      }
      await Promise.all(immediatePromises);

      // Queue requests with different priorities
      const lowPriorityPromise = rateLimiter.acquire(1, 'low');
      const highPriorityPromise = rateLimiter.acquire(10, 'high');
      const mediumPriorityPromise = rateLimiter.acquire(5, 'medium');

      const stats = rateLimiter.getStats();
      expect(stats.queueSize).toBe(3);

      const results: string[] = [];

      // Track completion order
      lowPriorityPromise.then(() => results.push('low'));
      mediumPriorityPromise.then(() => results.push('medium'));
      highPriorityPromise.then(() => results.push('high'));

      // Advance time to process queue
      vi.advanceTimersByTime(1000);
      await Promise.all([
        lowPriorityPromise,
        mediumPriorityPromise,
        highPriorityPromise,
      ]);

      // Should process in priority order: high, medium, low
      expect(results).toEqual(['high', 'medium', 'low']);

      vi.useRealTimers();
    });
  });

  describe('Header Integration', () => {
    it('should update tokens from Reddit API headers', () => {
      const headers = new Headers();
      headers.set('x-ratelimit-remaining', '8'); // Set to value within maxTokens (10)
      headers.set('x-ratelimit-used', '2');

      rateLimiter.updateFromHeaders(headers);

      const stats = rateLimiter.getStats();
      expect(stats.tokensRemaining).toBe(8);
    });

    it('should handle invalid header values gracefully', () => {
      const headers = new Headers();
      headers.set('x-ratelimit-remaining', 'invalid');

      const statsBefore = rateLimiter.getStats();
      rateLimiter.updateFromHeaders(headers);
      const statsAfter = rateLimiter.getStats();

      // Should not change if header is invalid
      expect(statsAfter.tokensRemaining).toBe(statsBefore.tokensRemaining);
    });
  });

  describe('Statistics', () => {
    it('should track request statistics correctly', async () => {
      vi.useFakeTimers();

      // Make some immediate requests
      await rateLimiter.acquire(1, 'test1');
      await rateLimiter.acquire(2, 'test2');

      // Consume all tokens and queue some requests
      for (let i = 0; i < 8; i++) {
        await rateLimiter.acquire();
      }

      // Queue a request
      const queuedPromise = rateLimiter.acquire(3, 'queued');

      const stats = rateLimiter.getStats();
      expect(stats.totalRequests).toBe(11);
      expect(stats.throttledRequests).toBe(1);
      expect(stats.queueSize).toBe(1);

      // Process queued request
      vi.advanceTimersByTime(1000);
      await queuedPromise;

      const finalStats = rateLimiter.getStats();
      expect(finalStats.averageWaitTime).toBeGreaterThan(0);

      vi.useRealTimers();
    });
  });

  describe('Burst Requests', () => {
    it('should handle burst of requests correctly', async () => {
      vi.useFakeTimers();

      const promises = [];

      // Create 15 concurrent requests (more than bucket capacity of 10)
      for (let i = 0; i < 15; i++) {
        promises.push(rateLimiter.acquire(1, `burst-${i}`));
      }

      // Check that some are queued
      await vi.runAllTimersAsync(); // Let immediate requests process
      const stats = rateLimiter.getStats();
      expect(stats.queueSize).toBe(5); // 15 requests - 10 available tokens

      // Advance time to process queued requests
      vi.advanceTimersByTime(1000); // 1 second to refill 5 tokens
      await vi.runAllTimersAsync();

      const results = await Promise.all(promises);
      expect(results.length).toBe(15);

      const finalStats = rateLimiter.getStats();
      expect(finalStats.queueSize).toBe(0);

      vi.useRealTimers();
    });

    it('should maintain rate limit under sustained load', async () => {
      vi.useFakeTimers();

      const requests = [];

      // Generate 15 requests (10 immediate + 5 queued)
      for (let i = 0; i < 15; i++) {
        requests.push(rateLimiter.acquire());
      }

      // Check initial state - should have 5 queued
      let stats = rateLimiter.getStats();
      expect(stats.queueSize).toBe(5);
      expect(stats.totalRequests).toBe(15);
      expect(stats.throttledRequests).toBe(5);

      // Advance time to process queued requests
      vi.advanceTimersByTime(1000); // Refill 5 tokens
      await vi.runAllTimersAsync();

      // All requests should be completed now
      await Promise.all(requests);

      stats = rateLimiter.getStats();
      expect(stats.queueSize).toBe(0);
      expect(stats.totalRequests).toBe(15);

      vi.useRealTimers();
    });
  });

  describe('Cleanup', () => {
    it('should clear queue and reject pending requests', async () => {
      vi.useFakeTimers();

      // Consume all tokens
      for (let i = 0; i < 10; i++) {
        await rateLimiter.acquire();
      }

      // Queue some requests
      const queuedPromises = [
        rateLimiter.acquire().catch(err => err.message),
        rateLimiter.acquire().catch(err => err.message),
      ];

      expect(rateLimiter.getStats().queueSize).toBe(2);

      // Clear the queue
      rateLimiter.clearQueue();

      const results = await Promise.all(queuedPromises);
      expect(results).toEqual(['Rate limiter cleared', 'Rate limiter cleared']);
      expect(rateLimiter.getStats().queueSize).toBe(0);

      vi.useRealTimers();
    });

    it('should reset statistics correctly', async () => {
      // Make some requests to generate stats
      await rateLimiter.acquire();
      await rateLimiter.acquire();

      let stats = rateLimiter.getStats();
      expect(stats.totalRequests).toBe(2);

      rateLimiter.reset();

      stats = rateLimiter.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.throttledRequests).toBe(0);
      expect(stats.tokensRemaining).toBe(10); // maxTokens
    });
  });
});

describe('Reddit Rate Limiter Factory', () => {
  it('should create correctly configured Reddit rate limiter', () => {
    const redditLimiter = createRedditRateLimiter();
    const stats = redditLimiter.getStats();

    expect(stats.maxTokens).toBe(60); // 60 requests per minute
    expect(stats.tokensRemaining).toBe(60); // Start with full bucket
  });
});
