// qiniu-example.ts - 七牛云集成使用示例
// 此文件展示如何使用七牛云上传和任务结果更新功能
// 文件路径: lib/qiniu-example.ts

import { qiniuClient } from './qiniu-client';
import { taskClient } from './task-client';

/**
 * 七牛云集成使用示例
 */
export class QiniuIntegrationExample {
  
  /**
   * 示例1: 上传视频文件并更新任务结果
   */
  static async uploadVideoAndUpdateTask(
    videoFile: File,
    projectId: string
  ): Promise<void> {
    try {
      console.log('🎬 开始上传视频并更新任务结果...');

      // 步骤1: 上传视频到七牛云
      const uploadResult = await qiniuClient.uploadVideo(
        videoFile, 
        `project_${projectId}_video.mp4`
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(`视频上传失败: ${uploadResult.error}`);
      }

      console.log('✅ 视频上传成功:', uploadResult.url);

      // 步骤2: 更新任务结果
      const taskResult = await taskClient.updateVideoExportResult(
        projectId,
        uploadResult.url,
        {
          duration: 0, // 这里可以传入实际的视频时长
          size: videoFile.size,
          format: 'mp4',
          quality: 'standard'
        }
      );

      if (taskResult.success) {
        console.log('✅ 任务结果更新成功');
      } else {
        console.warn('⚠️ 任务结果更新失败:', taskResult.error);
      }

    } catch (error) {
      console.error('❌ 处理失败:', error);
      throw error;
    }
  }

  /**
   * 示例2: 批量上传多个文件
   */
  static async batchUploadFiles(
    files: File[],
    projectId: string
  ): Promise<void> {
    try {
      console.log(`📁 开始批量上传 ${files.length} 个文件...`);

      const uploadPromises = files.map(async (file, index) => {
        const customFileName = `project_${projectId}_file_${index}_${file.name}`;
        
        if (file.type.startsWith('video/')) {
          return qiniuClient.uploadVideo(file, customFileName);
        } else if (file.type.startsWith('audio/')) {
          return qiniuClient.uploadAudio(file, customFileName);
        } else if (file.type.startsWith('image/')) {
          return qiniuClient.uploadImage(file, customFileName);
        } else {
          return qiniuClient.uploadFile(file, { customFileName });
        }
      });

      const results = await Promise.all(uploadPromises);
      
      // 统计上传结果
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      console.log(`📊 批量上传完成: 成功 ${successCount} 个, 失败 ${failCount} 个`);

      // 更新任务结果
      const videoUrls = results
        .filter(r => r.success && r.url)
        .map(r => r.url!);

      if (videoUrls.length > 0) {
        await taskClient.updateVideoExportResult(projectId, videoUrls[0]);
      }

    } catch (error) {
      console.error('❌ 批量上传失败:', error);
      throw error;
    }
  }

  /**
   * 示例3: 检查服务状态
   */
  static async checkServicesStatus(): Promise<{
    qiniu: boolean;
    task: boolean;
  }> {
    try {
      console.log('🔍 检查服务状态...');

      // 检查七牛云服务状态（通过尝试上传一个测试文件）
      let qiniuStatus = false;
      try {
        // 创建一个测试文件
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        // 🚀 修复：使用兼容性工具创建File对象
        const { createFileFromBlob } = await import('@/lib/file-polyfill');
        const testFile = createFileFromBlob(testBlob, 'test.txt');
        
        const result = await qiniuClient.uploadFile(testFile, { 
          keyPrefix: 'test',
          customFileName: 'status_check.txt'
        });
        
        qiniuStatus = result.success;
      } catch {
        qiniuStatus = false;
      }

      // 检查任务服务状态
      const taskStatus = await taskClient.checkTaskStatus();

      const servicesStatus = {
        qiniu: qiniuStatus,
        task: taskStatus.status === 'healthy'
      };

      console.log('📊 服务状态:', servicesStatus);
      return servicesStatus;

    } catch (error) {
      console.error('❌ 检查服务状态失败:', error);
      return {
        qiniu: false,
        task: false
      };
    }
  }

  /**
   * 示例4: 完整的视频处理流程
   */
  static async completeVideoProcessingFlow(
    videoFile: File,
    projectId: string,
    options: {
      generateSubtitles?: boolean;
      aiEditing?: boolean;
      quality?: 'low' | 'standard' | 'high';
    } = {}
  ): Promise<void> {
    try {
      console.log('🎬 开始完整的视频处理流程...');

      // 步骤1: 上传原始视频
      const originalVideoResult = await qiniuClient.uploadVideo(
        videoFile,
        `original_${projectId}.mp4`
      );

      if (!originalVideoResult.success) {
        throw new Error(`原始视频上传失败: ${originalVideoResult.error}`);
      }

      console.log('✅ 原始视频上传成功');

      // 步骤2: 生成字幕（如果需要）
      if (options.generateSubtitles) {
        // 这里可以调用字幕生成服务
        console.log('📝 字幕生成功能待实现...');
      }

      // 步骤3: AI编辑（如果需要）
      if (options.aiEditing) {
        // 这里可以调用AI编辑服务
        console.log('🤖 AI编辑功能待实现...');
      }

      // 步骤4: 更新任务结果
      const taskResult = await taskClient.updateVideoExportResult(
        projectId,
        originalVideoResult.url!,
        {
          size: videoFile.size,
          format: 'mp4',
          quality: options.quality || 'standard'
        }
      );

      if (taskResult.success) {
        console.log('✅ 任务结果更新成功');
      } else {
        console.warn('⚠️ 任务结果更新失败:', taskResult.error);
      }

      console.log('🎉 视频处理流程完成!');

    } catch (error) {
      console.error('❌ 视频处理流程失败:', error);
      throw error;
    }
  }
}

/**
 * 导出使用示例函数
 */
export const qiniuExamples = {
  uploadVideoAndUpdateTask: QiniuIntegrationExample.uploadVideoAndUpdateTask,
  batchUploadFiles: QiniuIntegrationExample.batchUploadFiles,
  checkServicesStatus: QiniuIntegrationExample.checkServicesStatus,
  completeVideoProcessingFlow: QiniuIntegrationExample.completeVideoProcessingFlow,
};
