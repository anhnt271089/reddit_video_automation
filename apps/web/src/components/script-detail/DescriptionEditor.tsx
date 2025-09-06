import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface DescriptionEditorProps {
  description: string;
  tags: string[];
  onUpdate: (description: string, tags: string[]) => void;
}

export function DescriptionEditor({
  description,
  tags,
  onUpdate,
}: DescriptionEditorProps) {
  const [localDescription, setLocalDescription] = useState(description);
  const [localTags, setLocalTags] = useState<string[]>(tags);
  const [newTag, setNewTag] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const hasChanges =
      localDescription !== description ||
      JSON.stringify(localTags) !== JSON.stringify(tags);
    setHasUnsavedChanges(hasChanges);
  }, [localDescription, localTags, description, tags]);

  const handleSave = () => {
    onUpdate(localDescription, localTags);
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    setLocalDescription(description);
    setLocalTags(tags);
    setHasUnsavedChanges(false);
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !localTags.includes(trimmedTag)) {
      setLocalTags([...localTags, trimmedTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setLocalTags(localTags.filter(tag => tag !== tagToRemove));
  };

  const getCharacterCount = () => localDescription.length;

  const getOptimalRange = () => {
    const count = getCharacterCount();
    if (count >= 125 && count <= 155) {
      return 'excellent';
    }
    if (count >= 100 && count <= 200) {
      return 'good';
    }
    return 'poor';
  };

  const getCharacterCountColor = () => {
    const range = getOptimalRange();
    switch (range) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-yellow-600';
      default:
        return 'text-red-600';
    }
  };

  const highlightHashtags = (text: string) => {
    return text.split(/(\s|^)(#\w+)/).map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span
            key={index}
            className="text-blue-600 font-medium bg-blue-50 px-1 rounded"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const extractHashtags = () => {
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    while ((match = hashtagRegex.exec(localDescription)) !== null) {
      hashtags.push(match[1]);
    }
    return hashtags;
  };

  const detectedHashtags = extractHashtags();

  return (
    <div className="space-y-4">
      {/* Description Editor */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                Video Description
              </h3>
              <Badge
                variant={
                  getOptimalRange() === 'excellent'
                    ? 'default'
                    : getOptimalRange() === 'good'
                      ? 'outline'
                      : 'destructive'
                }
              >
                {getOptimalRange() === 'excellent'
                  ? 'Optimal Length'
                  : getOptimalRange() === 'good'
                    ? 'Good Length'
                    : 'Needs Adjustment'}
              </Badge>
            </div>

            <textarea
              value={localDescription}
              onChange={e => setLocalDescription(e.target.value)}
              className="w-full min-h-24 p-3 text-sm border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your video description here. Include relevant hashtags like #Technology #AI #Innovation"
              rows={4}
            />

            <div className="flex items-center justify-between text-xs">
              <span className={getCharacterCountColor()}>
                {getCharacterCount()} characters
              </span>
              <span className="text-muted-foreground">
                Optimal: 125-155 chars for YouTube
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description Preview */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Description Preview
          </h3>
          <div className="w-full min-h-24 p-3 text-sm border rounded-lg bg-gray-50">
            {localDescription ? (
              <div className="whitespace-pre-wrap">
                {highlightHashtags(localDescription)}
              </div>
            ) : (
              <span className="text-muted-foreground italic">
                No description entered
              </span>
            )}
          </div>

          {detectedHashtags.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-medium text-gray-900 mb-2">
                Detected Hashtags:
              </h4>
              <div className="flex flex-wrap gap-1">
                {detectedHashtags.map((hashtag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{hashtag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags Management */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Content Tags</h3>

            {/* Current Tags */}
            {localTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {localTags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Tag */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && addTag()}
                placeholder="Add a tag..."
                className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button size="sm" onClick={addTag} disabled={!newTag.trim()}>
                Add
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Tags help categorize your content and improve discoverability
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save/Reset Actions */}
      {hasUnsavedChanges && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-sm text-yellow-800">Unsaved changes</span>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
