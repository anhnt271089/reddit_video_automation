# Frontend Architecture

The React dashboard provides the primary interface for content approval, script review, asset management, and video monitoring with real-time updates and developer-friendly UX patterns.

## Component Architecture

### Component Organization

```
apps/web/src/
├── components/
│   ├── ui/                    # Radix UI + Tailwind components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── ProgressBar.tsx
│   ├── features/              # Domain-specific components
│   │   ├── ContentDiscovery/
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostFilters.tsx
│   │   │   └── ApprovalActions.tsx
│   │   ├── ScriptReview/
│   │   │   ├── ScriptEditor.tsx
│   │   │   ├── SceneBreakdown.tsx
│   │   │   └── MetadataReview.tsx
│   │   ├── AssetGallery/
│   │   │   ├── AssetPreview.tsx
│   │   │   ├── AssetReplacement.tsx
│   │   │   └── MusicSelector.tsx
│   │   └── VideoMonitor/
│   │       ├── RenderProgress.tsx
│   │       ├── VideoPreview.tsx
│   │       └── DownloadActions.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── MainLayout.tsx
├── pages/
├── hooks/
├── services/
└── stores/
```

### Component Template

```typescript
interface PostCardProps {
  post: RedditPost;
  onApprove: (postId: string) => void;
  onReject: (postId: string) => void;
  isLoading?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onApprove,
  onReject,
  isLoading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold line-clamp-2">{post.title}</h3>
        <Badge variant={getStatusVariant(post.status)}>{post.status}</Badge>
      </div>

      <div className="text-sm text-gray-600 mb-3">
        Score: {post.score.toFixed(1)} • {post.upvotes} upvotes
      </div>

      <div className="flex justify-between items-center mt-4">
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Show Less' : 'Read More'}
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onReject(post.id)} disabled={isLoading}>
            Reject
          </Button>
          <Button size="sm" onClick={() => onApprove(post.id)} disabled={isLoading}>
            Approve
          </Button>
        </div>
      </div>
    </Card>
  );
};
```

## State Management Architecture

### State Structure

```typescript
interface AppState {
  posts: {
    items: RedditPost[];
    filter: PostFilter;
    loading: boolean;
    selectedIds: string[];
  };

  scripts: {
    current: VideoScript | null;
    editing: boolean;
    generating: boolean;
    versions: VideoScript[];
  };

  assets: {
    items: VideoAsset[];
    music: BackgroundMusic[];
    selectedMusicId: string | null;
    approvedCount: number;
  };

  videos: {
    items: VideoOutput[];
    currentRender: {
      postId: string;
      progress: number;
      status: string;
    } | null;
  };

  websocket: {
    connected: boolean;
    lastMessage: any;
    reconnectAttempts: number;
  };
}
```

### State Management Patterns

```typescript
const useAppStore = create<AppState>()((set, get) => ({
  posts: {
    items: [],
    filter: 'all',
    loading: false,
    selectedIds: [],
  },

  approvePost: (postId: string) => {
    set(state => ({
      posts: {
        ...state.posts,
        items: state.posts.items.map(post =>
          post.id === postId ? { ...post, status: 'idea_selected' } : post
        ),
      },
    }));
  },
}));
```

## Routing Architecture

### Route Organization

```typescript
const routes = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'content', element: <ContentReview /> },
      { path: 'scripts/:scriptId?', element: <ScriptWorkflow /> },
      { path: 'assets/:scriptId', element: <AssetManagement /> },
      { path: 'videos', element: <VideoLibrary /> }
    ]
  }
];
```

### Protected Route Pattern

```typescript
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

## Frontend Services Layer

### API Client Setup

```typescript
class ApiClient {
  private baseURL = process.env.VITE_API_URL || 'http://localhost:3001';
  private token = localStorage.getItem('auth_token');

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getPosts(
    filter?: PostFilter
  ): Promise<{ posts: RedditPost[]; total: number }> {
    const queryParams = filter ? `?status=${filter}` : '';
    return this.request(`/api/posts${queryParams}`);
  }

  async approvePost(postId: string): Promise<RedditPost> {
    return this.request(`/api/posts/${postId}/approve`, { method: 'POST' });
  }
}

export const apiClient = new ApiClient();
```

### Service Example

```typescript
export const usePosts = () => {
  const { posts, setPosts, setLoading } = useAppStore();

  const loadPosts = useCallback(
    async (filter?: PostFilter) => {
      try {
        setLoading(true);
        const data = await apiClient.getPosts(filter);
        setPosts(data.posts);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    },
    [setPosts, setLoading]
  );

  return {
    posts: posts.items,
    loading: posts.loading,
    loadPosts,
  };
};
```
