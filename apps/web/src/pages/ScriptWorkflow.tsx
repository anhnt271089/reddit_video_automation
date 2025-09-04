import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/ProgressBar';
import { PostStatusManager } from '@video-automation/shared-types';

interface Script {
  id: string;
  postId: string;
  title: string;
  status: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  subreddit: string;
  author: string;
  error?: string;
}

export function ScriptWorkflow() {
  const { scriptId } = useParams();
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load scripts data
  useEffect(() => {
    const loadScripts = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/scripts');
        if (response.ok) {
          const data = await response.json();
          setScripts(data.scripts || []);
        }
      } catch (error) {
        console.error('Failed to load scripts:', error);
        // Use mock data for development
        setScripts(generateMockScripts());
      } finally {
        setLoading(false);
      }
    };

    loadScripts();
  }, []);

  const generateMockScripts = (): Script[] => [
    {
      id: '1',
      postId: 'post1',
      title: 'The Revolutionary Impact of AI on Modern Healthcare',
      status: 'script_generated',
      content: 'AI is revolutionizing healthcare...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subreddit: 'technology',
      author: 'healthtech_researcher',
    },
    {
      id: '2',
      postId: 'post2',
      title: '5 Life-Changing Habits That Transform Your Daily Routine',
      status: 'script_approved',
      content: 'Transform your life with these habits...',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      subreddit: 'productivity',
      author: 'life_optimizer',
    },
    {
      id: '3',
      postId: 'post3',
      title: 'The Hidden Psychology Behind Social Media Addiction',
      status: 'script_generation_failed',
      content: '',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString(),
      subreddit: 'psychology',
      author: 'mind_researcher',
      error: 'Content filtering triggered - inappropriate content detected',
    },
  ];

  // Filter scripts based on search and status
  const filteredScripts = scripts.filter(script => {
    const matchesSearch =
      script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      script.subreddit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      script.author.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || script.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleRetryGeneration = async (postId: string) => {
    try {
      const response = await fetch(
        'http://localhost:3001/api/scripts/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId,
            targetDuration: 60,
            style: 'motivational',
          }),
        }
      );

      if (response.ok) {
        // Refresh the scripts list after triggering retry
        const scriptsResponse = await fetch(
          'http://localhost:3001/api/scripts'
        );
        if (scriptsResponse.ok) {
          const data = await scriptsResponse.json();
          setScripts(data.scripts || []);
        }
      } else {
        console.error('Failed to retry script generation');
      }
    } catch (error) {
      console.error('Error retrying script generation:', error);
    }
  };

  if (scriptId) {
    return <ScriptDetailView scriptId={scriptId} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Generated Scripts</h1>
          <p className="text-muted-foreground">
            Manage your AI-generated video scripts
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate('/content-review')}>
            Generate New Script
          </Button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search scripts by title, subreddit, or author..."
            className="w-full px-3 py-2 text-sm border rounded-md"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <select
            className="w-full px-3 py-2 text-sm border rounded-md"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="script_generating">Generating</option>
            <option value="script_generated">Generated</option>
            <option value="script_approved">Approved</option>
            <option value="script_generation_failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Scripts List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading scripts...</p>
        </div>
      ) : filteredScripts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all'
              ? 'No scripts match your filters.'
              : 'No scripts generated yet.'}
          </p>
          <Button className="mt-4" onClick={() => navigate('/content-review')}>
            Generate Your First Script
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredScripts.map(script => (
            <Card key={script.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {script.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <span>r/{script.subreddit}</span>
                          <span>•</span>
                          <span>u/{script.author}</span>
                          <span>•</span>
                          <span>
                            {new Date(script.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {script.status === 'script_generation_failed' &&
                          script.error && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              <span className="font-medium">Error:</span>{' '}
                              {script.error}
                            </div>
                          )}

                        {script.content &&
                          script.status !== 'script_generation_failed' && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {script.content}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <Badge
                      variant={
                        script.status === 'script_generated'
                          ? 'default'
                          : script.status === 'script_approved'
                            ? 'secondary'
                            : script.status === 'script_generation_failed'
                              ? 'destructive'
                              : 'outline'
                      }
                    >
                      {PostStatusManager.getDisplayName(script.status)}
                    </Badge>

                    <div className="flex gap-2">
                      {script.status === 'script_generation_failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryGeneration(script.postId)}
                        >
                          Retry
                        </Button>
                      )}

                      {script.status !== 'script_generation_failed' && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/scripts/${script.id}`)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Script Detail View Component (when scriptId is provided)
function ScriptDetailView({ scriptId }: { scriptId: string }) {
  const navigate = useNavigate();
  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScript = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to find the script in the list by scriptId
        const listResponse = await fetch('http://localhost:3001/api/scripts');
        if (listResponse.ok) {
          const listData = await listResponse.json();
          let foundScript = listData.scripts?.find(
            (s: Script) => s.id === scriptId
          );

          // If not found by scriptId, try to find by postId (fallback for navigation from PostCard)
          if (!foundScript) {
            foundScript = listData.scripts?.find(
              (s: Script) => s.postId === scriptId
            );
          }

          if (foundScript) {
            setScript(foundScript);
          } else {
            // If not found in list, try individual endpoint
            const response = await fetch(
              `http://localhost:3001/api/scripts/${scriptId}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.script) {
                setScript({
                  id: data.script.id,
                  postId: data.script.post_id,
                  title: data.script.title || 'Untitled Script',
                  status: 'script_generated',
                  content: data.script.script_content || '',
                  createdAt: data.script.created_at,
                  updatedAt: data.script.created_at,
                  subreddit: 'unknown',
                  author: 'unknown',
                });
              } else {
                setError('Script not found');
              }
            } else {
              setError('Failed to load script details');
            }
          }
        } else {
          setError('Failed to load scripts');
        }
      } catch (error) {
        console.error('Failed to load script:', error);
        setError('Failed to load script details');
      } finally {
        setLoading(false);
      }
    };

    fetchScript();
  }, [scriptId]);

  const handleRetryFromDetail = async () => {
    if (!script) {
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:3001/api/scripts/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postId: script.postId,
            targetDuration: 60,
            style: 'motivational',
          }),
        }
      );

      if (response.ok) {
        // Refresh the script data
        window.location.reload(); // Simple refresh for now
      } else {
        console.error('Failed to retry script generation');
      }
    } catch (error) {
      console.error('Error retrying script generation:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading script details...</p>
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error || 'Script not found'}</p>
        <Button className="mt-4" onClick={() => navigate('/scripts')}>
          Back to Scripts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/scripts')}
            className="mb-4"
          >
            ← Back to Scripts
          </Button>
          <h1 className="text-3xl font-bold">{script.title}</h1>
          <p className="text-muted-foreground">
            r/{script.subreddit} • u/{script.author}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Save Draft</Button>
          <Button>Approve Script</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Script</CardTitle>
              <CardDescription>
                AI-generated video script based on the Reddit post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {script.content ? (
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {script.content}
                    </pre>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Generated:{' '}
                      {new Date(script.createdAt).toLocaleDateString()}
                    </div>
                    <Badge
                      variant={
                        script.status === 'script_generated'
                          ? 'default'
                          : script.status === 'script_approved'
                            ? 'secondary'
                            : script.status === 'script_generation_failed'
                              ? 'destructive'
                              : 'outline'
                      }
                    >
                      {PostStatusManager.getDisplayName(script.status)}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No script content available</p>
                  {script.status === 'script_generation_failed' &&
                    script.error && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <span className="font-medium">Error:</span>{' '}
                        {script.error}
                      </div>
                    )}
                  {script.status === 'script_generation_failed' && (
                    <Button
                      className="mt-4"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetryFromDetail()}
                    >
                      Retry Generation
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Script Modifications</CardTitle>
              <CardDescription>
                Edit the script to improve flow and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  className="w-full h-32 px-3 py-2 text-sm border rounded-md resize-none"
                  placeholder="Add your modifications or notes here..."
                />
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Reset
                  </Button>
                  <Button size="sm">Apply Changes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Script Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Generation</span>
                  <Badge variant="default">Complete</Badge>
                </div>
                <Progress value={100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Review</span>
                  <Badge variant="secondary">In Progress</Badge>
                </div>
                <Progress value={60} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Asset Matching</span>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <h4 className="font-medium text-sm">{script.title}</h4>
              <p className="text-xs text-muted-foreground">
                r/{script.subreddit} • u/{script.author}
              </p>
              <div className="text-xs text-muted-foreground">
                Post ID: {script.postId}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2">
                View Original Post
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" size="sm">
                Regenerate Script
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                Find Assets
              </Button>
              <Button className="w-full" size="sm">
                Proceed to Assets
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
