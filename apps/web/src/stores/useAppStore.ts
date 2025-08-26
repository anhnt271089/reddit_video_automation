import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  Post, 
  VideoScript, 
  VideoAsset, 
  VideoOutput, 
  WebSocketState as WSState,
  WebSocketMessage
} from '../types';

interface PostsState {
  posts: Post[];
  selectedPost: Post | null;
  isLoading: boolean;
  error: string | null;
}

interface ScriptsState {
  scripts: VideoScript[];
  selectedScript: VideoScript | null;
  isLoading: boolean;
  error: string | null;
}

interface AssetsState {
  assets: VideoAsset[];
  selectedAssets: VideoAsset[];
  isLoading: boolean;
  error: string | null;
}

interface VideosState {
  videos: VideoOutput[];
  currentVideo: VideoOutput | null;
  isLoading: boolean;
  error: string | null;
}

interface WebSocketStateSlice {
  connectionState: WSState;
  lastMessage: WebSocketMessage | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

interface AppState extends PostsState, ScriptsState, AssetsState, VideosState, WebSocketStateSlice {
  // Posts actions
  setPosts: (posts: Post[]) => void;
  setSelectedPost: (post: Post | null) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  addPost: (post: Post) => void;
  removePost: (postId: string) => void;
  setPostsLoading: (loading: boolean) => void;
  setPostsError: (error: string | null) => void;

  // Scripts actions
  setScripts: (scripts: VideoScript[]) => void;
  setSelectedScript: (script: VideoScript | null) => void;
  updateScript: (scriptId: string, updates: Partial<VideoScript>) => void;
  addScript: (script: VideoScript) => void;
  removeScript: (scriptId: string) => void;
  setScriptsLoading: (loading: boolean) => void;
  setScriptsError: (error: string | null) => void;

  // Assets actions
  setAssets: (assets: VideoAsset[]) => void;
  setSelectedAssets: (assets: VideoAsset[]) => void;
  updateAsset: (assetId: string, updates: Partial<VideoAsset>) => void;
  addAsset: (asset: VideoAsset) => void;
  removeAsset: (assetId: string) => void;
  toggleAssetSelection: (asset: VideoAsset) => void;
  clearSelectedAssets: () => void;
  setAssetsLoading: (loading: boolean) => void;
  setAssetsError: (error: string | null) => void;

  // Videos actions
  setVideos: (videos: VideoOutput[]) => void;
  setCurrentVideo: (video: VideoOutput | null) => void;
  updateVideo: (videoId: string, updates: Partial<VideoOutput>) => void;
  addVideo: (video: VideoOutput) => void;
  removeVideo: (videoId: string) => void;
  setVideosLoading: (loading: boolean) => void;
  setVideosError: (error: string | null) => void;

  // WebSocket actions
  setConnectionState: (state: WSState) => void;
  setLastMessage: (message: WebSocketMessage) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  handleWebSocketMessage: (message: WebSocketMessage) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial states
      posts: [],
      selectedPost: null,
      scripts: [],
      selectedScript: null,
      assets: [],
      selectedAssets: [],
      videos: [],
      currentVideo: null,
      isLoading: false,
      error: null,
      
      // WebSocket state
      connectionState: 'disconnected',
      lastMessage: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,

      // Posts actions
      setPosts: (posts) => set({ posts }, false, 'setPosts'),
      setSelectedPost: (post) => set({ selectedPost: post }, false, 'setSelectedPost'),
      updatePost: (postId, updates) => set((state) => ({
        posts: state.posts.map(post => 
          post.id === postId ? { ...post, ...updates } : post
        ),
        selectedPost: state.selectedPost?.id === postId 
          ? { ...state.selectedPost, ...updates } 
          : state.selectedPost
      }), false, 'updatePost'),
      addPost: (post) => set((state) => ({
        posts: [post, ...state.posts]
      }), false, 'addPost'),
      removePost: (postId) => set((state) => ({
        posts: state.posts.filter(post => post.id !== postId),
        selectedPost: state.selectedPost?.id === postId ? null : state.selectedPost
      }), false, 'removePost'),
      setPostsLoading: (loading) => set({ isLoading: loading }, false, 'setPostsLoading'),
      setPostsError: (error) => set({ error }, false, 'setPostsError'),

      // Scripts actions
      setScripts: (scripts) => set({ scripts }, false, 'setScripts'),
      setSelectedScript: (script) => set({ selectedScript: script }, false, 'setSelectedScript'),
      updateScript: (scriptId, updates) => set((state) => ({
        scripts: state.scripts.map(script => 
          script.id === scriptId ? { ...script, ...updates } : script
        ),
        selectedScript: state.selectedScript?.id === scriptId 
          ? { ...state.selectedScript, ...updates } 
          : state.selectedScript
      }), false, 'updateScript'),
      addScript: (script) => set((state) => ({
        scripts: [script, ...state.scripts]
      }), false, 'addScript'),
      removeScript: (scriptId) => set((state) => ({
        scripts: state.scripts.filter(script => script.id !== scriptId),
        selectedScript: state.selectedScript?.id === scriptId ? null : state.selectedScript
      }), false, 'removeScript'),
      setScriptsLoading: (loading) => set({ isLoading: loading }, false, 'setScriptsLoading'),
      setScriptsError: (error) => set({ error }, false, 'setScriptsError'),

