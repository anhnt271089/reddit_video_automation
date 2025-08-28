import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import type { RedditPost } from './types';

interface PostCardProps {
  post: RedditPost;
  onApprove: (postId: string) => void;
  onReject: (postId: string) => void;
  onGenerateScript: (postId: string) => void;
  isSelected: boolean;
  onSelect: (postId: string, selected: boolean) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onApprove,
  onReject,
  onGenerateScript,
  isSelected,
  onSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      case 'script_generated': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'discovered': return 'New';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'script_generated': return 'Script Ready';
      default: return status;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const truncateContent = (content: string, limit: number = 150) => {
    if (content.length <= limit) return content;
    return content.substring(0, limit) + '...';
  };

  const handleGenerateScript = async () => {
    setIsLoading(true);
    try {
      await onGenerateScript(post.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`modern-card p-4 ${isSelected ? 'selected' : ''}`}>
      
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(post.id, e.target.checked)}
            className="w-6 h-6 text-blue-600 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-5 py-3 shadow-lg">
            <span className="text-sm font-bold text-blue-900">Quality</span>
            <Badge 
              variant={post.quality_score >= 80 ? 'success' : post.quality_score >= 60 ? 'info' : 'secondary'}
              className="text-sm font-bold px-3 py-1 shadow-md"
            >
              {post.quality_score}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <Badge 
            variant={getStatusBadgeVariant(post.status)}
            className="text-sm font-bold px-3 py-1"
          >
            {getStatusText(post.status)}
          </Badge>
          <span className="text-sm text-gray-500 font-medium">
            {formatRelativeTime(post.created_at)}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="mb-3">
        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
          <a 
            href={post.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            {post.title}
          </a>
        </h3>
        <p className="text-gray-600 font-medium">
          u/{post.author} • r/{post.subreddit}
        </p>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-700 text-base leading-relaxed">
          {isExpanded ? post.content : truncateContent(post.content)}
        </p>
        {post.content.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 font-semibold mt-2 transition-colors"
          >
            {isExpanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Engagement Stats */}
      <div className="flex items-center space-x-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">👍</span>
          <span className="font-bold text-gray-900 text-sm">{post.upvotes?.toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">💬</span>
          <span className="font-bold text-gray-900 text-sm">{post.comments?.toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⭐</span>
          <span className="font-bold text-gray-900 text-sm">{post.score?.toLocaleString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex space-x-4">
          {post.status === 'discovered' && (
            <>
              <Button
                onClick={() => onApprove(post.id)}
                variant="success"
                className="px-6 py-3 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                ✅ Approve
              </Button>
              <Button
                onClick={() => onReject(post.id)}
                variant="destructive"
                className="px-6 py-3 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                ❌ Reject
              </Button>
            </>
          )}
          
          {post.status === 'approved' && (
            <Button
              onClick={handleGenerateScript}
              disabled={isLoading}
              variant="info"
              className="px-5 py-2 text-base font-semibold rounded-lg"
            >
              {isLoading ? '⏳ Generating...' : '📝 Generate Script'}
            </Button>
          )}
          
          {post.status === 'script_generated' && (
            <Button
              variant="success"
              className="px-5 py-2 text-base font-semibold rounded-lg"
            >
              📄 View Script
            </Button>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="p-3 hover:bg-gray-100 rounded-xl"
        >
          <span className="text-2xl">⋮</span>
        </Button>
      </div>
    </div>
  );
};