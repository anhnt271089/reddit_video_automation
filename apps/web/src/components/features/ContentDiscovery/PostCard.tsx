import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import type { RedditPost } from './types';
import { PostStatusManager } from '@video-automation/shared-types';

interface PostCardProps {
  post: RedditPost;
  onApprove?: (postId: string) => void;
  onReject?: (postId: string) => void;
  onGenerateScript?: (postId: string) => void;
  onViewScript?: (postId: string) => void;
  isSelected?: boolean;
  onSelect?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onApprove,
  onReject,
  onGenerateScript,
  onViewScript,
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
    if (!status) {
      return 'bg-gray-100 text-gray-800';
    }

    const variant = PostStatusManager.getStatusVariant(status);
    switch (variant) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'destructive':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'secondary':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderActionButtons = () => {
    const normalizedStatus = PostStatusManager.normalizeStatus(
      post.status || 'discovered'
    );
    const uiConfig = PostStatusManager.getUIConfig(normalizedStatus);

    if (!uiConfig) {
      return null;
    }

    const buttons = [];

    // Always show View on Reddit button
    if (uiConfig.showView) {
      buttons.push(
        <Button
          key="view-reddit"
          size="sm"
          variant="outline"
          onClick={() => {
            let redditUrl: string;
            if (post.permalink) {
              redditUrl = `https://www.reddit.com${post.permalink}`;
            } else if (post.subreddit && post.id) {
              redditUrl = `https://www.reddit.com/r/${post.subreddit}/comments/${post.id}`;
            } else {
              redditUrl =
                (post as RedditPost & { url?: string }).url ||
                `https://www.reddit.com/comments/${post.id}`;
            }
            window.open(redditUrl, '_blank');
          }}
        >
          View on Reddit
        </Button>
      );
    }

    // Show Approve button based on status
    if (uiConfig.showApprove && onApprove) {
      buttons.push(
        <Button
          key="approve"
          size="sm"
          variant="outline"
          className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          onClick={() => onApprove(post.id)}
        >
          ✓ Approve
        </Button>
      );
    }

    // Show Reject button based on status
    if (uiConfig.showReject && onReject) {
      buttons.push(
        <Button
          key="reject"
          size="sm"
          variant="outline"
          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
          onClick={() => onReject(post.id)}
        >
          ✗ Reject
        </Button>
      );
    }

    // Show Generate Script button based on status
    if (uiConfig.showGenerate && onGenerateScript) {
      const isGenerating = normalizedStatus === 'script_generating';
      buttons.push(
        <Button
          key="generate"
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          onClick={() => onGenerateScript(post.id)}
          disabled={isGenerating}
        >
          {isGenerating ? '⏳ Generating Script...' : '🎬 Generate Script'}
        </Button>
      );
    }

    // Show View Script button based on status
    if (uiConfig.showViewScript && onViewScript) {
      buttons.push(
        <Button
          key="view-script"
          size="sm"
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => onViewScript(post.id)}
        >
          📄 View Script Details
        </Button>
      );
    }

    return <div className="flex flex-wrap gap-2">{buttons}</div>;
  };

  const normalizedStatus = PostStatusManager.normalizeStatus(
    post.status || 'discovered'
  );
  const isProcessing = PostStatusManager.isProcessingStatus(normalizedStatus);

  return (
    <Card
      className={`modern-card p-4 transition-all duration-200 ${
        isSelected ? 'ring-2 ring-purple-500' : ''
      } ${isProcessing ? 'animate-pulse' : ''}`}
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
                {PostStatusManager.getDisplayName(post.status)}
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

          {renderActionButtons()}
        </div>
      </div>
    </Card>
  );
};
