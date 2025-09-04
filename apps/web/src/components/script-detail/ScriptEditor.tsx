import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
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
              <Button size="sm" variant="outline" onClick={handleManualSave}>
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
                {content.split(/\s+/).filter(word => word.length > 0).length}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Est. Duration:</span>
              <span className="ml-1 font-medium">
                {Math.ceil(content.split(/\s+/).length / 150)} min
              </span>
            </div>
            {script.metadata?.scenes && (
              <div>
                <span className="text-muted-foreground">Scenes:</span>
                <span className="ml-1 font-medium">
                  {script.metadata.scenes.length}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