      // Assets actions
      setAssets: (assets) => set({ assets }, false, 'setAssets'),
      setSelectedAssets: (assets) => set({ selectedAssets: assets }, false, 'setSelectedAssets'),
      updateAsset: (assetId, updates) => set((state) => ({
        assets: state.assets.map(asset => 
          asset.id === assetId ? { ...asset, ...updates } : asset
        ),
        selectedAssets: state.selectedAssets.map(asset => 
          asset.id === assetId ? { ...asset, ...updates } : asset
        )
      }), false, 'updateAsset'),
      addAsset: (asset) => set((state) => ({
        assets: [asset, ...state.assets]
      }), false, 'addAsset'),
      removeAsset: (assetId) => set((state) => ({
        assets: state.assets.filter(asset => asset.id !== assetId),
        selectedAssets: state.selectedAssets.filter(asset => asset.id !== assetId)
      }), false, 'removeAsset'),
      toggleAssetSelection: (asset) => set((state) => {
        const isSelected = state.selectedAssets.some(selected => selected.id === asset.id);
        return {
          selectedAssets: isSelected 
            ? state.selectedAssets.filter(selected => selected.id !== asset.id)
            : [...state.selectedAssets, asset]
        };
      }, false, 'toggleAssetSelection'),
      clearSelectedAssets: () => set({ selectedAssets: [] }, false, 'clearSelectedAssets'),
      setAssetsLoading: (loading) => set({ isLoading: loading }, false, 'setAssetsLoading'),
      setAssetsError: (error) => set({ error }, false, 'setAssetsError'),

      // Videos actions
      setVideos: (videos) => set({ videos }, false, 'setVideos'),
      setCurrentVideo: (video) => set({ currentVideo: video }, false, 'setCurrentVideo'),
      updateVideo: (videoId, updates) => set((state) => ({
        videos: state.videos.map(video => 
          video.id === videoId ? { ...video, ...updates } : video
        ),
        currentVideo: state.currentVideo?.id === videoId 
          ? { ...state.currentVideo, ...updates } 
          : state.currentVideo
      }), false, 'updateVideo'),
      addVideo: (video) => set((state) => ({
        videos: [video, ...state.videos]
      }), false, 'addVideo'),
      removeVideo: (videoId) => set((state) => ({
        videos: state.videos.filter(video => video.id !== videoId),
        currentVideo: state.currentVideo?.id === videoId ? null : state.currentVideo
      }), false, 'removeVideo'),
      setVideosLoading: (loading) => set({ isLoading: loading }, false, 'setVideosLoading'),
      setVideosError: (error) => set({ error }, false, 'setVideosError'),

      // WebSocket actions
      setConnectionState: (state) => set({ connectionState: state }, false, 'setConnectionState'),
      setLastMessage: (message) => set({ lastMessage: message }, false, 'setLastMessage'),
      incrementReconnectAttempts: () => set((state) => ({ 
        reconnectAttempts: state.reconnectAttempts + 1 
      }), false, 'incrementReconnectAttempts'),
      resetReconnectAttempts: () => set({ reconnectAttempts: 0 }, false, 'resetReconnectAttempts'),

      // Handle WebSocket messages and update relevant state
      handleWebSocketMessage: (message) => {
        const { event, postId, scriptId, videoId, status, progress, data } = message.data;
        
        switch (event) {
          case 'post_status_update':
            if (postId && status) {
              get().updatePost(postId, { status: status as Post['status'] });
            }
            break;
            
          case 'script_generated':
            if (scriptId && postId) {
              // Add new script or update existing one
              if (data) {
                get().addScript(data as VideoScript);
              }
            }
            break;
            
          case 'render_progress':
            if (postId && progress !== undefined) {
              // Find video by postId and update progress
              const videos = get().videos;
              const video = videos.find(v => v.script_id === scriptId);
              if (video) {
                get().updateVideo(video.id, { progress_percentage: progress, status: 'rendering' });
              }
            }
            break;
            
          case 'render_complete':
            if (postId && videoId) {
              get().updateVideo(videoId, { status: 'completed', progress_percentage: 100 });
            }
            break;
        }
        
        // Always update the last message
        set({ lastMessage: message }, false, 'handleWebSocketMessage');
      }
    }),
    {
      name: 'video-automation-store',
    }
  )
);