// core/config.ts - FFmpeg配置和编码设置

import type { EncodingSettings } from '../types/ffmpeg-types';

// 性能优化配置 - 修复视频卡顿问题
export const PERFORMANCE_CONFIG = {
  // 超快速预设 - 优化质量和流畅度平衡
  ULTRA_FAST: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    crf: '23',           // 降低CRF提升质量 (原35改为23)
    preset: 'veryfast',  // 改为veryfast以提升质量 (原ultrafast)
    tune: 'film',        // 改为film优化视频质量 (原fastdecode)
    threads: 'auto',     // 自动线程数
    g: '60',            // 增加GOP大小提高效率 (原30改为60)
    keyint_min: '30',   // 增加最小关键帧间隔 (原15改为30)
    sc_threshold: '40', // 启用场景切换检测 (原0改为40)
    bf: '2',           // 添加B帧提升流畅度 (原0改为2)
    refs: '3',         // 增加参考帧数量 (原1改为3)
    flags: '+cgop',    // 优化GOP结构
    movflags: '+faststart', // 快速启动
    pixfmt: 'yuv420p'  // 确保兼容性
  },
  
  // 快速预设 - 平衡选择
  FAST: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    crf: '20',         // 更好的质量
    preset: 'fast',    // 平衡速度和质量
    tune: 'film',      // 视频优化
    threads: 'auto',
    g: '120',          // 更大的GOP
    keyint_min: '60',
    sc_threshold: '40',
    bf: '3',
    refs: '4',
    flags: '+cgop',
    movflags: '+faststart',
    pixfmt: 'yuv420p'
  },
  
  // 质量预设 - 大文件优化
  QUALITY: {
    videoCodec: 'libx264',
    audioCodec: 'aac',
    crf: '18',         // 高质量
    preset: 'medium',  // 更好的压缩
    tune: 'film',
    threads: 'auto',
    g: '250',          // 大GOP
    keyint_min: '25',
    sc_threshold: '40',
    bf: '3',
    refs: '6',
    flags: '+cgop',
    movflags: '+faststart',
    pixfmt: 'yuv420p'
  }
};

/**
 * 智能编码预设选择器 - 根据文件特征自动选择最优参数
 */
export const getOptimalEncodingSettings = (
  fileSize: number,
  duration: number,
  format: string,
  quality: string
): EncodingSettings => {
  // 文件大小阈值 (MB)
  const SMALL_FILE = 5 * 1024 * 1024; // 5MB
  const MEDIUM_FILE = 50 * 1024 * 1024; // 50MB
  
  // 时长阈值 (秒)
  const SHORT_VIDEO = 30; // 30秒
  const MEDIUM_VIDEO = 300; // 5分钟
  
  // 智能选择预设
  let preset = PERFORMANCE_CONFIG.FAST;
  
  if (fileSize < SMALL_FILE || duration < SHORT_VIDEO) {
    // 小文件或短视频使用超快速预设
    preset = PERFORMANCE_CONFIG.ULTRA_FAST;
  } else if (fileSize > MEDIUM_FILE || duration > MEDIUM_VIDEO) {
    // 大文件或长视频使用质量预设
    preset = PERFORMANCE_CONFIG.QUALITY;
  }
  
  // 根据质量调整CRF值
  const qualityAdjustments = {
    low: 8,      // 增加CRF值，更快编码
    medium: 0,   // 保持默认
    high: -5     // 减少CRF值，更好质量
  };
  
  const crfAdjustment = qualityAdjustments[quality as keyof typeof qualityAdjustments] || 0;
  const baseCRF = parseInt(preset.crf);
  preset.crf = Math.max(18, Math.min(40, baseCRF + crfAdjustment)).toString();
  
  // 格式特定优化
  if (format === 'webm') {
    return {
      ...preset,
      videoCodec: 'libvpx-vp9',
      audioCodec: 'libopus',
      // WebM特定设置
      deadline: 'realtime',      // 实时编码
      cpuUsed: '8',             // 最大CPU使用率
      tileColumns: '2',         // 并行编码
      frameParallel: '1',       // 帧并行
      lagInFrames: '0',         // 无延迟
      autoAltRef: '0',          // 禁用自动参考帧
      arnrMaxFrames: '0',       // 禁用ARNR
      arnrStrength: '0',        // 禁用ARNR强度
      enableCdef: '0',          // 禁用CDEF
      enableRestoration: '0'    // 禁用恢复
    } as any;
  }
  
  return preset;
};

/**
 * 缓存键生成器
 */
export const generateCacheKey = (file: File, format: string, quality: string, settings: any): string => {
  const fileHash = `${file.name}_${file.size}_${file.lastModified}`;
  const settingsHash = JSON.stringify(settings);
  return `${fileHash}_${format}_${quality}_${settingsHash}`;
}; 