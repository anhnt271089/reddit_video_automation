import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/ProgressBar';
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
  SceneMetadata,
} from '../../types/claude-code';

interface ScriptDetailPageProps {
  scriptId: string;
  onSave?: (
    script: ScriptWithMetadata,
    metadata: ClaudeCodeMetadata
  ) => Promise<void>;
  autoSaveEnabled?: boolean;
}

export function ScriptDetailPage({
  scriptId,
  onSave,
  autoSaveEnabled = true,
}: ScriptDetailPageProps) {
  const navigate = useNavigate();
  const [script, setScript] = useState<ScriptWithMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasStartedDownload, setHasStartedDownload] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [allAssetsDownloaded, setAllAssetsDownloaded] = useState(false);
  const [downloadStats, setDownloadStats] = useState<{
    total: number;
    completed: number;
    currentItem: string;
    photos: { total: number; completed: number };
    videos: { total: number; completed: number };
  }>({
    total: 0,
    completed: 0,
    currentItem: 'Ready to download assets',
    photos: { total: 0, completed: 0 },
    videos: { total: 0, completed: 0 },
  });
  const [downloadingScenes, setDownloadingScenes] = useState<Set<number>>(
    new Set()
  );
  const [downloadedScenes, setDownloadedScenes] = useState<Set<number>>(
    new Set()
  );

  // Refs for tracking download state inside loops to avoid stale closures
  const isDownloadingRef = useRef(false);
  const isPausedRef = useRef(false);

  // Initialize photo/video counts when script loads
  useEffect(() => {
    if (script?.metadata?.scenes) {
      const scenes = script.metadata.scenes;
      const photoCount = scenes.filter(scene => scene.duration < 4).length;
      const videoCount = scenes.filter(scene => scene.duration >= 4).length;

      setDownloadStats(prev => ({
        ...prev,
        total: scenes.length,
        photos: { total: photoCount, completed: 0 },
        videos: { total: videoCount, completed: 0 },
      }));
    }
  }, [script?.metadata?.scenes]);

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

            // Set approval state based on script status
            console.log('Script loaded with status:', data.script.status);
            if (data.script.status === 'script_approved') {
              console.log('Setting isApproved to true');
              setIsApproved(true);
            }
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

  const handlePauseResume = async () => {
    if (!script) {
      return;
    }

    try {
      const idToUse = script.postId || scriptId;
      console.log('🎛️ Pause/Resume request:', {
        scriptId,
        postId: script.postId,
        idToUse,
        currentState: isPaused ? 'paused' : 'downloading',
        action: isPaused ? 'resume' : 'pause',
      });

      const response = await fetch(
        `http://localhost:3001/api/scripts/${idToUse}/download/${isPaused ? 'resume' : 'pause'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        const newPausedState = !isPaused;
        setIsPaused(newPausedState);
        isPausedRef.current = newPausedState;
        setDownloadStats(prev => ({
          ...prev,
          currentItem: isPaused ? 'Resuming downloads...' : 'Downloads paused',
        }));
      }
    } catch (error) {
      console.error('Failed to toggle pause/resume:', error);
    }
  };

  // Multi-state button action handler
  const handleMainAction = async () => {
    if (!isApproved) {
      // State: Approve Script
      await handleApproveScript();
    } else if (!hasStartedDownload) {
      // State: Download Assets
      await handleDownloadAssets();
    } else if (isDownloading && !isPaused) {
      // State: Pause Download
      await handlePauseResume();
    } else if (isPaused) {
      // State: Resume Download
      await handlePauseResume();
    }
  };

  // Get button state info
  const getButtonState = () => {
    if (allAssetsDownloaded) {
      return {
        text: '✅ Download Successful',
        variant: 'default' as const,
        disabled: true,
        icon: null,
      };
    }
    if (!isApproved) {
      return {
        text: 'Approve Script',
        variant: 'default' as const,
        disabled: false,
        icon: null,
      };
    }
    if (!hasStartedDownload) {
      return {
        text: '⬇️ Download Assets',
        variant: 'default' as const,
        disabled: false,
        icon: null,
      };
    }
    if (isPaused) {
      return {
        text: '▶️ Resume Download',
        variant: 'outline' as const,
        disabled: false,
        icon: null,
      };
    }
    if (isDownloading) {
      return {
        text: '⏸️ Pause Download',
        variant: 'outline' as const,
        disabled: false,
        icon: null,
      };
    }
    // Download finished but not all assets downloaded (error state)
    return {
      text: '🔄 Retry Download',
      variant: 'outline' as const,
      disabled: false,
      icon: null,
    };
  };

  const handleApproveScript = async () => {
    if (!script) {
      return;
    }

    console.log('Attempting to approve script:', {
      scriptId,
      script: script,
      postId: script.postId,
    });

    try {
      // Try using postId first, then fall back to scriptId
      const idToUse = script.postId || scriptId;
      console.log('Using ID for approval:', {
        idToUse,
        scriptId,
        postId: script.postId,
      });

      const response = await fetch(
        `http://localhost:3001/api/scripts/${idToUse}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Script approved successfully:', result);
        setScript(prev =>
          prev ? { ...prev, status: 'script_approved' } : null
        );
        setIsApproved(true);

        // If already approved on backend, handle gracefully
        if (result.alreadyApproved) {
          console.log('Script was already approved');
        }
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        console.error('Failed to approve script - Full details:', {
          url: `http://localhost:3001/api/scripts/${script.postId || scriptId}/approve`,
          status: response.status,
          statusText: response.statusText,
          errorText,
          errorData,
          scriptData: {
            id: script.id,
            postId: script.postId,
            status: script.status,
            routeParam: scriptId,
          },
        });
        alert(
          `Failed to approve script: ${errorData.error || errorData.message || response.statusText}`
        );
      }
    } catch (error) {
      console.error('Network error approving script:', error);
      alert('Network error: Could not approve script');
    }
  };

  const handleDownloadAssets = async () => {
    if (!script || !script.metadata) {
      return;
    }

    setIsDownloading(true);
    setHasStartedDownload(true);
    setIsPaused(false);
    setDownloadProgress(0);

    // Update refs for loop state tracking
    isDownloadingRef.current = true;
    isPausedRef.current = false;

    try {
      // First, generate search phrases for all scenes
      const scenes = script.metadata.scenes || [];

      // Prepare sentences data for search phrase generation
      const sentences = scenes.map(scene => ({
        id: scene.id,
        content: scene.narration || scene.content || '',
        duration: scene.duration,
        assetType: scene.duration < 4 ? 'photo' : 'video',
      }));

      // Count photos and videos
      const photoCount = sentences.filter(s => s.assetType === 'photo').length;
      const videoCount = sentences.filter(s => s.assetType === 'video').length;

      setDownloadStats({
        total: sentences.length,
        completed: 0,
        currentItem: 'Generating search phrases...',
        photos: { total: photoCount, completed: 0 },
        videos: { total: videoCount, completed: 0 },
      });
      setDownloadProgress(5);

      // Generate search phrases
      const searchResponse = await fetch(
        'http://localhost:3001/api/search-phrases/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sentences }),
        }
      );

      if (!searchResponse.ok) {
        throw new Error('Failed to generate search phrases');
      }

      const searchResult = await searchResponse.json();
      const searchPhrases = searchResult.data || [];

      console.log('🔍 Search phrases generated:', {
        searchPhrases,
        count: searchPhrases.length,
        searchResult,
        isSuccess: searchResult.success,
      });

      if (searchPhrases.length === 0) {
        console.error('❌ No search phrases generated!', { searchResult });
        throw new Error('No search phrases were generated');
      }

      setDownloadProgress(10);
      setDownloadStats(prev => ({
        ...prev,
        currentItem: 'Starting asset downloads...',
      }));

      // Download assets for each scene
      let completed = 0;
      let photosCompleted = 0;
      let videosCompleted = 0;

      console.log(
        'Starting download loop for',
        searchPhrases.length,
        'phrases'
      );

      for (const phrase of searchPhrases) {
        console.log('🔄 Processing phrase:', phrase);
        console.log('💫 Current state:', {
          isDownloading: isDownloadingRef.current,
          isPaused: isPausedRef.current,
          completed,
          totalPhrases: searchPhrases.length,
        });

        // Check if paused before each download
        while (isPausedRef.current) {
          console.log('⏸️ Downloads paused, waiting...');
          setDownloadStats(prev => ({
            ...prev,
            currentItem: 'Downloads paused - Click Resume to continue',
          }));
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Re-check if we need to break out of the entire loop
          if (!isDownloadingRef.current) {
            break;
          }
        }

        // If stopped downloading, break out
        if (!isDownloadingRef.current) {
          console.log('🛑 Download stopped, breaking out of loop');
          break;
        }

        const scene = scenes.find(s => s.id === phrase.sentenceId);
        if (!scene) {
          console.warn('⚠️ Scene not found for sentenceId:', phrase.sentenceId);
          continue;
        }

        console.log('✅ Found scene for phrase:', {
          sceneId: scene.id,
          phraseId: phrase.sentenceId,
        });

        const assetType = scene.duration < 4 ? 'photo' : 'video';

        // Update downloading state
        setDownloadingScenes(prev => new Set(prev).add(phrase.sentenceId));

        setDownloadStats(prev => ({
          ...prev,
          currentItem: `Downloading ${assetType}: "${phrase.primaryPhrase}"`,
        }));

        try {
          console.log(
            `🔄 Calling download API for scene ${phrase.sentenceId}:`,
            {
              searchPhrase: phrase.primaryPhrase,
              assetType,
              scriptId,
              sentenceId: phrase.sentenceId,
            }
          );

          const downloadResponse = await fetch(
            'http://localhost:3001/api/pexels-download/search-and-download',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                searchPhrase: phrase.primaryPhrase,
                assetType,
                scriptId,
                sentenceId: phrase.sentenceId,
              }),
            }
          );

          const downloadResult = await downloadResponse.json();

          console.log(
            `📥 Download API response for scene ${phrase.sentenceId}:`,
            {
              status: downloadResponse.status,
              success: downloadResult.success,
              result: downloadResult,
            }
          );

          if (downloadResponse.ok && downloadResult.success) {
            console.log(
              `✅ Downloaded ${assetType} for scene ${phrase.sentenceId}:`,
              downloadResult.data.filename
            );
            console.log(
              `📁 File saved to: ${downloadResult.data.downloadPath}`
            );

            setDownloadedScenes(prev => new Set(prev).add(phrase.sentenceId));

            if (assetType === 'photo') {
              photosCompleted++;
              console.log(`📸 Photos completed: ${photosCompleted}`);
            } else {
              videosCompleted++;
              console.log(`🎥 Videos completed: ${videosCompleted}`);
            }
          } else {
            console.warn(
              `⚠️ Download failed for scene ${phrase.sentenceId}:`,
              downloadResult.error
            );
            console.warn('Full download response:', downloadResult);
          }
        } catch (downloadError) {
          console.error(
            `❌ Download error for scene ${phrase.sentenceId}:`,
            downloadError
          );
        }

        // Remove from downloading state
        setDownloadingScenes(prev => {
          const newSet = new Set(prev);
          newSet.delete(phrase.sentenceId);
          return newSet;
        });

        completed++;
        const progress = 10 + (completed / searchPhrases.length) * 85;
        setDownloadProgress(progress);

        console.log(
          `📊 Progress update: ${completed}/${searchPhrases.length} (${Math.round(progress)}%)`
        );

        setDownloadStats(prev => ({
          ...prev,
          completed,
          photos: { ...prev.photos, completed: photosCompleted },
          videos: { ...prev.videos, completed: videosCompleted },
          currentItem: `Downloaded ${completed}/${searchPhrases.length} assets`,
        }));

        // Add a small delay between downloads to see progress and allow pause/resume to work
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setDownloadProgress(100);
      setDownloadStats(prev => ({
        ...prev,
        currentItem: 'All assets downloaded successfully!',
      }));

      // Only mark as complete if we actually processed all assets
      if (completed >= searchPhrases.length) {
        setIsDownloading(false);
        isDownloadingRef.current = false;
        setAllAssetsDownloaded(true);

        console.log(
          `🎉 All assets downloaded! Processed ${completed}/${searchPhrases.length} items.`
        );

        // Transition post status to assets_ready
        try {
          const idToUse = script.postId || scriptId;
          const response = await fetch(
            `http://localhost:3001/api/scripts/${idToUse}/assets-ready`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Assets marked as ready:', result);
            setScript(prev =>
              prev ? { ...prev, status: 'assets_ready' } : null
            );
          } else {
            const errorText = await response.text();
            console.error('❌ Failed to mark assets as ready:', errorText);
          }
        } catch (error) {
          console.error('❌ Network error marking assets as ready:', error);
        }
      } else {
        console.log(
          `⚠️ Download incomplete: ${completed}/${searchPhrases.length} items processed`
        );
        setIsDownloading(false);
        isDownloadingRef.current = false;
      }
    } catch (error) {
      console.error('Failed to download assets:', error);
      setDownloadStats(prev => ({
        ...prev,
        currentItem: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }));
      setIsDownloading(false);
      isDownloadingRef.current = false;
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
          {/* Debug info */}
          <span className="text-xs text-gray-500">
            Status: {script.status} | Approved: {isApproved.toString()} |
            Started: {hasStartedDownload.toString()}
          </span>

          {/* Multi-State Action Button */}
          <Button
            onClick={handleMainAction}
            variant={getButtonState().variant}
            disabled={getButtonState().disabled}
            className="min-w-[180px]"
          >
            {getButtonState().text}
          </Button>
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
                  downloadingScenes={downloadingScenes}
                  downloadedScenes={downloadedScenes}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
            <div className="flex flex-col h-full space-y-4">
              {(script?.metadata?.scenes || []).length > 0 && (
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">
                      Asset Download Progress
                    </h3>
                    <div className="flex items-center space-x-2">
                      {isPaused && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          ⏸️ Paused
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {Math.round(downloadProgress)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={downloadProgress} className="h-2 mb-3" />

                  {/* Asset breakdown stats */}
                  <div className="grid grid-cols-2 gap-3 mb-3 p-2 bg-gray-50 rounded">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Photos</div>
                      <div className="text-sm font-medium">
                        <span
                          className={
                            downloadStats.photos.completed ===
                              downloadStats.photos.total &&
                            downloadStats.photos.total > 0
                              ? 'text-green-600'
                              : 'text-gray-900'
                          }
                        >
                          {downloadStats.photos.completed}
                        </span>
                        <span className="text-gray-400">
                          {' '}
                          / {downloadStats.photos.total}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Videos</div>
                      <div className="text-sm font-medium">
                        <span
                          className={
                            downloadStats.videos.completed ===
                              downloadStats.videos.total &&
                            downloadStats.videos.total > 0
                              ? 'text-green-600'
                              : 'text-gray-900'
                          }
                        >
                          {downloadStats.videos.completed}
                        </span>
                        <span className="text-gray-400">
                          {' '}
                          / {downloadStats.videos.total}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="truncate flex-1 mr-2">
                      {downloadStats.currentItem}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {downloadStats.completed} / {downloadStats.total}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex-1">
                <MetadataPanel
                  metadata={script.metadata}
                  onMetadataUpdate={handleMetadataUpdate}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={() =>
                    setIsSidebarCollapsed(!isSidebarCollapsed)
                  }
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
