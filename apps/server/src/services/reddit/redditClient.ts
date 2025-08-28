// import snoowrap from 'snoowrap'; // Commented out as not currently used in production

export interface RedditConfig {
  userAgent: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

export interface RedditPostData {
  id: string;
  title: string;
  selftext: string;
  author: {
    name: string;
  };
  subreddit: {
    display_name: string;
  };
  score: number;
  ups: number;
  num_comments: number;
  created_utc: number;
  url: string;
  permalink: string;
}

export class RedditClient {
  private reddit: any | null = null; // Type placeholder for snoowrap
  private isInitialized = false;

  constructor(private config: RedditConfig) {}

  async initialize(): Promise<void> {
    try {
      // this.reddit = new snoowrap({
      //   userAgent: this.config.userAgent,
      //   clientId: this.config.clientId,
      //   clientSecret: this.config.clientSecret,
      //   username: this.config.username,
      //   password: this.config.password,
      // });
      throw new Error('Reddit client not implemented yet');

      // TODO: Remove when Reddit client is implemented
      // Test the connection
      // await this.reddit.getMe();
      // this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Reddit client:', error);
      throw error;
    }
  }

  async getHotPosts(
    subreddit: string,
    limit: number = 25
  ): Promise<RedditPostData[]> {
    if (!this.isInitialized || !this.reddit) {
      throw new Error('Reddit client not initialized');
    }

    try {
      const posts = await this.reddit.getSubreddit(subreddit).getHot({ limit });
      return posts.map((post: any) => ({
        id: post.id,
        title: post.title,
        selftext: post.selftext || '',
        author: {
          name: post.author.name,
        },
        subreddit: {
          display_name: post.subreddit.display_name,
        },
        score: post.score,
        ups: post.ups,
        num_comments: post.num_comments,
        created_utc: post.created_utc,
        url: post.url,
        permalink: post.permalink,
      }));
    } catch (error) {
      console.error(`Failed to fetch posts from r/${subreddit}:`, error);
      throw error;
    }
  }

  async getMultipleSubreddits(
    subreddits: string[],
    limit: number = 10
  ): Promise<RedditPostData[]> {
    const allPosts: RedditPostData[] = [];

    for (const subreddit of subreddits) {
      try {
        const posts = await this.getHotPosts(subreddit, limit);
        allPosts.push(...posts);
      } catch (error) {
        console.error(`Failed to fetch from r/${subreddit}:`, error);
      }
    }

    // Sort by score and created time
    return allPosts.sort((a, b) => b.score - a.score).slice(0, 50); // Return top 50
  }

  isHealthy(): boolean {
    return this.isInitialized;
  }
}
