// ffmpeg/index.ts - FFmpeg模块主入口
// 统一导出所有FFmpeg相关功能

// 核心初始化和配置
export { initFFmpeg, testFFmpeg } from './core/init';
export { getOptimalEncodingSettings, generateCacheKey } from './core/config';

// 性能配置
export { 
  ULTRA_FAST_CONFIG,
  BALANCED_CONFIG,
  QUALITY_CONFIG,
  getOptimalConfig,
  STREAM_COPY_CONFIG,
  PARALLEL_CONFIG
} from './core/performance-config';

// 基础视频操作
export { 
  exportVideo, 
  trimVideo, 
  convertToWebM, 
  extractAudio,
  generateThumbnail,
  getVideoInfo 
} from './operations/basic-video-ops';

// 时间轴导出
export { exportTimeline } from './operations/timeline-export';
export { fastExportTimeline } from './operations/fast-export';

// 特效处理
export { 
  applyTransitionEffects,
  applyMirrorEffects,
  applyMaskEffects,
  renderSubtitlesToVideo 
} from './effects/video-effects';

// 音频处理
export { processAudioTracks } from './operations/audio-ops';

// 工具函数
export {
  resetExportCancellation,
  cancelCurrentExport,
  clearExportCache,
  getCacheStats
} from './utils/export-utils';

// 类型定义
export type { 
  ExportConfig,
  TimelineData,
  VideoInfo,
  ProgressCallback 
} from './types/ffmpeg-types'; 