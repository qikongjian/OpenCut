// test-rough-cut-integration.ts - 粗剪视频接口集成测试
// 此文件用于测试导出接口与粗剪视频接口的集成功能
// 文件路径: lib/test-rough-cut-integration.ts

import { roughCutService } from './rough-cut-service';
import { getProjectIdFromMultipleSources } from './project-utils';

/**
 * 🧪 测试粗剪视频接口集成功能
 */
export async function testRoughCutIntegration(): Promise<{
  success: boolean;
  results: Array<{ test: string; success: boolean; message: string; duration?: number }>;
}> {
  const results: Array<{ test: string; success: boolean; message: string; duration?: number }> = [];
  
  console.log('🧪 开始测试粗剪视频接口集成功能...');

  // 测试1: 服务配置检查
  try {
    const startTime = Date.now();
    const configured = roughCutService.configured;
    const duration = Date.now() - startTime;
    
    results.push({
      test: '服务配置检查',
      success: configured,
      message: configured ? '粗剪服务已正确配置' : '粗剪服务未配置，请检查环境变量',
      duration
    });
    
    console.log(configured ? '✅ 服务配置检查通过' : '❌ 服务配置检查失败');
  } catch (error) {
    results.push({
      test: '服务配置检查',
      success: false,
      message: `配置检查异常: ${error instanceof Error ? error.message : String(error)}`
    });
    console.error('❌ 服务配置检查异常:', error);
  }

  // 测试2: 项目ID获取
  try {
    const startTime = Date.now();
    const projectId = getProjectIdFromMultipleSources();
    const duration = Date.now() - startTime;
    
    const isValid = projectId && projectId.length > 0 && !projectId.startsWith('temp-');
    
    results.push({
      test: '项目ID获取',
      success: isValid,
      message: isValid 
        ? `成功获取项目ID: ${projectId}` 
        : `获取到临时ID: ${projectId}，建议在编辑器页面中测试`,
      duration
    });
    
    console.log(isValid ? '✅ 项目ID获取成功' : '⚠️ 获取到临时项目ID');
  } catch (error) {
    results.push({
      test: '项目ID获取',
      success: false,
      message: `项目ID获取异常: ${error instanceof Error ? error.message : String(error)}`
    });
    console.error('❌ 项目ID获取异常:', error);
  }

  // 测试3: 健康检查
  if (roughCutService.configured) {
    try {
      const startTime = Date.now();
      const healthCheck = await roughCutService.healthCheck();
      const duration = Date.now() - startTime;
      
      results.push({
        test: '服务健康检查',
        success: healthCheck.healthy,
        message: healthCheck.message,
        duration
      });
      
      console.log(healthCheck.healthy ? '✅ 服务健康检查通过' : '❌ 服务健康检查失败');
    } catch (error) {
      results.push({
        test: '服务健康检查',
        success: false,
        message: `健康检查异常: ${error instanceof Error ? error.message : String(error)}`
      });
      console.error('❌ 服务健康检查异常:', error);
    }
  } else {
    results.push({
      test: '服务健康检查',
      success: false,
      message: '跳过健康检查（服务未配置）'
    });
  }

  // 测试4: 模拟接口调用（仅在配置完整时进行）
  if (roughCutService.configured) {
    try {
      const startTime = Date.now();
      const projectId = getProjectIdFromMultipleSources();
      const mockVideoUrl = 'https://cdn.qikongjian.com/test-video.mp4';
      
      // 注意：这是一个真实的API调用，在生产环境中要小心
      console.log('🚨 准备进行真实API调用测试（使用模拟数据）...');
      
      const result = await roughCutService.updateTaskResult(projectId, mockVideoUrl);
      const duration = Date.now() - startTime;
      
      results.push({
        test: '模拟接口调用',
        success: result.success,
        message: result.success 
          ? '接口调用成功' 
          : `接口调用失败: ${result.error}`,
        duration
      });
      
      console.log(result.success ? '✅ 模拟接口调用成功' : '❌ 模拟接口调用失败');
      
    } catch (error) {
      results.push({
        test: '模拟接口调用',
        success: false,
        message: `接口调用异常: ${error instanceof Error ? error.message : String(error)}`
      });
      console.error('❌ 模拟接口调用异常:', error);
    }
  } else {
    results.push({
      test: '模拟接口调用',
      success: false,
      message: '跳过接口调用测试（服务未配置）'
    });
  }

  // 统计测试结果
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const success = passedTests === totalTests;

  console.log(`🧪 测试完成: ${passedTests}/${totalTests} 项测试通过`);
  
  if (success) {
    console.log('✅ 所有测试通过，粗剪视频接口集成功能正常');
  } else {
    console.log('⚠️ 部分测试失败，请检查配置和网络连接');
  }

  return {
    success,
    results
  };
}

/**
 * 🧪 快速测试 - 仅检查配置和项目ID
 */
export function quickTest(): {
  configured: boolean;
  projectId: string;
  message: string;
} {
  const configured = roughCutService.configured;
  const projectId = getProjectIdFromMultipleSources();
  
  let message = '';
  
  if (!configured) {
    message = '⚠️ 粗剪服务未配置，请设置 ROUGH_CUT_API_URL 环境变量';
  } else if (projectId.startsWith('temp-') || projectId.startsWith('error-')) {
    message = '⚠️ 无法获取有效项目ID，建议在编辑器页面中测试';
  } else {
    message = '✅ 配置正常，项目ID获取成功';
  }
  
  return {
    configured,
    projectId,
    message
  };
}

/**
 * 🧪 在浏览器控制台中运行测试
 * 使用方法：在浏览器控制台中运行 window.testRoughCutIntegration()
 */
if (typeof window !== 'undefined') {
  (window as any).testRoughCutIntegration = testRoughCutIntegration;
  (window as any).quickTestRoughCut = quickTest;
  console.log('🧪 测试函数已注册到 window 对象:');
  console.log('  - window.testRoughCutIntegration() - 完整测试');
  console.log('  - window.quickTestRoughCut() - 快速测试');
}
