import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { SceneMetadata } from '../../types/claude-code';
import { clsx } from 'clsx';

interface SceneInfoProps {
  scene: SceneMetadata;
  index: number;
  onUpdate: (updates: Partial<SceneMetadata>) => void;
}

export function SceneInfo({ scene, index, onUpdate }: SceneInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Partial<SceneMetadata>>({});

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleFieldEdit = (field: string, value: unknown) => {
    setTempValues({ ...tempValues, [field]: value });
  };

  const handleSaveField = (field: string) => {
    if (tempValues[field as keyof SceneMetadata] !== undefined) {
      onUpdate({ [field]: tempValues[field as keyof SceneMetadata] });
    }
    setEditingField(null);
    setTempValues({});
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValues({});
  };

  const handleDurationChange = (newDuration: number) => {
    onUpdate({ duration: Math.max(1, Math.min(300, newDuration)) }); // 1 second to 5 minutes max
  };

  const addKeyword = (keyword: string) => {
    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword && !scene.visualKeywords.includes(trimmedKeyword)) {
      onUpdate({ visualKeywords: [...scene.visualKeywords, trimmedKeyword] });
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    onUpdate({
      visualKeywords: scene.visualKeywords.filter(
        keyword => keyword !== keywordToRemove
      ),
    });
  };

  const emotionOptions = [
    'engaging',
    'hopeful',
    'concerned',
    'neutral',
    'dramatic',
    'urgent',
    'inspiring',
    'educational',
    'entertaining',
    'suspenseful',
  ];

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      engaging: 'bg-green-500',
      hopeful: 'bg-blue-500',
      concerned: 'bg-yellow-500',
      neutral: 'bg-gray-500',
      dramatic: 'bg-red-500',
      urgent: 'bg-orange-500',
      inspiring: 'bg-purple-500',
      educational: 'bg-indigo-500',
      entertaining: 'bg-pink-500',
      suspenseful: 'bg-red-600',
    };
    return colors[emotion] || 'bg-gray-500';
  };

  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Scene Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900">Scene {scene.id}</h4>
                <Badge variant="outline" className="text-xs">
                  {formatDuration(scene.duration)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Position: {index + 1} of total scenes
              </p>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(!isEditing)}
              className="h-6 w-6 p-0"
            >
              {isEditing ? '✓' : '✏️'}
            </Button>
          </div>

          {/* Scene Content */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Scene Description
              </label>
              {editingField === 'content' ? (
                <div className="mt-1 space-y-2">
                  <textarea
                    value={tempValues.content ?? scene.content}
                    onChange={e => handleFieldEdit('content', e.target.value)}
                    className="w-full p-2 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveField('content')}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p
                  className={clsx('text-sm text-gray-600 mt-1 p-2 rounded', {
                    'bg-gray-50 cursor-pointer hover:bg-gray-100': isEditing,
                  })}
                  onClick={() => isEditing && setEditingField('content')}
                >
                  {scene.content}
                </p>
              )}
            </div>

            {/* Duration Control */}
            <div>
              <label className="text-xs font-medium text-gray-700">
                Duration (seconds)
              </label>
              <div className="mt-1 flex items-center space-x-2">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDurationChange(scene.duration - 5)}
                      disabled={scene.duration <= 5}
                      className="h-6 w-6 p-0"
                    >
                      -5
                    </Button>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={scene.duration}
                      onChange={e =>
                        handleDurationChange(parseInt(e.target.value) || 1)
                      }
                      className="w-16 px-2 py-1 text-xs border rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDurationChange(scene.duration + 5)}
                      disabled={scene.duration >= 300}
                      className="h-6 w-6 p-0"
                    >
                      +5
                    </Button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-900">
                    {scene.duration}s ({formatDuration(scene.duration)})
                  </span>
                )}
              </div>
            </div>

            {/* Emotion Tag */}
            <div>
              <label className="text-xs font-medium text-gray-700">
                Emotion
              </label>
              <div className="mt-1">
                {editingField === 'emotion' ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1">
                      {emotionOptions.map(emotion => (
                        <button
                          key={emotion}
                          onClick={() => {
                            onUpdate({ emotion });
                            setEditingField(null);
                          }}
                          className={clsx(
                            'px-2 py-1 text-xs rounded border transition-colors',
                            {
                              'bg-blue-100 border-blue-300':
                                emotion === scene.emotion,
                              'hover:bg-gray-100': emotion !== scene.emotion,
                            }
                          )}
                        >
                          {emotion}
                        </button>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div
                    className={clsx(
                      'inline-flex items-center px-2 py-1 rounded text-white text-xs cursor-pointer',
                      getEmotionColor(scene.emotion),
                      { 'hover:opacity-80': isEditing }
                    )}
                    onClick={() => isEditing && setEditingField('emotion')}
                  >
                    {scene.emotion}
                  </div>
                )}
              </div>
            </div>

            {/* Visual Keywords */}
            <div>
              <label className="text-xs font-medium text-gray-700">
                Visual Keywords
              </label>
              <div className="mt-1 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {scene.visualKeywords.map((keyword, keywordIndex) => (
                    <div
                      key={keywordIndex}
                      className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                    >
                      <span>{keyword}</span>
                      {isEditing && (
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {isEditing && editingField === 'keywords' && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add keyword..."
                      className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          addKeyword((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingField(null)}
                    >
                      Done
                    </Button>
                  </div>
                )}

                {isEditing && editingField !== 'keywords' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingField('keywords')}
                    className="text-xs"
                  >
                    Add Keyword
                  </Button>
                )}
              </div>
            </div>

            {/* Narration Preview */}
            {scene.narration && scene.narration !== scene.content && (
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Narration Text
                </label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-600 border-l-2 border-blue-300">
                  {scene.narration}
                </div>
              </div>
            )}
          </div>

          {/* Scene Statistics */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-muted-foreground">
            <span>Start: {formatDuration(scene.startTime)}</span>
            <span>End: {formatDuration(scene.startTime + scene.duration)}</span>
            <span>{scene.visualKeywords.length} keywords</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
