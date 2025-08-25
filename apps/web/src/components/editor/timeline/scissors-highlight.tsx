"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors } from "lucide-react";
import { useTimelineStore } from "@/stores/timeline-store";
import { usePlaybackStore } from "@/stores/playback-store";
import { TIMELINE_CONSTANTS } from "@/constants/timeline-constants";

interface ScissorsHighlightProps {
  zoomLevel: number;
  isVisible: boolean;
  position?: number; // 可选的自定义位置
  tracks: any[]; // 轨道数组，用于计算轨道标签宽度
  trackLabelsRef?: React.RefObject<HTMLDivElement>; // 轨道标签引用
  tracksScrollRef?: React.RefObject<HTMLDivElement>; // 轨道滚动引用
}

export function ScissorsHighlight({
  zoomLevel,
  isVisible,
  position,
  tracks: propTracks,
  trackLabelsRef,
  tracksScrollRef
}: ScissorsHighlightProps) {
  const { currentTime } = usePlaybackStore();
  const { tracks: storeTracks } = useTimelineStore();

  // 使用传入的轨道数组或store中的轨道数组
  const tracks = propTracks || storeTracks;

  // 使用自定义位置或当前播放时间
  const displayPosition = position !== undefined ? position : currentTime;

  // 获取滚动位置
  const scrollLeft = tracksScrollRef?.current?.scrollLeft || 0;

  // 获取轨道标签宽度，与播放头保持一致
  const trackLabelsWidth = tracks.length > 0 && trackLabelsRef?.current
    ? trackLabelsRef.current.offsetWidth
    : 0;

  // 计算剪刀位置，与播放头定位逻辑保持一致
  const timelinePosition = displayPosition * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
  const leftPosition = trackLabelsWidth + timelinePosition - scrollLeft;

  // 计算总高度（所有轨道的高度）
  const totalHeight = tracks.reduce((height, track) => {
    return height + TIMELINE_CONSTANTS.TRACK_HEIGHT + TIMELINE_CONSTANTS.TRACK_GAP;
  }, 0);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            rotate: [0, -5, 5, -3, 3, 0], // 更轻微的摇摆动画
          }}
          exit={{
            opacity: 0,
            scale: 0.8,
            y: -10,
            transition: { duration: 0.2 }
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
            rotate: {
              duration: 0.6,
              ease: "easeInOut",
              times: [0, 0.2, 0.4, 0.6, 0.8, 1]
            }
          }}
          className="absolute pointer-events-none z-[300]"
          style={{
            left: `${leftPosition}px`, // 与播放头对齐
            top: "10px", // 调整到时间轴标尺区域
            height: `${totalHeight + 60}px`, // 覆盖整个时间轴高度
            transform: "translateX(-50%)", // 居中对齐
          }}
        >
          {/* 发光背景 */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-primary/40 rounded-full blur-md"
            style={{
              width: "32px",
              height: "32px",
              left: "50%",
              top: "20px",
              transform: "translateX(-50%)"
            }}
          />
          
          {/* 剪刀图标 */}
          <motion.div
            animate={{
              y: [0, -3, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative z-10 flex items-center justify-center"
            style={{
              width: "24px",
              height: "24px",
              left: "50%",
              top: "24px",
              transform: "translateX(-50%)"
            }}
          >
            <Scissors
              className="w-6 h-6 text-primary drop-shadow-lg"
              style={{
                filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))"
              }}
            />
          </motion.div>
          
          {/* 剪切线 */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute bg-primary opacity-60"
            style={{
              left: "50%",
              top: "50px",
              width: "2px",
              height: `${totalHeight}px`,
              transform: "translateX(-50%)",
              transformOrigin: "top",
              boxShadow: "0 0 6px hsl(var(--primary) / 0.6)"
            }}
          />
          
          {/* 粒子效果 */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0, 
                scale: 0,
                x: 0,
                y: 0
              }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1, 0],
                x: [0, (Math.random() - 0.5) * 40],
                y: [0, (Math.random() - 0.5) * 40]
              }}
              transition={{
                duration: 1.2,
                delay: i * 0.1,
                ease: "easeOut"
              }}
              className="absolute w-1 h-1 bg-primary rounded-full"
              style={{
                left: "50%",
                top: "30px",
                transform: "translateX(-50%)"
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 剪切动画触发器Hook
export function useScissorsAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPosition, setAnimationPosition] = useState<number | undefined>();

  const triggerScissorsAnimation = (position?: number) => {
    setAnimationPosition(position);
    setIsAnimating(true);

    // 动画持续时间后自动隐藏
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationPosition(undefined);
    }, 1500); // 1.5秒动画时间
  };

  // 监听全局剪刀动画事件
  useEffect(() => {
    const handleScissorsEvent = (event: CustomEvent) => {
      const { position } = event.detail;
      triggerScissorsAnimation(position);
    };

    window.addEventListener('trigger-scissors-animation', handleScissorsEvent as EventListener);

    return () => {
      window.removeEventListener('trigger-scissors-animation', handleScissorsEvent as EventListener);
    };
  }, []);

  return {
    isAnimating,
    animationPosition,
    triggerScissorsAnimation
  };
}
