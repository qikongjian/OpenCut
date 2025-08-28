import React from 'react';

interface DateDividerProps {
  timestamp: number;
}

export function DateDivider({ timestamp }: DateDividerProps) {
  const formatDate = (ts: number) => {
    const date = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 判断是否是今天
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    }
    // 判断是否是昨天
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }
    // 其他日期显示完整日期
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex items-center justify-center my-4" data-alt="date-divider">
      <div className="flex-grow border-t border-gray-700/30"></div>
      <div className="mx-4 text-xs text-gray-500">
        {formatDate(timestamp)}
      </div>
      <div className="flex-grow border-t border-gray-700/30"></div>
    </div>
  );
}
