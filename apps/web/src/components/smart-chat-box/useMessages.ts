import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { ChatMessage, MessageBlock, MessagesState, MessagesActions, SystemPushState, ChatConfig } from "./types";
import { fetchMessages, sendMessage, retryMessage } from "./api";
import { uid } from "./utils";

const POLLING_INTERVAL = 10000; // 10秒轮询一次
const PAGE_SIZE = 20;

interface UseMessagesProps {
  config: ChatConfig;
  onMessagesUpdate?: (shouldScroll: boolean) => void;
}

export function useMessages({ config, onMessagesUpdate }: UseMessagesProps): [MessagesState, MessagesActions, SystemPushState] {
  // 消息状态
  const [displayMessages, setDisplayMessages] = useState<ChatMessage[]>([]);
  const [latestMessages, setLatestMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // 系统推送状态
  const [systemPush, setSystemPush] = useState(true);
  const systemPushDisabledTimeRef = useRef<number | null>(null);

  // 状态引用
  const configRef = useRef(config);
  const isInitialLoadRef = useRef(true);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const isViewingHistoryRef = useRef(false);
  const prevTotalCountRef = useRef(totalCount);

  // 过滤消息
  const filterMessages = useCallback((messages: ChatMessage[]) => {
    if (systemPush || !systemPushDisabledTimeRef.current) {
      return messages;
    }

    // 系统推送关闭时，只显示关闭前的系统消息和所有非系统消息
    return messages.filter(msg => 
      msg.role !== 'system' || 
      msg.createdAt <= systemPushDisabledTimeRef.current!
    );
  }, [systemPush]);

  // 合并和去重消息
  const mergeMessages = useCallback((oldMessages: ChatMessage[], newMessages: ChatMessage[]) => {
    const messageMap = new Map<string, ChatMessage>();
    
    // 使用 Map 自动去重，后面的会覆盖前面的
    [...oldMessages, ...newMessages].forEach(msg => {
      messageMap.set(msg.id, msg);
    });

    // 转回数组并按 id 排序
    const merged = Array.from(messageMap.values())
      .sort((a, b) => Number(a.id) - Number(b.id));

    // 过滤系统消息
    return filterMessages(merged);
  }, [filterMessages]);

  // 更新 config 引用
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // 监听总消息数变化
  useEffect(() => {
    if (!isViewingHistoryRef.current && totalCount !== prevTotalCountRef.current) {
      // 有新消息，需要滚动
      onMessagesUpdate?.(true);
    }
    prevTotalCountRef.current = totalCount;
  }, [totalCount, onMessagesUpdate]);

  // 获取最新消息
  const updateMessages = useCallback(async (showLoading: boolean = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }

      const response = await fetchMessages(configRef.current, 0, PAGE_SIZE);
      const filteredMessages = filterMessages(response.messages);
      
      setLatestMessages(response.messages); // 保存完整的消息列表
      if (!isViewingHistoryRef.current) {
        setDisplayMessages(filteredMessages); // 显示过滤后的消息
      }
      setTotalCount(response.totalCount);
      setHasMore(response.hasMore);
      setOffset(PAGE_SIZE);
    } catch (err) {
      console.error("获取消息失败:", err);
      setError(err instanceof Error ? err : new Error("获取消息失败"));
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [filterMessages]);

  // 加载更多历史消息
  const loadMoreMessages = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      setIsLoading(true);
      isViewingHistoryRef.current = true;

      const response = await fetchMessages(configRef.current, offset, PAGE_SIZE);
      const newMessages = response.messages;
      
      // 合并消息
      const mergedMessages = mergeMessages(displayMessages, newMessages);
      setDisplayMessages(mergedMessages);
      setHasMore(response.hasMore);
      setOffset(prev => prev + PAGE_SIZE);
      
      // 通知需要保持滚动位置
      onMessagesUpdate?.(false);
    } catch (err) {
      console.error("加载更多消息失败:", err);
      setError(err instanceof Error ? err : new Error("加载更多消息失败"));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, offset, displayMessages, mergeMessages, onMessagesUpdate]);

  // 回到最新消息
  const backToLatest = useCallback(() => {
    isViewingHistoryRef.current = false;
    const filteredMessages = filterMessages(latestMessages);
    setDisplayMessages(filteredMessages);
    setOffset(PAGE_SIZE);
    onMessagesUpdate?.(true);
  }, [latestMessages, filterMessages, onMessagesUpdate]);

  // 发送消息
  const handleSendMessage = useCallback(async (blocks: MessageBlock[], videoId?: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    // 暂停轮询
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    isPollingRef.current = false;

    try {
      // 添加用户消息到本地显示
      const userMessage: ChatMessage = {
        id: uid(),
        role: 'user',
        blocks,
        createdAt: Date.now(),
        chatType: 'chat',
        status: 'pending',
      };

      setDisplayMessages(prev => [...prev, userMessage]);
      onMessagesUpdate?.(true);

      // 发送到服务器
      await sendMessage(blocks, configRef.current, videoId);
      
      // 立即获取最新的消息列表
      await updateMessages(false);
      onMessagesUpdate?.(true);
    } catch (err) {
      console.error("发送消息失败:", err);
      setError(err instanceof Error ? err : new Error("发送消息失败"));
    } finally {
      setIsLoading(false);
      
      // 恢复轮询
      if (systemPush) {
        isPollingRef.current = false;
        // 延迟一个轮询间隔后再开始轮询
        timeoutIdRef.current = setTimeout(() => {
          poll();
        }, POLLING_INTERVAL);
      }
    }
  }, [updateMessages, onMessagesUpdate, systemPush]);

  // 清空消息
  const handleClearMessages = useCallback(() => {
    setDisplayMessages([]);
    setLatestMessages([]);
    setTotalCount(0);
    setHasMore(false);
    setOffset(0);
    setError(null);
  }, []);

  // 重试消息
  const handleRetryMessage = useCallback(async (messageId: string) => {
    try {
      await retryMessage(messageId, configRef.current);
      await updateMessages(false);
    } catch (err) {
      console.error("重试消息失败:", err);
      setError(err instanceof Error ? err : new Error("重试消息失败"));
    }
  }, [updateMessages]);

  // 切换系统推送
  const toggleSystemPush = useCallback(() => {
    const newSystemPush = !systemPush;
    setSystemPush(newSystemPush);
    
    if (!newSystemPush) {
      // 关闭系统推送时，记录当前时间
      systemPushDisabledTimeRef.current = Date.now();
      
      // 停止轮询
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      isPollingRef.current = false;
      
      // 重新过滤显示的消息
      const filteredMessages = filterMessages(latestMessages);
      setDisplayMessages(filteredMessages);
    } else {
      // 开启系统推送时，清除时间记录
      systemPushDisabledTimeRef.current = null;
      
      // 重新过滤显示的消息
      const filteredMessages = filterMessages(latestMessages);
      setDisplayMessages(filteredMessages);
      
      // 重新开始轮询
      poll();
    }
  }, [systemPush, latestMessages, filterMessages]);

  // 轮询函数
  const poll = useCallback(() => {
    if (!systemPush || isPollingRef.current) return;
    
    isPollingRef.current = true;
    
    const doPoll = async () => {
      try {
        await updateMessages(false);
      } catch (error) {
        console.error("轮询获取消息失败:", error);
      }
      
      // 继续下一次轮询
      if (systemPush && isPollingRef.current) {
        timeoutIdRef.current = setTimeout(doPoll, POLLING_INTERVAL);
      }
    };
    
    timeoutIdRef.current = setTimeout(doPoll, POLLING_INTERVAL);
  }, [systemPush, updateMessages]);

  // 轮询获取最新消息
  useEffect(() => {
    if (!systemPush) return;

    poll();

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [systemPush, poll]);

  // 初始加载
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      updateMessages(true);
    }
  }, [updateMessages]);

  return [
    { 
      messages: displayMessages, 
      isLoading, 
      error, 
      hasMore, 
      loadMoreMessages,
      backToLatest,
      isViewingHistory: isViewingHistoryRef.current 
    },
    { 
      sendMessage: handleSendMessage, 
      clearMessages: handleClearMessages, 
      retryMessage: handleRetryMessage 
    },
    { 
      enabled: systemPush, 
      toggle: toggleSystemPush 
    }
  ];
}
