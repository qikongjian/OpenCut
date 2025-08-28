"use client";

import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import SmartChatBox from "./smart-chat-box/SmartChatBox";
import { useProjectStore } from "@/stores/project-store";
import { Drawer } from 'antd';

interface SmartChatTriggerProps {
  className?: string;
  userId?: number;
}

export function SmartChatTrigger({ className = "", userId = 1 }: SmartChatTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { activeProject } = useProjectStore();

  // 如果没有活跃项目，不显示聊天功能
  if (!activeProject) {
    return null;
  }

  return (
    <>
      {/* 触发按钮 */}
      <motion.button
        className={`fixed bottom-6 right-6 z-40 rounded-full p-4 shadow-lg transition-all duration-300 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring ${className}`}
        style={{
          background: 'linear-gradient(135deg, #6AF4F9 30%, #C73BFF 70%)',
          boxShadow: '0 0 20px rgba(106, 244, 249, 0.3), 0 0 40px rgba(199, 59, 255, 0.2)'
        }}
        onClick={() => setIsOpen(true)}
        whileHover={{
          scale: 1.05,
          boxShadow: '0 0 30px rgba(106, 244, 249, 0.4), 0 0 60px rgba(199, 59, 255, 0.3)'
        }}
        whileTap={{ scale: 0.95 }}
        title="打开AI聊天"
      >
        <MessageCircle size={24} className="text-white" />
      </motion.button>

      {/* 智能对话弹窗 - 完全复制video-flow的Drawer配置 */}
      <Drawer
        width="25%"
        placement="right"
        closable={false}
        maskClosable={false}
        open={isOpen}
        getContainer={false}
        autoFocus={false}
        mask={false}
        zIndex={52}
        rootClassName="outline-none"
        className="backdrop-blur-lg bg-black/30 border border-white/20 shadow-xl"
        style={{
          backgroundColor: 'transparent',
          borderBottomLeftRadius: 10,
          borderTopLeftRadius: 10,
          overflow: 'hidden',
        }}
        styles={{
          body: {
            backgroundColor: 'transparent',
            padding: 0,
          },
        }}
        onClose={() => setIsOpen(false)}
      >
        <SmartChatBox
          isSmartChatBoxOpen={isOpen}
          setIsSmartChatBoxOpen={setIsOpen}
          projectId={activeProject.id}
          userId={userId}
        />
      </Drawer>
    </>
  );
}
