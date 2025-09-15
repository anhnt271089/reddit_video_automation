import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Select } from '../ui/FormControls';
// Using emoji icons instead of lucide-react for simplicity

interface VideoGenerationProps {
  scriptId: string;
  postId: string;
  isEnabled: boolean; // Only enabled when assets are ready
}

interface VideoGenerationProgress {
  jobId: string;
  stage:
    | 'preparing'
    | 'bundling'
    | 'rendering'
    | 'encoding'
    | 'complete'
    | 'error';
  progress: number;
  currentScene?: number;
  totalScenes: number;
  message: string;
  error?: string;
  outputUrl?: string;
}

type VideoStyle = 'motivational' | 'contemplative' | 'urgent';
type VideoQuality = 'low' | 'medium' | 'high';

export function VideoGeneration({
  scriptId,
  postId,
  isEnabled,
}: VideoGenerationProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<VideoGenerationProgress | null>(
    null
  );
  const [style, setStyle] = useState<VideoStyle>('motivational');
  const [quality, setQuality] = useState<VideoQuality>('medium');
  const [outputFormat, setOutputFormat] = useState<'mp4' | 'webm'>('mp4');

  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/video/status/${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to get job status');
      }

      const status: VideoGenerationProgress = await response.json();
      setProgress(status);

      if (status.stage === 'complete' || status.stage === 'error') {
        setIsGenerating(false);
        return;
      }

      // Continue polling
      setTimeout(() => pollJobStatus(jobId), 2000);
    } catch (error) {
      console.error('Failed to poll job status:', error);
      setIsGenerating(false);
      setProgress(prev =>
        prev
          ? {
              ...prev,
              stage: 'error',
              error: 'Failed to get generation status',
            }
          : null
      );
    }
  };

  const handleStartGeneration = async () => {
    try {
      setIsGenerating(true);
      setProgress(null);

      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scriptId,
          postId,
          style,
          outputFormat,
          quality,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start video generation');
      }

      const result = await response.json();

      // Start polling for progress
      pollJobStatus(result.jobId);
    } catch (error) {
      console.error('Failed to start video generation:', error);
      setIsGenerating(false);
      setProgress({
        jobId: '',
        stage: 'error',
        progress: 0,
        totalScenes: 0,
        message: 'Failed to start video generation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const getStageDisplayName = (stage: string) => {
    switch (stage) {
      case 'preparing':
        return 'Preparing';
      case 'bundling':
        return 'Bundling';
      case 'rendering':
        return 'Rendering';
      case 'encoding':
        return 'Encoding';
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Error';
      default:
        return stage;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'preparing':
        return 'bg-blue-500';
      case 'bundling':
        return 'bg-yellow-500';
      case 'rendering':
        return 'bg-orange-500';
      case 'encoding':
        return 'bg-purple-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">🎬</span>
          Video Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEnabled && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg">
            <span>⚠️</span>
            <span className="text-sm">
              Complete asset download to enable video generation
            </span>
          </div>
        )}

        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Video Style
            </label>
            <Select
              value={style}
              onChange={e => setStyle(e.target.value as VideoStyle)}
              disabled={isGenerating}
            >
              <option value="motivational">🔥 Motivational</option>
              <option value="contemplative">🤔 Contemplative</option>
              <option value="urgent">⚡ Urgent</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quality</label>
            <Select
              value={quality}
              onChange={e => setQuality(e.target.value as VideoQuality)}
              disabled={isGenerating}
            >
              <option value="low">📱 Low (Fast)</option>
              <option value="medium">💻 Medium (Balanced)</option>
              <option value="high">🎬 High (Best)</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Format</label>
            <Select
              value={outputFormat}
              onChange={e => setOutputFormat(e.target.value as 'mp4' | 'webm')}
              disabled={isGenerating}
            >
              <option value="mp4">📱 MP4 (Universal)</option>
              <option value="webm">🌐 WebM (Web Optimized)</option>
            </Select>
          </div>
        </div>

        {/* Generation Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handleStartGeneration}
            disabled={!isEnabled || isGenerating}
            className="flex items-center gap-2"
          >
            <span>{isGenerating ? '⏳' : '▶️'}</span>
            {isGenerating ? 'Generating...' : 'Generate Video'}
          </Button>

          {progress?.outputUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(progress.outputUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <span>📥</span>
              Download Video
            </Button>
          )}
        </div>

        {/* Progress Section */}
        {progress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  className={`text-white ${getStageColor(progress.stage)}`}
                >
                  {getStageDisplayName(progress.stage)}
                </Badge>
                <span className="text-sm text-gray-600">
                  {Math.round(progress.progress)}%
                </span>
              </div>

              {progress.totalScenes > 0 && progress.currentScene && (
                <span className="text-sm text-gray-500">
                  Scene {progress.currentScene}/{progress.totalScenes}
                </span>
              )}
            </div>

            <Progress value={progress.progress} className="w-full" />

            <p className="text-sm text-gray-600">{progress.message}</p>

            {progress.error && (
              <div className="p-3 bg-red-50 text-red-800 rounded-lg">
                <p className="text-sm font-medium">Error:</p>
                <p className="text-sm">{progress.error}</p>
              </div>
            )}

            {progress.stage === 'complete' && progress.outputUrl && (
              <div className="p-3 bg-green-50 text-green-800 rounded-lg">
                <p className="text-sm font-medium">
                  ✅ Video generated successfully!
                </p>
                <p className="text-sm">Your video is ready for download.</p>
              </div>
            )}
          </div>
        )}

        {/* Style Preview */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Style Preview:</h4>
          <div className="text-xs text-gray-600">
            {style === 'motivational' && (
              <p>
                🔥 Bold animations, warm colors, inspiring typography with
                slide-up effects
              </p>
            )}
            {style === 'contemplative' && (
              <p>
                🤔 Gentle animations, cool tones, elegant serif fonts with fade
                transitions
              </p>
            )}
            {style === 'urgent' && (
              <p>
                ⚡ Dynamic effects, high contrast, bold sans-serif with scale
                animations
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
