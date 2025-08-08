// core/performance-config.ts - 高性能FFmpeg配置

/**
 * 超快速导出配置
 */
export const ULTRA_FAST_CONFIG = {
  videoCodec: 'libx264',
  audioCodec: 'aac',
  crf: '28',           // 更高的CRF值，更快编码
  preset: 'ultrafast',  // 最快预设
  tune: 'fastdecode',   // 快速解码优化
  threads: 'auto',      // 自动线程数
  g: '30',             // 较小的GOP
  keyint_min: '15',    // 较小的关键帧间隔
  sc_threshold: '0',   // 禁用场景切换检测
  bf: '0',             // 禁用B帧
  refs: '1',           // 最小参考帧
  flags: '+cgop',      // 优化GOP结构
  movflags: '+faststart', // 快速启动
  pixfmt: 'yuv420p'    // 兼容格式
};

/**
 * 平衡配置 - 质量和速度的平衡
 */
export const BALANCED_CONFIG = {
  videoCodec: 'libx264',
  audioCodec: 'aac',
  crf: '23',           // 平衡的CRF值
  preset: 'fast',      // 快速预设
  tune: 'film',        // 视频优化
  threads: 'auto',
  g: '60',             // 中等GOP
  keyint_min: '30',    // 中等关键帧间隔
  sc_threshold: '40',  // 启用场景切换检测
  bf: '2',             // 少量B帧
  refs: '3',           // 中等参考帧
  flags: '+cgop',
  movflags: '+faststart',
  pixfmt: 'yuv420p'
};

/**
 * 高质量配置 - 优先质量
 */
export const QUALITY_CONFIG = {
  videoCodec: 'libx264',
  audioCodec: 'aac',
  crf: '18',           // 低CRF值，高质量
  preset: 'medium',    // 中等预设
  tune: 'film',
  threads: 'auto',
  g: '120',            // 大GOP
  keyint_min: '60',    // 大关键帧间隔
  sc_threshold: '40',
  bf: '3',             // 更多B帧
  refs: '6',           // 更多参考帧
  flags: '+cgop',
  movflags: '+faststart',
  pixfmt: 'yuv420p'
};

/**
 * 智能配置选择器
 */
export function getOptimalConfig(
  fileSize: number,
  duration: number,
  quality: 'low' | 'medium' | 'high',
  hasEffects: boolean
) {
  // 小文件或短视频使用超快速配置
  if (fileSize < 10 * 1024 * 1024 || duration < 60) {
    return ULTRA_FAST_CONFIG;
  }
  
  // 有特效时使用平衡配置
  if (hasEffects) {
    return BALANCED_CONFIG;
  }
  
  // 根据质量选择
  switch (quality) {
    case 'low':
      return ULTRA_FAST_CONFIG;
    case 'high':
      return QUALITY_CONFIG;
    default:
      return BALANCED_CONFIG;
  }
}

/**
 * 流复制优化配置
 */
export const STREAM_COPY_CONFIG = {
  // 流复制时不需要编码参数，直接复制
  useStreamCopy: true,
  // 仅在必要时重编码
  reencodeOnlyWhenNeeded: true
};

/**
 * 并行处理配置
 */
export const PARALLEL_CONFIG = {
  maxConcurrentDownloads: 3,    // 最大并发下载数
  maxConcurrentProcessing: 2,   // 最大并发处理数
  chunkSize: 1024 * 1024,      // 文件分块大小
  timeoutMs: 30000              // 超时时间
}; 