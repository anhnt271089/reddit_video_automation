import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { VideoGeneration } from './VideoGeneration';
import { useAppStore } from '../../stores/useAppStore';
import {
  useWebSocketContext,
  useWebSocketSubscription,
} from '../../contexts/WebSocketContext';
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

  // Use WebSocket from context (already connected at app level)
  const { isConnected } = useWebSocketContext();
  const { lastMessage } = useAppStore();

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

  // Debug pause state changes
  useEffect(() => {
    console.log('🎛️ Pause state changed:', {
      isPaused,
      isPausedRef: isPausedRef.current,
    });
  }, [isPaused]);

  // WebSocket message handler for asset download events
  const handleWebSocketMessage = useCallback(
    (event: MessageEvent) => {
      if (!script) {
        return;
      }

      try {
        const message = JSON.parse(event.data);
        console.log('📡 Received WebSocket message:', message);

        // Extract the actual message from broadcast wrapper
        const actualMessage = message.data || message;
        const messageType =
          actualMessage.type ||
          actualMessage.event ||
          message.type ||
          message.event;

        // Handle asset download events
        if (
          messageType === 'asset_download_progress' &&
          actualMessage.payload?.scriptId === script.id
        ) {
          const {
            completed,
            total,
            currentAsset,
            sceneId,
            status,
            progress,
            photos,
            videos,
          } = actualMessage.payload;
          console.log('📥 Asset download progress:', {
            completed,
            total,
            currentAsset,
            sceneId,
            status,
            progress,
            photos,
            videos,
          });

          // Update individual scene status
          if (sceneId) {
            if (status === 'processing') {
              setDownloadingScenes(prev => new Set(prev).add(sceneId));
            } else if (status === 'completed') {
              setDownloadingScenes(prev => {
                const newSet = new Set(prev);
                newSet.delete(sceneId);
                return newSet;
              });
              setDownloadedScenes(prev => new Set(prev).add(sceneId));
            }
          }

          // Update overall progress based on completed assets, not individual job progress
          const overallProgress = total > 0 ? (completed / total) * 100 : 0;
          setDownloadProgress(overallProgress);

          // Update download stats with real-time data from backend
          setDownloadStats(prev => ({
            ...prev,
            completed,
            total,
            currentItem:
              currentAsset || `${completed}/${total} assets completed`,
            // Convert photos and videos from numbers to objects
            photos:
              photos !== undefined
                ? {
                    total: prev.photos.total,
                    completed: photos,
                  }
                : prev.photos,
            videos:
              videos !== undefined
                ? {
                    total: prev.videos.total,
                    completed: videos,
                  }
                : prev.videos,
          }));

          // Mark as complete if all done
          if (completed === total && total > 0) {
            setAllAssetsDownloaded(true);
            setIsDownloading(false);
            isDownloadingRef.current = false;
          }
        }

        // Handle asset download started events
        if (
          messageType === 'asset_download_started' &&
          actualMessage.payload?.scriptId === script.id
        ) {
          const { sceneId, assetType } = actualMessage.payload;
          console.log('🚀 Asset download started:', { sceneId, assetType });

          if (sceneId) {
            setDownloadingScenes(prev => new Set(prev).add(sceneId));
          }

          setIsDownloading(true);
          isDownloadingRef.current = true;
        }

        // Handle asset download status changes
        if (
          messageType === 'asset_download_status_change' &&
          (actualMessage.payload?.scriptId === script.id ||
            actualMessage.payload?.postId === script.postId)
        ) {
          const { status } = actualMessage.payload;
          console.log('🔄 Asset download status changed:', status);

          if (status === 'paused') {
            setIsPaused(true);
            isPausedRef.current = true;
            setDownloadStats(prev => ({
              ...prev,
              currentItem: 'Downloads paused',
            }));
          } else if (status === 'resumed') {
            setIsPaused(false);
            isPausedRef.current = false;
            setIsDownloading(true);
            isDownloadingRef.current = true;
            setDownloadStats(prev => ({
              ...prev,
              currentItem: 'Resuming downloads...',
            }));
          }
        }

        // Handle asset download completed
        if (
          messageType === 'asset_download_completed' &&
          actualMessage.payload?.scriptId === script.id
        ) {
          console.log('✅ All assets downloaded for script');
          setAllAssetsDownloaded(true);
          setIsDownloading(false);
          isDownloadingRef.current = false;

          // Check status again to get final state
          checkAssetDownloadStatus(script.id);
        }

        // Handle asset download failed
        if (
          messageType === 'asset_download_failed' &&
          actualMessage.payload?.scriptId === script.id
        ) {
          const { sceneId, error } = actualMessage.payload;
          console.error('❌ Asset download failed:', { sceneId, error });

          if (sceneId) {
            setDownloadingScenes(prev => {
              const newSet = new Set(prev);
              newSet.delete(sceneId);
              return newSet;
            });
          }
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    },
    [script]
  );

  // Subscribe to WebSocket messages for real-time updates
  useWebSocketSubscription(handleWebSocketMessage);

  // Check asset download status from backend
  const checkAssetDownloadStatus = async (idToUse: string) => {
    try {
      console.log('🔍 Checking asset download status for:', idToUse);
      const response = await fetch(
        `http://localhost:3001/api/scripts/${idToUse}/assets/status`
      );

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Asset download status:', result);

        if (result.success && result.jobs && result.jobs.length > 0) {
          const jobs = result.jobs;
          const completed = jobs.filter(
            (job: any) => job.status === 'completed'
          ).length;
          const processing = jobs.filter(
            (job: any) => job.status === 'processing'
          ).length;
          const failed = jobs.filter(
            (job: any) => job.status === 'failed'
          ).length;
          const total = jobs.length;

          console.log('📈 Asset job summary:', {
            total,
            completed,
            processing,
            failed,
            percentage: Math.round((completed / total) * 100),
          });

          // Update progress based on backend status
          const calculatedProgress = (completed / total) * 100;
          setDownloadProgress(calculatedProgress);

          // Update download stats
          const photoJobs = jobs.filter(
            (job: any) => job.asset_type === 'photo'
          );
          const videoJobs = jobs.filter(
            (job: any) => job.asset_type === 'video'
          );

          setDownloadStats(prev => ({
            ...prev,
            total,
            completed,
            photos: {
              total: photoJobs.length,
              completed: photoJobs.filter(
                (job: any) => job.status === 'completed'
              ).length,
            },
            videos: {
              total: videoJobs.length,
              completed: videoJobs.filter(
                (job: any) => job.status === 'completed'
              ).length,
            },
            currentItem:
              processing > 0
                ? `Processing ${processing} asset${processing > 1 ? 's' : ''}...`
                : completed === total
                  ? 'All assets downloaded successfully!'
                  : `${completed}/${total} assets completed`,
          }));

          // Set scene download states
          const completedScenes = jobs
            .filter((job: any) => job.status === 'completed')
            .map((job: any) => job.scene_id);
          const processingScenes = jobs
            .filter((job: any) => job.status === 'processing')
            .map((job: any) => job.scene_id);

          setDownloadedScenes(new Set(completedScenes));
          setDownloadingScenes(new Set(processingScenes));

          // If all completed, mark as done
          if (completed === total && total > 0) {
            setAllAssetsDownloaded(true);
            setIsDownloading(false);
            isDownloadingRef.current = false;
          }
        }
      }
    } catch (error) {
      console.error('Failed to check asset download status:', error);
    }
  };

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
            } else if (data.script.status === 'assets_downloading') {
              console.log(
                'Setting isApproved, hasStartedDownload, and isDownloading to true'
              );
              setIsApproved(true);
              setHasStartedDownload(true);
              setIsDownloading(true);
              // Check current asset download status
              await checkAssetDownloadStatus(data.script.postId || scriptId);
            } else if (data.script.status === 'assets_paused') {
              console.log(
                'Setting isApproved, hasStartedDownload, and isPaused to true'
              );
              setIsApproved(true);
              setHasStartedDownload(true);
              setIsPaused(true);
              // Check current asset download status
              await checkAssetDownloadStatus(data.script.postId || scriptId);
            } else if (data.script.status === 'assets_ready') {
              console.log('Setting isApproved and allAssetsDownloaded to true');
              setIsApproved(true);
              setAllAssetsDownloaded(true);
              // Check current asset download status to update progress display
              await checkAssetDownloadStatus(data.script.postId || scriptId);
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
      console.error('No script available for pause/resume');
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

      // For now, since the backend queue handles pause/resume automatically,
      // we just need to cancel the jobs to pause, or resume existing jobs to resume
      if (isPaused) {
        // Resume - use dedicated resume endpoint instead of creating new jobs
        const response = await fetch(
          `http://localhost:3001/api/scripts/${idToUse}/assets/resume`,
          {
            method: 'POST',
          }
        );

        const result = await response.json();
        console.log('🎛️ Resume response:', result);

        if (response.ok) {
          setIsPaused(false);
          isPausedRef.current = false;
          setIsDownloading(true);
          isDownloadingRef.current = true;
          setDownloadStats(prev => ({
            ...prev,
            currentItem: 'Resuming downloads...',
          }));
          console.log('✅ Download resumed successfully');
        } else {
          console.error('❌ Resume failed:', result);
          alert(
            `Failed to resume download: ${result.error || 'Unknown error'}`
          );
        }
      } else {
        // Pause - cancel current jobs
        const response = await fetch(
          `http://localhost:3001/api/scripts/${idToUse}/assets/cancel`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();
        console.log('🎛️ Cancel response:', result);

        if (response.ok) {
          setIsPaused(true);
          isPausedRef.current = true;
          setIsDownloading(false);
          isDownloadingRef.current = false;
          setDownloadStats(prev => ({
            ...prev,
            currentItem: 'Downloads paused',
          }));
          console.log('✅ Download paused successfully');
        } else {
          console.error('❌ Pause failed:', result);
          alert(`Failed to pause download: ${result.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to toggle pause/resume:', error);
      alert(
        `Error: ${error instanceof Error ? error.message : 'Failed to toggle download state'}`
      );
    }
  };

  // Multi-state button action handler
  const handleMainAction = async () => {
    console.log('🔘 Button clicked, current state:', {
      isApproved,
      hasStartedDownload,
      isDownloading,
      isPaused,
      allAssetsDownloaded,
    });

    if (!isApproved) {
      // State: Approve Script
      console.log('👉 Action: Approve Script');
      await handleApproveScript();
    } else if (!hasStartedDownload) {
      // State: Download Assets
      console.log('👉 Action: Download Assets');
      await handleDownloadAssets();
    } else if (isDownloading && !isPaused) {
      // State: Pause Download
      console.log('👉 Action: Pause Download');
      await handlePauseResume();
    } else if (isPaused) {
      // State: Resume Download
      console.log('👉 Action: Resume Download');
      await handlePauseResume();
    } else {
      console.log('⚠️ No action matched current state');
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

    console.log('🚀 Starting background asset download via API');

    try {
      // Use the backend asset download API instead of frontend loop
      const idToUse = script.postId || scriptId;

      setDownloadStats(prev => ({
        ...prev,
        currentItem: 'Starting background download...',
      }));

      const response = await fetch(
        `http://localhost:3001/api/scripts/${idToUse}/assets/download`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}), // Use default scenes from script
        }
      );

      console.log('Asset download response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Asset download error response:', errorText);
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Background asset download started:', result);

      // Update local script status immediately
      setScript(prev =>
        prev ? { ...prev, status: 'assets_downloading' } : null
      );

      setDownloadStats(prev => ({
        ...prev,
        currentItem: 'Background download in progress...',
      }));

      // The WebSocket will handle all progress updates from here
    } catch (error) {
      console.error('Failed to start asset download:', error);
      setDownloadStats(prev => ({
        ...prev,
        currentItem: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }));
      setIsDownloading(false);
      isDownloadingRef.current = false;
      setIsPaused(false);
      isPausedRef.current = false;
      alert(
        `Failed to start download: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
                  <Badge
                    variant="secondary"
                    className="gap-1.5 font-normal text-sm"
                  >
                    <span>
                      Total:{' '}
                      {script.metadata?.scenes.reduce(
                        (total, scene) => total + scene.duration,
                        0
                      ) || 0}
                      s
                    </span>
                  </Badge>
                </div>
                <SceneTimeline
                  scenes={script.metadata?.scenes || []}
                  currentContent={script.content}
                  scriptId={scriptId}
                  scriptStatus={script.status}
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

              {/* Video Generation Section */}
              <VideoGeneration
                scriptId={scriptId}
                postId={script.postId}
                isEnabled={allAssetsDownloaded}
              />

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
