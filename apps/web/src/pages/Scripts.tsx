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
              id: scriptData.id || `script-${scriptData.postId}`,
              post_id: scriptData.postId,
              script_content: scriptData.content || '',
              scene_breakdown: [],
              duration_target: 60, // Default duration
              titles: [],
              description: '',
              thumbnail_suggestions: [],
              version: 1,
              approved: scriptData.status === 'script_approved',
              generated_at: new Date(
                scriptData.createdAt || scriptData.updatedAt
              ),
            },
            post: {
              id: scriptData.postId,
              title: scriptData.title,
              content: scriptData.content || '',
              author: scriptData.author,
              subreddit: scriptData.subreddit,
              score: 0,
              upvotes: 0,
              comments: 0,
              created_at: scriptData.createdAt,
              url: `https://reddit.com/r/${scriptData.subreddit}`,
              status: scriptData.status as UnifiedPostStatus,
              quality_score: 75,
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

  const getStatusIcon = (status: UnifiedPostStatus) => {
    switch (status) {
      case 'script_generated':
      case 'script_approved':
        return <span className="text-green-500">✅</span>;
      case 'script_generating':
        return <span className="text-blue-500">⏳</span>;
      case 'script_generation_failed':
        return <span className="text-red-500">⚠️</span>;
      default:
        return null;
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
        <Button onClick={fetchScripts} variant="outline" size="sm">
          <span className="mr-2">🔄</span>
          Refresh
        </Button>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <span className="mr-2">🔍</span>
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <label htmlFor="search-scripts" className="sr-only">
                Search scripts
              </label>
              <span className="absolute left-3 top-3 text-muted-foreground">
                🔍
              </span>
              <Input
                id="search-scripts"
                placeholder="Search scripts..."
                value={filters.search}
                onChange={e =>
                  setFilters(prev => ({ ...prev, search: e.target.value }))
                }
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="sr-only">
                Filter by status
              </label>
              <Select
                id="status-filter"
                value={filters.status}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    status: e.target.value as UnifiedPostStatus | 'all',
                  }))
                }
              >
                <option value="all">All Statuses</option>
                <option value="script_generating">Generating</option>
                <option value="script_generated">Generated</option>
                <option value="script_approved">Approved</option>
                <option value="script_generation_failed">Failed</option>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <label htmlFor="date-from" className="sr-only">
                From date
              </label>
              <Input
                id="date-from"
                type="date"
                placeholder="From date"
                value={filters.dateFrom}
                onChange={e =>
                  setFilters(prev => ({ ...prev, dateFrom: e.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="date-to" className="sr-only">
                To date
              </label>
              <Input
                id="date-to"
                type="date"
                placeholder="To date"
                value={filters.dateTo}
                onChange={e =>
                  setFilters(prev => ({ ...prev, dateTo: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Reset Filters */}
          <div className="flex justify-end">
            <Button variant="ghost" onClick={resetFilters} size="sm">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <Button variant="ghost" onClick={resetFilters} className="mt-2">
                  Clear filters to see all scripts
                </Button>
              ) : null}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
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
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{post.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          r/{post.subreddit} • {post.author}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(post.status)}
                        <Badge
                          variant={PostStatusManager.getStatusVariant(
                            post.status
                          )}
                        >
                          {PostStatusManager.getDisplayName(post.status)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(script.generated_at).toLocaleDateString()}
                        <br />
                        <span className="text-muted-foreground">
                          {new Date(script.generated_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {script.duration_target > 0
                        ? `${script.duration_target}s`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>v{script.version}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {post.status === 'script_generation_failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryGeneration(post.id)}
                            disabled={retryingScript === post.id}
                          >
                            {retryingScript === post.id ? (
                              <span className="animate-spin">🔄</span>
                            ) : (
                              'Retry'
                            )}
                          </Button>
                        )}
                        {script.script_content && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewScript(script.id)}
                          >
                            <span className="mr-1">👁️</span>
                            View
                          </Button>
                        )}
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
