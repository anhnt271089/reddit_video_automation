import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Using emoji icons to maintain consistency with existing components
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Input } from '../components/ui/FormControls';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../components/ui/Table';
import { Select } from '../components/ui/FormControls';
import { PostStatusManager } from '@video-automation/shared-types';
import type {
  VideoScript,
  ContentDiscoveryPost,
} from '@video-automation/shared-types';

// Define unified post status type based on PostStatusManager constants
type UnifiedPostStatus =
  | 'discovered'
  | 'idea_selected'
  | 'script_generating'
  | 'script_generated'
  | 'script_approved'
  | 'script_generation_failed'
  | 'rejected'
  | 'assets_downloading'
  | 'assets_paused'
  | 'assets_ready'
  | 'rendering'
  | 'completed'
  | 'failed';

interface ScriptWithPost {
  script: VideoScript;
  post: ContentDiscoveryPost;
}

interface ScriptsFilters {
  search: string;
  status: UnifiedPostStatus | 'all';
  dateFrom: string;
  dateTo: string;
}

export function Scripts() {
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<ScriptWithPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ScriptsFilters>({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [retryingScript, setRetryingScript] = useState<string | null>(null);
  const [deletingScript, setDeletingScript] = useState<string | null>(null);

  // Fetch scripts with posts data
  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all scripts directly from the scripts endpoint
      const response = await fetch('/api/scripts');
      if (!response.ok) {
        throw new Error('Failed to fetch scripts');
      }

      const data = await response.json();
      console.log('Scripts API response:', data); // Debug log

      if (data.success && data.scripts) {
        // Transform backend script data to match our frontend interface
        const scriptsData: ScriptWithPost[] = data.scripts.map(
          (scriptData: any) => ({
            script: {
              id: scriptData.id || scriptData.postId,
              post_id: scriptData.postId,
              script_content: scriptData.content || '',
              scene_breakdown: [],
              duration_target: scriptData.duration || 0,
              titles: [],
              description: '',
              thumbnail_suggestions: [],
              version: scriptData.version || 1,
              approved: scriptData.status === 'script_approved',
              generated_at: new Date(
                scriptData.createdAt || scriptData.updatedAt
              ),
            },
            post: {
              id: scriptData.postId,
              title: scriptData.title || 'Untitled',
              content: scriptData.content || '',
              author: scriptData.author || 'unknown',
              subreddit: scriptData.subreddit || 'unknown',
              score: scriptData.score || 0,
              upvotes: scriptData.upvotes || 0,
              comments: scriptData.comments || 0,
              created_at: scriptData.createdAt,
              url:
                scriptData.url ||
                `https://reddit.com/r/${scriptData.subreddit}`,
              status: scriptData.status as UnifiedPostStatus,
              quality_score: scriptData.qualityScore || 0,
            },
          })
        );

        setScripts(scriptsData);
      } else {
        setScripts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scripts');
    } finally {
      setLoading(false);
    }
  };

  // Filter scripts based on current filters
  const filteredScripts = scripts.filter(({ script, post }) => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesTitle = post.title.toLowerCase().includes(searchTerm);
      const matchesContent = post.content.toLowerCase().includes(searchTerm);
      const matchesScriptContent = script.script_content
        .toLowerCase()
        .includes(searchTerm);

      if (!matchesTitle && !matchesContent && !matchesScriptContent) {
        return false;
      }
    }

    // Status filter
    if (filters.status !== 'all' && post.status !== filters.status) {
      return false;
    }

    // Date range filter
    const scriptDate = new Date(script.generated_at);
    if (filters.dateFrom && scriptDate < new Date(filters.dateFrom)) {
      return false;
    }
    if (filters.dateTo && scriptDate > new Date(filters.dateTo)) {
      return false;
    }

    return true;
  });

  const handleViewScript = (scriptId: string) => {
    navigate(`/scripts/${scriptId}`);
  };

  const handleRetryGeneration = async (postId: string) => {
    try {
      setRetryingScript(postId);

      const response = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error('Failed to retry script generation');
      }

      // Refresh scripts data
      await fetchScripts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to retry generation'
      );
    } finally {
      setRetryingScript(null);
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this script? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setDeletingScript(scriptId);

      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete script');
      }

      // Refresh scripts data
      await fetchScripts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete script');
    } finally {
      setDeletingScript(null);
    }
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateFrom: '',
      dateTo: '',
    });
  };

  // Format date/time in GMT+7 timezone
  const formatDateTimeGMT7 = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Bangkok', // GMT+7
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  };

  // Format duration from seconds to MM:SS format
  const formatDuration = (seconds: number) => {
    if (seconds <= 0) {
      return 'N/A';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <span className="animate-spin">🔄</span>
            <span>Loading scripts...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scripts</h1>
          <p className="text-muted-foreground">
            Manage and review generated video scripts
          </p>
        </div>
        <button
          onClick={fetchScripts}
          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 mb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Filter Scripts
            </h3>
            <div className="text-xs text-gray-500">
              Showing {filteredScripts.length.toLocaleString()} of{' '}
              {scripts.length.toLocaleString()} scripts
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {(filters.search !== '' ||
              filters.status !== 'all' ||
              filters.dateFrom !== '' ||
              filters.dateTo !== '') && (
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Main Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search scripts and posts..."
                value={filters.search}
                onChange={e =>
                  setFilters(prev => ({ ...prev, search: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  status: e.target.value as UnifiedPostStatus | 'all',
                }))
              }
              className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="script_generated">Script Ready</option>
              <option value="script_approved">Script Approved</option>
              <option value="assets_downloading">Assets Downloading</option>
              <option value="assets_paused">Assets Paused</option>
              <option value="assets_ready">Assets Downloaded</option>
              <option value="rendering">Rendering Video</option>
              <option value="completed">Video Complete</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e =>
                setFilters(prev => ({ ...prev, dateFrom: e.target.value }))
              }
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e =>
                setFilters(prev => ({ ...prev, dateTo: e.target.value }))
              }
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.search !== '' ||
          filters.status !== 'all' ||
          filters.dateFrom !== '' ||
          filters.dateTo !== '') && (
          <div className="border-t pt-4 mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-700">
                Active filters:
              </span>

              {filters.search && (
                <Badge
                  variant="info"
                  className="cursor-pointer"
                  onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                >
                  Search: "{filters.search}" ✕
                </Badge>
              )}

              {filters.status !== 'all' && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() =>
                    setFilters(prev => ({ ...prev, status: 'all' }))
                  }
                >
                  Status: {filters.status} ✕
                </Badge>
              )}

              {filters.dateFrom && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() =>
                    setFilters(prev => ({ ...prev, dateFrom: '' }))
                  }
                >
                  From: {filters.dateFrom} ✕
                </Badge>
              )}

              {filters.dateTo && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setFilters(prev => ({ ...prev, dateTo: '' }))}
                >
                  To: {filters.dateTo} ✕
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scripts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Scripts ({filteredScripts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredScripts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No scripts found matching your filters.</p>
              {filters.search ||
              filters.status !== 'all' ||
              filters.dateFrom ||
              filters.dateTo ? (
                <button
                  onClick={resetFilters}
                  className="mt-2 px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  Clear filters to see all scripts
                </button>
              ) : null}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Post Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScripts.map(({ script, post }) => (
                  <TableRow key={script.id}>
                    <TableCell>
                      <div className="text-sm font-mono text-muted-foreground">
                        {script.id.slice(0, 8)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{post.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          r/{post.subreddit} • {post.author}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={PostStatusManager.getStatusVariant(
                          post.status
                        )}
                        className="gap-1.5 font-normal"
                      >
                        <span className="text-sm">
                          {PostStatusManager.getStatusIcon(post.status)}
                        </span>
                        <span>
                          {PostStatusManager.getDisplayName(post.status)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {script.generated_at
                          ? formatDateTimeGMT7(
                              script.generated_at.toISOString()
                            ).split(', ')[0]
                          : 'N/A'}
                        <br />
                        <span className="text-muted-foreground">
                          {script.generated_at
                            ? formatDateTimeGMT7(
                                script.generated_at.toISOString()
                              ).split(', ')[1]
                            : 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDuration(script.duration_target)}
                    </TableCell>
                    <TableCell>v{script.version}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {post.status === 'script_generation_failed' && (
                          <button
                            onClick={() => handleRetryGeneration(post.id)}
                            disabled={retryingScript === post.id}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                          >
                            <span className="text-sm">
                              {retryingScript === post.id ? '⟳' : '↻'}
                            </span>
                            <span>
                              {retryingScript === post.id
                                ? 'Retrying...'
                                : 'Retry'}
                            </span>
                          </button>
                        )}
                        {script.script_content && (
                          <button
                            onClick={() => handleViewScript(script.id)}
                            className="px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-md hover:bg-violet-100 focus:ring-2 focus:ring-violet-500 transition-colors flex items-center gap-1.5"
                          >
                            <span className="text-sm">👁</span>
                            <span>View</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteScript(script.id)}
                          disabled={deletingScript === script.id}
                          className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                        >
                          <span className="text-sm">
                            {deletingScript === script.id ? '⟳' : '🗑'}
                          </span>
                          <span>
                            {deletingScript === script.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
