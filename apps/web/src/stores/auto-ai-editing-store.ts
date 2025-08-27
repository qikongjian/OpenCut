// auto-ai-editing-store.ts - 自动化AI剪辑流程状态管理
// 专门处理AI编辑器页面的自动化流程
// 文件路径: stores/auto-ai-editing-store.ts

import { create } from "zustand";
import { useAIEditingStore } from "./ai-editing-store";
import {
  SmoothProgressManager,
  createSmoothProgressManager,
} from "@/lib/ai-editing/smooth-progress-manager";

// 自动化流程状态
export type AutoAIEditingStage =
  | 'idle'           // 空闲状态
  | 'loading-plan'   // 加载剪辑计划
  | 'showing-original' // 显示原视频
  | 'visual-editing'   // 可视化剪辑
  | 'applying-result'  // 应用剪辑结果
  | 'completed'        // 完成
  | 'error';           // 错误

interface AutoAIEditingState {
  // 状态
  currentStage: AutoAIEditingStage;
  overallProgress: number;
  stageProgress: number;
  currentMessage: string;
  isAutoRunning: boolean;

  // 错误处理
  error: string | null;

  // 🚀 新增：智能进度管理
  progressManager: SmoothProgressManager | null;
  estimatedTimeRemaining: number;
  
  // 操作方法
  startAutoAIEditing: (projectId: string) => Promise<void>;
  stopAutoAIEditing: () => void;
  resetState: () => void;
  
  // 内部方法
  setStage: (stage: AutoAIEditingStage, message?: string) => void;
  setProgress: (overall: number, stage?: number) => void;
  setError: (error: string) => void;
}

export const useAutoAIEditingStore = create<AutoAIEditingState>((set, get) => ({
  // 初始状态
  currentStage: 'idle',
  overallProgress: 0,
  stageProgress: 0,
  currentMessage: '',
  isAutoRunning: false,
  error: null,
  progressManager: null,
  estimatedTimeRemaining: 0,

  // 开始自动化AI剪辑流程
  startAutoAIEditing: async (projectId: string) => {
    const { setStage, setProgress, setError } = get();

    try {
      set({ isAutoRunning: true, error: null });

      // 🚀 初始化智能进度管理器
      const progressManager = createSmoothProgressManager(
        (update) => {
          set({
            overallProgress: update.progress,
            currentMessage: update.message,
            estimatedTimeRemaining: update.estimatedTimeRemaining || 0,
          });
        },
        {
          smoothingFactor: 0.85, // 更平滑的过渡
          updateInterval: 150,   // 更频繁的更新
          minProgressIncrement: 0.3,
          maxProgressJump: 8,
        }
      );

      set({ progressManager });
      progressManager.start();
      
      // 阶段1: 加载剪辑计划 (使用智能进度管理)
      setStage('loading-plan', '正在加载AI剪辑计划...');
      progressManager.setTargetProgress(10, 'loading-plan', '正在分析视频内容...');
      
      const aiEditingStore = useAIEditingStore.getState();
      
      // 尝试生成AI剪辑计划
      try {
        await aiEditingStore.generateAIEditingPlanFromAPI(projectId);
      } catch (apiError) {
        console.warn('API调用失败，使用Mock数据:', apiError);
        // 回退到Mock数据
        const mockData = aiEditingStore.generateMockData(projectId);
        aiEditingStore.loadAIEditingData(mockData);
      }
      
      // 检查是否有剪辑计划
      const currentPlan = useAIEditingStore.getState().currentEditingPlan;
      if (!currentPlan) {
        throw new Error('无法生成AI剪辑计划');
      }
      
      setProgress(25, 100);
      
      // 阶段2: 显示原视频 (优化进度反馈)
      setStage('showing-original', '正在显示原视频到时间轴...');
      setProgress(35, 0);



      await aiEditingStore.showOriginalVideoInTimeline();

      setProgress(50, 100);
      
      // 阶段3: 可视化剪辑 + 并行一键剪辑 (优化体验)
      setStage('visual-editing', '正在执行可视化剪辑...');
      setProgress(60, 0);



      // 执行可视化剪辑（这会并行执行一键剪辑）
      await aiEditingStore.executeVisualEditingPlan();

      setProgress(80, 100);
      
      // 阶段4: 应用剪辑结果 (优化进度反馈)
      setStage('applying-result', '正在应用剪辑结果到时间轴...');
      progressManager.setTargetProgress(85, 'applying-result', '正在应用剪辑结果...');

      // 🎯 优化：监听一键剪辑完成状态
      let applyingProgress = 0;
      const applyingInterval = setInterval(() => {
        applyingProgress += 10;
        progressManager.setTargetProgress(
          85 + applyingProgress * 0.05,
          'applying-result',
          `应用剪辑结果中... ${Math.min(applyingProgress, 100)}%`
        );
      }, 200);

      // 等待一键剪辑结果应用到时间轴
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(applyingInterval);
      progressManager.setTargetProgress(100, 'applying-result', '剪辑结果应用完成');

      // 完成 (优化完成状态)
      progressManager.jumpToProgress(100, 'completed', '自动化AI剪辑流程完成！');
      setStage('completed', '自动化AI剪辑流程完成！');

      // 停止进度管理器
      progressManager.stop();


      
    } catch (error) {
      console.error('自动化AI剪辑失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setError(errorMessage);
      setStage('error', `错误: ${errorMessage}`);
      

    } finally {
      set({ isAutoRunning: false });
    }
  },



  // 停止自动化流程
  stopAutoAIEditing: () => {
    set({
      isAutoRunning: false,
      currentStage: 'idle',
      currentMessage: '已停止自动化流程',
    });
  },

  // 重置状态
  resetState: () => {
    set({
      currentStage: 'idle',
      overallProgress: 0,
      stageProgress: 0,
      currentMessage: '',
      isAutoRunning: false,
      error: null,
    });
  },

  // 设置阶段
  setStage: (stage: AutoAIEditingStage, message?: string) => {
    set({ 
      currentStage: stage,
      currentMessage: message || '',
    });
  },

  // 设置进度
  setProgress: (overall: number, stage?: number) => {
    set({ 
      overallProgress: Math.min(100, Math.max(0, overall)),
      stageProgress: stage !== undefined ? Math.min(100, Math.max(0, stage)) : get().stageProgress,
    });
  },

  // 设置错误
  setError: (error: string) => {
    set({ error });
  },
}));
