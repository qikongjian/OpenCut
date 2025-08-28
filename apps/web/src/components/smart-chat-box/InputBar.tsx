import React, { useRef, useState, useEffect, useCallback } from "react";
import { Image as ImageIcon, Send, Trash2, ArrowUp } from "lucide-react";
import { MessageBlock } from "./types";
import { useUploadFile } from "./useUploadFile";
import { motion, AnimatePresence } from "framer-motion";

// 防抖函数
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
};

interface InputBarProps {
  onSend: (blocks: MessageBlock[], videoId?: string) => void;
  setVideoPreview?: (url: string, id: string) => void;
  initialVideoUrl?: string;
  initialVideoId?: string;
  setIsFocusChatInput?: (v: boolean) => void;
}

export function InputBar({ onSend, setVideoPreview, initialVideoUrl, initialVideoId, setIsFocusChatInput }: InputBarProps) {
  const [text, setText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl || null);
  const [videoId, setVideoId] = useState<string | null>(initialVideoId || null);
  const [isMultiline, setIsMultiline] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { uploadFile } = useUploadFile();
  const [isComposing, setIsComposing] = useState(false);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || isComposing) return;

    // 保存当前滚动位置
    const scrollPos = window.scrollY;

    // 重置高度以获取实际内容高度
    textarea.style.height = '0px';

    // 强制浏览器重排，获取准确的 scrollHeight
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, 48), 120);

    // 设置新高度
    textarea.style.height = `${newHeight}px`;

    // 恢复滚动位置，避免页面跳动
    window.scrollTo(0, scrollPos);

    // 更新布局状态
    if (!text.trim()) {
      setIsMultiline(false);
    } else if (!isMultiline && newHeight > 48) {
      setIsMultiline(true);
    }
  }, [text, isMultiline, isComposing]);

  // 使用防抖包装 adjustHeight，但确保在输入完成时立即调整
  const debouncedAdjustHeight = useCallback(
    debounce(() => {
      requestAnimationFrame(() => {
        if (!isComposing) {
          adjustHeight();
        }
      });
    }, 16), // 使用一帧的时间作为防抖时间
    [adjustHeight, isComposing]
  );

  // 监听初始视频 URL 和 ID 的变化
  useEffect(() => {
    if (initialVideoUrl && initialVideoId) {
      setVideoUrl(initialVideoUrl);
      setVideoId(initialVideoId);
    }
  }, [initialVideoUrl, initialVideoId]);

  // 监听文本变化和组件挂载时调整高度
  useEffect(() => {
    debouncedAdjustHeight();
  }, [text, debouncedAdjustHeight]);

  // 布局切换时保持输入框焦点并将光标移到末尾
  useEffect(() => {
    // 等待布局动画完成后再聚焦，避免动画过程中的视觉跳动
    const focusTimeout = setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        // 将光标移动到文本末尾
        const length = textarea.value.length;
        textarea.setSelectionRange(length, length);
      }
    }, 200); // 与布局动画时长保持一致

    return () => clearTimeout(focusTimeout);
  }, [isMultiline]);

  const handleSend = () => {
    const blocks: MessageBlock[] = [];
    if (text.trim()) blocks.push({ type: "text" as const, text: text.trim() });
    if (imageUrl) blocks.push({ type: "image" as const, url: imageUrl });
    if (videoUrl) blocks.push({ type: "video" as const, url: videoUrl });
    if (!blocks.length) return;
    
    onSend(blocks, videoId || undefined);
    setText("");
    setImageUrl(null);
    if (videoUrl && videoId && setVideoPreview) {
      setVideoPreview(videoUrl, videoId);
    }
    setVideoUrl(null);
    setVideoId(null);
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const url = await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });
      // 如果已经有视频，先保存视频状态
      const prevVideoUrl = videoUrl;
      const prevVideoId = videoId;

      setImageUrl(url);

      // 恢复视频状态
      if (prevVideoUrl && prevVideoId) {
        setVideoUrl(prevVideoUrl);
        setVideoId(prevVideoId);
      }
    } catch (error) {
      console.error("上传失败:", error);
      // 可以添加错误提示
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 保存对 input 元素的引用
    const inputElement = e.currentTarget;
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        inputElement.value = ""; // 重置 input
        return;
      }
      await handleFileUpload(file);
      // 使用保存的引用重置 input
      inputElement.value = "";
    }
  };

  const removeImage = () => {
    setImageUrl(null);
  };

  return (
    <div data-alt="input-bar">
      {/* 媒体预览 */}
      <div className="px-3 pt-3 flex gap-2" data-alt="media-preview">
        {/* 图片预览 */}
        {imageUrl && (
          <div className="relative group w-24 h-24">
            <img
              src={imageUrl}
              className="h-full w-full object-cover rounded-xl border border-white/10"
              alt="预览图"
            />
            <button
              onClick={removeImage}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-black/60 text-white rounded-full p-1"
              title="移除"
              data-alt="remove-image-button"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
        
        {/* 视频预览 */}
        {videoUrl && (
          <div className="relative group w-24 h-24">
            <video
              src={videoUrl}
              className="h-full w-full object-cover rounded-xl border border-white/10"
              controls={false}
            />
            <button
              onClick={() => {
                if (setVideoPreview) {
                  setVideoPreview(videoUrl!, videoId!);
                }
                setVideoUrl(null);
                setVideoId(null);
              }}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-black/60 text-white rounded-full p-1"
              title="移除"
              data-alt="remove-video-button"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 上传进度 */}
      {isUploading && (
        <div className="px-3 py-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <motion.div
        layout
        className="px-3 m-3 border border-gray-700 rounded-[2rem]"
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <motion.div
          layout
          className={`${isMultiline ? 'flex flex-col' : 'flex items-center'} gap-2`}
        >
          <AnimatePresence mode="popLayout">
            {/* 图片上传按钮 - 单行时显示在左侧 */}
            {!isMultiline && (
              <motion.label 
                key="single-line-upload"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`cursor-pointer inline-flex items-center gap-2 p-2 my-2 rounded-full hover:bg-gray-700/50 text-gray-100 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                data-alt="file-upload"
              >
                <ImageIcon size={16} />
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  disabled={isUploading}
                />
              </motion.label>
            )}

            {/* 文本输入 */}
            <motion.div layout key="text-input" className="flex-1 flex">
              <textarea
                ref={textareaRef}
                placeholder="Describe your idea..."
                className="w-full pl-2 pr-2 py-4 rounded-2 leading-4 text-sm border-none bg-transparent text-white placeholder:text-white/[0.40] focus:outline-none resize-none min-h-[48px] max-h-[120px] overflow-y-auto"
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => {
                  setIsComposing(false);
                  // 输入法完成后等待下一帧再调整高度，确保文本内容已更新
                  requestAnimationFrame(() => {
                    requestAnimationFrame(adjustHeight);
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isComposing) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onFocus={() => setIsFocusChatInput?.(true)}
                onBlur={() => setIsFocusChatInput?.(false)}
                data-alt="text-input"
              />
            </motion.div>

            {isMultiline ? (
              // 多行模式：底部按钮区域
              <motion.div 
                key="multi-line-buttons"
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-between items-center w-full pb-2"
              >
                {/* 图片上传 */}
                <motion.label 
                  key="multi-line-upload"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`cursor-pointer inline-flex items-center gap-2 p-2 rounded-full hover:bg-gray-700/50 text-gray-100 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  data-alt="file-upload"
                >
                  <ImageIcon size={16} />
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    disabled={isUploading}
                  />
                </motion.label>

                {/* 发送按钮 必须有文字 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  className="inline-flex items-center gap-2 p-2 rounded-full bg-[#f1f3f4] text-[#25294b] shadow disabled:text-white/25 disabled:border disabled:border-white/10 disabled:bg-[#1b1b1b80] disabled:cursor-not-allowed"
                  data-alt="send-button"
                  disabled={!text.trim()}
                >
                  <ArrowUp size={18} />
                </motion.button>
              </motion.div>
            ) : (
              // 单行模式：发送按钮
              <motion.button
                key="single-line-send"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                className="inline-flex items-center gap-2 p-2 my-2 rounded-full bg-[#f1f3f4] text-[#25294b] shadow disabled:text-white/25 disabled:border disabled:border-white/10 disabled:bg-[#1b1b1b80] disabled:cursor-not-allowed"
                data-alt="send-button"
                disabled={!text.trim()}
              >
                <ArrowUp size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
