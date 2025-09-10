import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { SceneMetadata } from '../../types/claude-code';
import { clsx } from 'clsx';

interface SearchPhrase {
  sentenceId: number;
  primaryPhrase: string;
  alternativeKeywords: string[];
  assetType: 'photo' | 'video';
  reasoning: string;
}

interface SceneTimelineProps {
  scenes: SceneMetadata[];
  currentContent?: string; // Add current script content for accurate sentence counting
  scriptId?: string; // Script ID for file naming
  onSceneUpdate?: (sceneId: number, updates: Partial<SceneMetadata>) => void;
  downloadingScenes?: Set<number>; // Scenes currently downloading from parent
  downloadedScenes?: Set<number>; // Scenes already downloaded from parent
}

export function SceneTimeline({
  scenes,
  currentContent,
  scriptId,
  onSceneUpdate,
  downloadingScenes: parentDownloadingScenes,
  downloadedScenes: parentDownloadedScenes,
}: SceneTimelineProps) {
  const [searchPhrases, setSearchPhrases] = useState<SearchPhrase[]>([]);
  const [isGeneratingPhrases, setIsGeneratingPhrases] = useState(false);
  const [downloadingScenes, setDownloadingScenes] = useState<Set<number>>(
    new Set()
  );
  const [downloadedScenes, setDownloadedScenes] = useState<Set<number>>(
    new Set()
  );

  // Generate search phrases for sentences
  const generateSearchPhrases = async (sentences: any[]) => {
    if (sentences.length === 0) {
      return;
    }

    setIsGeneratingPhrases(true);
    try {
      const response = await fetch('/api/search-phrases/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sentences: sentences.map(sentence => ({
            id: sentence.id,
            content: sentence.content || sentence.narration,
            duration: sentence.duration,
            assetType: sentence.duration < 4 ? 'photo' : 'video',
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSearchPhrases(result.data || []);
        console.log('Generated search phrases:', result.data);
      } else {
        console.error(
          'Failed to generate search phrases:',
          response.statusText
        );
      }
    } catch (error) {
      console.error('Error generating search phrases:', error);
    } finally {
      setIsGeneratingPhrases(false);
    }
  };

  // Download asset for a scene
  const downloadAsset = async (
    sceneId: number,
    searchPhrase: string,
    assetType: 'photo' | 'video'
  ) => {
    if (!scriptId) {
      alert('❌ Script ID not available');
      return;
    }

    setDownloadingScenes(prev => new Set(prev).add(sceneId));

    try {
      console.log(`Downloading ${assetType} for scene ${sceneId}:`, {
        searchPhrase,
        scriptId,
      });

      const response = await fetch('/api/pexels-download/search-and-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchPhrase,
          assetType,
          scriptId,
          sentenceId: sceneId,
        }),
      });

      const result = await response.json();
      console.log('Download result:', result);

      if (response.ok && result.success) {
        setDownloadedScenes(prev => new Set(prev).add(sceneId));
        console.log(
          `✅ Downloaded ${assetType} for scene ${sceneId}! File: ${result.data.filename}`
        );
        console.log(`📁 File saved to: ${result.data.downloadPath}`);
      } else {
        alert(`❌ Download failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert(
        `❌ Download error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setDownloadingScenes(prev => {
        const newSet = new Set(prev);
        newSet.delete(sceneId);
        return newSet;
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const extractKeywordsFromText = (text: string): string[] => {
    // Comprehensive stop words list
    const stopWords = new Set([
      // Articles & basic words
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
      'from',
      'up',
      'about',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'out',
      'off',
      'over',
      'under',
      'again',
      'further',

      // Verbs
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
      'get',
      'got',
      'go',
      'goes',
      'went',
      'come',
      'came',
      'take',
      'took',
      'make',
      'made',
      'see',
      'saw',
      'know',
      'knew',
      'think',
      'thought',

      // Pronouns
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
      'my',
      'your',
      'his',
      'her',
      'its',
      'our',
      'their',
      'myself',
      'yourself',
      'himself',
      'herself',
      'itself',
      'ourselves',
      'themselves',

      // Demonstratives & determiners
      'this',
      'that',
      'these',
      'those',
      'some',
      'any',
      'all',
      'each',
      'every',
      'no',
      'none',
      'both',
      'either',
      'neither',
      'many',
      'much',
      'more',
      'most',

      // Common function words
      'so',
      'just',
      'now',
      'then',
      'here',
      'there',
      'where',
      'when',
      'why',
      'how',
      'what',
      'who',
      'which',
      'than',
      'only',
      'also',
      'very',
      'well',
      'still',
      'even',
      'back',
      'down',
      'way',
      'time',
      'because',
      'if',
      'as',
    ]);

    // High-impact keywords that should always be included
    const importantKeywords = new Set([
      // Psychology & mindset terms
      'psychology',
      'psychological',
      'mindset',
      'brain',
      'mental',
      'cognitive',
      'behavior',
      'habit',
      'routine',
      'pattern',
      'mechanism',
      'trigger',
      'emotion',

      // Achievement & success terms
      'success',
      'achievement',
      'breakthrough',
      'transformation',
      'growth',
      'motivation',
      'productivity',
      'performance',
      'excellence',
      'mastery',

      // Problem & solution terms
      'problem',
      'solution',
      'challenge',
      'obstacle',
      'struggle',
      'difficulty',
      'strategy',
      'method',
      'approach',
      'technique',
      'framework',
      'system',

      // Action & change terms
      'action',
      'change',
      'improvement',
      'progress',
      'development',
      'focus',
      'concentration',
      'discipline',
      'consistency',
      'momentum',
      'results',

      // Learning & insight terms
      'insight',
      'discovery',
      'realization',
      'understanding',
      'knowledge',
      'wisdom',
      'experience',
      'lesson',
      'principle',
      'truth',
      'secret',
    ]);

    // Extract and clean words
    const words = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Keep hyphens for compound words
      .split(/\s+/)
      .filter(word => word.length > 2) // Allow 3+ character words
      .map(word => word.replace(/^-+|-+$/g, '')); // Clean leading/trailing hyphens

    // Score words based on importance
    const keywordScores = new Map<string, number>();

    words.forEach(word => {
      if (stopWords.has(word)) {
        return;
      } // Skip stop words

      let score = 1; // Base score

      // Boost score for important keywords
      if (importantKeywords.has(word)) {
        score += 5;
      }

      // Boost score for longer words (often more meaningful)
      if (word.length >= 6) {
        score += 1;
      }
      if (word.length >= 8) {
        score += 1;
      }
      if (word.length >= 10) {
        score += 1;
      }

      // Boost score for words ending in common meaningful suffixes
      if (/tion|sion|ment|ness|able|ible|ful|less|ing$/.test(word)) {
        score += 1;
      }

      // Boost score for compound words (with hyphens)
      if (word.includes('-')) {
        score += 1;
      }

      // Boost score for capitalized concepts (proper nouns, acronyms)
      const originalWord = text.match(new RegExp(`\\b${word}\\b`, 'i'))?.[0];
      if (originalWord && /[A-Z]/.test(originalWord)) {
        score += 1;
      }

      // Accumulate scores for repeated words
      keywordScores.set(word, (keywordScores.get(word) || 0) + score);
    });

    // Sort by score and return all meaningful keywords (no limit)
    return Array.from(keywordScores.entries())
      .sort(([, a], [, b]) => b - a) // Sort by score descending
      .filter(([word, score]) => score >= 2) // Only include words with meaningful scores
      .map(([word]) => word);
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

  // Unified sentence splitting to match backend and ScriptEditor
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
    return processedText
      .split(/(?<=[.!?])\s+(?=[A-Z])/)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim());
  };

  const getTotalDuration = () => {
    return scenes.reduce((total, scene) => total + scene.duration, 0);
  };

  // Get accurate sentence count from current content if available
  const getAccurateSentenceCount = () => {
    if (currentContent) {
      return splitIntoSentences(currentContent).length;
    }
    return scenes.length; // Fallback to scenes length if no current content
  };

  // Auto-generate search phrases when timeline items change
  useEffect(() => {
    const timelineItems = getTimelineItems();
    if (timelineItems.length > 0 && searchPhrases.length === 0) {
      generateSearchPhrases(timelineItems);
    }
  }, [currentContent, scenes]);

  // Generate timeline items from current content when available
  const getTimelineItems = () => {
    if (currentContent) {
      // Generate dynamic timeline from current content
      const sentences = splitIntoSentences(currentContent);
      const totalDuration = getTotalDuration();

      // Calculate word count for each sentence to determine proportional duration
      const sentenceWordCounts = sentences.map(
        sentence => sentence.split(/\s+/).filter(word => word.length > 0).length
      );

      // Total words across all sentences
      const totalWords = sentenceWordCounts.reduce(
        (sum, count) => sum + count,
        0
      );

      // Calculate proportional duration for each sentence based on word count
      let cumulativeTime = 0;

      return sentences.map((sentence, index) => {
        const sentenceId = index + 1;
        const wordCount = sentenceWordCounts[index];

        // Calculate duration proportional to word count (minimum 2 seconds, maximum reasonable)
        const proportionalDuration = Math.max(
          2,
          Math.round((wordCount / totalWords) * totalDuration)
        );

        const startTime = cumulativeTime;
        const duration = proportionalDuration;

        // Update cumulative time for next sentence
        cumulativeTime += duration;

        // Generate keywords for this sentence
        const keywords = extractKeywordsFromText(sentence);

        // Determine emotion based on content analysis
        const emotion = analyzeSentenceEmotion(sentence);

        return {
          id: sentenceId,
          startTime,
          duration,
          content: sentence,
          narration: sentence,
          visualKeywords: keywords,
          emotion,
        };
      });
    }

    // Fallback to stored scenes if no current content
    return scenes;
  };

  // Simple emotion analysis based on sentence content
  const analyzeSentenceEmotion = (sentence: string): string => {
    const lowerSentence = sentence.toLowerCase();

    if (lowerSentence.includes('?')) {
      return 'curious';
    }
    if (
      lowerSentence.includes('!') ||
      lowerSentence.includes('challenge') ||
      lowerSentence.includes('action')
    ) {
      return 'engaging';
    }
    if (
      lowerSentence.includes('but') ||
      lowerSentence.includes('however') ||
      lowerSentence.includes('problem')
    ) {
      return 'concerned';
    }
    if (
      lowerSentence.includes('breakthrough') ||
      lowerSentence.includes('solution') ||
      lowerSentence.includes('success')
    ) {
      return 'hopeful';
    }
    if (
      lowerSentence.includes('remember') ||
      lowerSentence.includes('key insight') ||
      lowerSentence.includes('important')
    ) {
      return 'educational';
    }

    return 'contemplative'; // Default
  };

  // Get search phrase data for a specific scene
  const getSearchPhrase = (sceneId: number): SearchPhrase | null => {
    return searchPhrases.find(phrase => phrase.sentenceId === sceneId) || null;
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {getTimelineItems().map((scene, index) => (
          <div
            key={scene.id}
            className={clsx(
              'relative flex items-center p-2 rounded-md border-l-3 text-sm',
              getEmotionColor(scene.emotion)
            )}
          >
            {/* Timeline connector */}
            {index < getTimelineItems().length - 1 && (
              <div className="absolute left-1.5 top-full w-0.5 h-1 bg-gray-300" />
            )}

            {/* Scene content */}
            <div className="flex-1 space-y-1.5">
              <div className="flex items-start gap-3">
                {/* Scene number and timing */}
                <div className="flex-shrink-0 text-center min-w-[50px]">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="text-sm font-bold text-gray-900">
                      {scene.id}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(scene.startTime)}
                    </div>
                  </div>
                </div>

                {/* Scene content and search phrase */}
                <div className="flex-1 space-y-1.5">
                  {/* Main sentence */}
                  <p className="text-sm text-gray-800 leading-tight">
                    {scene.narration || scene.content}
                  </p>

                  {/* Search phrase and download button */}
                  {(() => {
                    const searchPhrase = getSearchPhrase(scene.id);
                    const assetType = scene.duration < 4 ? 'photo' : 'video';
                    // Use parent state if available, otherwise fall back to local state
                    const isDownloading =
                      parentDownloadingScenes?.has(scene.id) ||
                      downloadingScenes.has(scene.id);
                    const isDownloaded =
                      parentDownloadedScenes?.has(scene.id) ||
                      downloadedScenes.has(scene.id);

                    if (searchPhrase) {
                      return (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-lg">
                            {assetType === 'photo' ? '📷' : '🎬'}
                          </span>
                          <span className="italic flex-1">
                            {searchPhrase.primaryPhrase}
                          </span>
                          <Button
                            size="sm"
                            variant={isDownloaded ? 'success' : 'default'}
                            disabled={isDownloading || isDownloaded}
                            onClick={() =>
                              downloadAsset(
                                scene.id,
                                searchPhrase.primaryPhrase,
                                assetType
                              )
                            }
                            className={`ml-2 transition-all duration-200 ${
                              isDownloaded
                                ? 'bg-green-500 hover:bg-green-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {isDownloading ? (
                                <>
                                  <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full"></div>
                                  <span className="text-xs">Downloading</span>
                                </>
                              ) : isDownloaded ? (
                                <>
                                  <svg
                                    className="h-3 w-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                  <span className="text-xs">Downloaded</span>
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="h-3 w-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                  </svg>
                                  <span className="text-xs">Download</span>
                                </>
                              )}
                            </div>
                          </Button>
                        </div>
                      );
                    }

                    if (isGeneratingPhrases) {
                      return (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="animate-pulse">🤖</span>
                          <span className="italic animate-pulse">
                            Generating search phrase...
                          </span>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>

                {/* Duration and emotion */}
                <div className="flex-shrink-0 text-right min-w-[80px]">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      {scene.duration}s
                    </Badge>
                    <div className="text-xs text-gray-500 capitalize">
                      {scene.emotion}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline summary */}
      <div className="mt-2 p-2 bg-gray-50 rounded-md">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-medium text-gray-900 text-sm">
              {getAccurateSentenceCount()}
            </div>
            <div className="text-xs text-gray-500 leading-tight">Sentences</div>
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">
              {formatTime(getTotalDuration())}
            </div>
            <div className="text-xs text-gray-500 leading-tight">Duration</div>
          </div>
          <div>
            <div className="font-medium text-gray-900 text-sm">
              {Math.round(getTotalDuration() / getAccurateSentenceCount())}s
            </div>
            <div className="text-xs text-gray-500 leading-tight">
              Avg/Sentence
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
