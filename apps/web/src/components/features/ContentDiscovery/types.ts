export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  subreddit: string;
  score: number;
  upvoteRatio: number;
  numComments: number;
  createdUtc: number;
  permalink: string;
  url: string;
  thumbnail?: string;
  domain: string;
  isVideo: boolean;
  isSelf: boolean;
  postHint?: string;
  status?: 'discovered' | 'approved' | 'rejected' | 'script_generated';
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

export interface RedditAuthStatus {
  authenticated: boolean;
  valid?: boolean;
  expiresAt?: string;
  scope?: string;
}

export interface ScrapingProgress {
  isActive: boolean;
  subreddit?: string;
  postsFound?: number;
  status?: string;
}

export type PostStatus =
  | 'discovered'
  | 'approved'
  | 'rejected'
  | 'script_generated';
export type SortOption = 'score' | 'date' | 'upvotes' | 'comments';
export type SortOrder = 'asc' | 'desc';
