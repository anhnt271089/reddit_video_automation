import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ScriptDetailPage } from '../components/script-detail/ScriptDetailPage';
import type {
  ScriptWithMetadata,
  ClaudeCodeMetadata,
  ContentPackage,
} from '../types/claude-code';
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
  const handleScriptSave = async (
    script: ScriptWithMetadata,
    metadata: ClaudeCodeMetadata
  ) => {
    try {
      // TODO: Implement actual save to backend
      console.log('Saving script and metadata:', { script, metadata });
    } catch (error) {
      console.error('Failed to save script:', error);
    }
  };

  const handleContentExport = (contentPackage: ContentPackage) => {
    try {
      // TODO: Implement actual export functionality
      console.log('Exporting content package:', contentPackage);

      // For now, download as JSON file
      const blob = new Blob([JSON.stringify(contentPackage, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `script-${scriptId}-content-package.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export content package:', error);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <ScriptDetailPage
        scriptId={scriptId}
        onSave={handleScriptSave}
        onExport={handleContentExport}
        autoSaveEnabled={true}
      />
    </div>
  );
}
