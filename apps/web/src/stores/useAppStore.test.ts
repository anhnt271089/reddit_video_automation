import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.setState({
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
      connectionState: 'disconnected',
      lastMessage: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
    });
  });

  describe('Posts actions', () => {
    it('should set posts', () => {
      const mockPosts = [
        {
          id: '1',
          title: 'Test Post',
          content: 'Test content',
          url: 'https://example.com',
          score: 100,
          author: 'testuser',
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
          status: 'pending' as const,
        },
      ];

      useAppStore.getState().setPosts(mockPosts);
      
      expect(useAppStore.getState().posts).toEqual(mockPosts);
    });

    it('should update a post', () => {
      const initialPost = {
        id: '1',
        title: 'Test Post',
        content: 'Test content',
        url: 'https://example.com',
        score: 100,
        author: 'testuser',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        status: 'pending' as const,
      };

      useAppStore.getState().setPosts([initialPost]);
      useAppStore.getState().updatePost('1', { status: 'completed' });

      const updatedPost = useAppStore.getState().posts[0];
      expect(updatedPost.status).toBe('completed');
    });

    it('should add a post', () => {
      const newPost = {
        id: '2',
        title: 'New Post',
        content: 'New content',
        url: 'https://example.com/new',
        score: 50,
        author: 'newuser',
        created_at: '2023-01-02',
        updated_at: '2023-01-02',
        status: 'pending' as const,
      };

      useAppStore.getState().addPost(newPost);
      
      expect(useAppStore.getState().posts).toHaveLength(1);
      expect(useAppStore.getState().posts[0]).toEqual(newPost);
    });
  });

  describe('WebSocket actions', () => {
    it('should set connection state', () => {
      useAppStore.getState().setConnectionState('connected');
      
      expect(useAppStore.getState().connectionState).toBe('connected');
    });

    it('should increment reconnect attempts', () => {
      useAppStore.getState().incrementReconnectAttempts();
      
      expect(useAppStore.getState().reconnectAttempts).toBe(1);
    });

    it('should reset reconnect attempts', () => {
      useAppStore.setState({ reconnectAttempts: 3 });
      useAppStore.getState().resetReconnectAttempts();
      
      expect(useAppStore.getState().reconnectAttempts).toBe(0);
    });

    it('should handle post status update message', () => {
      const initialPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        url: 'https://example.com',
        score: 100,
        author: 'testuser',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        status: 'pending' as const,
      };

      useAppStore.getState().setPosts([initialPost]);

      const message = {
        type: 'broadcast' as const,
        data: {
          event: 'post_status_update',
          postId: 'post-1',
          status: 'completed',
        },
        timestamp: '2023-01-01T00:00:00Z',
      };

      useAppStore.getState().handleWebSocketMessage(message);

      const updatedPost = useAppStore.getState().posts[0];
      expect(updatedPost.status).toBe('completed');
    });
  });
});