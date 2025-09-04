import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { ClaudeCodeMetadata } from '../../types/claude-code';
import { TitleSelector } from './TitleSelector';
import { DescriptionEditor } from './DescriptionEditor';
import { clsx } from 'clsx';

interface MetadataPanelProps {
  metadata?: ClaudeCodeMetadata;
  onMetadataUpdate: (metadata: ClaudeCodeMetadata) => void;
  isCollapsed?: boolean;
  onToggleCollapse: () => void;
}

type MetadataTab = 'titles' | 'description' | 'thumbnails';

export function MetadataPanel({
  metadata,
  onMetadataUpdate,
  isCollapsed = false,
  onToggleCollapse,
}: MetadataPanelProps) {
  const [activeTab, setActiveTab] = useState<MetadataTab>('titles');

  if (!metadata) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No metadata available</p>
        </CardContent>
      </Card>
    );
  }

  if (isCollapsed) {
    return (
      <Card className="h-full">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Metadata</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleCollapse}
              className="h-6 w-6 p-0"
            >
              →
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Titles:</span>
              <Badge variant="outline" className="h-4 text-xs">
                {metadata.titles.length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Description:</span>
              <Badge variant="outline" className="h-4 text-xs">
                {metadata.description ? '✓' : '✗'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleTitleUpdate = (
    titles: string[],
    selectedIndex?: number,
    customTitle?: string
  ) => {
    onMetadataUpdate({
      ...metadata,
      titles,
      selectedTitleIndex: selectedIndex,
      customTitle,
    });
  };

  const handleDescriptionUpdate = (description: string, tags: string[]) => {
    onMetadataUpdate({
      ...metadata,
      description,
      tags,
    });
  };

  const tabs: Array<{ id: MetadataTab; label: string; count?: number }> = [
    { id: 'titles', label: 'Titles', count: metadata.titles.length },
    { id: 'description', label: 'Description' },
    {
      id: 'thumbnails',
      label: 'Thumbnails',
      count: metadata.thumbnailConcepts?.length || 0,
    },
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Content Metadata</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleCollapse}
            className="h-6 w-6 p-0"
          >
            ←
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                'flex items-center space-x-1',
                {
                  'bg-blue-100 text-blue-700': activeTab === tab.id,
                  'text-gray-600 hover:text-gray-900 hover:bg-gray-100':
                    activeTab !== tab.id,
                }
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <Badge variant="outline" className="h-4 text-xs ml-1">
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 overflow-auto">
        {activeTab === 'titles' && (
          <TitleSelector
            titles={metadata.titles}
            selectedIndex={metadata.selectedTitleIndex}
            customTitle={metadata.customTitle}
            onTitleUpdate={handleTitleUpdate}
          />
        )}

        {activeTab === 'description' && (
          <DescriptionEditor
            description={metadata.description}
            tags={metadata.tags}
            onUpdate={handleDescriptionUpdate}
          />
        )}

        {activeTab === 'thumbnails' && (
          <div className="space-y-4">
            {metadata.thumbnailConcepts?.map((concept, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        Thumbnail {index + 1}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        Concept
                      </Badge>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700">
                        Description
                      </label>
                      <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                        {typeof concept.description === 'string'
                          ? concept.description
                          : concept.description?.visual_theme ||
                            'No description'}
                      </p>
                    </div>

                    {concept.textOverlay && (
                      <div>
                        <label className="text-xs font-medium text-gray-700">
                          Text Overlay
                        </label>
                        <p className="text-sm font-semibold text-blue-600 mt-1 p-2 bg-blue-50 rounded">
                          {concept.textOverlay}
                        </p>
                      </div>
                    )}

                    {typeof concept.description === 'object' && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {concept.description.text_overlay && (
                          <div>
                            <span className="text-muted-foreground">Text:</span>
                            <p className="font-medium">
                              {concept.description.text_overlay}
                            </p>
                          </div>
                        )}
                        {concept.description.emotional_style && (
                          <div>
                            <span className="text-muted-foreground">
                              Style:
                            </span>
                            <p className="font-medium">
                              {concept.description.emotional_style}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) || (
              <p className="text-muted-foreground text-center py-8">
                No thumbnail concepts available
              </p>
            )}
          </div>
        )}
      </CardContent>

      {/* Metadata Summary Footer */}
      <div className="border-t p-3 bg-gray-50">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Title Selected:</span>
            <Badge
              variant={
                metadata.selectedTitleIndex !== undefined ||
                metadata.customTitle
                  ? 'default'
                  : 'outline'
              }
              className="h-4"
            >
              {metadata.selectedTitleIndex !== undefined || metadata.customTitle
                ? 'Yes'
                : 'No'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Description:</span>
            <Badge
              variant={metadata.description ? 'default' : 'outline'}
              className="h-4"
            >
              {metadata.description ? 'Ready' : 'Empty'}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
