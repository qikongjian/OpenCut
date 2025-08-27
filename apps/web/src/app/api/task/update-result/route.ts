// task/update-result/route.ts - 任务结果更新API
// 此文件提供任务结果更新服务，调用外部API更新任务状态
// 文件路径: app/api/task/update-result/route.ts

import { NextRequest, NextResponse } from "next/server";
import { UpdateTaskResultRequest, UpdateTaskResultResponse } from "@/types/task";

// 外部API配置
const EXTERNAL_API_CONFIG = {
  baseUrl: process.env.AI_EDITING_PLAN_API_URL || 'https://77.smartvideo.py.qikongjian.com',
  timeout: 30000, // 30秒超时
};

/**
 * 更新任务结果API - POST请求
 */
export async function POST(request: NextRequest) {
  try {
    const body: UpdateTaskResultRequest = await request.json();
    
    // 验证请求参数
    if (!body.task_result || !body.task_name || !body.project_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: '缺少必要参数: task_result, task_name, project_id' 
        },
        { status: 400 }
      );
    }

    console.log('🚀 开始更新任务结果:', {
      task_name: body.task_name,
      project_id: body.project_id,
      task_result: body.task_result
    });

    // 调用外部API更新任务结果
    const result = await updateExternalTaskResult(body);

    if (result.success) {
      console.log('✅ 任务结果更新成功');
      return NextResponse.json({
        success: true,
        message: '任务结果更新成功',
        data: result.data
      });
    } else {
      console.error('❌ 任务结果更新失败:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || '任务结果更新失败' 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('任务结果更新API错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '内部服务器错误' 
      },
      { status: 500 }
    );
  }
}

/**
 * 调用外部API更新任务结果
 */
async function updateExternalTaskResult(request: UpdateTaskResultRequest): Promise<UpdateTaskResultResponse> {
  try {
    const url = `${EXTERNAL_API_CONFIG.baseUrl}/movie/update_task_result`;
    
    console.log(`📡 调用外部API: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_API_CONFIG.timeout);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenCut/1.0',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`外部API响应错误: ${response.status} ${response.statusText}`);
      console.error('错误详情:', errorText);
      
      return {
        success: false,
        error: `外部API错误: ${response.status} ${response.statusText}`
      };
    }

    const responseData = await response.json();
    
    console.log('外部API响应:', responseData);

    return {
      success: true,
      data: responseData,
      message: '任务结果更新成功'
    };

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: '请求超时'
      };
    }

    console.error('调用外部API失败:', error);
    return {
      success: false,
      error: `网络请求失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 健康检查 - GET请求
 */
export async function GET() {
  try {
    // 测试外部API连接
    const testUrl = `${EXTERNAL_API_CONFIG.baseUrl}/health`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'OpenCut/1.0',
      },
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: '外部API连接正常',
        externalApiStatus: 'healthy',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '外部API连接异常',
        externalApiStatus: 'unhealthy',
        status: response.status,
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '外部API连接失败',
      externalApiStatus: 'error',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
