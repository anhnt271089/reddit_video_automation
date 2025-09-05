import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { ScriptWithMetadata } from '../../types/claude-code';

interface RedditOriginalContentProps {
  script: ScriptWithMetadata;
}

export function RedditOriginalContent({ script }: RedditOriginalContentProps) {
  const handleViewOnReddit = () => {
    if (script.redditUrl) {
      window.open(script.redditUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Original Reddit Post Card */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Original Reddit Post</CardTitle>
          <div className="flex items-center space-x-2">
            {script.redditUrl && (
              <Button size="sm" variant="outline" onClick={handleViewOnReddit}>
                View on Reddit
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4">
          {/* Post Header */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                {script.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Badge variant="secondary" className="text-xs">
                r/{script.subreddit}
              </Badge>
              <span>•</span>
              <span>u/{script.author}</span>
              <span>•</span>
              <span>{new Date(script.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Post Content */}
          <div className="flex-1 overflow-auto">
            {script.originalContent ? (
              <div className="prose prose-sm max-w-none">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                  {script.originalContent}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <div className="text-center">
                  <p className="text-sm">No original content available</p>
                  <p className="text-xs mt-1">
                    The original Reddit post content is not stored in the
                    database
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Statistics */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Characters:</span>
              <span className="ml-1 font-medium">
                {script.originalContent?.length || 0}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Words:</span>
              <span className="ml-1 font-medium">
                {script.originalContent
                  ? script.originalContent
                      .split(/\s+/)
                      .filter(word => word.length > 0).length
                  : 0}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Read Time:</span>
              <span className="ml-1 font-medium">
                {script.originalContent
                  ? Math.ceil(script.originalContent.split(/\s+/).length / 200)
                  : 0}{' '}
                min
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Lines:</span>
              <span className="ml-1 font-medium">
                {script.originalContent
                  ? script.originalContent.split('\n').length
                  : 0}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
