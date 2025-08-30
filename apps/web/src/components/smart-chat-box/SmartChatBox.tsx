import React, { useRef, useCallback, useState, useEffect } from "react";
import { ArrowRightFromLine, ChevronDown } from 'lucide-react';
import { Switch } from 'antd';
import { useSearchParams } from 'next/navigation';
import { MessageRenderer } from "./MessageRenderer";
import { InputBar } from "./InputBar";
import { useMessages } from "./useMessages";
import { DateDivider } from "./DateDivider";
import { LoadMoreButton } from "./LoadMoreButton";
import { ChatMessage } from "./types";
import { initializeTokenSystem } from "@/lib/ai-editing-auth";

interface SmartChatBoxProps {
  isSmartChatBoxOpen: boolean;
  setIsSmartChatBoxOpen: (v: boolean) => void;
  projectId: string;
  userId: number | string;
  previewVideoUrl?: string | null;
  previewVideoId?: string | null;
  onClearPreview?: () => void;
  setIsFocusChatInput?: (v: boolean) => void;
}

interface MessageGroup {
  date: number;
  messages: ChatMessage[];
}

function BackToLatestButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 bg-blue-500 hover:bg-blue-400 text-white rounded-full p-2 shadow-lg"
      title="Back to latest"
    >
      <ChevronDown size={20} />
    </button>
  );
}

export default function SmartChatBox({ 
  isSmartChatBoxOpen, 
  setIsSmartChatBoxOpen, 
  projectId, 
  userId,
  previewVideoUrl,
  previewVideoId,
  onClearPreview,
  setIsFocusChatInput
}: SmartChatBoxProps) {
  // 消息列表引用
  const listRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  // 从URL获取uid或user_id参数，原样传递不做处理
  const searchParams = useSearchParams();
  const urlUid = searchParams.get('uid');
  const urlUserId = searchParams.get('user_id');
  
  // 优先使用URL中的uid，然后是user_id，最后使用传入的userId
  // 注意：这里直接使用字符串值，不做任何解析
  const finalUserId = urlUid || urlUserId || userId;

  // 检查是否滚动到底部
  const checkIfAtBottom = useCallback(() => {
    if (listRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = listRef.current;
      // 考虑一个小的误差范围（10px）
      const isBottom = scrollHeight - scrollTop - clientHeight <= 10;
      setIsAtBottom(isBottom);
    }
  }, []);

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    checkIfAtBottom();
  }, [checkIfAtBottom]);



  // 监听滚动事件
  useEffect(() => {
    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => {
        listElement.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // 处理消息更新时的滚动
  const handleMessagesUpdate = useCallback((shouldScroll: boolean) => {
    if (shouldScroll && listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
    // 更新底部状态
    checkIfAtBottom();
  }, [checkIfAtBottom]);

  // 🔐 初始化token系统
  useEffect(() => {
    const initTokenSystem = async () => {
      try {
        await initializeTokenSystem();
        console.log('✅ SmartChatBox token系统初始化成功');
      } catch (error) {
        console.error('❌ SmartChatBox token系统初始化失败:', error);
      }
    };

    initTokenSystem();
  }, []);

  // 使用消息管理 hook
  const [
    { messages, isLoading, error, hasMore, loadMoreMessages, backToLatest, isViewingHistory },
    { sendMessage },
    { enabled: systemPush, toggle: toggleSystemPush }
  ] = useMessages({ 
    config: { projectId, userId: finalUserId },
    onMessagesUpdate: handleMessagesUpdate
  });

  // 按日期分组消息
  const groupedMessages = React.useMemo(() => {
    const groups: MessageGroup[] = [];
    
    messages.forEach(message => {
      const messageDate = new Date(message.createdAt).setHours(0, 0, 0, 0);
      
      const existingGroup = groups.find(group => {
        const groupDate = new Date(group.date).setHours(0, 0, 0, 0);
        return groupDate === messageDate;
      });

      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({
          date: messageDate,
          messages: [message]
        });
      }
    });

    return groups.sort((a, b) => a.date - b.date);
  }, [messages]);

  return (
    <div className="h-full w-full text-gray-100 flex flex-col" data-alt="smart-chat-box">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between" data-alt="chat-header">
        <div className="font-semibold flex items-center gap-2">
          <span>Chat</span>
          {/* System push toggle */}
          <Switch
            checkedChildren="System push: On"
            unCheckedChildren="System push: Off"
            checked={systemPush}
            onChange={toggleSystemPush}
            className="ml-2"
            style={{
              backgroundColor: systemPush ? 'linear-gradient(135deg, #2567EC 30%, #37B6F7 70%)' : '#6B7280',
              borderColor: systemPush ? '#2567EC' : '#6B7280',
              background: systemPush ? 'linear-gradient(135deg, #2567EC 30%, #37B6F7 70%)' : '#6B7280'
            }}
          />
        </div>
        <div className="text-xs opacity-70">
          <ArrowRightFromLine
            className="w-4 h-4 cursor-pointer"
            onClick={() => setIsSmartChatBoxOpen(false)}
          />
        </div>
      </div>

      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4" data-alt="message-list">
        {/* Load more button */}
        {hasMore && (
          <LoadMoreButton onClick={loadMoreMessages} loading={isLoading} />
        )}

        {/* Messages grouped by date */}
        <div className="space-y-3">
          {groupedMessages.map((group) => (
            <React.Fragment key={group.date}>
              <DateDivider timestamp={group.date} />
              {group.messages.map((message) => (
                <MessageRenderer key={message.id} msg={message} />
              ))}
            </React.Fragment>
          ))}
        </div>

        {/* Loading indicator */}
        {isLoading && !hasMore && (
          <div className="flex justify-start space-x-1 p-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
          </div>
        )}

        {/* Back to latest button */}
        {isViewingHistory && !isAtBottom && (
          <BackToLatestButton onClick={backToLatest} />
        )}
      </div>

      {/* Input */}
      <InputBar
        onSend={sendMessage}
        setVideoPreview={(url, id) => {
          if (url === previewVideoUrl && id === previewVideoId) {
            onClearPreview?.();
          }
        }}
        initialVideoUrl={previewVideoUrl || undefined}
        initialVideoId={previewVideoId || undefined}
        setIsFocusChatInput={setIsFocusChatInput}
      />
    </div>
  );
}
