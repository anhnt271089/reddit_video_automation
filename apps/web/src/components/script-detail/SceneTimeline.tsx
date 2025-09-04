import React from 'react';
import { Badge } from '../ui/Badge';
import type { SceneMetadata } from '../../types/claude-code';
import { clsx } from 'clsx';

interface SceneTimelineProps {
  scenes: SceneMetadata[];
  onSceneUpdate?: (sceneId: number, updates: Partial<SceneMetadata>) => void;
}

export function SceneTimeline({ scenes, onSceneUpdate }: SceneTimelineProps) {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const extractKeywordsFromText = (text: string): string[] => {
    // Remove common stop words and extract meaningful words
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'can',
      'this',
      'that',
      'these',
      'those',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'me',
      'him',
      'her',
      'us',
      'them',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 3); // Take first 3 meaningful words
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      engaging: 'border-green-500 bg-green-50',
      hopeful: 'border-blue-500 bg-blue-50',
      concerned: 'border-yellow-500 bg-yellow-50',
      neutral: 'border-gray-500 bg-gray-50',
      dramatic: 'border-red-500 bg-red-50',
      urgent: 'border-orange-500 bg-orange-50',
      inspiring: 'border-purple-500 bg-purple-50',
      educational: 'border-indigo-500 bg-indigo-50',
      entertaining: 'border-pink-500 bg-pink-50',
      suspenseful: 'border-red-600 bg-red-50',
    };
    return colors[emotion] || 'border-gray-500 bg-gray-50';
  };

  const getTotalDuration = () => {
    return scenes.reduce((total, scene) => total + scene.duration, 0);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {scenes.map((scene, index) => (
          <div
            key={scene.id}
            className={clsx(
              'relative flex items-center p-4 rounded-lg border-l-4',
              getEmotionColor(scene.emotion)
            )}
          >
            {/* Timeline connector */}
            {index < scenes.length - 1 && (
              <div className="absolute left-2 top-full w-0.5 h-3 bg-gray-300" />
            )}

            {/* Scene content */}
            <div className="flex-1 grid grid-cols-12 gap-4 items-center">
              {/* Scene number and timing */}
              <div className="col-span-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {scene.id}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(scene.startTime)}
                  </div>
                </div>
              </div>

              {/* Scene content */}
              <div className="col-span-6">
                <p className="text-sm text-gray-700">
                  {scene.narration || scene.content}
                </p>
              </div>

              {/* Visual keywords */}
              <div className="col-span-2">
                <div className="flex flex-wrap gap-1">
                  {extractKeywordsFromText(
                    scene.narration || scene.content
                  ).map((keyword, keywordIndex) => (
                    <Badge
                      key={keywordIndex}
                      variant="secondary"
                      className="text-xs"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Duration and emotion */}
              <div className="col-span-2 text-right">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs">
                    {scene.duration}s
                  </Badge>
                  <div className="text-xs text-gray-500 capitalize">
                    {scene.emotion}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-medium text-gray-900">{scenes.length}</div>
            <div className="text-xs text-gray-500">Total Scenes</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {formatTime(getTotalDuration())}
            </div>
            <div className="text-xs text-gray-500">Total Duration</div>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {Math.round(getTotalDuration() / scenes.length)}s
            </div>
            <div className="text-xs text-gray-500">Avg Scene</div>
          </div>
        </div>
      </div>
    </div>
  );
}
