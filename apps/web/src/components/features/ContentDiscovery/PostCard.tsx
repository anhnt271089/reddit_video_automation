import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import type { RedditPost } from './types';

interface PostCardProps {
  post: RedditPost;
  onApprove?: (postId: string) => void;
  onReject?: (postId: string) => void;
  onGenerateScript?: (postId: string) => void;
  isSelected?: boolean;
  onSelect?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onApprove,
  onReject,
  onGenerateScript,
  isSelected,
  onSelect,
}) => {
  const formatScore = (score: number) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  const formatDate = (post: RedditPost) => {
    const timestamp = post.createdUtc;
    if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
      return 'Unknown date';
    }

    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // Return a more user-friendly relative date
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const [showFullContent, setShowFullContent] = useState(false);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'script_generated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card
      className={`modern-card p-4 transition-all duration-200 ${
        isSelected ? 'ring-2 ring-purple-500' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {onSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(post.id)}
            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 leading-tight">
              {post.title}
            </h3>
            {post.status && (
              <Badge className={`ml-2 ${getStatusColor(post.status)}`}>
                {post.status.replace('_', ' ')}
              </Badge>
            )}
          </div>

          {post.selftext && (
            <div className="text-base text-gray-600 mb-3">
              <p className={showFullContent ? '' : 'line-clamp-3'}>
                {post.selftext}
              </p>
              {post.selftext.length > 200 && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-purple-600 hover:text-purple-800 text-sm mt-1 font-medium"
                >
                  {showFullContent ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-3">
            <span className="font-medium">r/{post.subreddit}</span>
            <span>•</span>
            <span>u/{post.author}</span>
            <span>•</span>
            <span>{formatDate(post)}</span>
          </div>

          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center space-x-1">
              <span className="w-5 h-5 text-orange-500">⬆</span>
              <span className="text-base font-medium">
                {formatScore(post.score)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-5 h-5 text-blue-500">💬</span>
              <span className="text-base">{post.numComments || 0}</span>
            </div>
            {post.upvoteRatio && (
              <div className="flex items-center space-x-1">
                <span className="text-base text-gray-600">
                  {Math.round(post.upvoteRatio * 100)}% upvoted
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {onApprove && (
              <Button
                size="sm"
                variant="outline"
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                onClick={() => onApprove(post.id)}
              >
                ✓ Approve
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="outline"
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                onClick={() => onReject(post.id)}
              >
                ✗ Reject
              </Button>
            )}
            {onGenerateScript && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => onGenerateScript(post.id)}
              >
                🎬 Generate Script
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const redditUrl = post.permalink
                  ? `https://www.reddit.com${post.permalink}`
                  : (post as any).url ||
                    `https://www.reddit.com/r/${post.subreddit}/comments/${post.id}`;
                window.open(redditUrl, '_blank');
              }}
            >
              View on Reddit
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
