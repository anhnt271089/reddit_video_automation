import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';

export interface PostFilters {
  search: string;
  status: 'all' | 'discovered' | 'approved' | 'rejected' | 'script_generated';
  sortBy: 'score' | 'date' | 'upvotes' | 'comments';
  sortOrder: 'asc' | 'desc';
  minScore: number;
  subreddit: string;
  dateRange: {
    start: string;
    end: string;
  };
}

interface PostFiltersProps {
  filters: PostFilters;
  onFiltersChange: (filters: PostFilters) => void;
  onClearFilters: () => void;
  totalPosts: number;
  filteredPosts: number;
}

export const PostFilters: React.FC<PostFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  totalPosts,
  filteredPosts
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof PostFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const updateDateRange = (key: 'start' | 'end', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [key]: value
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'discovered': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'script_generated': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.subreddit !== '' ||
    filters.minScore > 0 ||
    filters.dateRange.start !== '' ||
    filters.dateRange.end !== '';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">Filter Posts</h3>
          <div className="text-sm text-gray-500">
            Showing {filteredPosts.toLocaleString()} of {totalPosts.toLocaleString()} posts
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Simple' : 'Advanced'} Filters
          </Button>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Main Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Search */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search titles and content..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="discovered">New</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="script_generated">Script Ready</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <div className="flex space-x-1">
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Date</option>
              <option value="score">Score</option>
              <option value="upvotes">Upvotes</option>
              <option value="comments">Comments</option>
            </select>
            <button
              onClick={() => updateFilter('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            >
              {filters.sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Subreddit Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subreddit
              </label>
              <input
                type="text"
                placeholder="e.g., motivation"
                value={filters.subreddit}
                onChange={(e) => updateFilter('subreddit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Min Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Score: {filters.minScore}
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={filters.minScore}
                onChange={(e) => updateFilter('minScore', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>500</span>
                <span>1000+</span>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => updateDateRange('start', e.target.value)}
                  className="flex-1 px-2 py-2 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => updateDateRange('end', e.target.value)}
                  className="flex-1 px-2 py-2 text-xs border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="border-t pt-4 mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            
            {filters.search && (
              <Badge variant="info" className="cursor-pointer" onClick={() => updateFilter('search', '')}>
                Search: "{filters.search}" ✕
              </Badge>
            )}
            
            {filters.status !== 'all' && (
              <Badge 
                className={`cursor-pointer ${getStatusColor(filters.status)}`}
                onClick={() => updateFilter('status', 'all')}
              >
                Status: {filters.status} ✕
              </Badge>
            )}
            
            {filters.subreddit && (
              <Badge variant="info" className="cursor-pointer" onClick={() => updateFilter('subreddit', '')}>
                r/{filters.subreddit} ✕
              </Badge>
            )}
            
            {filters.minScore > 0 && (
              <Badge variant="secondary" className="cursor-pointer" onClick={() => updateFilter('minScore', 0)}>
                Score ≥{filters.minScore} ✕
              </Badge>
            )}
            
            {(filters.dateRange.start || filters.dateRange.end) && (
              <Badge 
                variant="secondary" 
                className="cursor-pointer" 
                onClick={() => updateDateRange('start', ''), updateDateRange('end', '')}
              >
                Date Range ✕
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};