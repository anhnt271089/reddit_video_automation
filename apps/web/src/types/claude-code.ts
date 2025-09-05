export interface SceneMetadata {
  id: number;
  startTime: number;
  duration: number;
  content: string;
  visualKeywords: string[];
  emotion: string;
  narration: string;
}

export interface ThumbnailConcept {
  description: string;
  textOverlay: string;
}

export interface ClaudeCodeMetadata {
  titles: string[];
  selectedTitleIndex?: number;
  customTitle?: string;
  description: string;
  tags: string[];
  scenes: SceneMetadata[];
  thumbnailConcepts: ThumbnailConcept[];
}

export interface ContentPackage {
  script: string;
  selectedTitle: string;
  description: string;
  tags: string[];
  scenes: SceneMetadata[];
  thumbnailConcepts: ThumbnailConcept[];
  exportedAt: string;
}

export interface ScriptWithMetadata {
  id: string;
  postId: string;
  title: string;
  status: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  subreddit: string;
  author: string;
  error?: string;
  metadata?: ClaudeCodeMetadata;
  originalContent?: string;
  redditUrl?: string;
}

export interface AutoSaveState {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  error?: string;
}
