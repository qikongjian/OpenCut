import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ChatMessage } from "./types";
import { bubbleVariants, hhmm } from "./utils";
import { ProgressBar } from "./ProgressBar";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Image } from "antd";

interface MessageRendererProps {
  msg: ChatMessage;
}

export function MessageRenderer({ msg }: MessageRendererProps) {
  // Decide bubble style
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";

  const bubbleClass = useMemo(() => {
    if (isSystem) return "bg-[#281c1459] text-white";
    if (isUser) return "bg-[#27416c59] text-white";
    return "bg-[#281c1459] text-white"; // assistant
  }, [isSystem, isUser]);

  const badge = isSystem ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-amber-200 text-amber-900 mr-2">
      系统流程
    </span>
  ) : msg.role === "assistant" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-[#6240274d] text-gray-100 mr-2">
      助手
    </span>
  ) : null;

  // 状态图标和颜色
  const statusIcon = useMemo(() => {
    if (!isUser) return null;
    
    switch (msg.status) {
      case 'pending':
        return <Loader2 size={12} className="animate-spin text-gray-300" />;
      case 'success':
        return <CheckCircle2 size={12} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={12} className="text-red-400" />;
      default:
        return null;
    }
  }, [isUser, msg.status]);

  // 消息类型标签
  const typeLabel = useMemo(() => {
    if (!isUser) return null;
    
    const isTask = msg.chatType !== 'chat';
    if (isTask) {
      return (
        <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/30 text-blue-200">
          任务
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#2567EC]/30 text-[#37B6F7]">
        聊天
      </span>
    );
  }, [isUser, msg.chatType]);

  return (
    <motion.div
      className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}
      custom={isUser}
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.25 }}
      data-alt="message-bubble"
    >
      <div className={`max-w-[75%] rounded-2xl shadow-md p-3 ${bubbleClass}`}>
        {/* Header */}
        {/* <div className="flex items-center gap-2 text-[11px] opacity-80 mb-1">
          {badge}
          <div className="flex items-center gap-1.5">
            {typeLabel}
            <span>{hhmm(msg.createdAt)}</span>
            {statusIcon}
          </div>
        </div> */}

        {/* Content blocks */}
        <div className="space-y-2">
          {msg.blocks.map((b, idx) => {
            switch (b.type) {
              case "text":
                return (
                  <p key={idx} className="leading-relaxed whitespace-pre-wrap break-words">
                    {b.text}
                  </p>
                );
              case "image":
                return (
                  <div key={idx} className="overflow-hidden rounded-xl border border-white/10">
                    <Image src={b.url} alt={b.alt || "image"} className="max-h-72 object-contain w-full bg-black/10" />
                  </div>
                );
              case "video":
                return (
                  <div key={idx} className="overflow-hidden rounded-xl">
                    <video
                      controls
                      src={b.url}
                      poster={b.poster}
                      className="w-full max-h-80 bg-black"
                      controlsList="nodownload noremoteplayback"
                      disablePictureInPicture
                      disableRemotePlayback
                      onContextMenu={e => e.preventDefault()}
                    />
                  </div>
                );
              case "audio":
                return (
                  <audio key={idx} className="w-full" controls src={b.url} />
                );
              case "progress":
                return <ProgressBar key={idx} value={b.value} total={b.total} label={b.label} />;
              case "link":
                return <a key={idx} href={b.url} className="underline text-blue-400 hover:text-blue-300">{b.text}</a>;
              default:
                return null;
            }
          })}
        </div>
      </div>
    </motion.div>
  );
}
