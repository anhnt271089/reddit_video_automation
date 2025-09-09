import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../ui/Resizable';
import { ScriptEditor } from './ScriptEditor';
import { MetadataPanel } from './MetadataPanel';
import { SceneTimeline } from './SceneTimeline';
import type {
  ScriptWithMetadata,
  ClaudeCodeMetadata,
  ContentPackage,
  SceneMetadata,
} from '../../types/claude-code';
import { PostStatusManager } from '@video-automation/shared-types';

interface ScriptDetailPageProps {
  scriptId: string;
  onSave?: (
    script: ScriptWithMetadata,
    metadata: ClaudeCodeMetadata
  ) => Promise<void>;
  onExport?: (contentPackage: ContentPackage) => void;
  autoSaveEnabled?: boolean;
}

export function ScriptDetailPage({
  scriptId,
  onSave,
  onExport,
  autoSaveEnabled = true,
}: ScriptDetailPageProps) {
  const navigate = useNavigate();
  const [script, setScript] = useState<ScriptWithMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchScript = async () => {
      try {
        setLoading(true);
        setError(null);

        // Always use individual script endpoint to get full metadata
        const response = await fetch(
          `http://localhost:3001/api/scripts/${scriptId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.script) {
            setScript({
              id: data.script.id,
              postId: data.script.postId,
              title: data.script.title || 'Untitled Script',
              status: data.script.status,
              content: data.script.content || '',
              createdAt: data.script.createdAt,
              updatedAt: data.script.updatedAt,
              subreddit: data.script.subreddit || 'unknown',
              author: data.script.author || 'unknown',
              metadata: data.script.metadata, // Real metadata from backend
              originalContent: data.script.originalContent,
              redditUrl: data.script.redditUrl,
            });
          } else {
            setError('Script not found');
          }
        } else {
          setError('Failed to load script details');
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

  const handleScriptSave = async (content: string) => {
    if (!script) {
      return;
    }

    const updatedScript = {
      ...script,
      content,
      updatedAt: new Date().toISOString(),
    };

    setScript(updatedScript);

    if (onSave && script.metadata) {
      await onSave(updatedScript, script.metadata);
    }
  };

  const handleMetadataUpdate = (metadata: ClaudeCodeMetadata) => {
    if (!script) {
      return;
    }

    const updatedScript = {
      ...script,
      metadata,
      updatedAt: new Date().toISOString(),
    };

    setScript(updatedScript);
  };

  const handleSceneUpdate = (
    sceneId: number,
    updates: Partial<SceneMetadata>
  ) => {
    if (!script?.metadata) {
      return;
    }

    const updatedScenes = script.metadata.scenes.map(scene =>
      scene.id === sceneId ? { ...scene, ...updates } : scene
    );

    handleMetadataUpdate({
      ...script.metadata,
      scenes: updatedScenes,
    });
  };

  const handleExport = () => {
    if (!script || !script.metadata) {
      return;
    }

    const selectedTitle =
      script.metadata.customTitle ||
      (script.metadata.selectedTitleIndex !== undefined
        ? script.metadata.titles[script.metadata.selectedTitleIndex]
        : script.metadata.titles[0]);

    const contentPackage: ContentPackage = {
      script: script.content,
      selectedTitle,
      description: script.metadata.description,
      tags: script.metadata.tags,
      scenes: script.metadata.scenes,
      thumbnailConcepts: script.metadata.thumbnailConcepts,
      exportedAt: new Date().toISOString(),
    };

    if (onExport) {
      onExport(contentPackage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/scripts')}
          >
            ← Back to Scripts
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{script.title}</h1>
            <p className="text-muted-foreground text-sm">
              r/{script.subreddit} • u/{script.author}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
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
          <Button variant="outline" onClick={handleExport}>
            Export Package
          </Button>
          <Button>Approve Script</Button>
        </div>
      </div>

      {/* Main Content - Split Pane Layout */}
      <div className="flex-1 p-6">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={70} minSize={60}>
            <div className="h-full flex flex-col space-y-4">
              <div className="flex-1">
                <ScriptEditor
                  script={script}
                  onSave={handleScriptSave}
                  autoSaveEnabled={autoSaveEnabled}
                />
              </div>
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium">Sentence Timeline</h3>
                  <Badge variant="outline" className="text-sm">
                    Total:{' '}
                    {script.metadata?.scenes.reduce(
                      (total, scene) => total + scene.duration,
                      0
                    ) || 0}
                    s
                  </Badge>
                </div>
                <SceneTimeline
                  scenes={script.metadata?.scenes || []}
                  currentContent={script.content}
                  scriptId={scriptId}
                  onSceneUpdate={handleSceneUpdate}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <MetadataPanel
              metadata={script.metadata}
              onMetadataUpdate={handleMetadataUpdate}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={() =>
                setIsSidebarCollapsed(!isSidebarCollapsed)
              }
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
