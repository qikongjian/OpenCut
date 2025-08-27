// types/task.ts - 任务相关类型定义
// 文件路径: types/task.ts

/**
 * 任务结果更新请求接口
 */
export interface UpdateTaskResultRequest {
  task_result: string; // JSON字符串，包含视频URL等信息
  task_name: string;   // 任务名称
  project_id: string;  // 项目ID
}

/**
 * 任务结果更新响应接口
 */
export interface UpdateTaskResultResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * 任务类型枚举
 */
export enum TaskType {
  VIDEO_EXPORT = 'video_export',
  AI_EDITING = 'ai_editing',
  SUBTITLE_GENERATION = 'subtitle_generation',
  VIDEO_PROCESSING = 'video_processing'
}

/**
 * 任务信息接口
 */
export interface TaskInfo {
  id: string;
  type: TaskType;
  status: TaskStatus;
  project_id: string;
  created_at: string;
  updated_at: string;
  progress?: number;
  result?: any;
  error?: string;
}

/**
 * 任务结果数据接口
 */
export interface TaskResultData {
  video?: string;
  audio?: string;
  subtitles?: string;
  metadata?: {
    duration?: number;
    size?: number;
    format?: string;
    quality?: string;
  };
  [key: string]: any;
}
