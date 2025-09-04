import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { clsx } from 'clsx';

interface TitleSelectorProps {
  titles: string[];
  selectedIndex?: number;
  customTitle?: string;
  onTitleUpdate: (
    titles: string[],
    selectedIndex?: number,
    customTitle?: string
  ) => void;
}

export function TitleSelector({
  titles,
  selectedIndex,
  customTitle,
  onTitleUpdate,
}: TitleSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(!!customTitle);
  const [customTitleInput, setCustomTitleInput] = useState(customTitle || '');

  const getCharacterCount = (title: string) => title.length;

  const getCharacterCountColor = (count: number) => {
    if (count <= 60) {
      return 'text-green-600';
    }
    if (count <= 70) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  const getSEOScore = (title: string) => {
    const length = title.length;
    if (length >= 50 && length <= 60) {
      return 'excellent';
    }
    if (length >= 30 && length <= 70) {
      return 'good';
    }
    return 'poor';
  };

  const getSEOBadge = (score: string) => {
    switch (score) {
      case 'excellent':
        return <Badge className="bg-green-500 text-white">Excellent SEO</Badge>;
      case 'good':
        return <Badge className="bg-yellow-500 text-white">Good SEO</Badge>;
      default:
        return <Badge variant="destructive">Poor SEO</Badge>;
    }
  };

  const handleTitleSelect = (index: number) => {
    onTitleUpdate(titles, index, undefined);
    setShowCustomInput(false);
    setCustomTitleInput('');
  };

  const handleCustomTitleSave = () => {
    if (customTitleInput.trim()) {
      onTitleUpdate(titles, undefined, customTitleInput.trim());
    }
  };

  const handleCopyToClipboard = (title: string) => {
    navigator.clipboard.writeText(title);
    // Could add a toast notification here
  };

  const isCustomSelected = customTitle && !selectedIndex && selectedIndex !== 0;
  const currentSelectedTitle = isCustomSelected
    ? customTitle
    : selectedIndex !== undefined
      ? titles[selectedIndex]
      : null;

  return (
    <div className="space-y-4">
      {/* AI-Generated Titles */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">
          AI-Generated Title Options
        </h3>

        {titles.map((title, index) => {
          const isSelected = selectedIndex === index && !isCustomSelected;
          const charCount = getCharacterCount(title);
          const seoScore = getSEOScore(title);

          return (
            <Card
              key={index}
              className={clsx('cursor-pointer transition-all duration-200', {
                'ring-2 ring-blue-500 bg-blue-50': isSelected,
                'hover:bg-gray-50': !isSelected,
              })}
              onClick={() => handleTitleSelect(index)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className={clsx(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        {
                          'bg-blue-500 border-blue-500': isSelected,
                          'border-gray-300': !isSelected,
                        }
                      )}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Option {index + 1}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getSEOBadge(seoScore)}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation();
                        handleCopyToClipboard(title);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      📋
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-gray-900 mb-2 leading-relaxed">
                  {title}
                </p>

                <div className="flex items-center justify-between text-xs">
                  <span className={getCharacterCountColor(charCount)}>
                    {charCount} characters
                  </span>
                  <span className="text-muted-foreground">
                    YouTube optimal: 50-60 chars
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Title Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Custom Title</h3>
          {!showCustomInput && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCustomInput(true)}
            >
              Add Custom
            </Button>
          )}
        </div>

        {showCustomInput && (
          <Card
            className={clsx('transition-all duration-200', {
              'ring-2 ring-blue-500 bg-blue-50': isCustomSelected,
            })}
          >
            <CardContent className="p-3">
              <div className="space-y-3">
                <textarea
                  value={customTitleInput}
                  onChange={e => setCustomTitleInput(e.target.value)}
                  placeholder="Enter your custom title here..."
                  className="w-full p-2 text-sm border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />

                <div className="flex items-center justify-between">
                  <span
                    className={clsx(
                      'text-xs',
                      getCharacterCountColor(
                        getCharacterCount(customTitleInput)
                      )
                    )}
                  >
                    {getCharacterCount(customTitleInput)} characters
                  </span>
                  {getSEOBadge(getSEOScore(customTitleInput))}
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomTitleInput('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCustomTitleSave}
                    disabled={!customTitleInput.trim()}
                  >
                    Use Custom Title
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isCustomSelected && !showCustomInput && (
          <Card className="ring-2 ring-blue-500 bg-blue-50">
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full border-2 bg-blue-500 border-blue-500 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <span className="text-xs text-muted-foreground">Custom</span>
                </div>

                <div className="flex items-center space-x-2">
                  {getSEOBadge(getSEOScore(customTitle!))}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowCustomInput(true);
                      setCustomTitleInput(customTitle!);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    ✏️
                  </Button>
                </div>
              </div>

              <p className="text-sm text-gray-900 mb-2 leading-relaxed">
                {customTitle}
              </p>

              <div className="flex items-center justify-between text-xs">
                <span
                  className={getCharacterCountColor(
                    getCharacterCount(customTitle!)
                  )}
                >
                  {getCharacterCount(customTitle!)} characters
                </span>
                <span className="text-muted-foreground">
                  YouTube optimal: 50-60 chars
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selection Summary */}
      {currentSelectedTitle && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-green-800">
              Selected Title:
            </span>
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Ready for Export
            </Badge>
          </div>
          <p className="text-sm text-green-700">{currentSelectedTitle}</p>
        </div>
      )}
    </div>
  );
}
