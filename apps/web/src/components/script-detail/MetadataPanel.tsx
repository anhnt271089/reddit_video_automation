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
            {/* Temporary: show fallback thumbnails if none available */}
            {!metadata.thumbnailConcepts ||
            metadata.thumbnailConcepts.length === 0 ? (
              <>
                {/* Mock Enhanced Thumbnail from Backend Fallback Structure */}
                <Card className="border-l-4 border-l-orange-400">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          🎨 Thumbnail 1
                          <Badge variant="outline" className="text-xs ml-2">
                            Curiosity
                          </Badge>
                        </h4>
                        <Badge variant="default" className="text-xs">
                          Clarity: 8/10
                        </Badge>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          📝 Concept Description
                        </label>
                        <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg border-l-3 border-l-blue-400">
                          Transformation-focused thumbnail showing personal
                          growth breakthrough moment with visual metaphors
                        </p>
                      </div>

                      {/* Text Strategy */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center">
                          ✍️ Text Strategy
                        </label>
                        <div className="mt-2 space-y-2">
                          <div className="bg-white p-2 rounded border">
                            <span className="text-sm font-bold text-blue-900">
                              "THIS CHANGES EVERYTHING"
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-blue-600 font-medium">
                                Font:
                              </span>{' '}
                              Bold impact font
                            </div>
                            <div>
                              <span className="text-blue-600 font-medium">
                                Position:
                              </span>{' '}
                              Top third for immediate impact
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Character Details */}
                      <div className="bg-green-50 p-3 rounded-lg">
                        <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                          👤 Character Specifications
                        </label>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                          <div>
                            <span className="text-green-600 font-medium">
                              Demographics:
                            </span>{' '}
                            25-35 professional, highly relatable
                          </div>
                          <div>
                            <span className="text-green-600 font-medium">
                              Expressions:
                            </span>{' '}
                            realization, confidence, enlightened
                          </div>
                          <div>
                            <span className="text-green-600 font-medium">
                              Positioning:
                            </span>{' '}
                            Center-weighted at golden ratio position
                          </div>
                          <div>
                            <span className="text-green-600 font-medium">
                              Style:
                            </span>{' '}
                            Smart casual, approachable professional
                          </div>
                        </div>
                      </div>

                      {/* Visual Composition */}
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                          🎭 Visual Composition
                        </label>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                          <div>
                            <span className="text-purple-600 font-medium">
                              Layout:
                            </span>{' '}
                            transformation-triangle
                          </div>
                          <div>
                            <span className="text-purple-600 font-medium">
                              Visual Flow:
                            </span>{' '}
                            Left to right transformation progression
                          </div>
                          <div>
                            <span className="text-purple-600 font-medium">
                              Focal Point:
                            </span>{' '}
                            Central character transformation moment
                          </div>
                        </div>
                      </div>

                      {/* Objects & Elements */}
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <label className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                          🎯 Visual Elements & Objects
                        </label>
                        <div className="mt-2 space-y-2 text-xs">
                          <div>
                            <span className="text-yellow-600 font-medium">
                              Symbolic:
                            </span>{' '}
                            lightbulb, key, open door
                          </div>
                          <div>
                            <span className="text-yellow-600 font-medium">
                              Contextual:
                            </span>{' '}
                            modern workspace, growth charts
                          </div>
                          <div>
                            <span className="text-yellow-600 font-medium">
                              Emotional:
                            </span>{' '}
                            upward arrows, positive symbols
                          </div>
                          <div>
                            <span className="text-yellow-600 font-medium">
                              Keywords:
                            </span>{' '}
                            transformation, breakthrough, success
                          </div>
                        </div>
                      </div>

                      {/* Color Scheme */}
                      <div className="bg-red-50 p-3 rounded-lg">
                        <label className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                          🎨 Color Psychology
                        </label>
                        <p className="text-xs text-red-600 mt-1">
                          Energy orange (#FF6B35) with trust blue (#1B365D) -
                          High contrast design for maximum psychological impact
                        </p>
                      </div>

                      {/* Psychological Triggers */}
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                          🧠 Psychological Triggers
                        </label>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs bg-white">
                            curiosity
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-white">
                            hope
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-white">
                            transformation
                          </Badge>
                        </div>
                      </div>

                      {/* CTR Optimization */}
                      <div className="bg-gray-100 p-3 rounded-lg border">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          📊 CTR Optimization
                        </label>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-gray-900">
                              High
                            </div>
                            <div className="text-gray-600">Contrast</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900">
                              Moderate
                            </div>
                            <div className="text-gray-600">Intensity</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900">
                              8/10
                            </div>
                            <div className="text-gray-600">Clarity</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Second Mock Thumbnail */}
                <Card className="border-l-4 border-l-orange-400">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          🎨 Thumbnail 2
                          <Badge variant="outline" className="text-xs ml-2">
                            Urgency
                          </Badge>
                        </h4>
                        <Badge variant="default" className="text-xs">
                          Clarity: 7/10
                        </Badge>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          📝 Concept Description
                        </label>
                        <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg border-l-3 border-l-blue-400">
                          Urgency-driven thumbnail highlighting immediate
                          relevance with dramatic visual elements
                        </p>
                      </div>

                      {/* Text Strategy */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center">
                          ✍️ Text Strategy
                        </label>
                        <div className="mt-2 space-y-2">
                          <div className="bg-white p-2 rounded border">
                            <span className="text-sm font-bold text-blue-900">
                              "WHAT THEY DON'T TELL YOU"
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-blue-600 font-medium">
                                Font:
                              </span>{' '}
                              Dramatic bold impact
                            </div>
                            <div>
                              <span className="text-blue-600 font-medium">
                                Position:
                              </span>{' '}
                              Central overlay
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Character Details */}
                      <div className="bg-green-50 p-3 rounded-lg">
                        <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                          👤 Character Specifications
                        </label>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                          <div>
                            <span className="text-green-600 font-medium">
                              Demographics:
                            </span>{' '}
                            28-35, authentic surprise/concern
                          </div>
                          <div>
                            <span className="text-green-600 font-medium">
                              Expressions:
                            </span>{' '}
                            shocked realization, urgency
                          </div>
                          <div>
                            <span className="text-green-600 font-medium">
                              Positioning:
                            </span>{' '}
                            Close-up facial focus
                          </div>
                          <div>
                            <span className="text-green-600 font-medium">
                              Style:
                            </span>{' '}
                            Casual but concerned professional
                          </div>
                        </div>
                      </div>

                      {/* Visual Composition */}
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                          🎭 Visual Composition
                        </label>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                          <div>
                            <span className="text-purple-600 font-medium">
                              Layout:
                            </span>{' '}
                            central-focus
                          </div>
                          <div>
                            <span className="text-purple-600 font-medium">
                              Visual Flow:
                            </span>{' '}
                            Center-out radiating attention
                          </div>
                          <div>
                            <span className="text-purple-600 font-medium">
                              Focal Point:
                            </span>{' '}
                            Intense character expression
                          </div>
                        </div>
                      </div>

                      {/* Objects & Elements */}
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <label className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                          🎯 Visual Elements & Objects
                        </label>
                        <div className="mt-2 space-y-2 text-xs">
                          <div>
                            <span className="text-yellow-600 font-medium">
                              Symbolic:
                            </span>{' '}
                            warning signs, hidden truths
                          </div>
                          <div>
                            <span className="text-yellow-600 font-medium">
                              Contextual:
                            </span>{' '}
                            shadowed backgrounds, revelation
                          </div>
                          <div>
                            <span className="text-yellow-600 font-medium">
                              Emotional:
                            </span>{' '}
                            question marks, revealing light
                          </div>
                          <div>
                            <span className="text-yellow-600 font-medium">
                              Keywords:
                            </span>{' '}
                            urgency, revelation, attention
                          </div>
                        </div>
                      </div>

                      {/* Color Scheme */}
                      <div className="bg-red-50 p-3 rounded-lg">
                        <label className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                          🎨 Color Psychology
                        </label>
                        <p className="text-xs text-red-600 mt-1">
                          Dramatic red (#DC143C) with attention yellow (#FFD700)
                          - Creates urgency and demands immediate attention
                        </p>
                      </div>

                      {/* Psychological Triggers */}
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                          🧠 Psychological Triggers
                        </label>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs bg-white">
                            urgency
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-white">
                            FOMO
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-white">
                            curiosity
                          </Badge>
                        </div>
                      </div>

                      {/* CTR Optimization */}
                      <div className="bg-gray-100 p-3 rounded-lg border">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          📊 CTR Optimization
                        </label>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-gray-900">
                              High
                            </div>
                            <div className="text-gray-600">Contrast</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900">
                              Intense
                            </div>
                            <div className="text-gray-600">Intensity</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-gray-900">
                              7/10
                            </div>
                            <div className="text-gray-600">Clarity</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              metadata.thumbnailConcepts?.map((concept, index) => (
                <Card key={index} className="border-l-4 border-l-orange-400">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          🎨 Thumbnail {index + 1}
                          {concept.targetEmotion && (
                            <Badge variant="outline" className="text-xs ml-2">
                              {typeof concept.targetEmotion === 'string'
                                ? concept.targetEmotion
                                : JSON.stringify(concept.targetEmotion)}
                            </Badge>
                          )}
                        </h4>
                        {concept.ctrOptimization?.clarityScore && (
                          <Badge variant="default" className="text-xs">
                            Clarity: {concept.ctrOptimization.clarityScore}/10
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          📝 Concept Description
                        </label>
                        <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg border-l-3 border-l-blue-400">
                          {typeof concept.description === 'string'
                            ? concept.description
                            : concept.description?.emotional_style
                              ? concept.description.emotional_style
                              : 'No description available'}
                        </p>
                      </div>

                      {/* Text Overlay Strategy */}
                      {concept.textStrategy && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center">
                            ✍️ Text Strategy
                          </label>
                          <div className="mt-2 space-y-2">
                            <div className="bg-white p-2 rounded border">
                              <span className="text-sm font-bold text-blue-900">
                                "
                                {concept.textStrategy?.primary ||
                                  (typeof concept.textOverlay === 'string'
                                    ? concept.textOverlay
                                    : concept.description?.text_overlay ||
                                      'No text available')}
                                "
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-blue-600 font-medium">
                                  Font:
                                </span>{' '}
                                {concept.textStrategy?.font || 'Bold Impact'}
                              </div>
                              <div>
                                <span className="text-blue-600 font-medium">
                                  Position:
                                </span>{' '}
                                {concept.textStrategy?.placement || 'Top area'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Character Details */}
                      {concept.characters && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <label className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                            👤 Character Specifications
                          </label>
                          <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                            <div>
                              <span className="text-green-600 font-medium">
                                Demographics:
                              </span>{' '}
                              {typeof concept.characters.demographics ===
                              'string'
                                ? concept.characters.demographics
                                : JSON.stringify(
                                    concept.characters.demographics
                                  )}
                            </div>
                            <div>
                              <span className="text-green-600 font-medium">
                                Expressions:
                              </span>{' '}
                              {Array.isArray(concept.characters.expressions)
                                ? concept.characters.expressions.join(', ')
                                : typeof concept.characters.expressions ===
                                    'object'
                                  ? JSON.stringify(
                                      concept.characters.expressions
                                    )
                                  : concept.characters.expressions}
                            </div>
                            <div>
                              <span className="text-green-600 font-medium">
                                Positioning:
                              </span>{' '}
                              {typeof concept.characters.positioning ===
                              'string'
                                ? concept.characters.positioning
                                : JSON.stringify(
                                    concept.characters.positioning
                                  )}
                            </div>
                            <div>
                              <span className="text-green-600 font-medium">
                                Style:
                              </span>{' '}
                              {typeof concept.characters.clothing === 'string'
                                ? concept.characters.clothing
                                : JSON.stringify(concept.characters.clothing)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Visual Composition */}
                      {concept.composition && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <label className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                            🎭 Visual Composition
                          </label>
                          <div className="mt-2 grid grid-cols-1 gap-2 text-xs">
                            <div>
                              <span className="text-purple-600 font-medium">
                                Layout:
                              </span>{' '}
                              {typeof concept.composition.layout === 'string'
                                ? concept.composition.layout
                                : JSON.stringify(concept.composition.layout)}
                            </div>
                            <div>
                              <span className="text-purple-600 font-medium">
                                Visual Flow:
                              </span>{' '}
                              {typeof concept.composition.visualFlow ===
                              'string'
                                ? concept.composition.visualFlow
                                : JSON.stringify(
                                    concept.composition.visualFlow
                                  )}
                            </div>
                            <div>
                              <span className="text-purple-600 font-medium">
                                Focal Point:
                              </span>{' '}
                              {typeof concept.composition.focalPoint ===
                              'string'
                                ? concept.composition.focalPoint
                                : JSON.stringify(
                                    concept.composition.focalPoint
                                  )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Objects & Elements */}
                      {concept.objects && (
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <label className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                            🎯 Visual Elements & Objects
                          </label>
                          <div className="mt-2 space-y-2 text-xs">
                            {concept.objects.symbolic &&
                              concept.objects.symbolic.length > 0 && (
                                <div>
                                  <span className="text-yellow-600 font-medium">
                                    Symbolic:
                                  </span>{' '}
                                  {concept.objects.symbolic.join(', ')}
                                </div>
                              )}
                            {concept.objects.contextual &&
                              concept.objects.contextual.length > 0 && (
                                <div>
                                  <span className="text-yellow-600 font-medium">
                                    Contextual:
                                  </span>{' '}
                                  {concept.objects.contextual.join(', ')}
                                </div>
                              )}
                            {concept.objects.emotional &&
                              concept.objects.emotional.length > 0 && (
                                <div>
                                  <span className="text-yellow-600 font-medium">
                                    Emotional:
                                  </span>{' '}
                                  {concept.objects.emotional.join(', ')}
                                </div>
                              )}
                            {concept.visualElements &&
                              concept.visualElements.length > 0 && (
                                <div>
                                  <span className="text-yellow-600 font-medium">
                                    Keywords:
                                  </span>{' '}
                                  {concept.visualElements.join(', ')}
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                      {/* Color Scheme */}
                      <div className="bg-red-50 p-3 rounded-lg">
                        <label className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                          🎨 Color Psychology
                        </label>
                        <p className="text-xs text-red-600 mt-1">
                          {typeof concept.colorScheme === 'string'
                            ? concept.colorScheme
                            : 'High contrast design for maximum impact'}
                        </p>
                      </div>

                      {/* Psychological Triggers */}
                      {concept.psychologicalTriggers &&
                        concept.psychologicalTriggers.length > 0 && (
                          <div className="bg-indigo-50 p-3 rounded-lg">
                            <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                              🧠 Psychological Triggers
                            </label>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {concept.psychologicalTriggers.map(
                                (trigger, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs bg-white"
                                  >
                                    {typeof trigger === 'string'
                                      ? trigger
                                      : JSON.stringify(trigger)}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* CTR Optimization */}
                      {concept.ctrOptimization && (
                        <div className="bg-gray-100 p-3 rounded-lg border">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            📊 CTR Optimization
                          </label>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center">
                              <div className="font-medium text-gray-900">
                                {concept.ctrOptimization.contrastLevel ||
                                  'High'}
                              </div>
                              <div className="text-gray-600">Contrast</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-gray-900">
                                {concept.ctrOptimization.emotionalIntensity ||
                                  'Moderate'}
                              </div>
                              <div className="text-gray-600">Intensity</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-gray-900">
                                {concept.ctrOptimization.clarityScore || 8}/10
                              </div>
                              <div className="text-gray-600">Clarity</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎨</div>
                  <p className="text-muted-foreground">
                    No thumbnail concepts available
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Enhanced thumbnails will appear here after script generation
                  </p>
                </div>
              )
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
