// task-client.ts - 任务结果更新客户端工具
// 此文件提供前端调用任务结果更新的接口
// 文件路径: lib/task-client.ts

import { UpdateTaskResultRequest, UpdateTaskResultResponse, TaskResultData } from '@/types/task';

/**
 * 任务结果更新客户端
 */
export class TaskClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/task';
  }

  /**
   * 更新任务结果
   */
  async updateTaskResult(
    taskName: string,
    projectId: string,
    resultData: TaskResultData
  ): Promise<UpdateTaskResultResponse> {
    try {
      const request: UpdateTaskResultRequest = {
        task_result: JSON.stringify(resultData),
        task_name: taskName,
        project_id: projectId,
      };

      console.log('🚀 开始更新任务结果:', {
        task_name: taskName,
        project_id: projectId,
        result_data: resultData
      });

      const response = await fetch(`${this.baseUrl}/update-result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `更新失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 任务结果更新成功');
        return result;
      } else {
        console.error('❌ 任务结果更新失败:', result.error);
        return result;
      }

    } catch (error) {
      const errorMsg = `更新任务结果失败: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * 更新视频导出任务结果
   */
  async updateVideoExportResult(
    projectId: string,
    videoUrl: string,
    metadata?: {
      duration?: number;
      size?: number;
      format?: string;
      quality?: string;
    }
  ): Promise<UpdateTaskResultResponse> {
    const resultData: TaskResultData = {
      video: videoUrl,
      metadata: {
        format: 'mp4',
        quality: 'standard',
        ...metadata
      }
    };

    return this.updateTaskResult('generate_final_simple_video', projectId, resultData);
  }

  /**
   * 更新AI编辑任务结果
   */
  async updateAIEditingResult(
    projectId: string,
    resultData: TaskResultData
  ): Promise<UpdateTaskResultResponse> {
    return this.updateTaskResult('ai_editing_complete', projectId, resultData);
  }

  /**
   * 更新字幕生成任务结果
   */
  async updateSubtitleResult(
    projectId: string,
    subtitleUrl: string,
    metadata?: any
  ): Promise<UpdateTaskResultResponse> {
    const resultData: TaskResultData = {
      subtitles: subtitleUrl,
      metadata
    };

    return this.updateTaskResult('subtitle_generation_complete', projectId, resultData);
  }

  /**
   * 检查任务状态
   */
  async checkTaskStatus(): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/update-result`, {
        method: 'GET',
      });

      if (response.ok) {
        const result = await response.json();
        return {
          status: 'healthy',
          message: result.message || '任务服务正常'
        };
      } else {
        return {
          status: 'unhealthy',
          message: `任务服务异常: ${response.status}`
        };
      }

    } catch (error) {
      return {
        status: 'error',
        message: `任务服务连接失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
 * 批量更新任务结果
 */
  async batchUpdateTaskResults(
    updates: Array<{
      taskName: string;
      projectId: string;
      resultData: TaskResultData;
    }>
  ): Promise<Array<{ success: boolean; taskName: string; result: UpdateTaskResultResponse }>> {
    const results = [];

    for (const update of updates) {
      try {
        const result = await this.updateTaskResult(
          update.taskName,
          update.projectId,
          update.resultData
        );

        results.push({
          success: result.success,
          taskName: update.taskName,
          result
        });

        // 添加延迟避免请求过于频繁
        if (updates.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        results.push({
          success: false,
          taskName: update.taskName,
          result: {
            success: false,
            error: `批量更新失败: ${error instanceof Error ? error.message : String(error)}`
          }
        });
      }
    }

    return results;
  }
}

/**
 * 创建任务客户端实例
 */
export function createTaskClient(): TaskClient {
  return new TaskClient();
}

/**
 * 默认任务客户端实例
 */
export const taskClient = createTaskClient();
