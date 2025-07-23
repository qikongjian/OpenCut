// audio-waveform.tsx - 视频编辑器组件
// 此文件包含 视频编辑器组件 的相关代码
// 文件路径: components/editor/audio-waveform.tsx
// 最后更新: 2025/7/23

// audio-waveform.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入 React 核心库
import React, { useEffect, useRef, useState } from 'react';
// 导入 WaveSurfer 音频波形库
import WaveSurfer from 'wavesurfer.js';

// AudioWaveformProps 接口定义
interface AudioWaveformProps {
  audioUrl: string;
  height?: number;
  className?: string;
}

// AudioWaveform 函数
const AudioWaveform: React.FC<AudioWaveformProps> = ({ 
  audioUrl, 
  height = 32, 
  className = '' 
}) => {
// 常量定义 - 模块内部使用的固定值
  const waveformRef = useRef<HTMLDivElement>(null);
// 常量定义 - 模块内部使用的固定值
  const wavesurfer = useRef<WaveSurfer | null>(null);
// 状态管理 - 创建和管理组件内部状态
  const [isLoading, setIsLoading] = useState(true);
// 状态管理 - 创建和管理组件内部状态
  const [error, setError] = useState(false);

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
    let mounted = true;

// 常量定义 - 模块内部使用的固定值
    const initWaveSurfer = async () => {
      if (!waveformRef.current || !audioUrl) return;

      try {
        // Clean up any existing instance
        if (wavesurfer.current) {
          try {
            // Check if the container still exists before destroying
            if (waveformRef.current && document.contains(waveformRef.current)) {
              wavesurfer.current.destroy();
            }
          } catch (e) {
            // Silently ignore destroy errors
            console.warn('WaveSurfer destroy error:', e);
          }
          wavesurfer.current = null;
        }

// 创建状态存储 - 使用 Zustand 创建状态管理器
        wavesurfer.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: 'rgba(255, 255, 255, 0.6)',
          progressColor: 'rgba(255, 255, 255, 0.9)',
          cursorColor: 'transparent',
          barWidth: 2,
          barGap: 1,
          height: height,
          normalize: true,
          interact: false,
        });

        // Event listeners
        wavesurfer.current.on('ready', () => {
          if (mounted) {
            setIsLoading(false);
            setError(false);
          }
        });

        wavesurfer.current.on('error', (err) => {
          console.error('WaveSurfer error:', err);
          if (mounted) {
            setError(true);
            setIsLoading(false);
          }
        });

        await wavesurfer.current.load(audioUrl);

      } catch (err) {
        console.error('Failed to initialize WaveSurfer:', err);
        if (mounted) {
          setError(true);
          setIsLoading(false);
        }
      }
    };

    initWaveSurfer();

    return () => {
      mounted = false;
      if (wavesurfer.current) {
        try {
          // Check if the container still exists and is in the DOM before destroying
          if (waveformRef.current && document.contains(waveformRef.current)) {
            wavesurfer.current.destroy();
          }
        } catch (e) {
          // Silently ignore destroy errors
          console.warn('WaveSurfer cleanup error:', e);
        }
        wavesurfer.current = null;
      }
    };
  }, [audioUrl, height]);

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <span className="text-xs text-foreground/60">Audio unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-foreground/60">Loading...</span>
        </div>
      )}
      <div 
        ref={waveformRef} 
        className={`w-full transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ height }}
      />
    </div>
  );
};

export default AudioWaveform;