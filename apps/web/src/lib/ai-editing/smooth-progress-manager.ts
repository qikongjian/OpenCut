// smooth-progress-manager.ts - 智能进度管理器
// 解决自动化AI剪辑流程不够丝滑的问题
// 文件路径: lib/ai-editing/smooth-progress-manager.ts

export interface ProgressUpdate {
  stage: string;
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
}

export interface ProgressConfig {
  smoothingFactor: number; // 0-1, 越大越平滑
  updateInterval: number; // 更新间隔(ms)
  minProgressIncrement: number; // 最小进度增量
  maxProgressJump: number; // 最大进度跳跃
}

/**
 * 智能进度管理器
 * 解决进度跳跃、用户等待感知等问题
 */
export class SmoothProgressManager {
  private currentProgress = 0;
  private targetProgress = 0;
  private isRunning = false;
  private updateTimer: NodeJS.Timeout | null = null;
  private onProgressUpdate: (update: ProgressUpdate) => void;
  private config: ProgressConfig;
  private currentStage = '';
  private currentMessage = '';
  private startTime = Date.now();

  constructor(
    onProgressUpdate: (update: ProgressUpdate) => void,
    config: Partial<ProgressConfig> = {}
  ) {
    this.onProgressUpdate = onProgressUpdate;
    this.config = {
      smoothingFactor: 0.8,
      updateInterval: 100,
      minProgressIncrement: 0.5,
      maxProgressJump: 10,
      ...config,
    };
  }

  /**
   * 开始平滑进度更新
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = Date.now();
    this.currentProgress = 0;
    this.targetProgress = 0;
    
    this.updateTimer = setInterval(() => {
      this.smoothUpdate();
    }, this.config.updateInterval);
  }

  /**
   * 停止进度更新
   */
  stop() {
    this.isRunning = false;
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * 设置目标进度
   */
  setTargetProgress(progress: number, stage: string, message: string) {
    // 限制进度跳跃幅度
    const maxAllowedProgress = this.currentProgress + this.config.maxProgressJump;
    this.targetProgress = Math.min(progress, maxAllowedProgress);
    this.currentStage = stage;
    this.currentMessage = message;
  }

  /**
   * 立即跳转到指定进度
   */
  jumpToProgress(progress: number, stage: string, message: string) {
    this.currentProgress = progress;
    this.targetProgress = progress;
    this.currentStage = stage;
    this.currentMessage = message;
    this.emitUpdate();
  }

  /**
   * 平滑更新进度
   */
  private smoothUpdate() {
    if (!this.isRunning) return;

    const progressDiff = this.targetProgress - this.currentProgress;
    
    if (Math.abs(progressDiff) < 0.1) {
      // 已接近目标，直接设置
      this.currentProgress = this.targetProgress;
    } else {
      // 平滑过渡
      const increment = progressDiff * (1 - this.config.smoothingFactor);
      this.currentProgress += Math.max(increment, this.config.minProgressIncrement);
    }

    // 确保进度不超过100%
    this.currentProgress = Math.min(this.currentProgress, 100);

    this.emitUpdate();
  }

  /**
   * 发送进度更新
   */
  private emitUpdate() {
    const elapsedTime = (Date.now() - this.startTime) / 1000;
    const estimatedTotalTime = elapsedTime / (this.currentProgress / 100);
    const estimatedTimeRemaining = Math.max(0, estimatedTotalTime - elapsedTime);

    this.onProgressUpdate({
      stage: this.currentStage,
      progress: this.currentProgress,
      message: this.currentMessage,
      estimatedTimeRemaining,
    });
  }

  /**
   * 获取当前进度
   */
  getCurrentProgress(): number {
    return this.currentProgress;
  }

  /**
   * 重置进度
   */
  reset() {
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.currentStage = '';
    this.currentMessage = '';
    this.startTime = Date.now();
  }
}

/**
 * 预定义的进度阶段配置
 */
export const AI_EDITING_STAGES = {
  'loading-plan': {
    range: [0, 25],
    duration: 30000, // 30秒
    messages: [
      '正在分析视频内容...',
      '生成AI剪辑计划...',
      '优化剪辑策略...',
      '准备剪辑数据...',
    ],
  },
  'showing-original': {
    range: [25, 50],
    duration: 20000, // 20秒
    messages: [
      '正在加载原视频...',
      '添加到时间轴...',
      '调整时间轴视图...',
      '准备可视化剪辑...',
    ],
  },
  'visual-editing': {
    range: [50, 80],
    duration: 25000, // 25秒
    messages: [
      '开始可视化剪辑...',
      '执行剪切操作...',
      '并行生成最终结果...',
      '应用剪辑效果...',
    ],
  },
  'applying-result': {
    range: [80, 100],
    duration: 15000, // 15秒
    messages: [
      '应用剪辑结果...',
      '添加AI字幕...',
      '优化时间轴...',
      '完成剪辑流程...',
    ],
  },
} as const;

/**
 * 创建智能进度管理器实例
 */
export function createSmoothProgressManager(
  onProgressUpdate: (update: ProgressUpdate) => void,
  config?: Partial<ProgressConfig>
): SmoothProgressManager {
  return new SmoothProgressManager(onProgressUpdate, config);
}

/**
 * 获取阶段的动态消息
 */
export function getStageMessage(stage: keyof typeof AI_EDITING_STAGES, progress: number): string {
  const stageConfig = AI_EDITING_STAGES[stage];
  if (!stageConfig) return '';

  const messageIndex = Math.floor((progress / 100) * stageConfig.messages.length);
  return stageConfig.messages[Math.min(messageIndex, stageConfig.messages.length - 1)];
}

/**
 * 计算阶段内的相对进度
 */
export function getStageRelativeProgress(
  stage: keyof typeof AI_EDITING_STAGES,
  overallProgress: number
): number {
  const stageConfig = AI_EDITING_STAGES[stage];
  if (!stageConfig) return 0;

  const [start, end] = stageConfig.range;
  const stageProgress = Math.max(0, Math.min(100, overallProgress - start));
  return (stageProgress / (end - start)) * 100;
}
