import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';

interface BatchActionsProps {
  selectedPosts: string[];
  allPostIds: string[];
  onSelectAll: (selected: boolean) => void;
  onClearSelection: () => void;
  onBatchApprove: (postIds: string[]) => Promise<void>;
  onBatchReject: (postIds: string[]) => Promise<void>;
  onBatchGenerateScripts: (postIds: string[]) => Promise<void>;
  isLoading: boolean;
}

export const BatchActions: React.FC<BatchActionsProps> = ({
  selectedPosts,
  allPostIds,
  onSelectAll,
  onClearSelection,
  onBatchApprove,
  onBatchReject,
  onBatchGenerateScripts,
  isLoading
}) => {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<{
    action: string;
    count: number;
  } | null>(null);

  const selectedCount = selectedPosts.length;
  const allSelected = selectedCount === allPostIds.length && allPostIds.length > 0;
  const someSelected = selectedCount > 0;

  const handleBatchAction = async (
    action: 'approve' | 'reject' | 'generate',
    actionFn: (postIds: string[]) => Promise<void>
  ) => {
    setActionInProgress(action);
    try {
      await actionFn(selectedPosts);
      onClearSelection();
    } catch (error) {
      console.error(`Batch ${action} failed:`, error);
      // TODO: Show error toast
    } finally {
      setActionInProgress(null);
      setShowConfirmation(null);
    }
  };

  const confirmAction = (action: string, count: number) => {
    setShowConfirmation({ action, count });
  };

  const cancelAction = () => {
    setShowConfirmation(null);
  };

  if (!someSelected && !showConfirmation) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              disabled={allPostIds.length === 0}
            />
            <span className="text-sm text-gray-600">
              Select posts to enable batch actions
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {allPostIds.length.toLocaleString()} posts available
          </div>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    const { action, count } = showConfirmation;
    return (
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <p className="font-medium text-yellow-800">
                Confirm {action} for {count} post{count !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-yellow-700">
                This action cannot be undone. Are you sure?
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={cancelAction}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (action === 'approve') handleBatchAction('approve', onBatchApprove);
                else if (action === 'reject') handleBatchAction('reject', onBatchReject);
                else if (action === 'generate scripts') handleBatchAction('generate', onBatchGenerateScripts);
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : `Confirm ${action}`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(input) => {
              if (input) input.indeterminate = someSelected && !allSelected;
            }}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="flex items-center space-x-2">
            <Badge variant="info" className="bg-blue-100 text-blue-800">
              {selectedCount} selected
            </Badge>
            <button
              onClick={onClearSelection}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear selection
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => confirmAction('approve', selectedCount)}
            disabled={isLoading || actionInProgress === 'approve'}
            className="bg-green-600 hover:bg-green-700"
          >
            {actionInProgress === 'approve' ? 'Approving...' : `Approve ${selectedCount}`}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => confirmAction('reject', selectedCount)}
            disabled={isLoading || actionInProgress === 'reject'}
          >
            {actionInProgress === 'reject' ? 'Rejecting...' : `Reject ${selectedCount}`}
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => confirmAction('generate scripts', selectedCount)}
            disabled={isLoading || actionInProgress === 'generate'}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {actionInProgress === 'generate' ? 'Generating...' : `Generate Scripts`}
          </Button>

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="px-2"
            >
              ⋯
            </Button>
            {/* TODO: Add dropdown with more actions:
                - Export selected
                - Add to collection
                - Bulk edit tags
                - Schedule for later
            */}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      {actionInProgress && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-sm text-blue-700">
              Processing {selectedCount} post{selectedCount !== 1 ? 's' : ''}...
            </span>
          </div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};