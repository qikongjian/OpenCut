import React from 'react';
import { ChevronUp } from 'lucide-react';

interface LoadMoreButtonProps {
  onClick: () => void;
  loading?: boolean;
}

export function LoadMoreButton({ onClick, loading = false }: LoadMoreButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300 hover:bg-gray-800/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      data-alt="load-more-button"
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-white" />
      ) : (
        <ChevronUp size={16} />
      )}
      <span>查看历史消息</span>
    </button>
  );
}
