import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PostCard } from './PostCard';
import { PostFilters } from './PostFilters';
import { BatchActions } from './BatchActions';
import type { RedditPost } from './types';
import type { PostFilters as PostFiltersType } from './PostFilters';
import { useWebSocket } from '../../../hooks/useSimpleWebSocket';

interface ContentDiscoveryDashboardProps {
  initialPosts?: RedditPost[];
}

export const ContentDiscoveryDashboard: React.FC<
  ContentDiscoveryDashboardProps
> = ({ initialPosts = [] }) => {
  // State management
  const [posts, setPosts] = useState<RedditPost[]>(initialPosts);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [filters, setFilters] = useState<PostFiltersType>({
    search: '',
    status: 'all',
    sortBy: 'date',
    sortOrder: 'desc',
    minScore: 0,
    subreddit: '',
    dateRange: {
      start: '',
      end: '',
    },
  });

  // Reddit API status
  const [redditApiStatus, setRedditApiStatus] = useState<{
    isHealthy: boolean;
    lastChecked: Date | null;
    usingMockData: boolean;
  }>({
    isHealthy: false,
    lastChecked: null,
    usingMockData: true,
  });

  // Reddit authentication status
  const [redditAuthStatus, setRedditAuthStatus] = useState<{
    authenticated: boolean;
    checking: boolean;
  }>({
    authenticated: false,
    checking: false,
  });

  // WebSocket for real-time updates
  const { isConnected, lastMessage } = useWebSocket('ws://localhost:3001/ws', {
    onMessage: handleWebSocketMessage,
  });

  function handleWebSocketMessage(message: any) {
    try {
      const data = JSON.parse(message.data);

      switch (data.type) {
        case 'posts_discovered':
          setPosts(prevPosts => [...data.posts, ...prevPosts]);
          break;

        case 'post_status_update':
          setPosts(prevPosts =>
            prevPosts.map(post =>
              post.id === data.postId
                ? { ...post, status: data.newStatus }
                : post
            )
          );
          break;

        case 'script_generated':
          setPosts(prevPosts =>
            prevPosts.map(post =>
              post.id === data.postId
                ? { ...post, status: 'script_generated' }
                : post
            )
          );
          break;

        case 'batch_update_complete':
          // Refresh posts after batch operation
          loadPosts();
          break;
      }
    } catch (error) {
      console.error('WebSocket message parsing error:', error);
    }
  }

  // Filtered and sorted posts
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        post =>
          post.title.toLowerCase().includes(searchTerm) ||
          post.selftext.toLowerCase().includes(searchTerm) ||
          post.author.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(post => post.status === filters.status);
    }

    // Apply subreddit filter
    if (filters.subreddit) {
      filtered = filtered.filter(post =>
        post.subreddit.toLowerCase().includes(filters.subreddit.toLowerCase())
      );
    }

    // Apply minimum score filter
    if (filters.minScore > 0) {
      filtered = filtered.filter(post => post.score >= filters.minScore);
    }

    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(post => {
        const postDate = new Date(post.createdUtc * 1000)
          .toISOString()
          .split('T')[0];
        const startMatch =
          !filters.dateRange.start || postDate >= filters.dateRange.start;
        const endMatch =
          !filters.dateRange.end || postDate <= filters.dateRange.end;
        return startMatch && endMatch;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (filters.sortBy) {
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'upvotes':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'comments':
          aValue = a.numComments;
          bValue = b.numComments;
          break;
        case 'date':
        default:
          aValue = a.createdUtc;
          bValue = b.createdUtc;
          break;
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [posts, filters]);

  // Load posts from API
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      // First try to get real Reddit data via the scrape endpoint
      const scrapeResponse = await fetch(
        'http://localhost:3001/api/reddit/scrape',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}), // Empty body to satisfy the JSON parser
        }
      );

      if (scrapeResponse.ok) {
        const scrapeData = await scrapeResponse.json();
        if (scrapeData.success && scrapeData.data?.posts) {
          // Transform Reddit API data to our post format
          const redditPosts: RedditPost[] = scrapeData.data.posts.map(
            (redditPost: any, index: number) => ({
              id: redditPost.id,
              title: redditPost.title,
              selftext: redditPost.selftext || redditPost.text || '',
              author: redditPost.author,
              subreddit: redditPost.subreddit || 'getmotivated',
              score: redditPost.score || 0,
              upvoteRatio:
                redditPost.upvote_ratio || redditPost.upvoteRatio || 0.85,
              numComments:
                redditPost.num_comments || redditPost.numComments || 0,
              createdUtc:
                redditPost.created_utc ||
                redditPost.createdUtc ||
                Math.floor(Date.now() / 1000),
              permalink: redditPost.permalink,
              url:
                redditPost.url ||
                `https://www.reddit.com/r/${redditPost.subreddit || 'getmotivated'}/comments/${redditPost.id}`,
              domain: redditPost.domain || 'self.reddit',
              isVideo: redditPost.is_video || false,
              isSelf: redditPost.is_self || true,
              thumbnail: redditPost.thumbnail,
              postHint: redditPost.post_hint,
              status: 'discovered' as const,
            })
          );

          setPosts(redditPosts);
          setRedditApiStatus({
            isHealthy: true,
            lastChecked: new Date(),
            usingMockData: false,
          });
          return;
        }
      }

      // Fallback: Try to get stored posts
      const storedResponse = await fetch(
        'http://localhost:3001/api/reddit/posts'
      );
      if (storedResponse.ok) {
        const storedData = await storedResponse.json();
        if (storedData.posts && storedData.posts.length > 0) {
          setPosts(storedData.posts);
          return;
        }
      }

      // Final fallback: Use mock data with a warning
      setPosts(generateMockPosts());
      setRedditApiStatus({
        isHealthy: false,
        lastChecked: new Date(),
        usingMockData: true,
      });
    } catch (error) {
      // Use mock data for development
      setPosts(generateMockPosts());
      setRedditApiStatus({
        isHealthy: false,
        lastChecked: new Date(),
        usingMockData: true,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load posts on component mount
  useEffect(() => {
    if (initialPosts.length === 0) {
      loadPosts();
    }
  }, [loadPosts, initialPosts.length]);

  // Selection handlers
  const handleSelectPost = (postId: string, selected: boolean) => {
    setSelectedPosts(prev =>
      selected ? [...prev, postId] : prev.filter(id => id !== postId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedPosts(selected ? filteredPosts.map(post => post.id) : []);
  };

  const handleClearSelection = () => {
    setSelectedPosts([]);
  };

  // Post action handlers
  const handleApprovePost = async (postId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/posts/${postId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'approved' }),
        }
      );

      if (response.ok) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId ? { ...post, status: 'approved' as const } : post
          )
        );
      }
    } catch (error) {
      console.error('Post approval error:', error);
    }
  };

  const handleRejectPost = async (postId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/posts/${postId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'rejected' }),
        }
      );

      if (response.ok) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId ? { ...post, status: 'rejected' as const } : post
          )
        );
      }
    } catch (error) {
      console.error('Post rejection error:', error);
    }
  };

  const handleGenerateScript = async (postId: string) => {
    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          targetDuration: 60,
          style: 'motivational',
        }),
      });

      if (response.ok) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, status: 'script_generated' as const }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Script generation error:', error);
    }
  };

  // Batch action handlers
  const handleBatchApprove = async (postIds: string[]) => {
    setBatchLoading(true);
    try {
      const response = await fetch('/api/posts/batch/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postIds }),
      });

      if (response.ok) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            postIds.includes(post.id)
              ? { ...post, status: 'approved' as const }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Batch approval error:', error);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchReject = async (postIds: string[]) => {
    setBatchLoading(true);
    try {
      const response = await fetch('/api/posts/batch/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postIds }),
      });

      if (response.ok) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            postIds.includes(post.id)
              ? { ...post, status: 'rejected' as const }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Batch rejection error:', error);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchGenerateScripts = async (postIds: string[]) => {
    setBatchLoading(true);
    try {
      const response = await fetch('/api/scripts/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postIds,
          targetDuration: 60,
          style: 'motivational',
        }),
      });

      if (response.ok) {
        setPosts(prevPosts =>
          prevPosts.map(post =>
            postIds.includes(post.id)
              ? { ...post, status: 'script_generated' as const }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Batch script generation error:', error);
    } finally {
      setBatchLoading(false);
    }
  };

  // Filter handlers
  const handleFiltersChange = (newFilters: PostFiltersType) => {
    setFilters(newFilters);
    setSelectedPosts([]); // Clear selection when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      sortBy: 'date',
      sortOrder: 'desc',
      minScore: 0,
      subreddit: '',
      dateRange: {
        start: '',
        end: '',
      },
    });
  };

  // Reddit authentication functions
  const checkRedditAuth = useCallback(async () => {
    setRedditAuthStatus(prev => ({ ...prev, checking: true }));
    try {
      const response = await fetch('http://localhost:3001/auth/reddit/status');
      const data = await response.json();
      setRedditAuthStatus({
        authenticated: data.data?.authenticated && data.data?.valid,
        checking: false,
      });

      // Update API status based on auth status
      setRedditApiStatus(prev => ({
        ...prev,
        isHealthy: data.data?.authenticated && data.data?.valid,
        usingMockData: !(data.data?.authenticated && data.data?.valid),
      }));
    } catch (error) {
      setRedditAuthStatus({ authenticated: false, checking: false });
    }
  }, []);

  const handleRedditAuth = () => {
    // Open Reddit OAuth in new window
    window.open(
      'http://localhost:3001/auth/reddit',
      '_blank',
      'width=600,height=700'
    );

    // Check auth status after a delay to allow user to complete OAuth
    setTimeout(() => {
      checkRedditAuth();
    }, 2000);
  };

  // Check Reddit auth status on component mount
  useEffect(() => {
    checkRedditAuth();
  }, [checkRedditAuth]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      Content Discovery
                    </h1>
                    <p className="text-gray-700 text-lg">
                      Review and approve Reddit posts for video creation
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Reddit API status indicator */}
                <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200 shadow-sm">
                  <div className="relative">
                    <div
                      className={`w-3 h-3 rounded-full ${redditApiStatus.isHealthy ? 'bg-green-500' : redditApiStatus.usingMockData ? 'bg-yellow-500' : 'bg-red-500'} shadow-sm`}
                    ></div>
                    {redditApiStatus.isHealthy && (
                      <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-30"></div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {redditApiStatus.isHealthy
                      ? 'Reddit API Connected'
                      : redditApiStatus.usingMockData
                        ? 'Using Demo Data'
                        : 'Reddit API Offline'}
                  </span>
                </div>

                {/* WebSocket status indicator */}
                <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200 shadow-sm">
                  <div className="relative">
                    <div
                      className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'} shadow-sm`}
                    ></div>
                    {isConnected && (
                      <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-30"></div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {isConnected ? 'Live Feed' : 'Manual Refresh'}
                  </span>
                </div>

                {/* Reddit Authentication button */}
                {!redditAuthStatus.authenticated ? (
                  <button
                    onClick={handleRedditAuth}
                    disabled={redditAuthStatus.checking}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {redditAuthStatus.checking ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Checking...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Connect Reddit</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-xl shadow-lg">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Reddit Connected</span>
                  </div>
                )}

                {/* Refresh button with modern styling */}
                <button
                  onClick={loadPosts}
                  disabled={loading}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        {redditAuthStatus.authenticated
                          ? 'Get New Posts'
                          : 'Refresh'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-blue-700 font-semibold text-lg">
                      {posts.length}
                    </p>
                    <p className="text-blue-600 text-sm font-medium">
                      Total Posts
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-green-700 font-semibold text-lg">
                      {posts.filter(p => p.status === 'approved').length}
                    </p>
                    <p className="text-green-600 text-sm font-medium">
                      Approved
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-purple-700 font-semibold text-lg">
                      {
                        posts.filter(p => p.status === 'script_generated')
                          .length
                      }
                    </p>
                    <p className="text-purple-600 text-sm font-medium">
                      Scripts Ready
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <PostFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          totalPosts={posts.length}
          filteredPosts={filteredPosts.length}
        />

        {/* Batch Actions */}
        <BatchActions
          selectedPosts={selectedPosts}
          allPostIds={filteredPosts.map(post => post.id)}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onBatchApprove={handleBatchApprove}
          onBatchReject={handleBatchReject}
          onBatchGenerateScripts={handleBatchGenerateScripts}
          isLoading={batchLoading}
        />

        {/* Posts Grid */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-spin"></div>
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loading content...
              </h3>
              <p className="text-gray-600">
                Discovering the best Reddit posts for video creation
              </p>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-12 shadow-xl shadow-gray-200/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                No posts found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {filters.search ||
                filters.status !== 'all' ||
                filters.subreddit ||
                filters.minScore > 0
                  ? 'Try adjusting your filters to discover more content, or clear all filters to see everything.'
                  : 'No Reddit posts have been discovered yet. Click the refresh button to start discovering content.'}
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                >
                  Clear Filters
                </button>
                <button
                  onClick={loadPosts}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Discover Content
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Results header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {filteredPosts.length === posts.length
                    ? `${filteredPosts.length} posts found`
                    : `${filteredPosts.length} of ${posts.length} posts`}
                </h2>
                {selectedPosts.length > 0 && (
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedPosts.length} selected
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-500">
                Updated {new Date().toLocaleTimeString()}
              </div>
            </div>

            {/* Enhanced grid with better spacing and animations */}
            <div className="space-y-3">
              {filteredPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <PostCard
                    post={post}
                    onApprove={handleApprovePost}
                    onReject={handleRejectPost}
                    onGenerateScript={handleGenerateScript}
                    isSelected={selectedPosts.includes(post.id)}
                    onSelect={handleSelectPost}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Enhanced Load More Button */}
        {filteredPosts.length > 0 && filteredPosts.length % 20 === 0 && (
          <div className="text-center mt-12">
            <button className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium rounded-xl border border-gray-300 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md">
              <span>Load More Posts</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Mock data generator for development
function generateMockPosts(): RedditPost[] {
  const mockPosts: RedditPost[] = [
    {
      id: '1',
      title:
        "Your body isn't your enemy, it's just a really dumb pet. Here's how to train it.",
      selftext:
        "I used to think my body was working against me. Late nights? My body wanted to stay awake. Early mornings? It wanted to sleep in. Healthy food? It craved junk. I felt like I was in a constant battle with myself.\n\nThen I realized something that changed everything: my body isn't my enemy, it's just a really dumb pet.\n\nThink about it. If you had a dog that you fed pizza every day, never walked, and let sleep on your schedule, what would happen? The dog would become lazy, unhealthy, and hard to control. But if you trained that dog with consistency, patience, and the right rewards, it would become your best companion.\n\nYour body is the same way. It learns from what you repeatedly do. Feed it well, move it regularly, and give it consistent sleep, and it starts to crave those things. It becomes easier to wake up early, easier to choose healthy food, easier to exercise.\n\nThe key is treating your body like you're training a pet: with patience, consistency, and understanding that it takes time to build new habits. Stop fighting your body and start training it instead.",
      author: 'AffectionateRange768',
      subreddit: 'decidingtobebetter',
      score: 445,
      upvoteRatio: 0.94,
      numComments: 89,
      createdUtc: Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000), // 2 days ago
      permalink: '/r/decidingtobebetter/comments/1/body_training/',
      url: 'https://reddit.com/r/decidingtobebetter/comments/1',
      domain: 'self.decidingtobebetter',
      isVideo: false,
      isSelf: true,
      status: 'discovered',
    },
    {
      id: '2',
      title:
        "I quit social media for 6 months. Here's what I learned about dopamine and focus.",
      selftext:
        "Six months ago, I deleted Instagram, TikTok, Twitter, and Facebook from my phone. I was spending 4-5 hours a day scrolling, and I felt like my brain was broken. I couldn't focus on anything for more than a few minutes without reaching for my phone.\n\nThe first week was brutal. I felt anxious, bored, and kept reaching for my phone out of habit. But something interesting started happening around week 3.\n\nI began to notice things I hadn't seen in years. The way morning light hits my coffee cup. Conversations with friends without the urge to check notifications. Books became interesting again - I read 12 books in 6 months compared to 1 the entire year before.\n\nMy productivity skyrocketed. Without the constant dopamine hits from likes and comments, my brain started finding satisfaction in completing tasks, learning new skills, and having real conversations.\n\nThe biggest surprise? I stopped caring about what other people were doing with their lives. The comparison trap disappeared. I focused on my own goals and actually achieved them.\n\nI'm not saying everyone should quit social media forever, but taking a break taught me that my attention is my most valuable asset, and I was giving it away for free.",
      author: 'digitaldetoxer',
      subreddit: 'selfimprovement',
      score: 1247,
      upvoteRatio: 0.97,
      numComments: 342,
      createdUtc: Math.floor((Date.now() - 1 * 24 * 60 * 60 * 1000) / 1000), // 1 day ago
      permalink: '/r/selfimprovement/comments/2/social_media_detox/',
      url: 'https://reddit.com/r/selfimprovement/comments/2',
      domain: 'self.selfimprovement',
      isVideo: false,
      isSelf: true,
      status: 'discovered',
    },
    {
      id: '3',
      title:
        'From $30K debt to $50K savings in 18 months: My productivity system that changed everything',
      selftext:
        "Eighteen months ago, I was $30,000 in debt, working a job I hated, and spending my evenings watching Netflix while ordering takeout. Today, I have $50,000 in savings, started my own consulting business, and feel more energetic than I have in years.\n\nThe transformation didn't happen overnight, but it started with one simple realization: I was treating my time like it was unlimited, but my debt like it was permanent. I needed to flip that mindset.\n\nHere's the system that worked for me:\n\n1. **Time blocking with energy awareness**: I mapped out when I had high energy (mornings) vs low energy (after 3pm) and scheduled my hardest work during peak times.\n\n2. **The 2-minute rule**: If something takes less than 2 minutes, do it immediately. This eliminated the mental overhead of tiny tasks.\n\n3. **Revenue-focused side hustle**: Instead of random side gigs, I focused on one skill (Excel training) and monetized it through freelancing.\n\n4. **Automated everything**: Bills, savings, investments. Decision fatigue was killing my willpower.\n\nThe key insight: productivity isn't about doing more things. It's about doing the right things with the energy you have. When you align your energy with your priorities, everything becomes easier.",
      author: 'productivitywin',
      subreddit: 'productivity',
      score: 823,
      upvoteRatio: 0.91,
      numComments: 156,
      createdUtc: Math.floor((Date.now() - 5 * 60 * 60 * 1000) / 1000), // 5 hours ago
      permalink: '/r/productivity/comments/3/debt_to_savings/',
      url: 'https://reddit.com/r/productivity/comments/3',
      domain: 'self.productivity',
      isVideo: false,
      isSelf: true,
      status: 'discovered',
    },
  ];

  return mockPosts;
}
