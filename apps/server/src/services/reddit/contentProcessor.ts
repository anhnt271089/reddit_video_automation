import type { RedditPostData } from './redditClient';
import type { ContentDiscoveryPost } from '@video-automation/shared-types';

export class ContentProcessor {
  /**
   * Convert Reddit API data to our internal post format
   */
  processRedditPost(redditPost: RedditPostData): ContentDiscoveryPost {
    const qualityScore = this.calculateQualityScore(redditPost);
    const status = this.determineInitialStatus(redditPost);

    return {
      id: redditPost.id,
      title: redditPost.title,
      content: redditPost.selftext || 'Link post - no text content',
      author: redditPost.author.name,
      subreddit: redditPost.subreddit.display_name,
      score: redditPost.score,
      upvotes: redditPost.ups,
      comments: redditPost.num_comments,
      created_at: new Date(redditPost.created_utc * 1000).toISOString(),
      url: `https://reddit.com${redditPost.permalink}`,
      status,
      quality_score: qualityScore,
    };
  }

  /**
   * Calculate quality score based on Reddit metrics
   */
  private calculateQualityScore(post: RedditPostData): number {
    let score = 60; // Base score

    // Score based on upvotes
    if (post.ups > 1000) {
      score += 15;
    } else if (post.ups > 500) {
      score += 10;
    } else if (post.ups > 100) {
      score += 5;
    }

    // Score based on comments (engagement)
    if (post.num_comments > 200) {
      score += 10;
    } else if (post.num_comments > 100) {
      score += 7;
    } else if (post.num_comments > 50) {
      score += 5;
    }

    // Score based on title quality
    if (post.title.length > 20 && post.title.length < 100) {
      score += 5;
    }
    if (
      /\b(how|why|what|amazing|incredible|unbelievable)\b/i.test(post.title)
    ) {
      score += 5;
    }

    // Score based on content
    if (post.selftext && post.selftext.length > 200) {
      score += 10;
    }
    if (post.selftext && post.selftext.length > 500) {
      score += 5;
    }

    // Penalty for very recent posts (might be spam)
    const ageInHours =
      (Date.now() - post.created_utc * 1000) / (1000 * 60 * 60);
    if (ageInHours < 1) {
      score -= 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Determine initial status based on quality
   */
  private determineInitialStatus(
    post: RedditPostData
  ): ContentDiscoveryPost['status'] {
    const qualityScore = this.calculateQualityScore(post);

    if (qualityScore >= 85) {
      return 'approved';
    }
    if (qualityScore < 50) {
      return 'rejected';
    }
    return 'discovered';
  }

  /**
   * Filter posts suitable for video content
   */
  filterForVideoContent(posts: ContentDiscoveryPost[]): ContentDiscoveryPost[] {
    return posts.filter(post => {
      // Must have text content for storytelling
      if (!post.content || post.content === 'Link post - no text content') {
        return false;
      }

      // Must meet minimum quality threshold
      if (!post.quality_score || post.quality_score < 60) {
        return false;
      }

      // Must have reasonable engagement
      if (post.comments < 10) {
        return false;
      }

      // Content length should be substantial but not too long
      if (post.content.length < 100 || post.content.length > 2000) {
        return false;
      }

      return true;
    });
  }
}
