import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { RedditOriginalContent } from './RedditOriginalContent';
import type {
  ScriptWithMetadata,
  AutoSaveState,
  SceneMetadata,
} from '../../types/claude-code';

interface ScriptEditorProps {
  script: ScriptWithMetadata;
  onSave: (content: string) => Promise<void>;
  autoSaveEnabled?: boolean;
}

export function ScriptEditor({
  script,
  onSave,
  autoSaveEnabled = true,
}: ScriptEditorProps) {
  const [content, setContent] = useState(script.content);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSceneId, setCurrentSceneId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'script' | 'original'>('script');
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false,
  });

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (!autoSaveState.hasUnsavedChanges || autoSaveState.isSaving) {
      return;
    }

    try {
      setAutoSaveState(prev => ({ ...prev, isSaving: true }));
      await onSave(content);
      setAutoSaveState({
        lastSaved: new Date(),
        isSaving: false,
        hasUnsavedChanges: false,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveState(prev => ({
        ...prev,
        isSaving: false,
        error: 'Failed to save changes',
      }));
    }
  }, [
    content,
    onSave,
    autoSaveState.hasUnsavedChanges,
    autoSaveState.isSaving,
  ]);

  // Debounced auto-save
  useEffect(() => {
    if (!autoSaveEnabled || !autoSaveState.hasUnsavedChanges) {
      return;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [autoSaveState.hasUnsavedChanges, autoSaveEnabled, performAutoSave]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setAutoSaveState(prev => ({
      ...prev,
      hasUnsavedChanges: true,
      error: undefined,
    }));
  };

  const handleManualSave = async () => {
    await performAutoSave();
  };

  const parseSceneBoundaries = (): Array<{
    start: number;
    end: number;
    scene: SceneMetadata;
  }> => {
    if (!script.metadata?.scenes) {
      return [];
    }

    return script.metadata.scenes
      .map(scene => {
        const sceneText = scene.narration || scene.content;
        const startIndex = content.indexOf(sceneText);
        const endIndex = startIndex >= 0 ? startIndex + sceneText.length : -1;

        return {
          start: Math.max(0, startIndex),
          end: Math.max(0, endIndex),
          scene,
        };
      })
      .filter(boundary => boundary.start >= 0);
  };

  const getCurrentScene = (): SceneMetadata | null => {
    if (!textAreaRef.current || !script.metadata?.scenes) {
      return null;
    }

    const cursorPosition = textAreaRef.current.selectionStart;
    const boundaries = parseSceneBoundaries();

    const currentBoundary = boundaries.find(
      boundary =>
        cursorPosition >= boundary.start && cursorPosition <= boundary.end
    );

    return currentBoundary?.scene || null;
  };

  const handleCursorMove = () => {
    const currentScene = getCurrentScene();
    if (currentScene && currentScene.id !== currentSceneId) {
      setCurrentSceneId(currentScene.id);
    }
  };

  // Unified sentence splitting to match backend exactly
  const splitIntoSentences = (text: string): string[] => {
    // Replace common abbreviations to avoid false splits
    const processedText = text
      .replace(/Mr\./g, 'Mr')
      .replace(/Mrs\./g, 'Mrs')
      .replace(/Dr\./g, 'Dr')
      .replace(/vs\./g, 'vs')
      .replace(/etc\./g, 'etc')
      .replace(/i\.e\./g, 'ie')
      .replace(/e\.g\./g, 'eg');

    // Split by sentence-ending punctuation followed by space and capital letter
    const initialSentences = processedText
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());

    // Further split long sentences for better video display (matches backend logic)
    const MAX_WORDS_PER_SENTENCE = 20; // Optimal for video text display
    const finalSentences: string[] = [];

    initialSentences.forEach(sentence => {
      const words = sentence.split(/\s+/);

      if (words.length <= MAX_WORDS_PER_SENTENCE) {
        finalSentences.push(sentence);
      } else {
        // Split long sentences at natural break points
        // Try to split at conjunctions, semicolons, or commas
        const breakPoints = [
          /\s+but\s+/i,
          /\s+and\s+/i,
          /\s+or\s+/i,
          /\s+so\s+/i,
          /\s+yet\s+/i,
          /\s+because\s+/i,
          /\s+when\s+/i,
          /\s+while\s+/i,
          /\s+although\s+/i,
          /\s+if\s+/i,
          /;\s*/,
          /,\s+which\s+/i,
          /,\s+that\s+/i,
          /,\s+and\s+/i,
          /,\s+but\s+/i,
          /:\s*/,
          /\s+-\s+/,
          /,\s*/, // Last resort: any comma
        ];

        let splitSuccessful = false;

        for (const breakPoint of breakPoints) {
          if (sentence.match(breakPoint)) {
            const parts = sentence.split(breakPoint);
            if (parts.length === 2 && parts[0].split(/\s+/).length >= 5) {
              // Capitalize first letter of second part if needed
              let secondPart = parts[1].trim();
              if (secondPart.length > 0) {
                secondPart =
                  secondPart.charAt(0).toUpperCase() + secondPart.slice(1);
              }

              // Add appropriate punctuation if missing
              let firstPart = parts[0].trim();
              if (!firstPart.match(/[.!?]$/)) {
                firstPart += '.';
              }
              if (!secondPart.match(/[.!?]$/)) {
                secondPart += '.';
              }

              finalSentences.push(firstPart);
              finalSentences.push(secondPart);
              splitSuccessful = true;
              break;
            }
          }
        }

        // If no natural break point found, force split at word boundary
        if (!splitSuccessful) {
          const midPoint = Math.floor(words.length / 2);
          const firstHalf = words.slice(0, midPoint).join(' ');
          const secondHalf = words.slice(midPoint).join(' ');

          finalSentences.push(firstHalf + '.');
          finalSentences.push(
            secondHalf.charAt(0).toUpperCase() + secondHalf.slice(1)
          );
        }
      }
    });

    return finalSentences;
  };

  const formatAutoSaveStatus = () => {
    if (autoSaveState.isSaving) {
      return 'Saving...';
    }
    if (autoSaveState.error) {
      return `Error: ${autoSaveState.error}`;
    }
    if (autoSaveState.hasUnsavedChanges) {
      return 'Unsaved changes';
    }
    if (autoSaveState.lastSaved) {
      const timeDiff = (Date.now() - autoSaveState.lastSaved.getTime()) / 1000;
      if (timeDiff < 60) {
        return 'Saved just now';
      }
      if (timeDiff < 3600) {
        return `Saved ${Math.floor(timeDiff / 60)}m ago`;
      }
      return `Saved ${Math.floor(timeDiff / 3600)}h ago`;
    }
    return '';
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('script')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'script'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Script Content
        </button>
        <button
          onClick={() => setActiveTab('original')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'original'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Original Reddit Idea
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'script' ? (
        <div className="flex flex-col h-full space-y-4">
          {/* Script Content Card */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Script Content</CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">
                  {formatAutoSaveStatus()}
                </span>
                {autoSaveState.isSaving && (
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                )}
                {autoSaveState.hasUnsavedChanges && !autoSaveState.isSaving && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleManualSave}
                  >
                    Save Now
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={isEditing ? 'default' : 'outline'}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Done' : 'Edit'}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-4">
              {isEditing ? (
                <textarea
                  ref={textAreaRef}
                  value={content}
                  onChange={e => handleContentChange(e.target.value)}
                  onSelect={handleCursorMove}
                  onKeyUp={handleCursorMove}
                  onClick={handleCursorMove}
                  className="w-full flex-1 p-4 text-sm font-mono border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your script content here..."
                  style={{ minHeight: '400px' }}
                />
              ) : (
                <div className="flex-1 p-4 bg-gray-50 rounded-lg overflow-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
                    {content || 'No script content available'}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Script Statistics */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Characters:</span>
                  <span className="ml-1 font-medium">{content.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Words:</span>
                  <span className="ml-1 font-medium">
                    {
                      content.split(/\s+/).filter(word => word.length > 0)
                        .length
                    }
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Est. Duration:</span>
                  <span className="ml-1 font-medium">
                    {(() => {
                      const words = content
                        .split(/\s+/)
                        .filter(word => word.length > 0).length;
                      const seconds = Math.round(words / 2.5); // 2.5 words per second
                      const minutes = Math.floor(seconds / 60);
                      const remainingSeconds = seconds % 60;
                      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sentences:</span>
                  <span className="ml-1 font-medium">
                    {splitIntoSentences(content).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <RedditOriginalContent script={script} />
      )}
    </div>
  );
}
